import { requireCustomer } from "@/lib/auth";
import { createOrderFromCart, listCustomerOrders } from "@/lib/services/orders";
import { fail, ok, readJson } from "@/lib/http";
import { getShopBySlug } from "@/lib/tenant";

export async function GET(_request: Request, context: { params: Promise<{ shopSlug: string }> }) {
  try {
    const params = await context.params;
    const user = await requireCustomer();
    const shop = await getShopBySlug(params.shopSlug);
    return ok(await listCustomerOrders(shop.id, user.id));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "查询我的订单失败");
  }
}

export async function POST(request: Request, context: { params: Promise<{ shopSlug: string }> }) {
  try {
    const params = await context.params;
    const user = await requireCustomer();
    const shop = await getShopBySlug(params.shopSlug);
    const body = await readJson<{ receiverName: string; receiverPhone: string; receiverAddress: string }>(request);
    return ok(
      await createOrderFromCart(shop.id, user.id, {
        name: body.receiverName,
        phone: body.receiverPhone,
        address: body.receiverAddress
      })
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : "提交订单失败");
  }
}
