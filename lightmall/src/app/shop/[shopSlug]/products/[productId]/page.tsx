import { notFound } from "next/navigation";
import { AddToCart } from "@/components/shop/AddToCart";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getShopBySlug } from "@/lib/tenant";

export default async function ProductDetailPage({ params }: { params: Promise<{ shopSlug: string; productId: string }> }) {
  const { shopSlug, productId } = await params;
  const shop = await getShopBySlug(shopSlug);
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId: shop.id, deletedAt: null },
    include: { category: true, skus: { where: { status: "active" }, take: 1 } }
  });
  if (!product) notFound();
  const sku = product.skus[0];
  const disabled = product.status !== "on_sale" || !sku || sku.stock <= 0;

  return (
    <div className="min-h-screen">
      <ShopHeader shopSlug={shopSlug} shopName={shop.name} />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="aspect-square bg-gray-100">
            {product.coverImage ? <img src={product.coverImage} alt={product.title} className="h-full w-full object-cover" /> : null}
          </div>
        </div>
        <div className="space-y-5 rounded-xl border bg-white p-6">
          <div>
            <div className="text-sm text-gray-500">{product.category.name}</div>
            <h1 className="mt-2 text-3xl font-bold">{product.title}</h1>
            <p className="mt-2 text-gray-500">{product.subtitle}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-sm text-gray-500">{sku?.skuName || "默认规格"}</div>
            <div className="mt-1 text-3xl font-bold">{formatMoney(sku?.price || 0)}</div>
            <div className="mt-1 text-sm text-gray-500">库存 {sku?.stock ?? 0}</div>
          </div>
          <p className="leading-7 text-gray-700">{product.description || "暂无商品描述"}</p>
          {disabled ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">当前商品不可购买</p> : null}
          {sku ? <AddToCart shopSlug={shopSlug} skuId={sku.id} disabled={disabled} /> : null}
        </div>
      </main>
    </div>
  );
}
