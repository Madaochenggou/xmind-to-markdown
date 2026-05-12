import { prisma } from "@/lib/prisma";
import type { ProductFormValues, ProductStatus } from "@/types";

export async function listAdminProducts(tenantId: string, shopId: string) {
  return prisma.product.findMany({
    where: { tenantId, shopId, deletedAt: null },
    include: { category: true, skus: { orderBy: { createdAt: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" }
  });
}

export async function createProduct(tenantId: string, shopId: string, values: ProductFormValues) {
  const category = await prisma.category.findFirst({
    where: { id: values.categoryId, tenantId, shopId, status: "active" }
  });
  if (!category) throw new Error("商品分类不存在");

  return prisma.product.create({
    data: {
      tenantId,
      shopId,
      categoryId: values.categoryId,
      title: values.title,
      subtitle: values.subtitle || "",
      description: values.description || "",
      coverImage: values.coverImage || "",
      status: values.status,
      skus: {
        create: {
          tenantId,
          shopId,
          skuName: values.skuName || "默认规格",
          price: values.price,
          stock: values.stock,
          status: "active"
        }
      }
    }
  });
}

export async function updateProduct(
  tenantId: string,
  shopId: string,
  productId: string,
  values: ProductFormValues
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId, shopId, deletedAt: null },
    include: { skus: { orderBy: { createdAt: "asc" }, take: 1 } }
  });
  if (!product) throw new Error("商品不存在");

  await prisma.product.update({
    where: { id: product.id },
    data: {
      categoryId: values.categoryId,
      title: values.title,
      subtitle: values.subtitle || "",
      description: values.description || "",
      coverImage: values.coverImage || "",
      status: values.status
    }
  });

  const sku = product.skus[0];
  if (sku) {
    await prisma.sku.update({
      where: { id: sku.id },
      data: {
        skuName: values.skuName || "默认规格",
        price: values.price,
        stock: values.stock,
        status: "active"
      }
    });
  } else {
    await prisma.sku.create({
      data: {
        tenantId,
        shopId,
        productId: product.id,
        skuName: values.skuName || "默认规格",
        price: values.price,
        stock: values.stock,
        status: "active"
      }
    });
  }
}

export async function changeProductStatus(
  tenantId: string,
  shopId: string,
  productId: string,
  status: ProductStatus
) {
  const product = await prisma.product.findFirst({ where: { id: productId, tenantId, shopId } });
  if (!product) throw new Error("商品不存在");
  return prisma.product.update({ where: { id: product.id }, data: { status } });
}

export async function softDeleteProduct(tenantId: string, shopId: string, productId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, tenantId, shopId } });
  if (!product) throw new Error("商品不存在");
  return prisma.product.update({
    where: { id: product.id },
    data: { deletedAt: new Date(), status: "off_sale" }
  });
}

export async function listShopProducts(shopId: string, categoryId?: string) {
  return prisma.product.findMany({
    where: {
      shopId,
      deletedAt: null,
      status: "on_sale",
      ...(categoryId ? { categoryId } : {})
    },
    include: { category: true, skus: { where: { status: "active" }, take: 1 } },
    orderBy: { createdAt: "desc" }
  });
}
