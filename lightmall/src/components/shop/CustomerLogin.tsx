"use client";

import { useState } from "react";

export function CustomerLogin() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
    });
    const result = await response.json();
    if (!result.ok) setMessage(result.message);
    else window.location.reload();
  }

  if (!open) {
    return <button className="rounded-lg bg-ink px-3 py-2 text-white" onClick={() => setOpen(true)}>买家登录</button>;
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input name="email" defaultValue="customer@lightmall.local" className="w-52 rounded-lg border px-3 py-2" />
      <input name="password" type="password" defaultValue="123456" className="w-24 rounded-lg border px-3 py-2" />
      <button className="rounded-lg bg-ink px-3 py-2 text-white">登录</button>
      {message ? <span className="text-red-600">{message}</span> : null}
    </form>
  );
}
