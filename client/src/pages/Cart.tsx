import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, ShoppingBag, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Cart() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, itemCount, total, updateQuantity, removeFromCart, clearCart, isLoading } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para acessar seu carrinho",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-6">
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const deliveryFee = total > 0 ? 5.00 : 0;
  // Discount should only apply to product subtotal, not delivery fee
  const discountAmount = (appliedCoupon && typeof appliedCoupon.discount === 'number' && appliedCoupon.discount > 0) 
    ? total * (appliedCoupon.discount / 100) 
    : 0;
  
  
  const subtotalAfterDiscount = total - discountAmount;
  const finalTotal = subtotalAfterDiscount + deliveryFee;

  const couponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/coupons/validate", { code });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setAppliedCoupon({ code: couponCode, discount: data.discount });
      setCouponError("");
      toast({
        title: "Cupom aplicado!",
        description: data.message,
      });
    },
    onError: (error: any) => {
      // Extract just the error message from the response
      let errorMessage = "Erro ao validar cupom";
      if (error.message) {
        try {
          // If the error message contains JSON, parse it and extract the error field
          const match = error.message.match(/\{"valid":false,"error":"([^"]+)"\}/);
          if (match && match[1]) {
            errorMessage = match[1];
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      setCouponError(errorMessage);
      setAppliedCoupon(null);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (deliveryAddress: string) => {
      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
        // Note: price is calculated server-side for security
      }));
      
      return await apiRequest("POST", "/api/orders", {
        deliveryAddress,
        items: orderItems,
        couponCode: appliedCoupon?.code || null
      });
    },
    onSuccess: () => {
      // Clear local cart state
      clearCart();
      // Invalidate orders cache to show new order in profile
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsCheckoutOpen(false);
      setDeliveryAddress("");
      toast({
        title: "Pedido realizado com sucesso!",
        description: "Seu pedido foi confirmado e está sendo preparado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao finalizar pedido",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError("Por favor, insira um código de cupom");
      return;
    }
    setCouponError("");
    couponMutation.mutate(couponCode.trim());
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast({
      title: "Cupom removido",
      description: "O cupom foi removido do seu pedido.",
    });
  };

  const validateAddress = (address: string): string => {
    if (!address.trim()) {
      return "Endereço é obrigatório";
    }
    
    if (address.trim().length < 10) {
      return "Endereço deve ter pelo menos 10 caracteres";
    }

    // Check if it has at least a street name and number
    const hasNumber = /\d/.test(address);
    if (!hasNumber) {
      return "Endereço deve incluir o número";
    }

    // Check for common address components
    const addressLower = address.toLowerCase();
    const hasStreetIndicator = /\b(rua|av|avenida|estrada|alameda|travessa|praça|largo)\b/.test(addressLower);
    
    if (!hasStreetIndicator) {
      return "Endereço deve incluir tipo de logradouro (Rua, Av, etc.)";
    }

    // CEP validation if present (Brazilian postal code: 00000-000 or 00000000)
    const cepMatch = address.match(/\b\d{5}-?\d{3}\b/);
    if (cepMatch) {
      const cep = cepMatch[0].replace('-', '');
      if (cep.length !== 8 || !/^\d{8}$/.test(cep)) {
        return "CEP deve ter o formato 00000-000";
      }
    }

    return "";
  };

  const handleAddressChange = (value: string) => {
    setDeliveryAddress(value);
    setAddressError("");
  };

  const handleCheckout = () => {
    const addressValidationError = validateAddress(deliveryAddress);
    if (addressValidationError) {
      setAddressError(addressValidationError);
      toast({
        title: "Endereço inválido",
        description: addressValidationError,
        variant: "destructive",
      });
      return;
    }
    
    setAddressError("");
    checkoutMutation.mutate(deliveryAddress);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-8" data-testid="text-cart-title">
        Seu Carrinho
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-16" data-testid="empty-cart">
          <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
            Seu carrinho está vazio
          </h2>
          <p className="text-muted-foreground mb-8">
            Que tal adicionar alguns cupcakes deliciosos?
          </p>
          <Link href="/catalog" data-testid="link-shop-now">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Começar a Comprar
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-2xl p-6 shadow-lg" data-testid={`cart-item-${item.id}`}>
                <div className="flex items-center space-x-4">
                  <img 
                    src={item.product.imageUrl} 
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-xl"
                    data-testid={`img-cart-item-${item.id}`}
                  />
                  <div className="flex-1">
                    <h3 className="font-serif font-bold text-foreground mb-1" data-testid={`text-item-name-${item.id}`}>
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`text-item-description-${item.id}`}>
                      {item.product.description.length > 50 
                        ? `${item.product.description.substring(0, 50)}...`
                        : item.product.description
                      }
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary" data-testid={`text-item-price-${item.id}`}>
                        R$ {parseFloat(item.product.price).toFixed(2).replace('.', ',')}
                      </span>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1 || isLoading}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-medium px-2" data-testid={`text-quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={isLoading}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          disabled={isLoading}
                          className="text-destructive hover:text-destructive/80 ml-4"
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-accent border border-border rounded-2xl p-6">
              <h3 className="font-serif font-bold text-foreground mb-4">Continuar Comprando</h3>
              <p className="text-muted-foreground mb-4">Que tal adicionar mais sabores especiais?</p>
              <Link href="/catalog" data-testid="link-continue-shopping">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Ver Catálogo
                </Button>
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-6 shadow-lg sticky top-24">
              <h3 className="font-serif font-bold text-foreground mb-6">Resumo do Pedido</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                  <span data-testid="text-subtotal">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto ({appliedCoupon.code})</span>
                    <span data-testid="text-discount">-R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxa de entrega</span>
                  <span data-testid="text-delivery-fee">
                    {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis'}
                  </span>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-xl font-bold text-foreground">
                    <span>Total</span>
                    <span data-testid="text-total">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                      size="lg"
                      disabled={items.length === 0}
                      data-testid="button-checkout"
                    >
                      Finalizar Pedido
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Endereço de Entrega
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="delivery-address">Endereço completo</Label>
                        <Textarea
                          id="delivery-address"
                          placeholder="Ex: Rua das Flores, 123, Apt 45, Vila Madalena, São Paulo, SP, 01310-100"
                          value={deliveryAddress}
                          onChange={(e) => handleAddressChange(e.target.value)}
                          rows={4}
                          className={addressError ? "border-red-500 focus:border-red-500" : ""}
                          data-testid="textarea-delivery-address"
                        />
                        {addressError && (
                          <p className="text-sm text-red-600" data-testid="text-address-error">
                            {addressError}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Inclua: tipo de logradouro (Rua, Av), número, bairro e cidade
                        </p>
                      </div>
                      <div className="bg-accent p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Total do pedido:</span>
                          <span className="font-bold text-lg">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {itemCount} {itemCount === 1 ? 'item' : 'itens'} • Entrega em até 2 horas
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsCheckoutOpen(false)}
                          className="flex-1"
                          data-testid="button-cancel-checkout"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleCheckout}
                          disabled={checkoutMutation.isPending || !deliveryAddress.trim() || !!addressError}
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          data-testid="button-confirm-checkout"
                        >
                          {checkoutMutation.isPending ? "Processando..." : "Confirmar Pedido"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                {appliedCoupon ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-green-800 font-medium">Cupom {appliedCoupon.code}</span>
                        <p className="text-green-600 text-sm">{appliedCoupon.discount}% de desconto aplicado</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="text-green-700 hover:text-green-800"
                        data-testid="button-remove-coupon"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Input 
                        placeholder="Código do cupom"
                        className="pr-20"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        data-testid="input-coupon"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-1 top-1 bottom-1"
                        onClick={handleApplyCoupon}
                        disabled={couponMutation.isPending || !couponCode.trim()}
                        data-testid="button-apply-coupon"
                      >
                        {couponMutation.isPending ? "..." : "Aplicar"}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-600" data-testid="text-coupon-error">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-accent rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🚚</span>
                  <span className="font-medium text-foreground">Entrega Expressa</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Receba em até 2 horas na sua casa!
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="font-serif font-bold text-foreground mb-4">Informações de Entrega</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="font-medium text-foreground">Endereço será coletado no checkout</p>
                    <p className="text-sm text-muted-foreground">Entrega rápida em toda a cidade</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">⏰</span>
                  <div>
                    <p className="font-medium text-foreground">Entrega em até 2 horas</p>
                    <p className="text-sm text-muted-foreground">Cupcakes fresquinhos na sua casa</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">💳</span>
                  <div>
                    <p className="font-medium text-foreground">Pagamento na entrega</p>
                    <p className="text-sm text-muted-foreground">Dinheiro, cartão ou PIX</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
