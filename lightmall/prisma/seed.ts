import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPassword } from "../src/lib/password";
import { resolveSqlitePath } from "../src/lib/database-url";

const adapter = new PrismaBetterSqlite3(
  { url: resolveSqlitePath() },
  { timestampFormat: "iso8601" }
);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.operationLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.tenant.deleteMany();

  const passwordHash = hashPassword("123456");

  const platformAdmin = await prisma.user.create({
    data: {
      name: "平台管理员",
      email: "admin@lightmall.local",
      passwordHash,
      role: "platform_admin"
    }
  });

  const tenant = await prisma.tenant.create({
    data: { name: "测试商户", code: "test_merchant", status: "active" }
  });

  const shop = await prisma.shop.create({
    data: {
      tenantId: tenant.id,
      name: "LightMall 测试店铺",
      slug: "demo-shop",
      logoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop",
      status: "active"
    }
  });

  const merchantAdmin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "商户管理员",
      email: "merchant@lightmall.local",
      passwordHash,
      role: "merchant_admin"
    }
  });

  const customer = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "演示买家",
      email: "customer@lightmall.local",
      passwordHash,
      role: "customer"
    }
  });

  const categories = await Promise.all(
    ["热销商品", "数码配件", "生活用品"].map((name, index) =>
      prisma.category.create({
        data: { tenantId: tenant.id, shopId: shop.id, name, sort: index + 1 }
      })
    )
  );

  const products = [
    {
      category: categories[0],
      title: "轻量保温杯",
      subtitle: "随手携带，全天保温",
      description: "316 不锈钢内胆，适合办公室、通勤和户外。",
      coverImage: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop",
      status: "on_sale" as const,
      skuName: "白色 480ml",
      price: 6990,
      stock: 32
    },
    {
      category: categories[1],
      title: "Type-C 快充线",
      subtitle: "1.5 米耐弯折编织线",
      description: "支持 60W 快充，兼容主流手机、平板和轻薄本。",
      coverImage: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=800&auto=format&fit=crop",
      status: "on_sale" as const,
      skuName: "灰色 1.5m",
      price: 2990,
      stock: 8
    },
    {
      category: categories[1],
      title: "桌面无线充",
      subtitle: "简洁立式设计",
      description: "适合床头和办公桌，支持多角度观看提醒。",
      coverImage: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800&auto=format&fit=crop",
      status: "on_sale" as const,
      skuName: "黑色 15W",
      price: 8990,
      stock: 0
    },
    {
      category: categories[2],
      title: "香薰扩香石",
      subtitle: "自然矿石纹理",
      description: "小空间香氛搭配，适合书桌、衣柜和玄关。",
      coverImage: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800&auto=format&fit=crop",
      status: "on_sale" as const,
      skuName: "暖灰套装",
      price: 4590,
      stock: 15
    },
    {
      category: categories[0],
      title: "便携收纳包",
      subtitle: "低库存演示商品",
      description: "分区收纳数据线、充电头和随身小物。",
      coverImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop",
      status: "on_sale" as const,
      skuName: "深蓝标准款",
      price: 3990,
      stock: 2
    },
    {
      category: categories[2],
      title: "下架棉麻拖鞋",
      subtitle: "后台可见，前台不可购买",
      description: "用于演示 off_sale 状态。",
      coverImage: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800&auto=format&fit=crop",
      status: "off_sale" as const,
      skuName: "米色 42",
      price: 5990,
      stock: 20
    }
  ];

  for (const item of products) {
    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        shopId: shop.id,
        categoryId: item.category.id,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        coverImage: item.coverImage,
        status: item.status,
        skus: {
          create: {
            tenantId: tenant.id,
            shopId: shop.id,
            skuName: item.skuName,
            price: item.price,
            stock: item.stock
          }
        }
      }
    });
  }

  await prisma.operationLog.create({
    data: {
      tenantId: tenant.id,
      userId: platformAdmin.id,
      action: "seed",
      targetType: "Tenant",
      targetId: tenant.id,
      detail: `初始化演示数据，商户管理员：${merchantAdmin.email}，买家：${customer.email}`
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
