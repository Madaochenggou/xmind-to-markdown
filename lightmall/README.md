# LightMall

LightMall 是一个轻量级电商 SaaS MVP，面向本地演示、个人维护和后续扩展。第一版包含基础多商户隔离、商户后台、C 端店铺、购物车、下单、模拟支付、库存扣减和订单流转。

## 技术栈

- TypeScript
- Next.js App Router
- React Server Components + 必要的 Client Components
- Prisma ORM
- SQLite，本地快速启动，Prisma 7 + better-sqlite3 adapter，schema 字段设计保留后续切换 PostgreSQL 的空间
- Tailwind CSS
- 简化版签名 cookie session + scrypt 密码哈希

## 本地启动

```bash
cd lightmall
cp .env.example .env
npm install
npm run db:reset
npm run dev
```

启动后访问：

- 首页：http://localhost:3000
- 后台登录：http://localhost:3000/admin/login
- 演示店铺：http://localhost:3000/shop/demo-shop

## 环境变量

`.env` 示例：

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-secret"
```

`DATABASE_URL` 默认会在 `prisma/dev.db` 创建 SQLite 数据库。生产或后续切 PostgreSQL 时，需要调整 `prisma/schema.prisma` 的 datasource provider 和连接串。

## 数据库初始化

```bash
npm run db:push
```

当前 MVP 的 `db:push` 会先生成 Prisma Client，再用轻量 SQLite 初始化脚本创建本地表结构。这样可以避开部分新系统环境下 Prisma schema engine 对 SQLite 的兼容问题，同时保留 Prisma schema 作为后续迁移依据。

重置数据库并重新 seed：

```bash
npm run db:reset
```

## Seed 数据

```bash
npm run db:seed
```

初始化内容：

- 平台管理员：`admin@lightmall.local`
- 测试商户：`测试商户 / test_merchant`
- 测试店铺：`LightMall 测试店铺 / demo-shop`
- 商户管理员：`merchant@lightmall.local`
- C 端买家：`customer@lightmall.local`
- 分类：热销商品、数码配件、生活用品
- 商品：6 个商品，包含在售、下架、正常库存、低库存和 0 库存

所有测试账号密码都是：

```text
123456
```

## 已实现功能

- 后台登录、登出、当前用户识别
- 后台首页统计：商品、订单、待支付、已支付、今日金额、最近订单
- 商品管理：列表、新增、编辑、上架、下架、软删除、默认 SKU
- 订单管理：列表、订单商品明细、发货、完成、取消
- C 端店铺首页：分类、商品列表、库存、价格
- 商品详情：商品图、名称、副标题、描述、SKU、库存、加入购物车、立即购买
- 购物车：查询、数量修改、删除、勾选、合计、去结算
- 确认订单：收货信息、金额确认、提交订单
- 我的订单：订单列表、状态、模拟支付、取消订单
- 模拟支付：pending_pay 才能支付，支付时校验库存，成功后扣减 SKU 库存并写入 Payment 和 OperationLog

## 常见问题

### 登录后仍然看不到买家订单

C 端页面需要使用 `customer@lightmall.local / 123456` 登录。后台管理请使用 `merchant@lightmall.local / 123456`。

### 商品可以下单但支付失败

库存扣减发生在模拟支付时，不在创建订单时。若其他订单先支付导致库存不足，模拟支付会失败并提示具体商品库存不足。

### 端口 3000 被占用

可以换端口启动：

```bash
npm run dev -- -p 3001
```

### 后续扩展建议

- 增加专门的 C 端登录页和注册页
- 商品多 SKU、多图片、富文本详情
- 订单详情页、支付页和物流信息
- 更严格的 CSRF 防护和 session 存储
- PostgreSQL 迁移、Prisma migrate 工作流
- 单元测试和端到端测试
