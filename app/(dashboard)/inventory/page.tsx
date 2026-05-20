export default function InventoryPage() {
  return <ModulePlaceholder title="Kho hàng" subtitle="Tháng 2: Product, Recipe, StockMovement" />;
}

function ModulePlaceholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}
