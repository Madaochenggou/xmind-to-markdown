import { AdminOrderActions } from "@/components/admin/AdminOrderActions";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { listAdminOrders } from "@/lib/services/orders";
import { getAdminScope } from "@/lib/tenant";

export default async function AdminOrdersPage() {
  const user = await requireAdmin();
  const scope = await getAdminScope(user);
  const orders = await listAdminOrders(scope.tenantId, scope.shopId);

  return (
    <AdminShell user={user}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">订单管理</h1>
        <p className="mt-1 text-gray-500">查看订单详情，处理发货、完成和取消。</p>
      </div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3">订单号</th>
              <th className="px-4 py-3">买家</th>
              <th className="px-4 py-3">金额</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">收货人</th>
              <th className="px-4 py-3">创建时间</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-gray-500" colSpan={7}>暂无订单</td></tr>
            ) : orders.map((order) => (
              <tr key={order.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{order.orderNo}</div>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    {order.items.map((item) => <div key={item.id}>{item.productTitle} x {item.quantity}</div>)}
                  </div>
                </td>
                <td className="px-4 py-3">{order.customer.name}</td>
                <td className="px-4 py-3">{formatMoney(order.payAmount)}</td>
                <td className="px-4 py-3"><StatusBadge value={order.status} /></td>
                <td className="px-4 py-3">
                  <div>{order.receiverName}</div>
                  <div className="text-xs text-gray-500">{order.receiverPhone}</div>
                  <div className="max-w-48 text-xs text-gray-500">{order.receiverAddress}</div>
                </td>
                <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3"><AdminOrderActions orderId={order.id} status={order.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
