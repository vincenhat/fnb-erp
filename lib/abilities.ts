import { AbilityBuilder, PureAbility, type AbilityClass } from '@casl/ability';
import type { SystemRole } from '@prisma/client';

/**
 * Subjects we can authorize against. Strings work for the skeleton; once we
 * have real Prisma models flowing through the resolvers we can switch to the
 * model classes for finer-grained per-instance checks.
 */
export type Subject =
  | 'Organization'
  | 'Branch'
  | 'User'
  | 'Account'
  | 'JournalEntry'
  | 'Product'
  | 'Inventory'
  | 'PurchaseOrder'
  | 'Order'
  | 'Invoice'
  | 'Employee'
  | 'Payroll'
  | 'Report'
  | 'all';

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

export type AppAbility = PureAbility<[Action, Subject]>;
const AppAbility = PureAbility as AbilityClass<AppAbility>;

export interface AbilityInput {
  role: SystemRole;
  organizationId: string;
  branchId: string | null;
}

/**
 * Build a CASL ability for the given user. Today this is a coarse role-based
 * map; we will refine into per-branch + per-time conditions as modules land.
 */
export function defineAbilityFor({ role }: AbilityInput): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(AppAbility);

  switch (role) {
    case 'OWNER':
      can('manage', 'all');
      break;

    case 'MANAGER':
      can('manage', 'all');
      cannot('delete', 'Organization');
      cannot('manage', 'JournalEntry');
      can('read', 'JournalEntry');
      break;

    case 'ACCOUNTANT':
      can('read', 'all');
      can('manage', 'Account');
      can('manage', 'JournalEntry');
      can('manage', 'Invoice');
      can('manage', 'Report');
      break;

    case 'CASHIER':
      can('read', ['Product', 'Inventory', 'Branch']);
      can(['create', 'read', 'update'], 'Order');
      can(['create', 'read'], 'Invoice');
      break;

    case 'KITCHEN':
      can('read', ['Product', 'Order', 'Inventory']);
      can('update', 'Order');
      break;

    case 'STAFF':
    default:
      can('read', ['Product', 'Branch']);
      break;
  }

  return build();
}
