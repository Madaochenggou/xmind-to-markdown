import Link from "next/link";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { listCart } from "@/lib/services/cart";
import { getShopBySlug } from "@/lib/tenant";

export default async function CheckoutPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  const user = await getCurrentUser();
  const items = user?.role === "customer" ? (await listCart(shop.id, user.id)).filter((item) => item.selected) : [];
  const total = items.reduce((sum, item) => sum + item.sku.price * item.quantity, 0);

  return (
    <div className="min-h-screen">
      <ShopHeader shopSlug={shopSlug} shopName={shop.name} />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">确认订单</h1>
          {user?.role !== "customer" ? (
            <div className="rounded-xl border bg-white p-10 text-center text-gray-500">请先使用买家账号登录</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
              没有选中的购物车商品，<Link className="text-blue-600" href={`/shop/${shopSlug}/cart`}>返回购物车</Link>
            </div>
          ) : items.map((item) => (
            <div key={item.id} className="rounded-xl border bg-white p-4">
              <div className="font-medium">{item.product.title}</div>
              <div className="mt-1 text-sm text-gray-500">{item.sku.skuName} x {item.quantity}</div>
              <div className="mt-2 font-semibold">{formatMoney(item.sku.price * item.quantity)}</div>
            </div>
          ))}
          <div className="rounded-xl border bg-white p-5">
            <div className="flex justify-between">
              <span>商品金额</span>
              <span className="font-semibold">{formatMoney(total)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>应付金额</span>
              <span className="text-xl font-bold">{formatMoney(total)}</span>
            </div>
          </div>
        </section>
        {user?.role === "customer" && items.length > 0 ? <CheckoutForm shopSlug={shopSlug} /> : null}
      </main>
    </div>
  );
}
