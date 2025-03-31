import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Product model
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Order model
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  customerId: text("customer_id").notNull(),
  orderDate: timestamp("order_date").notNull().defaultNow(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Order items model
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer model
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  zone: text("zone"),
  isMerged: boolean("is_merged").default(false),
  mergedFrom: text("merged_from").array(),
  orderHistory: jsonb("order_history"),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  lastOrderDate: timestamp("last_order_date"),
  status: text("status").default("clean"),
  emptyRecord: boolean("empty_record").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// File upload history
export const fileHistory = pgTable("file_history", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  recordCount: integer("record_count").notNull(),
  duplicatesFound: integer("duplicates_found"),
  processedAt: timestamp("processed_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const updateCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertFileHistorySchema = createInsertSchema(fileHistory).omit({
  id: true,
  processedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertFileHistory = z.infer<typeof insertFileHistorySchema>;
export type FileHistory = typeof fileHistory.$inferSelect;

// Define the CSV record type
export interface CSVRecord {
  Teléfono?: string;
  Nombre?: string;
  Apellido?: string;
  Dirección?: string;
  Zona?: string;
  Producto?: string;
  Cantidad?: string;
  Precio?: string;
  FechaCompra?: string;
  [key: string]: string | undefined;
}

// Define the duplicate group type
export interface DuplicateGroup {
  id: string;
  name: string;
  records: Customer[];
  confidence: number;
  matchReason?: string; // e.g., "phone match", "full name match"
}

// Order history item interface
export interface OrderHistoryItem {
  orderId: string;
  date: string;
  products: {
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalAmount: number;
}
