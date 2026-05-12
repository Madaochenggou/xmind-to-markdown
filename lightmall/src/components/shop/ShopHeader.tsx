import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { CustomerLogin } from "@/components/shop/CustomerLogin";

export async function ShopHeader({ shopSlug, shopName }: { shopSlug: string; shopName: string }) {
  const user = await getCurrentUser();
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href={`/shop/${shopSlug}`} className="text-2xl font-bold">{shopName}</Link>
          <p className="text-sm text-gray-500">LightMall 演示店铺</p>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href={`/shop/${shopSlug}`} className="rounded-lg px-3 py-2 hover:bg-gray-100">商品</Link>
          <Link href={`/shop/${shopSlug}/cart`} className="rounded-lg px-3 py-2 hover:bg-gray-100">购物车</Link>
          <Link href={`/shop/${shopSlug}/orders`} className="rounded-lg px-3 py-2 hover:bg-gray-100">我的订单</Link>
          {user?.role === "customer" ? <span className="text-gray-500">{user.name}</span> : <CustomerLogin />}
        </nav>
      </div>
    </header>
  );
}
