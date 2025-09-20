import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, itemCount, total, updateQuantity, removeFromCart, isLoading } = useCart();
  const { toast } = useToast();

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
  const finalTotal = total + deliveryFee;

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
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                  size="lg"
                  disabled={items.length === 0}
                  data-testid="button-checkout"
                >
                  Finalizar Pedido
                </Button>
                <div className="relative">
                  <Input 
                    placeholder="Código do cupom"
                    className="pr-20"
                    data-testid="input-coupon"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-1 top-1 bottom-1"
                    data-testid="button-apply-coupon"
                  >
                    Aplicar
                  </Button>
                </div>
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
              <h3 className="font-serif font-bold text-foreground mb-4">Endereço de Entrega</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">João Silva</p>
                <p className="text-muted-foreground">Rua das Flores, 123</p>
                <p className="text-muted-foreground">Vila Madalena - São Paulo, SP</p>
                <p className="text-muted-foreground">CEP: 05433-000</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-3 text-primary hover:underline p-0"
                data-testid="button-change-address"
              >
                Alterar endereço
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
