import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useDelivery } from "@/contexts/DeliveryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, ShoppingBag, MapPin, CheckCircle, XCircle, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

export default function Cart() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, itemCount, total, updateQuantity, removeFromCart, clearCart, isLoading, addToCart } = useCart();
  const { cep, available, city, state, setCep, setDeliveryInfo } = useDelivery();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products for the "continuar comprando" section
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: ""
  });
  const [addressError, setAddressError] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showPixQr, setShowPixQr] = useState(false);

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
      setAddressForm({
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: ""
      });
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

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    if (method === 'pix') {
      setShowPixQr(true);
    } else {
      setShowPixQr(false);
    }
  };

  const generateFakeQrCode = () => {
    // Generate a fake QR code pattern using squares
    const qrSize = 25;
    const pattern = [];
    
    for (let i = 0; i < qrSize; i++) {
      const row = [];
      for (let j = 0; j < qrSize; j++) {
        // Create a pseudo-random pattern based on position
        const shouldFill = (i + j + Math.floor(i/3) + Math.floor(j/3)) % 3 === 0;
        row.push(shouldFill);
      }
      pattern.push(row);
    }
    
    return pattern;
  };

  const validateCep = (cep: string): string => {
    if (!cep.trim()) {
      return "CEP é obrigatório";
    }
    
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return "CEP deve conter 8 dígitos";
    }
    
    return "";
  };

  const validateAddressForm = (): string => {
    if (!addressForm.cep.trim()) {
      return "CEP é obrigatório";
    }
    
    if (!addressForm.street.trim()) {
      return "Logradouro é obrigatório";
    }
    
    if (!addressForm.number.trim()) {
      return "Número é obrigatório";
    }
    
    if (!addressForm.neighborhood.trim()) {
      return "Bairro é obrigatório";
    }
    
    if (!addressForm.city.trim()) {
      return "Cidade é obrigatória";
    }
    
    if (!addressForm.state.trim()) {
      return "Estado é obrigatório";
    }
    
    return "";
  };

  const handleCepLookup = async (cep: string) => {
    const cepError = validateCep(cep);
    if (cepError) {
      setAddressError(cepError);
      return;
    }

    setCepLoading(true);
    setAddressError("");

    try {
      const response = await fetch(`/api/cep/${cep.replace(/\D/g, '')}`);
      const data = await response.json();

      if (!response.ok) {
        setAddressError(data.error || "Erro ao consultar CEP");
        return;
      }

      // Auto-fill the address fields
      setAddressForm(prev => ({
        ...prev,
        cep: data.cep,
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        complement: data.complement
      }));

      toast({
        title: "CEP encontrado!",
        description: `${data.street}, ${data.neighborhood}, ${data.city}`,
      });
    } catch (error) {
      setAddressError("Erro ao consultar CEP");
      toast({
        title: "Erro",
        description: "Não foi possível consultar o CEP",
        variant: "destructive",
      });
    } finally {
      setCepLoading(false);
    }
  };

  const handleAddressFieldChange = (field: keyof typeof addressForm, value: string) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
    setAddressError("");
  };

  // Delivery check functionality
  const deliveryCheckMutation = useMutation({
    mutationFn: async (cepToCheck: string) => {
      const cleanCep = cepToCheck.replace(/\D/g, '');
      if (cleanCep.length !== 8) {
        throw new Error('CEP deve conter 8 dígitos');
      }

      const response = await fetch(`/api/cep/${cleanCep}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao consultar CEP');
      }

      return data;
    },
    onSuccess: (data) => {
      const available = isDeliveryAvailable(data.city, data.state);
      setDeliveryInfo({
        available,
        city: data.city,
        state: data.state,
        cep: data.cep
      });

      if (available) {
        toast({
          title: "✅ Entregamos na sua região!",
          description: `${data.city}, ${data.state} - CEP ${data.cep}`,
        });
      } else {
        toast({
          title: "❌ Não entregamos nesta região",
          description: `Atualmente entregamos apenas em João Pessoa, PB. Você está em ${data.city}, ${data.state}.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao consultar CEP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCepCheck = () => {
    if (cep.trim()) {
      deliveryCheckMutation.mutate(cep);
    }
  };

  // Normalize city name for comparison (remove accents and convert to uppercase)
  const normalizeCity = (cityName: string): string => {
    return cityName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
  };

  // Check if delivery is available for João Pessoa, PB
  const isDeliveryAvailable = (cityName: string, stateName: string): boolean => {
    const normalizedCity = normalizeCity(cityName);
    const normalizedState = stateName.toUpperCase().trim();
    return normalizedCity === 'JOAO PESSOA' && normalizedState === 'PB';
  };

  const handleCheckout = () => {
    const addressValidationError = validateAddressForm();
    if (addressValidationError) {
      setAddressError(addressValidationError);
      toast({
        title: "Endereço inválido",
        description: addressValidationError,
        variant: "destructive",
      });
      return;
    }
    
    // Check delivery availability for the address
    if (!isDeliveryAvailable(addressForm.city, addressForm.state)) {
      setAddressError("Entrega não disponível para esta localidade");
      toast({
        title: "Entrega não disponível",
        description: `Não entregamos em ${addressForm.city}, ${addressForm.state}. Atualmente entregamos apenas em João Pessoa, PB.`,
        variant: "destructive",
      });
      return;
    }
    
    // Format the complete address for the API
    const fullAddress = [
      addressForm.street,
      addressForm.number,
      addressForm.complement && addressForm.complement.trim() ? addressForm.complement : null,
      addressForm.neighborhood,
      addressForm.city,
      addressForm.state,
      addressForm.cep
    ].filter(Boolean).join(', ');
    
    setAddressError("");
    checkoutMutation.mutate(fullAddress);
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
              
              {/* Product Miniatures Grid */}
              {products && Array.isArray(products) && products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 mb-4">
                  {products
                    .filter((product) => !items.some((item) => item.productId === product.id))
                    .slice(0, 6)
                    .map((product) => (
                    <div 
                      key={product.id} 
                      className="bg-background rounded-lg p-3 border border-border hover:shadow-md transition-shadow"
                      data-testid={`mini-product-${product.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                          data-testid={`img-mini-product-${product.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground truncate" data-testid={`text-mini-product-name-${product.id}`}>
                            {product.name}
                          </h4>
                          <p className="text-xs text-primary font-semibold" data-testid={`text-mini-product-price-${product.id}`}>
                            R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => addToCart(product.id)}
                          className="bg-primary hover:bg-primary/90 px-3 py-1 text-xs"
                          data-testid={`button-add-mini-product-${product.id}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <Link href="/catalog" data-testid="link-continue-shopping">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                  Ver Catálogo Completo
                </Button>
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="font-serif font-bold text-foreground mb-6">Resumo do Pedido</h3>
              
              {/* Delivery Checker */}
              <div className="space-y-4 mb-6 border-b border-border pb-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Verificar entrega</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Digite seu CEP"
                        value={cep}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2');
                          setCep(value);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleCepCheck()}
                        maxLength={9}
                        className="text-sm"
                        data-testid="input-delivery-cep"
                      />
                      <Button
                        onClick={handleCepCheck}
                        disabled={deliveryCheckMutation.isPending || !cep.trim()}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                        data-testid="button-check-delivery"
                      >
                        {deliveryCheckMutation.isPending ? "..." : "Verificar"}
                      </Button>
                    </div>
                  </div>
                  {available !== null && (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={available ? "default" : "destructive"}
                        className="text-xs"
                        data-testid={`badge-delivery-${available ? 'available' : 'unavailable'}`}
                      >
                        {available ? (
                          <><CheckCircle className="h-3 w-3 mr-1" />Entregamos</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" />Não entregamos</>
                        )}
                      </Badge>
                      {city && state && (
                        <span className="text-xs text-muted-foreground" data-testid="text-delivery-location">
                          {city}, {state}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

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
              <h3 className="font-serif font-bold text-foreground mb-4">Opções de Pagamento</h3>
              <div className="space-y-3 mb-6">
                <div 
                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedPaymentMethod === 'pix' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handlePaymentMethodSelect('pix')}
                  data-testid="option-payment-pix"
                >
                  <span className="text-lg">📱</span>
                  <div>
                    <p className="font-medium text-foreground">PIX</p>
                    <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                  </div>
                </div>
                <div 
                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedPaymentMethod === 'cash' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handlePaymentMethodSelect('cash')}
                  data-testid="option-payment-cash"
                >
                  <span className="text-lg">💰</span>
                  <div>
                    <p className="font-medium text-foreground">Dinheiro na Entrega</p>
                    <p className="text-sm text-muted-foreground">Troco disponível</p>
                  </div>
                </div>
              </div>

              {showPixQr && selectedPaymentMethod === 'pix' && (
                <div className="mb-6 p-4 bg-accent rounded-xl text-center">
                  <h4 className="font-medium text-foreground mb-3">Código PIX</h4>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(25, 1fr)', gap: 0}} className="mx-auto w-fit">
                      {generateFakeQrCode().flatMap((row, i) => 
                        row.map((filled, j) => (
                          <div
                            key={`${i}-${j}`}
                            className={`w-2 h-2 ${filled ? 'bg-black' : 'bg-white'}`}
                          />
                        ))
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Escaneie o código com seu aplicativo do banco
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Código: 00020126330014BR.GOV.BCB.PIX2711doce-delicia5204000053039865802BR5913DOCE DELICIA6009SAO PAULO62070503***6304ABCD
                  </p>
                </div>
              )}

              <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                    size="lg"
                    disabled={items.length === 0 || !selectedPaymentMethod}
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
                    {/* CEP Lookup */}
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cep"
                          placeholder="00000-000"
                          value={addressForm.cep}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2');
                            handleAddressFieldChange('cep', value);
                          }}
                          onBlur={() => addressForm.cep && handleCepLookup(addressForm.cep)}
                          maxLength={9}
                          className={addressError ? "border-red-500" : ""}
                          data-testid="input-cep"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCepLookup(addressForm.cep)}
                          disabled={cepLoading || !addressForm.cep}
                          data-testid="button-search-cep"
                        >
                          {cepLoading ? "..." : "Buscar"}
                        </Button>
                      </div>
                      {addressError && (
                        <p className="text-sm text-red-600" data-testid="text-address-error">
                          {addressError}
                        </p>
                      )}
                    </div>

                    {/* Address Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="street">Logradouro</Label>
                        <Input
                          id="street"
                          placeholder="Rua, Avenida, etc."
                          value={addressForm.street}
                          onChange={(e) => handleAddressFieldChange('street', e.target.value)}
                          readOnly={!!addressForm.street}
                          className={!!addressForm.street ? "bg-gray-100" : ""}
                          data-testid="input-street"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="number">Número *</Label>
                        <Input
                          id="number"
                          placeholder="123"
                          value={addressForm.number}
                          onChange={(e) => handleAddressFieldChange('number', e.target.value)}
                          data-testid="input-number"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="complement">Complemento</Label>
                        <Input
                          id="complement"
                          placeholder="Apt 45, Bloco B, etc."
                          value={addressForm.complement}
                          onChange={(e) => handleAddressFieldChange('complement', e.target.value)}
                          data-testid="input-complement"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input
                          id="neighborhood"
                          placeholder="Nome do bairro"
                          value={addressForm.neighborhood}
                          onChange={(e) => handleAddressFieldChange('neighborhood', e.target.value)}
                          readOnly={!!addressForm.neighborhood}
                          className={!!addressForm.neighborhood ? "bg-gray-100" : ""}
                          data-testid="input-neighborhood"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          placeholder="Nome da cidade"
                          value={addressForm.city}
                          onChange={(e) => handleAddressFieldChange('city', e.target.value)}
                          readOnly={!!addressForm.city}
                          className={!!addressForm.city ? "bg-gray-100" : ""}
                          data-testid="input-city"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          placeholder="UF"
                          value={addressForm.state}
                          onChange={(e) => handleAddressFieldChange('state', e.target.value.toUpperCase())}
                          readOnly={!!addressForm.state}
                          className={!!addressForm.state ? "bg-gray-100" : ""}
                          maxLength={2}
                          data-testid="input-state"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Digite o CEP e clique em "Buscar" para preencher automaticamente o endereço
                    </p>
                    
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
                        disabled={checkoutMutation.isPending || !!validateAddressForm() || !!addressError}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        data-testid="button-confirm-checkout"
                      >
                        {checkoutMutation.isPending ? "Processando..." : "Confirmar Pedido"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
