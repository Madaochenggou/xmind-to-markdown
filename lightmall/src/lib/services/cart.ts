import { prisma } from "@/lib/prisma";

export async function listCart(shopId: string, customerId: string) {
  return prisma.cartItem.findMany({
    where: { shopId, customerId },
    include: { product: true, sku: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function addToCart(shopId: string, customerId: string, skuId: string, quantity: number) {
  const sku = await prisma.sku.findFirst({
    where: { id: skuId, shopId, status: "active" },
    include: { product: true }
  });
  if (!sku || sku.product.deletedAt || sku.product.status !== "on_sale") {
    throw new Error("商品不可购买");
  }
  if (sku.stock <= 0) throw new Error("商品库存不足");
  const safeQuantity = Math.max(1, quantity);

  return prisma.cartItem.upsert({
    where: { shopId_customerId_skuId: { shopId, customerId, skuId } },
    create: {
      tenantId: sku.tenantId,
      shopId,
      customerId,
      productId: sku.productId,
      skuId,
      quantity: safeQuantity,
      selected: true
    },
    update: {
      quantity: { increment: safeQuantity },
      selected: true
    }
  });
}

export async function updateCartItem(
  shopId: string,
  customerId: string,
  cartItemId: string,
  values: { quantity?: number; selected?: boolean }
) {
  const item = await prisma.cartItem.findFirst({ where: { id: cartItemId, shopId, customerId } });
  if (!item) throw new Error("购物车商品不存在");
  return prisma.cartItem.update({
    where: { id: item.id },
    data: {
      ...(values.quantity !== undefined ? { quantity: Math.max(1, values.quantity) } : {}),
      ...(values.selected !== undefined ? { selected: values.selected } : {})
    }
  });
}

export async function deleteCartItem(shopId: string, customerId: string, cartItemId: string) {
  const item = await prisma.cartItem.findFirst({ where: { id: cartItemId, shopId, customerId } });
  if (!item) throw new Error("购物车商品不存在");
  return prisma.cartItem.delete({ where: { id: item.id } });
}
