import { requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { listAdminOrders } from "@/lib/services/orders";
import { getAdminScope } from "@/lib/tenant";

export async function GET() {
  try {
    const user = await requireAdmin();
    const scope = await getAdminScope(user);
    return ok(await listAdminOrders(scope.tenantId, scope.shopId));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "查询订单失败");
  }
}
