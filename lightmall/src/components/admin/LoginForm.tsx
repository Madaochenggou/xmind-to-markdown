"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });
    const result = await response.json();
    setLoading(false);
    if (!result.ok) {
      setMessage(result.message || "登录失败");
      return;
    }
    router.push(result.data.role === "customer" ? "/shop/demo-shop" : "/admin/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
      <div>
        <label className="text-sm font-medium">邮箱</label>
        <input name="email" type="email" defaultValue="merchant@lightmall.local" className="mt-1 w-full rounded-lg border px-3 py-2" required />
      </div>
      <div>
        <label className="text-sm font-medium">密码</label>
        <input name="password" type="password" defaultValue="123456" className="mt-1 w-full rounded-lg border px-3 py-2" required />
      </div>
      {message ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
      <Button disabled={loading} className="w-full">{loading ? "登录中..." : "登录"}</Button>
      <div className="space-y-1 text-xs text-gray-500">
        <p>商户：admin 后台：merchant@lightmall.local / 123456</p>
        <p>买家：customer@lightmall.local / 123456</p>
      </div>
    </form>
  );
}
