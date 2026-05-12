import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">LightMall 后台登录</h1>
          <p className="mt-2 text-sm text-gray-500">商户、平台和演示买家共用简化登录能力</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
