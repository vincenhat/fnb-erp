import Link from 'next/link';
import type { Route } from 'next';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  BookOpen,
  BarChart3,
  Settings,
} from 'lucide-react';

const navItems: { href: Route; label: string; icon: typeof LayoutDashboard }[] = [
  { href: '/overview' as Route, label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/inventory' as Route, label: 'Kho hàng', icon: Package },
  { href: '/purchasing' as Route, label: 'Mua hàng', icon: ShoppingCart },
  { href: '/sales' as Route, label: 'Bán hàng', icon: Receipt },
  { href: '/hr' as Route, label: 'Nhân sự', icon: Users },
  { href: '/accounting' as Route, label: 'Kế toán', icon: BookOpen },
  { href: '/reports' as Route, label: 'Báo cáo', icon: BarChart3 },
  { href: '/settings' as Route, label: 'Cài đặt', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="border-border bg-card flex w-60 shrink-0 flex-col border-r">
      <div className="border-border flex h-14 items-center border-b px-4">
        <span className="font-semibold tracking-tight">F&amp;B ERP</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
