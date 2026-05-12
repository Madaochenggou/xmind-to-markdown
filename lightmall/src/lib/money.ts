export function formatMoney(amount: number) {
  return `¥${(amount / 100).toFixed(2)}`;
}

export function yuanToCent(value: string | number) {
  const normalized = typeof value === "number" ? value.toString() : value;
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error("请输入有效的金额");
  }
  return Math.round(numeric * 100);
}
