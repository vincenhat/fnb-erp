import { UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header className="border-border bg-card flex h-14 items-center justify-between border-b px-6">
      <div className="text-muted-foreground text-sm">Welcome back</div>
      <UserButton />
    </header>
  );
}
