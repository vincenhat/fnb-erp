# Double-entry bookkeeping

Every business event in this ERP posts at least two `JournalLine` rows that
together form a balanced `JournalEntry` (sum of debits == sum of credits).
Reports (P&L, Balance Sheet, Cash Flow) read **only** from journal entries.
The Order and PurchaseOrder tables hold operational details, not money.

## Why

- One source of truth for all reports.
- Auditability: every cent has a debit + credit pair tied to a source document.
- Compliance: this is how Vietnam's TT200 / TT133 expects books to be kept.
- Bug containment: an Order calculation bug doesn't double-count revenue if
  the journal posting is the only path that affects ledgers.

## Account model

`Account` rows form a tree (`parentId`). Each has:

- `code` — Vietnamese chart of accounts code, e.g. `111` (cash), `511` (revenue).
- `type` — one of `ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE`.
- `debitNormal` — `true` if the account increases on the debit side.

| Type      | debitNormal | Increases on |
| --------- | ----------- | ------------ |
| ASSET     | true        | DEBIT        |
| EXPENSE   | true        | DEBIT        |
| LIABILITY | false       | CREDIT       |
| EQUITY    | false       | CREDIT       |
| REVENUE   | false       | CREDIT       |

Balance of an account at time `t`:

```
balance = sum(debit) - sum(credit)        if debitNormal
balance = sum(credit) - sum(debit)        otherwise
```

## Money representation

All amounts are stored as `BIGINT` cents in `JournalLine.debitCents` /
`creditCents`. For VND the "cent" is the unit (no fractional unit), but we
still go through cents so we can support multi-currency cleanly later.

Conversion helpers live in `lib/utils.ts` (`formatCents`, `toCents`).

## Posting examples

### 1. Cash sale of 110,000 VND with 10% VAT

A customer pays 110,000 VND in cash for goods worth 100,000 VND + 10% VAT.

| Account | Name                         | Debit   | Credit  |
| ------- | ---------------------------- | ------- | ------- |
| 111     | Tiền mặt (cash)              | 110,000 |         |
| 511     | Doanh thu (revenue)          |         | 100,000 |
| 3331    | Thuế GTGT phải nộp (VAT out) |         | 10,000  |

Post in code:

```ts
await ctx.db.journalEntry.create({
  data: {
    organizationId: ctx.auth.organizationId,
    postedAt: new Date(),
    reference: `ORDER:${order.id}`,
    sourceType: 'Order',
    sourceId: order.id,
    description: 'Bán lẻ tại quầy',
    lines: {
      create: [
        { accountId: cashId, debitCents: 110_000n },
        { accountId: revenueId, creditCents: 100_000n },
        { accountId: vatOutId, creditCents: 10_000n },
      ],
    },
  },
});
```

### 2. Recognising COGS at sale time

Same sale, goods cost 60,000 VND from inventory:

| Account | Name                    | Debit  | Credit |
| ------- | ----------------------- | ------ | ------ |
| 632     | Giá vốn hàng bán (COGS) | 60,000 |        |
| 156     | Hàng hóa (inventory)    |        | 60,000 |

This is a second `JournalEntry` linked to the same Order — keep them
separate so a re-cost adjustment doesn't have to touch the revenue entry.

### 3. Purchase 24 chai soft drink × 8,000 VND from supplier on credit

| Account | Name                              | Debit   | Credit  |
| ------- | --------------------------------- | ------- | ------- |
| 152     | Nguyên liệu, vật liệu (inventory) | 192,000 |         |
| 1331    | Thuế GTGT được khấu trừ (VAT in)  | 19,200  |         |
| 331     | Phải trả người bán (AP)           |         | 211,200 |

When we later pay the supplier from the bank:

| Account | Name                      | Debit   | Credit  |
| ------- | ------------------------- | ------- | ------- |
| 331     | Phải trả người bán (AP)   | 211,200 |         |
| 112     | Tiền gửi ngân hàng (bank) |         | 211,200 |

### 4. Payroll accrual on the last day of the month

10,000,000 VND gross, 8% mandatory employee deductions:

| Account | Name                                    | Debit      | Credit    |
| ------- | --------------------------------------- | ---------- | --------- |
| 622     | Chi phí nhân công trực tiếp             | 10,000,000 |           |
| 334     | Phải trả người lao động (wages payable) |            | 9,200,000 |
| 338     | BHXH/BHYT/BHTN payable                  |            | 800,000   |

When wages are paid:

| Account | Name                    | Debit     | Credit    |
| ------- | ----------------------- | --------- | --------- |
| 334     | Phải trả người lao động | 9,200,000 |           |
| 112     | Tiền gửi ngân hàng      |           | 9,200,000 |

## Invariants enforced in code

`server/trpc/routers/journal.ts#create` enforces:

- ≥ 2 lines per entry.
- Each line has exactly one of `debitCents > 0` xor `creditCents > 0` (no
  signed amounts, no zero-zero rows).
- `sum(debit) === sum(credit)` across the whole entry.

A future migration will add a deferred CHECK constraint to enforce balance
at the database level too.

## What NOT to do

- ❌ Don't store `revenue` or `expense` columns on `Order`, `PurchaseOrder`,
  `Payroll`, or anywhere else. They are derivable from journals.
- ❌ Don't run reports off the document tables. P&L = sum over `JournalLine`
  filtered by `account.type = REVENUE / EXPENSE`.
- ❌ Don't edit a posted `JournalEntry`. Reverse it (post the inverse) and
  post a new one. Audit trails matter.
