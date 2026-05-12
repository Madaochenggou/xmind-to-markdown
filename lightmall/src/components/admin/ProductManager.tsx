"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatMoney } from "@/lib/money";

type Category = { id: string; name: string };
type Product = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  coverImage: string | null;
  status: string;
  createdAt: Date;
  category: Category;
  skus: { skuName: string; price: number; stock: number }[];
};

const empty = {
  title: "",
  subtitle: "",
  description: "",
  coverImage: "",
  categoryId: "",
  skuName: "默认规格",
  price: "99.00",
  stock: "10",
  status: "draft"
};

export function ProductManager({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      subtitle: String(form.get("subtitle") || ""),
      description: String(form.get("description") || ""),
      coverImage: String(form.get("coverImage") || ""),
      categoryId: String(form.get("categoryId") || ""),
      skuName: String(form.get("skuName") || "默认规格"),
      price: Math.round(Number(form.get("price") || 0) * 100),
      stock: Number(form.get("stock") || 0),
      status: String(form.get("status") || "draft")
    };
    const response = await fetch(editing ? `/api/admin/products/${editing.id}` : "/api/admin/products", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    window.location.reload();
  }

  async function action(productId: string, method: string, body?: unknown) {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const result = await response.json();
    if (!result.ok) setMessage(result.message);
    else window.location.reload();
  }

  const firstCategory = categories[0]?.id || "";
  const sku = editing?.skus[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3">价格</th>
              <th className="px-4 py-3">库存</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-gray-500" colSpan={6}>暂无商品</td></tr>
            ) : products.map((product) => {
              const currentSku = product.skus[0];
              return (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                        {product.coverImage ? <img src={product.coverImage} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                      <div>
                        <div className="font-medium">{product.title}</div>
                        <div className="text-xs text-gray-500">{product.subtitle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{product.category.name}</td>
                  <td className="px-4 py-3">{formatMoney(currentSku?.price || 0)}</td>
                  <td className="px-4 py-3">{currentSku?.stock ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge value={product.status} /></td>
                  <td className="space-x-2 px-4 py-3">
                    <button className="text-blue-600" onClick={() => setEditing(product)}>编辑</button>
                    {product.status === "on_sale" ? (
                      <button className="text-amber-600" onClick={() => action(product.id, "PATCH", { status: "off_sale" })}>下架</button>
                    ) : (
                      <button className="text-green-600" onClick={() => action(product.id, "PATCH", { status: "on_sale" })}>上架</button>
                    )}
                    <button className="text-red-600" onClick={() => action(product.id, "DELETE")}>删除</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{editing ? "编辑商品" : "新增商品"}</h2>
          {editing ? <button type="button" className="text-sm text-gray-500" onClick={() => setEditing(null)}>清空</button> : null}
        </div>
        {message ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
        <input name="title" placeholder="商品名称" defaultValue={editing?.title || empty.title} className="w-full rounded-lg border px-3 py-2" required />
        <input name="subtitle" placeholder="副标题" defaultValue={editing?.subtitle || empty.subtitle} className="w-full rounded-lg border px-3 py-2" />
        <select name="categoryId" defaultValue={editing?.category.id || firstCategory} className="w-full rounded-lg border px-3 py-2">
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <textarea name="description" placeholder="商品描述" defaultValue={editing?.description || empty.description} className="min-h-24 w-full rounded-lg border px-3 py-2" />
        <input name="coverImage" placeholder="封面图 URL" defaultValue={editing?.coverImage || empty.coverImage} className="w-full rounded-lg border px-3 py-2" />
        <input name="skuName" placeholder="SKU 名称" defaultValue={sku?.skuName || empty.skuName} className="w-full rounded-lg border px-3 py-2" />
        <div className="grid grid-cols-2 gap-3">
          <input name="price" type="number" step="0.01" min="0" placeholder="售价（元）" defaultValue={sku ? (sku.price / 100).toFixed(2) : empty.price} className="w-full rounded-lg border px-3 py-2" />
          <input name="stock" type="number" min="0" placeholder="库存" defaultValue={sku?.stock ?? empty.stock} className="w-full rounded-lg border px-3 py-2" />
        </div>
        <select name="status" defaultValue={editing?.status || empty.status} className="w-full rounded-lg border px-3 py-2">
          <option value="draft">草稿</option>
          <option value="on_sale">在售</option>
          <option value="off_sale">下架</option>
        </select>
        <Button className="w-full">{editing ? "保存修改" : "新增商品"}</Button>
      </form>
    </div>
  );
}
