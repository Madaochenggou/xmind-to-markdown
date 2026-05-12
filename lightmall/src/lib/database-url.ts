import { resolve } from "path";

export function resolveSqlitePath(url = process.env.DATABASE_URL || "file:./dev.db") {
  const rawPath = url.startsWith("file:") ? url.slice(5) : url;
  if (rawPath === ":memory:" || rawPath.startsWith("/")) return rawPath;
  return resolve(process.cwd(), "prisma", rawPath.replace(/^\.\//, ""));
}
