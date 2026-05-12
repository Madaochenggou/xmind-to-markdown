import { requireAdmin } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";
import { getAdminScope } from "@/lib/tenant";
import { changeProductStatus, softDeleteProduct, updateProduct } from "@/lib/services/products";
import type { ProductFormValues, ProductStatus } from "@/types";

export async function PUT(request: Request, context: { params: Promise<{ productId: string }> }) {
  try {
    const params = await context.params;
    const user = await requireAdmin();
    const scope = await getAdminScope(user);
    const body = await readJson<ProductFormValues>(request);
    await updateProduct(scope.tenantId, scope.shopId, params.productId, body);
    return ok(true);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "编辑商品失败");
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ productId: string }> }) {
  try {
    const params = await context.params;
    const user = await requireAdmin();
    const scope = await getAdminScope(user);
    const body = await readJson<{ status: ProductStatus }>(request);
    await changeProductStatus(scope.tenantId, scope.shopId, params.productId, body.status);
    return ok(true);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "更新商品状态失败");
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ productId: string }> }) {
  try {
    const params = await context.params;
    const user = await requireAdmin();
    const scope = await getAdminScope(user);
    await softDeleteProduct(scope.tenantId, scope.shopId, params.productId);
    return ok(true);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "删除商品失败");
  }
}
