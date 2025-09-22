import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { insertCartItemSchema, insertFavoriteSchema, orders, orderItems, products } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Products routes
  app.get('/api/products', async (req, res) => {
    try {
      const { category, featured } = req.query;
      
      let products;
      if (featured === 'true') {
        products = await storage.getFeaturedProducts();
      } else if (category) {
        products = await storage.getProductsByCategory(category as string);
      } else {
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart routes
  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId,
      });
      
      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.put('/api/cart/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const cartItem = await storage.updateCartItem(id, quantity, userId);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found or not owned by user" });
      }
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const removed = await storage.removeFromCart(id, userId);
      if (!removed) {
        return res.status(404).json({ message: "Cart item not found or not owned by user" });
      }
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Orders routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Get order with items using storage interface
      const orderWithItems = await storage.getOrderWithItems(userId, id);
      
      if (!orderWithItems) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(orderWithItems);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Cancel order
  app.put('/api/orders/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const order = await storage.cancelOrder(userId, id);
      res.json(order);
    } catch (error) {
      console.error("Error canceling order:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate input using extended schema
      const orderRequestSchema = z.object({
        deliveryAddress: z.string().min(1, "Endereço de entrega é obrigatório"),
        items: z.array(z.object({
          productId: z.string(),
          quantity: z.number().int().min(1)
        })).min(1, "Pelo menos um item é obrigatório"),
        couponCode: z.string().nullable().optional(),
        paymentMethod: z.enum(['pix', 'cod']).optional().default('cod')
      });
      
      const validatedData = orderRequestSchema.parse(req.body);
      const { deliveryAddress, items, couponCode, paymentMethod } = validatedData;
      
      // Determine order status based on payment method
      const orderStatus = paymentMethod === 'pix' ? 'confirmed' : 'pending';

      // Extract and validate CEP for delivery area restriction
      const cepMatch = deliveryAddress.match(/\b\d{5}-?\d{3}\b/);
      if (!cepMatch) {
        return res.status(400).json({ 
          message: "CEP não encontrado no endereço de entrega" 
        });
      }

      const cep = cepMatch[0].replace('-', '');
      
      // Validate delivery area using ViaCEP
      try {
        const cepResponse = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        
        if (!cepResponse.ok) {
          return res.status(400).json({ 
            message: "Erro ao verificar CEP para entrega" 
          });
        }
        
        const cepData = await cepResponse.json();
        
        if (cepData.erro) {
          return res.status(400).json({ 
            message: "CEP inválido" 
          });
        }

        // Normalize city name for comparison (remove accents and convert to uppercase)
        const normalizeCity = (cityName: string): string => {
          return cityName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .trim();
        };

        const normalizedCity = normalizeCity(cepData.localidade);
        const normalizedState = cepData.uf.toUpperCase().trim();
        
        // Check if delivery is available for João Pessoa, PB only
        const isDeliveryAvailable = normalizedCity === 'JOAO PESSOA' && normalizedState === 'PB';
        
        if (!isDeliveryAvailable) {
          return res.status(400).json({ 
            message: "Entrega não disponível",
            error: `Não entregamos em ${cepData.localidade}, ${cepData.uf}. Atualmente entregamos apenas em João Pessoa, PB.`
          });
        }
      } catch (error) {
        console.error("Error validating delivery area:", error);
        return res.status(400).json({ 
          message: "Erro ao verificar área de entrega" 
        });
      }

      // Validate and deduplicate items
      const itemsMap = new Map();
      items.forEach((item: any) => {
        if (!item.productId || !item.quantity || item.quantity < 1) {
          throw new Error('Invalid item format');
        }
        const quantity = parseInt(item.quantity);
        if (itemsMap.has(item.productId)) {
          // Aggregate quantities for duplicate products
          itemsMap.set(item.productId, itemsMap.get(item.productId) + quantity);
        } else {
          itemsMap.set(item.productId, quantity);
        }
      });
      
      const validatedItems = Array.from(itemsMap.entries()).map(([productId, quantity]) => ({
        productId,
        quantity
      }));

      // Fetch products from database to get real prices
      const productIds = validatedItems.map(item => item.productId);
      const products = await storage.getProductsByIds(productIds);
      
      if (products.length !== productIds.length) {
        return res.status(400).json({ message: "Some products not found" });
      }

      // Calculate server-side total using DB prices (in cents to avoid floating point errors)
      let subtotalCents = 0;
      const orderItems = validatedItems.map((item: any) => {
        const product = products.find(p => p.id === item.productId);
        if (!product || !product.isAvailable) {
          throw new Error(`Product ${item.productId} not available`);
        }
        const priceCents = Math.round(parseFloat(product.price) * 100);
        const lineTotalCents = priceCents * item.quantity;
        subtotalCents += lineTotalCents;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price // Use DB price, not client price
        };
      });

      let order;
      let appliedCoupon = null;
      let totals = null;
      
      if (couponCode && couponCode.trim()) {
        try {
          // Use atomic transaction for order + coupon (validates coupon inside transaction)
          const result = await storage.createOrderWithCoupon(
            userId,
            deliveryAddress,
            orderItems,
            couponCode,
            orderStatus
          );
          
          order = result.order;
          appliedCoupon = result.appliedCoupon;
          totals = result.totals;
        } catch (error: any) {
          // Handle known coupon errors with user-friendly messages
          if (error.message.includes('não encontrado') || 
              error.message.includes('inativo') ||
              error.message.includes('expirado') || 
              error.message.includes('esgotado')) {
            return res.status(400).json({
              message: "Código de cupom inválido", 
              error: error.message
            });
          }
          throw error; // Re-throw unexpected errors
        }
      } else {
        // No coupon - regular order creation
        const finalTotal = (subtotalCents / 100).toFixed(2);
        order = await storage.createOrder(
          {
            userId,
            deliveryAddress,
            total: finalTotal,
            status: orderStatus,
            appliedCouponCode: null,
            discountAmount: "0.00",
          },
          orderItems
        );
      }

      // Clear cart after order
      await storage.clearCart(userId);

      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Favorites routes
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favoriteData = insertFavoriteSchema.parse({
        ...req.body,
        userId,
      });
      
      const favorite = await storage.addToFavorites(favoriteData);
      res.json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding to favorites:", error);
      res.status(500).json({ message: "Failed to add to favorites" });
    }
  });

  app.delete('/api/favorites/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.params;
      
      await storage.removeFromFavorites(userId, productId);
      res.json({ message: "Removed from favorites" });
    } catch (error) {
      console.error("Error removing from favorites:", error);
      res.status(500).json({ message: "Failed to remove from favorites" });
    }
  });

  // CEP lookup route
  app.get('/api/cep/:cep', async (req, res) => {
    try {
      const { cep } = req.params;
      
      // Validate CEP format (8 digits)
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length !== 8) {
        return res.status(400).json({ 
          error: 'CEP deve conter exatamente 8 dígitos' 
        });
      }

      // Call ViaCEP API
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        return res.status(500).json({ 
          error: 'Erro ao consultar CEP' 
        });
      }

      const data = await response.json();
      
      if (data.erro) {
        return res.status(404).json({ 
          error: 'CEP não encontrado' 
        });
      }

      // Return formatted address data
      res.json({
        cep: data.cep,
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        complement: data.complemento || '',
      });
    } catch (error) {
      console.error('Error fetching CEP:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  });

  // Coupon routes
  app.post('/api/coupons/validate', isAuthenticated, async (req: any, res) => {
    try {
      const { code } = req.body;
      
      const result = await storage.validateCoupon(code);
      
      if (result.valid && result.coupon) {
        res.json({
          valid: true,
          discount: result.coupon.discountPercentage,
          message: `Cupom aplicado! ${result.coupon.discountPercentage}% de desconto`
        });
      } else {
        res.status(400).json({
          valid: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Address routes
  app.get('/api/addresses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ message: "Erro ao buscar endereços" });
    }
  });

  app.post('/api/addresses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate input using Zod schema
      const addressSchema = z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        cep: z.string().regex(/^\d{8}$|^\d{5}-?\d{3}$/, "CEP inválido"),
        street: z.string().min(1, "Rua é obrigatória"),
        number: z.string().min(1, "Número é obrigatório"),
        complement: z.string().optional(),
        neighborhood: z.string().min(1, "Bairro é obrigatório"),
        city: z.string().min(1, "Cidade é obrigatória"),
        state: z.string().min(2, "Estado é obrigatório").max(2, "Estado deve ter 2 caracteres"),
        isDefault: z.boolean().optional().default(false)
      });

      const validatedData = addressSchema.parse(req.body);
      const addressData = {
        ...validatedData,
        userId,
        cep: validatedData.cep.replace(/\D/g, ''), // Clean CEP
      };

      const address = await storage.createAddress(addressData);
      res.json(address);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos",
          errors: error.errors
        });
      }
      console.error("Error creating address:", error);
      res.status(500).json({ message: "Erro ao criar endereço" });
    }
  });

  app.put('/api/addresses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Validate input using Zod schema (all fields optional for updates)
      const updateAddressSchema = z.object({
        name: z.string().min(1, "Nome é obrigatório").optional(),
        cep: z.string().regex(/^\d{8}$|^\d{5}-?\d{3}$/, "CEP inválido").optional(),
        street: z.string().min(1, "Rua é obrigatória").optional(),
        number: z.string().min(1, "Número é obrigatório").optional(),
        complement: z.string().optional(),
        neighborhood: z.string().min(1, "Bairro é obrigatório").optional(),
        city: z.string().min(1, "Cidade é obrigatória").optional(),
        state: z.string().min(2, "Estado é obrigatório").max(2, "Estado deve ter 2 caracteres").optional(),
        isDefault: z.boolean().optional()
      });

      const validatedData = updateAddressSchema.parse(req.body);
      
      // Clean CEP if provided
      if (validatedData.cep) {
        validatedData.cep = validatedData.cep.replace(/\D/g, '');
      }

      const address = await storage.updateAddress(id, userId, validatedData);
      res.json(address);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos",
          errors: error.errors
        });
      }
      if (error instanceof Error && error.message === 'Endereço não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      console.error("Error updating address:", error);
      res.status(500).json({ message: "Erro ao atualizar endereço" });
    }
  });

  app.delete('/api/addresses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      await storage.deleteAddress(id, userId);
      res.json({ message: "Endereço removido com sucesso" });
    } catch (error) {
      if (error instanceof Error && error.message === 'Endereço não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      console.error("Error deleting address:", error);
      res.status(500).json({ message: "Erro ao remover endereço" });
    }
  });

  app.put('/api/addresses/:id/default', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const address = await storage.setDefaultAddress(id, userId);
      res.json(address);
    } catch (error) {
      if (error instanceof Error && error.message === 'Endereço não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      console.error("Error setting default address:", error);
      res.status(500).json({ message: "Erro ao definir endereço padrão" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/orders', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: "Failed to fetch admin orders" });
    }
  });

  app.put('/api/admin/orders/:id/status', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.post('/api/admin/products', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/admin/products/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const product = await storage.updateProduct(id, req.body);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/admin/products/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Create sample orders for authenticated user (for testing order tracking) - Admin only
  app.post('/api/seed-orders', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get some products to create sample orders
      const products = await storage.getProducts();
      if (products.length === 0) {
        return res.status(400).json({ message: "Não há produtos disponíveis para criar pedidos de exemplo" });
      }

      // Ensure we have enough products for sample orders
      if (products.length < 3) {
        return res.status(400).json({ message: "Produtos insuficientes para criar pedidos de exemplo" });
      }

      // Pick products safely
      const availableProducts = products.slice(0, Math.min(6, products.length));
      
      // Sample order 1: Ready order (PIX payment, ready for pickup)
      const order1Items = [
        { productId: availableProducts[0].id, quantity: 2, price: availableProducts[0].price },
        { productId: availableProducts[1].id, quantity: 1, price: availableProducts[1].price }
      ];
      
      const order1 = await storage.createOrder({
        userId,
        deliveryAddress: "Rua das Flores, 123 - Centro, João Pessoa - PB, 58000-000",
        total: "25.80",
        status: "ready",
        appliedCouponCode: null,
        discountAmount: "0.00"
      }, order1Items);

      // Sample order 2: Delivered order
      const order2Items = [
        { productId: availableProducts[2 % availableProducts.length].id, quantity: 3, price: availableProducts[2 % availableProducts.length].price }
      ];
      
      const order2 = await storage.createOrder({
        userId,
        deliveryAddress: "Av. Epitácio Pessoa, 456 - Tambaú, João Pessoa - PB, 58039-000", 
        total: "28.50",
        status: "delivered",
        appliedCouponCode: null,
        discountAmount: "0.00"
      }, order2Items);

      // Sample order 3: Pending order (cash on delivery)
      const order3Items = [
        { productId: availableProducts[0].id, quantity: 1, price: availableProducts[0].price }
      ];
      
      const order3 = await storage.createOrder({
        userId,
        deliveryAddress: "Rua João Suassuna, 789 - Bancários, João Pessoa - PB, 58051-900",
        total: "16.90",
        status: "pending", 
        appliedCouponCode: null,
        discountAmount: "0.00"
      }, order3Items);

      res.json({ 
        message: "Pedidos de exemplo criados com sucesso",
        orders: [order1, order2, order3]
      });
      
    } catch (error) {
      console.error('Error creating sample orders:', error);
      res.status(500).json({ message: "Erro ao criar pedidos de exemplo" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
