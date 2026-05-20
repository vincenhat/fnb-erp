import { PrismaClient, type AccountType, type SystemRole } from '@prisma/client';

const db = new PrismaClient();

interface AccountSeed {
  code: string;
  name: string;
  type: AccountType;
  debitNormal: boolean;
  parent?: string;
}

/**
 * Vietnam Chart of Accounts (TT200/2014) — abbreviated to the most-used
 * accounts for an F&B SME. Codes follow the Vietnamese 4-digit convention.
 */
const TT200_ACCOUNTS: AccountSeed[] = [
  // 1xx Assets
  { code: '111', name: 'Tiền mặt', type: 'ASSET', debitNormal: true },
  { code: '112', name: 'Tiền gửi ngân hàng', type: 'ASSET', debitNormal: true },
  { code: '131', name: 'Phải thu khách hàng', type: 'ASSET', debitNormal: true },
  { code: '152', name: 'Nguyên liệu, vật liệu', type: 'ASSET', debitNormal: true },
  { code: '153', name: 'Công cụ, dụng cụ', type: 'ASSET', debitNormal: true },
  { code: '155', name: 'Thành phẩm', type: 'ASSET', debitNormal: true },
  { code: '156', name: 'Hàng hóa', type: 'ASSET', debitNormal: true },
  { code: '211', name: 'Tài sản cố định hữu hình', type: 'ASSET', debitNormal: true },
  // 3xx Liabilities
  { code: '331', name: 'Phải trả người bán', type: 'LIABILITY', debitNormal: false },
  {
    code: '333',
    name: 'Thuế và các khoản phải nộp Nhà nước',
    type: 'LIABILITY',
    debitNormal: false,
  },
  { code: '334', name: 'Phải trả người lao động', type: 'LIABILITY', debitNormal: false },
  {
    code: '338',
    name: 'Phải trả, phải nộp khác (BHXH, BHYT...)',
    type: 'LIABILITY',
    debitNormal: false,
  },
  // 4xx Equity
  { code: '411', name: 'Vốn đầu tư của chủ sở hữu', type: 'EQUITY', debitNormal: false },
  { code: '421', name: 'Lợi nhuận sau thuế chưa phân phối', type: 'EQUITY', debitNormal: false },
  // 5xx Revenue
  {
    code: '511',
    name: 'Doanh thu bán hàng và cung cấp dịch vụ',
    type: 'REVENUE',
    debitNormal: false,
  },
  { code: '515', name: 'Doanh thu hoạt động tài chính', type: 'REVENUE', debitNormal: false },
  // 6xx Expense
  { code: '621', name: 'Chi phí nguyên liệu trực tiếp', type: 'EXPENSE', debitNormal: true },
  { code: '622', name: 'Chi phí nhân công trực tiếp', type: 'EXPENSE', debitNormal: true },
  { code: '627', name: 'Chi phí sản xuất chung', type: 'EXPENSE', debitNormal: true },
  { code: '632', name: 'Giá vốn hàng bán', type: 'EXPENSE', debitNormal: true },
  { code: '641', name: 'Chi phí bán hàng', type: 'EXPENSE', debitNormal: true },
  { code: '642', name: 'Chi phí quản lý doanh nghiệp', type: 'EXPENSE', debitNormal: true },
];

interface SeedUser {
  clerkId: string;
  email: string;
  fullName: string;
  role: SystemRole;
}

const SEED_USERS: SeedUser[] = [
  {
    clerkId: 'seed_owner',
    email: 'owner@fnb-erp.local',
    fullName: 'Nguyễn Văn Owner',
    role: 'OWNER',
  },
  {
    clerkId: 'seed_manager',
    email: 'manager@fnb-erp.local',
    fullName: 'Trần Thị Manager',
    role: 'MANAGER',
  },
  {
    clerkId: 'seed_accountant',
    email: 'accountant@fnb-erp.local',
    fullName: 'Lê Văn Accountant',
    role: 'ACCOUNTANT',
  },
  {
    clerkId: 'seed_cashier',
    email: 'cashier@fnb-erp.local',
    fullName: 'Phạm Thị Cashier',
    role: 'CASHIER',
  },
  {
    clerkId: 'seed_kitchen',
    email: 'kitchen@fnb-erp.local',
    fullName: 'Hoàng Văn Kitchen',
    role: 'KITCHEN',
  },
];

async function main() {
  console.log('[seed] start');

  const org = await db.organization.upsert({
    where: { slug: 'demo-fnb' },
    create: { name: 'Demo F&B Co.', slug: 'demo-fnb', taxCode: '0123456789' },
    update: {},
  });

  const branches = [
    { code: 'HQ', name: 'Trụ sở chính', address: '123 Nguyễn Huệ, Q1, TP.HCM' },
    { code: 'BR01', name: 'Chi nhánh 1', address: '45 Lê Lợi, Q1, TP.HCM' },
  ];
  for (const b of branches) {
    await db.branch.upsert({
      where: { organizationId_code: { organizationId: org.id, code: b.code } },
      create: { ...b, organizationId: org.id },
      update: {},
    });
  }

  for (const acc of TT200_ACCOUNTS) {
    await db.account.upsert({
      where: { organizationId_code: { organizationId: org.id, code: acc.code } },
      create: {
        organizationId: org.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debitNormal: acc.debitNormal,
      },
      update: { name: acc.name },
    });
  }

  for (const u of SEED_USERS) {
    const user = await db.user.upsert({
      where: { clerkId: u.clerkId },
      create: { clerkId: u.clerkId, email: u.email, fullName: u.fullName },
      update: { email: u.email, fullName: u.fullName },
    });
    await db.userOrganization.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
      create: { userId: user.id, organizationId: org.id, role: u.role },
      update: { role: u.role },
    });
  }

  console.log('[seed] done');
}

main()
  .catch((err) => {
    console.error('[seed] failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
