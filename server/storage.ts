import {
  users,
  products,
  categories,
  cartItems,
  orders,
  orderItems,
  favorites,
  coupons,
  addresses,
  type User,
  type UpsertUser,
  type Product,
  type Category,
  type CartItem,
  type Order,
  type OrderItem,
  type Favorite,
  type Coupon,
  type Address,
  type InsertProduct,
  type InsertCategory,
  type InsertCartItem,
  type InsertOrder,
  type InsertOrderItem,
  type CreateOrderItem,
  type InsertFavorite,
  type InsertCoupon,
  type InsertAddress,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByIds(ids: string[]): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number, userId: string): Promise<CartItem | null>;
  removeFromCart(id: string, userId: string): Promise<boolean>;
  clearCart(userId: string): Promise<void>;
  
  // Order operations
  createOrder(order: InsertOrder, items: CreateOrderItem[]): Promise<Order>;
  createOrderWithCoupon(userId: string, deliveryAddress: string, items: CreateOrderItem[], couponCode: string, status?: string): Promise<{ order: Order; appliedCoupon: Coupon; totals: { subtotal: string; discount: string; total: string } }>;
  getUserOrders(userId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderWithItems(userId: string, orderId: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined>;
  cancelOrder(userId: string, orderId: string): Promise<Order>;
  
  // Favorites operations
  getUserFavorites(userId: string): Promise<(Favorite & { product: Product })[]>;
  addToFavorites(favorite: InsertFavorite): Promise<Favorite>;
  removeFromFavorites(userId: string, productId: string): Promise<void>;
  
  // Coupon operations
  getCoupon(code: string): Promise<Coupon | undefined>;
  validateCoupon(code: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }>;
  incrementCouponUsage(id: string): Promise<void>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  
  // Address operations
  getUserAddresses(userId: string): Promise<Address[]>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(addressId: string, userId: string, updates: Partial<InsertAddress>): Promise<Address>;
  deleteAddress(addressId: string, userId: string): Promise<void>;
  setDefaultAddress(addressId: string, userId: string): Promise<Address>;
  
  // Admin operations
  getAdminStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalUsers: number;
  }>;
  getAllOrders(): Promise<(Order & { user: User; orderItems: (OrderItem & { product: Product })[] })[]>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isAvailable, true));
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.categoryId, categoryId), eq(products.isAvailable, true)));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.isFeatured, true), eq(products.isAvailable, true)))
      .limit(6);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(inArray(products.id, ids));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    return await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, cartItem.userId),
          eq(cartItems.productId, cartItem.productId)
        )
      );

    if (existingItem) {
      // Update quantity if item exists
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + (cartItem.quantity || 1) })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItem(id: string, quantity: number, userId: string): Promise<CartItem | null> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
      .returning();
    return updatedItem || null;
  }

  async removeFromCart(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Order operations
  async createOrder(order: InsertOrder, items: CreateOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    await db.insert(orderItems).values(
      items.map(item => ({ ...item, orderId: newOrder.id }))
    );

    return newOrder;
  }

  async createOrderWithCoupon(userId: string, deliveryAddress: string, items: CreateOrderItem[], couponCode: string, status: string = "pending"): Promise<{ order: Order; appliedCoupon: Coupon; totals: { subtotal: string; discount: string; total: string } }> {
    return await db.transaction(async (tx) => {
      // Lock and validate coupon within transaction
      const normalized = couponCode.trim().toUpperCase();
      const [coupon] = await tx.select().from(coupons)
        .where(eq(coupons.code, normalized))
        .for('update'); // Row-level lock
      
      if (!coupon || !coupon.isActive) {
        throw new Error('Cupom não encontrado ou inativo');
      }

      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        throw new Error('Cupom expirado');
      }

      if (coupon.maxUsage && (coupon.currentUsage || 0) >= coupon.maxUsage) {
        throw new Error('Cupom esgotado');
      }

      // Compute totals within transaction using locked coupon data
      let subtotalCents = 0;
      items.forEach(item => {
        const priceCents = Math.round(parseFloat(item.price) * 100);
        subtotalCents += priceCents * item.quantity;
      });

      const discountAmountCents = Math.round(subtotalCents * (coupon.discountPercentage / 100));
      const subtotalAfterDiscountCents = Math.max(0, subtotalCents - discountAmountCents);
      
      // Add delivery fee (R$ 5.00 = 500 cents)
      const deliveryFeeCents = subtotalCents > 0 ? 500 : 0;
      const finalTotalCents = subtotalAfterDiscountCents + deliveryFeeCents;
      
      // Convert to decimal strings
      const subtotal = (subtotalCents / 100).toFixed(2);
      const discountAmount = (discountAmountCents / 100).toFixed(2);
      const finalTotal = (finalTotalCents / 100).toFixed(2);

      // Create order within transaction
      const [newOrder] = await tx.insert(orders).values({
        userId,
        deliveryAddress,
        total: finalTotal,
        status: status,
        appliedCouponCode: coupon.code,
        discountAmount,
      }).returning();
      
      await tx.insert(orderItems).values(
        items.map(item => ({ ...item, orderId: newOrder.id }))
      );

      // Increment usage atomically
      await tx.update(coupons)
        .set({ currentUsage: sql`current_usage + 1` })
        .where(eq(coupons.id, coupon.id));

      return { 
        order: newOrder, 
        appliedCoupon: coupon,
        totals: { subtotal, discount: discountAmount, total: finalTotal }
      };
    });
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderWithItems(userId: string, orderId: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    // First get the order and verify ownership
    const order = await this.getOrder(orderId);
    if (!order || order.userId !== userId) {
      return undefined;
    }

    // Get order items with product details
    const orderItemsWithProducts = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    // Return order with items array
    return {
      ...order,
      orderItems: orderItemsWithProducts
    };
  }

  async cancelOrder(userId: string, orderId: string): Promise<Order> {
    const [order] = await db.select().from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));
    
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    // Only allow canceling orders in pending or confirmed status
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      throw new Error('Este pedido não pode ser cancelado');
    }

    const [updatedOrder] = await db.update(orders)
      .set({ status: 'cancelled' })
      .where(eq(orders.id, orderId))
      .returning();

    return updatedOrder;
  }

  // Favorites operations
  async getUserFavorites(userId: string): Promise<(Favorite & { product: Product })[]> {
    return await db
      .select({
        id: favorites.id,
        userId: favorites.userId,
        productId: favorites.productId,
        createdAt: favorites.createdAt,
        product: products,
      })
      .from(favorites)
      .innerJoin(products, eq(favorites.productId, products.id))
      .where(eq(favorites.userId, userId));
  }

  async addToFavorites(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFromFavorites(userId: string, productId: string): Promise<void> {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
  }

  // Admin operations
  async getAdminStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalUsers: number;
  }> {
    const [ordersCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const [revenue] = await db.select({ sum: sql<number>`sum(total)` }).from(orders);
    const [productsCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    
    return {
      totalOrders: ordersCount.count || 0,
      totalRevenue: Number(revenue.sum) || 0,
      totalProducts: productsCount.count || 0,
      totalUsers: usersCount.count || 0,
    };
  }

  async getAllOrders(): Promise<(Order & { user: User; orderItems: (OrderItem & { product: Product })[] })[]> {
    return await db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        total: orders.total,
        deliveryAddress: orders.deliveryAddress,
        appliedCouponCode: orders.appliedCouponCode,
        discountAmount: orders.discountAmount,
        createdAt: orders.createdAt,
        user: users,
        orderItems: orderItems,
        product: products,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Coupon operations
  async getCoupon(code: string): Promise<Coupon | undefined> {
    const normalized = code.trim().toUpperCase();
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, normalized));
    return coupon;
  }

  async validateCoupon(code: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
    if (!code || code.trim() === '') {
      return { valid: false, error: 'Código do cupom é obrigatório' };
    }

    const coupon = await this.getCoupon(code);
    
    if (!coupon) {
      return { valid: false, error: 'Cupom não encontrado' };
    }

    if (!coupon.isActive) {
      return { valid: false, error: 'Cupom inativo' };
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return { valid: false, error: 'Cupom expirado' };
    }

    if (coupon.maxUsage && (coupon.currentUsage || 0) >= coupon.maxUsage) {
      return { valid: false, error: 'Cupom esgotado' };
    }

    return { valid: true, coupon };
  }

  async incrementCouponUsage(id: string): Promise<void> {
    await db
      .update(coupons)
      .set({ currentUsage: sql`current_usage + 1` })
      .where(eq(coupons.id, id));
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [newCoupon] = await db.insert(coupons).values({
      ...coupon,
      code: coupon.code.trim().toUpperCase()
    }).returning();
    return newCoupon;
  }

  // Address operations
  async getUserAddresses(userId: string): Promise<Address[]> {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    return await db.transaction(async (tx) => {
      // Create the address first
      const [newAddress] = await tx.insert(addresses).values(address).returning();

      // If this should be default, atomically set it as the only default
      if (address.isDefault) {
        await tx
          .update(addresses)
          .set({ 
            isDefault: sql`${addresses.id} = ${newAddress.id}`,
            updatedAt: new Date()
          })
          .where(eq(addresses.userId, address.userId));
      }

      return newAddress;
    });
  }

  async updateAddress(addressId: string, userId: string, updates: Partial<InsertAddress>): Promise<Address> {
    return await db.transaction(async (tx) => {
      // Verify ownership
      const [existingAddress] = await tx
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

      if (!existingAddress) {
        throw new Error('Endereço não encontrado');
      }

      // Whitelist allowed update fields (exclude userId and system fields)
      const { name, cep, street, number, complement, neighborhood, city, state, isDefault } = updates;
      const allowedUpdates = {
        ...(name !== undefined && { name }),
        ...(cep !== undefined && { cep }),
        ...(street !== undefined && { street }),
        ...(number !== undefined && { number }),
        ...(complement !== undefined && { complement }),
        ...(neighborhood !== undefined && { neighborhood }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(isDefault !== undefined && { isDefault }),
        updatedAt: new Date()
      };

      // Handle default address logic atomically
      if (isDefault) {
        // Atomically set only this address as default for the user
        await tx
          .update(addresses)
          .set({ 
            isDefault: sql`${addresses.id} = ${addressId}`,
            updatedAt: new Date()
          })
          .where(eq(addresses.userId, userId));
      }

      // Update other fields (excluding isDefault since it was handled above)
      const { isDefault: _, ...otherUpdates } = allowedUpdates;
      const [updatedAddress] = await tx
        .update(addresses)
        .set(otherUpdates)
        .where(eq(addresses.id, addressId))
        .returning();

      return updatedAddress;
    });
  }

  async deleteAddress(addressId: string, userId: string): Promise<void> {
    const result = await db
      .delete(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new Error('Endereço não encontrado');
    }
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<Address> {
    return await db.transaction(async (tx) => {
      // Verify ownership
      const [existingAddress] = await tx
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

      if (!existingAddress) {
        throw new Error('Endereço não encontrado');
      }

      // Atomically set only this address as default for the user
      await tx
        .update(addresses)
        .set({ 
          isDefault: sql`${addresses.id} = ${addressId}`,
          updatedAt: new Date()
        })
        .where(eq(addresses.userId, userId));

      // Return the updated address
      const [updatedAddress] = await tx
        .select()
        .from(addresses)
        .where(eq(addresses.id, addressId));

      return updatedAddress;
    });
  }
}

export const storage = new DatabaseStorage();
