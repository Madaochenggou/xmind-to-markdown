const labels: Record<string, string> = {
  draft: "草稿",
  on_sale: "在售",
  off_sale: "下架",
  pending_pay: "待支付",
  paid: "已支付",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
  active: "启用",
  disabled: "停用"
};

const colors: Record<string, string> = {
  on_sale: "bg-green-50 text-green-700 ring-green-200",
  paid: "bg-blue-50 text-blue-700 ring-blue-200",
  shipped: "bg-purple-50 text-purple-700 ring-purple-200",
  completed: "bg-gray-100 text-gray-700 ring-gray-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  pending_pay: "bg-amber-50 text-amber-700 ring-amber-200"
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${colors[value] || "bg-gray-50 text-gray-700 ring-gray-200"}`}>
      {labels[value] || value}
    </span>
  );
}
