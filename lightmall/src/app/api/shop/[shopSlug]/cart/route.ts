import { requireCustomer } from "@/lib/auth";
import { addToCart, listCart } from "@/lib/services/cart";
import { fail, ok, readJson } from "@/lib/http";
import { getShopBySlug } from "@/lib/tenant";

export async function GET(_request: Request, context: { params: Promise<{ shopSlug: string }> }) {
  try {
    const params = await context.params;
    const user = await requireCustomer();
    const shop = await getShopBySlug(params.shopSlug);
    return ok(await listCart(shop.id, user.id));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "查询购物车失败");
  }
}

export async function POST(request: Request, context: { params: Promise<{ shopSlug: string }> }) {
  try {
    const params = await context.params;
    const user = await requireCustomer();
    const shop = await getShopBySlug(params.shopSlug);
    const body = await readJson<{ skuId: string; quantity?: number }>(request);
    return ok(await addToCart(shop.id, user.id, body.skuId, body.quantity || 1));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "加入购物车失败");
  }
}
