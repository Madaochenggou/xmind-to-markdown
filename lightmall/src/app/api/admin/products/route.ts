import { requireAdmin } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";
import { getAdminScope } from "@/lib/tenant";
import { createProduct, listAdminProducts } from "@/lib/services/products";
import type { ProductFormValues } from "@/types";

export async function GET() {
  try {
    const user = await requireAdmin();
    const scope = await getAdminScope(user);
    return ok(await listAdminProducts(scope.tenantId, scope.shopId));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "查询商品失败");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const scope = await getAdminScope(user);
    const body = await readJson<ProductFormValues>(request);
    return ok(await createProduct(scope.tenantId, scope.shopId, body));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "新增商品失败");
  }
}
