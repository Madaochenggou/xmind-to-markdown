export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export type UserRole = "platform_admin" | "merchant_admin" | "customer";
export type ProductStatus = "draft" | "on_sale" | "off_sale";
export type OrderStatus = "pending_pay" | "paid" | "shipped" | "completed" | "cancelled";

export type ProductFormValues = {
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  categoryId: string;
  skuName: string;
  price: number;
  stock: number;
  status: ProductStatus;
};
