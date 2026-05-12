"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";

export function CustomerOrderActions({ shopSlug, orderId, status }: { shopSlug: string; orderId: string; status: string }) {
  const [message, setMessage] = useState("");

  async function action(next: "pay" | "cancel") {
    setMessage("");
    const response = await fetch(`/api/shop/${shopSlug}/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: next })
    });
    const result = await response.json();
    if (!result.ok) setMessage(result.message);
    else window.location.reload();
  }

  if (status !== "pending_pay") return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => action("pay")}>模拟支付</Button>
      <Button variant="secondary" onClick={() => action("cancel")}>取消订单</Button>
      {message ? <span className="text-sm text-red-600">{message}</span> : null}
    </div>
  );
}
