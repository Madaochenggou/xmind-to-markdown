import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAdminScope(user: SessionUser) {
  if (user.role === "merchant_admin") {
    if (!user.tenantId) throw new Error("商户管理员未绑定商户");
    const shop = await prisma.shop.findFirst({ where: { tenantId: user.tenantId } });
    if (!shop) throw new Error("当前商户未配置店铺");
    return { tenantId: user.tenantId, shopId: shop.id, shop };
  }
  const shop = await prisma.shop.findFirst({ orderBy: { createdAt: "asc" } });
  if (!shop) throw new Error("暂无店铺数据");
  return { tenantId: shop.tenantId, shopId: shop.id, shop };
}

export async function getShopBySlug(shopSlug: string) {
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, include: { tenant: true } });
  if (!shop || shop.status !== "active" || shop.tenant.status !== "active") {
    throw new Error("店铺不存在或已停用");
  }
  return shop;
}
