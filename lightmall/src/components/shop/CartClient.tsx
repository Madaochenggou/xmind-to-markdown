"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { formatMoney } from "@/lib/money";

type CartItem = {
  id: string;
  quantity: number;
  selected: boolean;
  product: { title: string; coverImage: string | null; status: string };
  sku: { skuName: string; price: number; stock: number };
};

export function CartClient({ shopSlug, items }: { shopSlug: string; items: CartItem[] }) {
  const [message, setMessage] = useState("");
  const total = items.filter((item) => item.selected).reduce((sum, item) => sum + item.sku.price * item.quantity, 0);

  async function update(id: string, body: unknown) {
    const response = await fetch(`/api/shop/${shopSlug}/cart/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!result.ok) setMessage(result.message);
    else window.location.reload();
  }

  async function remove(id: string) {
    const response = await fetch(`/api/shop/${shopSlug}/cart/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (!result.ok) setMessage(result.message);
    else window.location.reload();
  }

  return (
    <div className="space-y-4">
      {message ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
      {items.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">购物车还是空的</div>
      ) : items.map((item) => (
        <div key={item.id} className="flex flex-col gap-4 rounded-xl border bg-white p-4 md:flex-row md:items-center">
          <input type="checkbox" checked={item.selected} onChange={(e) => update(item.id, { selected: e.target.checked })} className="h-5 w-5" />
          <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100">
            {item.product.coverImage ? <img src={item.product.coverImage} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="flex-1">
            <div className="font-medium">{item.product.title}</div>
            <div className="text-sm text-gray-500">{item.sku.skuName} · 库存 {item.sku.stock}</div>
            <div className="mt-1 font-semibold">{formatMoney(item.sku.price)}</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded border px-3 py-1" onClick={() => update(item.id, { quantity: item.quantity - 1 })}>-</button>
            <span className="w-8 text-center">{item.quantity}</span>
            <button className="rounded border px-3 py-1" onClick={() => update(item.id, { quantity: item.quantity + 1 })}>+</button>
          </div>
          <button className="text-sm text-red-600" onClick={() => remove(item.id)}>删除</button>
        </div>
      ))}
      <div className="sticky bottom-0 flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
        <div>
          <div className="text-sm text-gray-500">合计</div>
          <div className="text-xl font-bold">{formatMoney(total)}</div>
        </div>
        <Link href={`/shop/${shopSlug}/checkout`}>
          <Button disabled={total <= 0}>去结算</Button>
        </Link>
      </div>
    </div>
  );
}
