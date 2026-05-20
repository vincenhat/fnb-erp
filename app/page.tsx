import Link from 'next/link';
import type { Route } from 'next';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">F&amp;B ERP</h1>
        <p className="text-muted-foreground">ERP custom cho doanh nghiệp F&amp;B vừa và nhỏ</p>
      </div>
      <div className="flex gap-4">
        <Link
          href={'/sign-in' as Route}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Đăng nhập
        </Link>
        <Link
          href={'/overview' as Route}
          className="border-border bg-background hover:bg-accent rounded-md border px-4 py-2 text-sm font-medium"
        >
          Vào dashboard
        </Link>
      </div>
    </main>
  );
}
