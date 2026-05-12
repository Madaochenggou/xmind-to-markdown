import Link from "next/link";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/lib/auth";

export function AdminShell({
  user,
  children
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  async function logoutAction() {
    "use server";
    const { logout } = await import("@/lib/auth");
    await logout();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-white p-6 md:block">
        <Link href="/admin/dashboard" className="text-xl font-bold">LightMall</Link>
        <nav className="mt-8 space-y-2">
          <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100" href="/admin/dashboard">后台首页</Link>
          <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100" href="/admin/products">商品管理</Link>
          <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100" href="/admin/orders">订单管理</Link>
          <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100" href="/shop/demo-shop">演示店铺</Link>
        </nav>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="md:hidden">
            <Link href="/admin/dashboard" className="font-bold">LightMall</Link>
          </div>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span>{user.name} · {user.role}</span>
            <form action={logoutAction}>
              <button className="text-gray-500 hover:text-gray-900">退出</button>
            </form>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
