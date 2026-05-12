import { AdminShell } from "@/components/admin/AdminShell";
import { ProductManager } from "@/components/admin/ProductManager";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAdminProducts } from "@/lib/services/products";
import { getAdminScope } from "@/lib/tenant";

export default async function AdminProductsPage() {
  const user = await requireAdmin();
  const scope = await getAdminScope(user);
  const [products, categories] = await Promise.all([
    listAdminProducts(scope.tenantId, scope.shopId),
    prisma.category.findMany({ where: { tenantId: scope.tenantId, shopId: scope.shopId, status: "active" }, orderBy: { sort: "asc" } })
  ]);

  return (
    <AdminShell user={user}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <p className="mt-1 text-gray-500">新增、编辑、上架、下架和软删除商品。</p>
      </div>
      <ProductManager products={products} categories={categories} />
    </AdminShell>
  );
}
