"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";

export function AddToCart({ shopSlug, skuId, disabled }: { shopSlug: string; skuId: string; disabled?: boolean }) {
  const [message, setMessage] = useState("");

  async function add() {
    setMessage("");
    const response = await fetch(`/api/shop/${shopSlug}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skuId, quantity: 1 })
    });
    const result = await response.json();
    setMessage(result.ok ? "已加入购物车" : result.message);
  }

  async function buyNow() {
    await add();
    window.location.href = `/shop/${shopSlug}/cart`;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button variant="secondary" disabled={disabled} onClick={add}>加入购物车</Button>
        <Button disabled={disabled} onClick={buyNow}>立即购买</Button>
      </div>
      {message ? <p className={message.includes("已") ? "text-sm text-green-700" : "text-sm text-red-600"}>{message}</p> : null}
    </div>
  );
}
