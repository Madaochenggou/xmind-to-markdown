import Link from "next/link";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { formatMoney } from "@/lib/money";
import { listShopProducts } from "@/lib/services/products";
import { getShopBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export default async function ShopHomePage({
  params,
  searchParams
}: {
  params: Promise<{ shopSlug: string }>;
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const { shopSlug } = await params;
  const query = await searchParams;
  const shop = await getShopBySlug(shopSlug);
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { shopId: shop.id, status: "active" }, orderBy: { sort: "asc" } }),
    listShopProducts(shop.id, query.categoryId)
  ]);

  return (
    <div className="min-h-screen">
      <ShopHeader shopSlug={shopSlug} shopName={shop.name} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-full border bg-white px-4 py-2 text-sm" href={`/shop/${shopSlug}`}>全部</Link>
          {categories.map((category) => (
            <Link key={category.id} className="rounded-full border bg-white px-4 py-2 text-sm" href={`/shop/${shopSlug}?categoryId=${category.id}`}>
              {category.name}
            </Link>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 ? (
            <div className="col-span-full rounded-xl border bg-white p-10 text-center text-gray-500">暂无可售商品</div>
          ) : products.map((product) => {
            const sku = product.skus[0];
            return (
              <Link key={product.id} href={`/shop/${shopSlug}/products/${product.id}`} className="overflow-hidden rounded-xl border bg-white transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="aspect-[4/3] bg-gray-100">
                  {product.coverImage ? <img src={product.coverImage} alt={product.title} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="space-y-2 p-4">
                  <div className="font-semibold">{product.title}</div>
                  <div className="text-sm text-gray-500">{product.subtitle}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{formatMoney(sku?.price || 0)}</span>
                    <span className="text-sm text-gray-500">库存 {sku?.stock ?? 0}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
