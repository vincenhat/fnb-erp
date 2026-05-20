export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-muted-foreground">
          Doanh thu, food cost %, inventory health sẽ hiển thị ở đây.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {['Doanh thu hôm nay', 'Food cost %', 'Đơn pending', 'Inventory alert'].map((title) => (
          <div key={title} className="border-border bg-card rounded-lg border p-4 shadow-sm">
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
