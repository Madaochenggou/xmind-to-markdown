"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";

export function AdminOrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [message, setMessage] = useState("");

  async function action(next: "ship" | "complete" | "cancel") {
    setMessage("");
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: next })
    });
    const result = await response.json();
    if (!result.ok) setMessage(result.message);
    else window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "pending_pay" ? <Button variant="danger" onClick={() => action("cancel")}>取消</Button> : null}
      {status === "paid" ? <Button onClick={() => action("ship")}>发货</Button> : null}
      {status === "shipped" ? <Button onClick={() => action("complete")}>完成</Button> : null}
      {message ? <span className="text-sm text-red-600">{message}</span> : null}
    </div>
  );
}
