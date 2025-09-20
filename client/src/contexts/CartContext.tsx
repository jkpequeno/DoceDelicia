import { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { CartItem, Product } from "@shared/schema";

interface CartState {
  items: (CartItem & { product: Product })[];
  itemCount: number;
  total: number;
}

interface CartContextType extends CartState {
  addToCart: (productId: string, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

type CartAction =
  | { type: "SET_ITEMS"; items: (CartItem & { product: Product })[] }
  | { type: "ADD_ITEM"; item: CartItem & { product: Product } }
  | { type: "UPDATE_ITEM"; itemId: string; quantity: number }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "CLEAR_CART" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_ITEMS": {
      const items = action.items;
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const total = items.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
      return { items, itemCount, total };
    }
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(item => item.productId === action.item.productId);
      let items;
      
      if (existingItemIndex >= 0) {
        items = [...state.items];
        items[existingItemIndex] = {
          ...items[existingItemIndex],
          quantity: items[existingItemIndex].quantity + action.item.quantity,
        };
      } else {
        items = [...state.items, action.item];
      }
      
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const total = items.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
      return { items, itemCount, total };
    }
    case "UPDATE_ITEM": {
      const items = state.items.map(item =>
        item.id === action.itemId ? { ...item, quantity: action.quantity } : item
      );
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const total = items.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
      return { items, itemCount, total };
    }
    case "REMOVE_ITEM": {
      const items = state.items.filter(item => item.id !== action.itemId);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const total = items.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
      return { items, itemCount, total };
    }
    case "CLEAR_CART":
      return { items: [], itemCount: 0, total: 0 };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    itemCount: 0,
    total: 0,
  });

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (cartItems && Array.isArray(cartItems)) {
      dispatch({ type: "SET_ITEMS", items: cartItems });
    }
  }, [cartItems]);

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      await apiRequest("POST", "/api/cart", { productId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Sucesso!",
        description: "Produto adicionado ao carrinho",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto ao carrinho",
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      await apiRequest("PUT", `/api/cart/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade",
        variant: "destructive",
      });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("DELETE", `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Produto removido",
        description: "O produto foi removido do carrinho",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o produto",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      dispatch({ type: "CLEAR_CART" });
    },
  });

  const contextValue: CartContextType = {
    ...state,
    addToCart: (productId: string, quantity = 1) => {
      if (!isAuthenticated) {
        toast({
          title: "Login necessário",
          description: "Faça login para adicionar produtos ao carrinho",
          variant: "destructive",
        });
        return;
      }
      addToCartMutation.mutate({ productId, quantity });
    },
    updateQuantity: (itemId: string, quantity: number) => {
      updateQuantityMutation.mutate({ itemId, quantity });
    },
    removeFromCart: (itemId: string) => {
      removeFromCartMutation.mutate(itemId);
    },
    clearCart: () => {
      clearCartMutation.mutate();
    },
    isLoading: isLoading || addToCartMutation.isPending || updateQuantityMutation.isPending || removeFromCartMutation.isPending,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
