export function generateOrderNo() {
  const stamp = new Date()
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(".", "")
    .slice(0, 17);
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `LM${stamp}${random}`;
}

export function generatePaymentNo() {
  const random = Math.floor(Math.random() * 900000 + 100000);
  return `PAY${Date.now()}${random}`;
}
