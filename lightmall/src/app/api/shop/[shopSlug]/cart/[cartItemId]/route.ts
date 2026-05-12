import { requireCustomer } from "@/lib/auth";
import { deleteCartItem, updateCartItem } from "@/lib/services/cart";
import { fail, ok, readJson } from "@/lib/http";
import { getShopBySlug } from "@/lib/tenant";

export async function PATCH(request: Request, context: { params: Promise<{ shopSlug: string; cartItemId: string }> }) {
  try {
    const params = await context.params;
    const user = await requireCustomer();
    const shop = await getShopBySlug(params.shopSlug);
    const body = await readJson<{ quantity?: number; selected?: boolean }>(request);
    return ok(await updateCartItem(shop.id, user.id, params.cartItemId, body));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "更新购物车失败");
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ shopSlug: string; cartItemId: string }> }) {
  try {
    const params = await context.params;
    const user = await requireCustomer();
    const shop = await getShopBySlug(params.shopSlug);
    await deleteCartItem(shop.id, user.id, params.cartItemId);
    return ok(true);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "删除购物车失败");
  }
}
