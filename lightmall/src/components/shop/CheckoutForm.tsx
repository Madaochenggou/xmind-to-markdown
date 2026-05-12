"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";

export function CheckoutForm({ shopSlug }: { shopSlug: string }) {
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/shop/${shopSlug}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverName: form.get("receiverName"),
        receiverPhone: form.get("receiverPhone"),
        receiverAddress: form.get("receiverAddress")
      })
    });
    const result = await response.json();
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    window.location.href = `/shop/${shopSlug}/orders`;
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-5">
      <h2 className="font-semibold">收货信息</h2>
      {message ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
      <input name="receiverName" placeholder="收货人姓名" defaultValue="张三" className="w-full rounded-lg border px-3 py-2" required />
      <input name="receiverPhone" placeholder="手机号" defaultValue="13800000000" className="w-full rounded-lg border px-3 py-2" required />
      <textarea name="receiverAddress" placeholder="收货地址" defaultValue="上海市演示区 LightMall 路 100 号" className="min-h-24 w-full rounded-lg border px-3 py-2" required />
      <Button className="w-full">提交订单</Button>
    </form>
  );
}
