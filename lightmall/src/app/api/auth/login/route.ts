import { login } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ email: string; password: string }>(request);
    const user = await login(body.email, body.password);
    return ok(user);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "登录失败", 401);
  }
}
