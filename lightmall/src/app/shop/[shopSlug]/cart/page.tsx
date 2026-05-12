import { CartClient } from "@/components/shop/CartClient";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { getCurrentUser } from "@/lib/auth";
import { listCart } from "@/lib/services/cart";
import { getShopBySlug } from "@/lib/tenant";

export default async function CartPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  const user = await getCurrentUser();
  const items = user?.role === "customer" ? await listCart(shop.id, user.id) : [];

  return (
    <div className="min-h-screen">
      <ShopHeader shopSlug={shopSlug} shopName={shop.name} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-5 text-2xl font-bold">购物车</h1>
        {user?.role !== "customer" ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">请先使用买家账号登录</div>
        ) : (
          <CartClient shopSlug={shopSlug} items={items} />
        )}
      </main>
    </div>
  );
}
