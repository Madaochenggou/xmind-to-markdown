import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const rawUrl = process.env.DATABASE_URL || "file:./dev.db";
const dbPath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl;
const absolutePath = resolve("prisma", dbPath.replace(/^\.\//, ""));
const dir = dirname(absolutePath);

if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const db = new Database(absolutePath);
db.exec("PRAGMA foreign_keys = OFF;");
db.exec(`
DROP TABLE IF EXISTS OperationLog;
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS OrderItem;
DROP TABLE IF EXISTS "Order";
DROP TABLE IF EXISTS CartItem;
DROP TABLE IF EXISTS Sku;
DROP TABLE IF EXISTS Product;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS Shop;
DROP TABLE IF EXISTS Tenant;
`);

db.exec(`
CREATE TABLE Tenant (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE Shop (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logoUrl TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE INDEX Shop_tenantId_idx ON Shop(tenantId);

CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  tenantId TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE INDEX User_tenantId_idx ON "User"(tenantId);

CREATE TABLE Category (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  shopId TEXT NOT NULL,
  name TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE INDEX Category_tenantId_shopId_idx ON Category(tenantId, shopId);

CREATE TABLE Product (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  shopId TEXT NOT NULL,
  categoryId TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  coverImage TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  deletedAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE INDEX Product_tenantId_shopId_idx ON Product(tenantId, shopId);
CREATE INDEX Product_categoryId_idx ON Product(categoryId);

CREATE TABLE Sku (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  shopId TEXT NOT NULL,
  productId TEXT NOT NULL,
  skuName TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE INDEX Sku_tenantId_shopId_productId_idx ON Sku(tenantId, shopId, productId);

CREATE TABLE CartItem (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  shopId TEXT NOT NULL,
  customerId TEXT NOT NULL,
  productId TEXT NOT NULL,
  skuId TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  selected BOOLEAN NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE UNIQUE INDEX CartItem_shopId_customerId_skuId_key ON CartItem(shopId, customerId, skuId);
CREATE INDEX CartItem_tenantId_shopId_customerId_idx ON CartItem(tenantId, shopId, customerId);

CREATE TABLE "Order" (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  shopId TEXT NOT NULL,
  customerId TEXT NOT NULL,
  orderNo TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_pay',
  totalAmount INTEGER NOT NULL,
  payAmount INTEGER NOT NULL,
  receiverName TEXT NOT NULL,
  receiverPhone TEXT NOT NULL,
  receiverAddress TEXT NOT NULL,
  paidAt DATETIME,
  shippedAt DATETIME,
  completedAt DATETIME,
  cancelledAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE INDEX Order_tenantId_shopId_idx ON "Order"(tenantId, shopId);
CREATE INDEX Order_customerId_idx ON "Order"(customerId);

CREATE TABLE OrderItem (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  shopId TEXT NOT NULL,
  orderId TEXT NOT NULL,
  productId TEXT NOT NULL,
  skuId TEXT NOT NULL,
  productTitle TEXT NOT NULL,
  skuName TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  totalAmount INTEGER NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE INDEX OrderItem_tenantId_shopId_orderId_idx ON OrderItem(tenantId, shopId, orderId);

CREATE TABLE Payment (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  shopId TEXT NOT NULL,
  orderId TEXT NOT NULL,
  paymentNo TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  channel TEXT NOT NULL DEFAULT 'mock',
  paidAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
CREATE INDEX Payment_tenantId_shopId_orderId_idx ON Payment(tenantId, shopId, orderId);

CREATE TABLE OperationLog (
  id TEXT PRIMARY KEY,
  tenantId TEXT,
  userId TEXT NOT NULL,
  action TEXT NOT NULL,
  targetType TEXT NOT NULL,
  targetId TEXT NOT NULL,
  detail TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX OperationLog_tenantId_idx ON OperationLog(tenantId);
CREATE INDEX OperationLog_userId_idx ON OperationLog(userId);
`);

db.close();
console.log(`SQLite database initialized at ${absolutePath}`);
