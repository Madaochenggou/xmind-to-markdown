import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6">
      <div className="space-y-6">
        <p className="text-sm font-semibold text-blue-600">LightMall MVP</p>
        <h1 className="text-4xl font-bold tracking-tight">轻量级电商 SaaS 演示项目</h1>
        <p className="max-w-2xl text-gray-600">
          本地 SQLite、多商户隔离、商户后台、C 端店铺、购物车、下单、模拟支付和订单流转已经串成闭环。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-lg bg-ink px-5 py-3 text-sm font-medium text-white" href="/admin/login">
            后台登录
          </Link>
          <Link className="rounded-lg border bg-white px-5 py-3 text-sm font-medium" href="/shop/demo-shop">
            打开演示店铺
          </Link>
        </div>
      </div>
    </main>
  );
}
