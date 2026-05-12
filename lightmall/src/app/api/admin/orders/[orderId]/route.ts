import { requireAdmin } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";
import { cancelAdminOrder, completeOrder, getAdminOrder, shipOrder } from "@/lib/services/orders";
import { getAdminScope } from "@/lib/tenant";

export async function GET(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const params = await context.params;
    const user = await requireAdmin();
    const scope = await getAdminScope(user);
    return ok(await getAdminOrder(scope.tenantId, scope.shopId, params.orderId));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "查询订单详情失败");
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const params = await context.params;
    const user = await requireAdmin();
    const scope = await getAdminScope(user);
    const body = await readJson<{ action: "ship" | "complete" | "cancel" }>(request);
    if (body.action === "ship") await shipOrder(scope.tenantId, scope.shopId, params.orderId, user.id);
    if (body.action === "complete") await completeOrder(scope.tenantId, scope.shopId, params.orderId, user.id);
    if (body.action === "cancel") await cancelAdminOrder(scope.tenantId, scope.shopId, params.orderId, user.id);
    return ok(true);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "订单操作失败");
  }
}
