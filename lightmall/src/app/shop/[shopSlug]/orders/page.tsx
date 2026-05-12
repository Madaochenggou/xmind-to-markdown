import { CustomerOrderActions } from "@/components/shop/CustomerOrderActions";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { listCustomerOrders } from "@/lib/services/orders";
import { getShopBySlug } from "@/lib/tenant";

export default async function CustomerOrdersPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  const user = await getCurrentUser();
  const orders = user?.role === "customer" ? await listCustomerOrders(shop.id, user.id) : [];

  return (
    <div className="min-h-screen">
      <ShopHeader shopSlug={shopSlug} shopName={shop.name} />
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-bold">我的订单</h1>
        {user?.role !== "customer" ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">请先使用买家账号登录</div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">暂无订单</div>
        ) : orders.map((order) => (
          <div key={order.id} className="rounded-xl border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
              <div>
                <div className="font-semibold">{order.orderNo}</div>
                <div className="mt-1 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge value={order.status} />
                <span className="text-lg font-bold">{formatMoney(order.payAmount)}</span>
              </div>
            </div>
            <div className="space-y-2 py-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.productTitle} · {item.skuName} x {item.quantity}</span>
                  <span>{formatMoney(item.totalAmount)}</span>
                </div>
              ))}
            </div>
            <CustomerOrderActions shopSlug={shopSlug} orderId={order.id} status={order.status} />
          </div>
        ))}
      </main>
    </div>
  );
}
