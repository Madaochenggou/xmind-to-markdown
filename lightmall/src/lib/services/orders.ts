import { prisma } from "@/lib/prisma";
import { generateOrderNo, generatePaymentNo } from "@/lib/order";

export async function listAdminOrders(tenantId: string, shopId: string) {
  return prisma.order.findMany({
    where: { tenantId, shopId },
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function getAdminOrder(tenantId: string, shopId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId, shopId },
    include: { customer: true, items: true, payments: true }
  });
  if (!order) throw new Error("订单不存在");
  return order;
}

export async function createOrderFromCart(
  shopId: string,
  customerId: string,
  receiver: { name: string; phone: string; address: string }
) {
  if (!receiver.name || !receiver.phone || !receiver.address) {
    throw new Error("请完整填写收货信息");
  }
  const cartItems = await prisma.cartItem.findMany({
    where: { shopId, customerId, selected: true },
    include: { product: true, sku: true }
  });
  if (cartItems.length === 0) throw new Error("请选择要结算的商品");

  for (const item of cartItems) {
    if (item.product.deletedAt || item.product.status !== "on_sale") {
      throw new Error(`商品「${item.product.title}」不可购买`);
    }
    if (item.sku.status !== "active") throw new Error(`规格「${item.sku.skuName}」不可购买`);
    if (item.sku.stock <= 0) throw new Error(`商品「${item.product.title}」库存不足`);
  }

  const tenantId = cartItems[0].tenantId;
  const totalAmount = cartItems.reduce((sum, item) => sum + item.sku.price * item.quantity, 0);

  // 下单只锁定订单金额和快照，不扣库存；库存统一在模拟支付成功时扣减。
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        tenantId,
        shopId,
        customerId,
        orderNo: generateOrderNo(),
        status: "pending_pay",
        totalAmount,
        payAmount: totalAmount,
        receiverName: receiver.name,
        receiverPhone: receiver.phone,
        receiverAddress: receiver.address,
        items: {
          create: cartItems.map((item) => ({
            tenantId,
            shopId,
            productId: item.productId,
            skuId: item.skuId,
            productTitle: item.product.title,
            skuName: item.sku.skuName,
            price: item.sku.price,
            quantity: item.quantity,
            totalAmount: item.sku.price * item.quantity
          }))
        }
      }
    });
    await tx.cartItem.deleteMany({ where: { id: { in: cartItems.map((item) => item.id) } } });
    return order;
  });
}

export async function listCustomerOrders(shopId: string, customerId: string) {
  return prisma.order.findMany({
    where: { shopId, customerId },
    include: { items: true, payments: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function mockPayOrder(shopId: string, customerId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, shopId, customerId },
    include: { items: true, payments: true }
  });
  if (!order) throw new Error("订单不存在");
  if (order.status !== "pending_pay") throw new Error("只有待支付订单可以支付");

  return prisma.$transaction(async (tx) => {
    const freshItems = await tx.orderItem.findMany({ where: { orderId: order.id }, include: { sku: true } });
    for (const item of freshItems) {
      if (item.sku.stock < item.quantity) {
        await tx.payment.create({
          data: {
            tenantId: order.tenantId,
            shopId,
            orderId: order.id,
            paymentNo: generatePaymentNo(),
            amount: order.payAmount,
            status: "failed",
            channel: "mock"
          }
        });
        throw new Error(`商品「${item.productTitle}」库存不足，支付失败`);
      }
    }

    for (const item of freshItems) {
      await tx.sku.update({ where: { id: item.skuId }, data: { stock: { decrement: item.quantity } } });
    }

    const paidAt = new Date();
    const payment =
      order.payments[0] ??
      (await tx.payment.create({
        data: {
          tenantId: order.tenantId,
          shopId,
          orderId: order.id,
          paymentNo: generatePaymentNo(),
          amount: order.payAmount,
          status: "pending",
          channel: "mock"
        }
      }));

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "success", paidAt, amount: order.payAmount }
    });
    await tx.operationLog.create({
      data: {
        tenantId: order.tenantId,
        userId: customerId,
        action: "mock_pay_order",
        targetType: "Order",
        targetId: order.id,
        detail: `模拟支付成功：${order.orderNo}`
      }
    });
    return tx.order.update({ where: { id: order.id }, data: { status: "paid", paidAt } });
  });
}

export async function cancelCustomerOrder(shopId: string, customerId: string, orderId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, shopId, customerId } });
  if (!order) throw new Error("订单不存在");
  if (order.status !== "pending_pay") throw new Error("只有待支付订单可以取消");
  return prisma.order.update({ where: { id: order.id }, data: { status: "cancelled", cancelledAt: new Date() } });
}

export async function shipOrder(tenantId: string, shopId: string, orderId: string, userId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId, shopId } });
  if (!order) throw new Error("订单不存在");
  if (order.status !== "paid") throw new Error("只有已支付订单可以发货");
  return prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: "shipped", shippedAt: new Date() } }),
    prisma.operationLog.create({
      data: { tenantId, userId, action: "ship_order", targetType: "Order", targetId: order.id }
    })
  ]);
}

export async function completeOrder(tenantId: string, shopId: string, orderId: string, userId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId, shopId } });
  if (!order) throw new Error("订单不存在");
  if (order.status !== "shipped") throw new Error("只有已发货订单可以完成");
  return prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: "completed", completedAt: new Date() } }),
    prisma.operationLog.create({
      data: { tenantId, userId, action: "complete_order", targetType: "Order", targetId: order.id }
    })
  ]);
}

export async function cancelAdminOrder(tenantId: string, shopId: string, orderId: string, userId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId, shopId } });
  if (!order) throw new Error("订单不存在");
  if (order.status !== "pending_pay") throw new Error("只有待支付订单可以取消");
  return prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: "cancelled", cancelledAt: new Date() } }),
    prisma.operationLog.create({
      data: { tenantId, userId, action: "cancel_order", targetType: "Order", targetId: order.id }
    })
  ]);
}
