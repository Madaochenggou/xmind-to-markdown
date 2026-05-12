import { requireCustomer } from "@/lib/auth";
import { cancelCustomerOrder, mockPayOrder } from "@/lib/services/orders";
import { fail, ok, readJson } from "@/lib/http";
import { getShopBySlug } from "@/lib/tenant";

export async function PATCH(request: Request, context: { params: Promise<{ shopSlug: string; orderId: string }> }) {
  try {
    const params = await context.params;
    const user = await requireCustomer();
    const shop = await getShopBySlug(params.shopSlug);
    const body = await readJson<{ action: "pay" | "cancel" }>(request);
    if (body.action === "pay") await mockPayOrder(shop.id, user.id, params.orderId);
    if (body.action === "cancel") await cancelCustomerOrder(shop.id, user.id, params.orderId);
    return ok(true);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "订单操作失败");
  }
}
