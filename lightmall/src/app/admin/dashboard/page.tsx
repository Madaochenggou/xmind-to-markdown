import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getAdminScope } from "@/lib/tenant";

export default async function DashboardPage() {
  const user = await requireAdmin();
  const scope = await getAdminScope(user);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [productTotal, onSaleTotal, orderTotal, pendingPayTotal, paidTotal, todayOrders, recentOrders] =
    await Promise.all([
      prisma.product.count({ where: { tenantId: scope.tenantId, shopId: scope.shopId, deletedAt: null } }),
      prisma.product.count({ where: { tenantId: scope.tenantId, shopId: scope.shopId, deletedAt: null, status: "on_sale" } }),
      prisma.order.count({ where: { tenantId: scope.tenantId, shopId: scope.shopId } }),
      prisma.order.count({ where: { tenantId: scope.tenantId, shopId: scope.shopId, status: "pending_pay" } }),
      prisma.order.count({ where: { tenantId: scope.tenantId, shopId: scope.shopId, status: "paid" } }),
      prisma.order.findMany({ where: { tenantId: scope.tenantId, shopId: scope.shopId, createdAt: { gte: today } } }),
      prisma.order.findMany({
        where: { tenantId: scope.tenantId, shopId: scope.shopId },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 5
      })
    ]);

  const todayAmount = todayOrders.reduce((sum, order) => sum + order.payAmount, 0);
  const cards = [
    ["商品总数", productTotal],
    ["在售商品", onSaleTotal],
    ["订单总数", orderTotal],
    ["待支付", pendingPayTotal],
    ["已支付", paidTotal],
    ["今日订单金额", formatMoney(todayAmount)]
  ];

  return (
    <AdminShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">后台首页</h1>
          <p className="mt-1 text-gray-500">当前店铺：{scope.shop.name}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-white p-5">
              <div className="text-sm text-gray-500">{label}</div>
              <div className="mt-2 text-2xl font-bold">{value}</div>
            </div>
          ))}
        </div>
        <section className="rounded-xl border bg-white">
          <div className="border-b px-5 py-4 font-semibold">最近 5 条订单</div>
          <div className="divide-y">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无订单</div>
            ) : recentOrders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
                <div>
                  <div className="font-medium">{order.orderNo}</div>
                  <div className="text-gray-500">{order.customer.name} · {new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={order.status} />
                  <span className="font-semibold">{formatMoney(order.payAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
