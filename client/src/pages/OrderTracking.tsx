import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Package, 
  CheckCircle, 
  Clock, 
  Truck, 
  MapPin,
  ShoppingBag,
  Calendar
} from "lucide-react";
import { useEffect } from "react";
import type { Order, OrderItem, Product } from "@shared/schema";

interface OrderWithItems extends Order {
  orderItems: (OrderItem & { product: Product })[];
}

export default function OrderTracking() {
  const { id } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: order, isLoading, error } = useQuery<OrderWithItems>({
    queryKey: [`/api/orders/${id}`],
    enabled: isAuthenticated && !!id,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para acessar seus pedidos",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-6">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
            Pedido não encontrado
          </h1>
          <p className="text-muted-foreground mb-6">
            Não foi possível encontrar este pedido ou você não tem permissão para visualizá-lo.
          </p>
          <Link href="/profile">
            <Button data-testid="button-back-to-profile">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Perfil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const orderSteps = [
    {
      key: "pending",
      label: "Pedido Recebido",
      icon: ShoppingBag,
      description: "Seu pedido foi recebido e está sendo processado"
    },
    {
      key: "confirmed",
      label: "Confirmado",
      icon: CheckCircle,
      description: "Pagamento aprovado e pedido confirmado"
    },
    {
      key: "preparing",
      label: "Em Preparo",
      icon: Clock,
      description: "Nossos confeiteiros estão preparando seus cupcakes"
    },
    {
      key: "ready",
      label: "Pronto",
      icon: Package,
      description: "Pedido pronto para entrega"
    },
    {
      key: "delivered",
      label: "Entregue",
      icon: Truck,
      description: "Pedido entregue com sucesso"
    }
  ];

  const getCurrentStepIndex = (status: string) => {
    if (status === "cancelled") return -1;
    const index = orderSteps.findIndex(step => step.key === status);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex(order.status);
  const isCancelled = order.status === "cancelled";

  const formatOrderStatus = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "outline" },
      confirmed: { label: "Confirmado", variant: "secondary" },
      preparing: { label: "Em Preparo", variant: "default" },
      ready: { label: "Pronto", variant: "secondary" },
      delivered: { label: "Entregue", variant: "default" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    return statusMap[status] || { label: status, variant: "outline" as const };
  };

  const statusInfo = formatOrderStatus(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/profile">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground" data-testid="text-order-title">
                Pedido #{order.id.slice(-8)}
              </h1>
              <p className="text-muted-foreground">
                Acompanhe o progresso do seu pedido
              </p>
            </div>
          </div>
          <Badge variant={statusInfo.variant} className="text-sm" data-testid="badge-order-status">
            {statusInfo.label}
          </Badge>
        </div>

        {/* Order Progress */}
        <div className="bg-card rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-serif font-bold text-foreground mb-6">
            Status do Pedido
          </h2>
          
          {isCancelled ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Pedido Cancelado
              </h3>
              <p className="text-muted-foreground">
                Este pedido foi cancelado. Entre em contato conosco se tiver dúvidas.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {orderSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const IconComponent = step.icon;
                
                return (
                  <div key={step.key} className="flex items-start space-x-4">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-colors
                      ${isCompleted 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                      }
                      ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                    `}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`
                          font-semibold transition-colors
                          ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}
                        `}>
                          {step.label}
                        </h3>
                        {isCompleted && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className={`
                        text-sm transition-colors
                        ${isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/60'}
                      `}>
                        {step.description}
                      </p>
                    </div>
                    
                    {index < orderSteps.length - 1 && (
                      <div className="absolute left-6 mt-12 w-px h-6 bg-border"></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Details */}
          <div className="bg-card rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-serif font-bold text-foreground mb-6">
              Detalhes do Pedido
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Data do Pedido</span>
                <div className="flex items-center space-x-2 text-foreground">
                  <Calendar className="h-4 w-4" />
                  <span data-testid="text-order-date">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Data não disponível'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total do Pedido</span>
                <span className="font-bold text-primary text-lg" data-testid="text-order-total">
                  R$ {parseFloat(order.total).toFixed(2).replace('.', ',')}
                </span>
              </div>

              {order.appliedCouponCode && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cupom Aplicado</span>
                  <div className="text-right">
                    <div className="font-medium text-foreground">
                      {order.appliedCouponCode}
                    </div>
                    <div className="text-sm text-destructive">
                      -R$ {parseFloat(order.discountAmount || "0").toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-border">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <span className="text-sm text-muted-foreground block">Endereço de Entrega</span>
                    <p className="text-foreground" data-testid="text-delivery-address">
                      {order.deliveryAddress}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-card rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-serif font-bold text-foreground mb-6">
              Itens do Pedido
            </h2>
            
            <div className="space-y-4">
              {order.orderItems?.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 pb-4 border-b border-border last:border-b-0">
                  <img 
                    src={item.product.imageUrl} 
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">
                      {item.product.name}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-muted-foreground">
                        Quantidade: {item.quantity}
                      </span>
                      <span className="font-semibold text-primary">
                        R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-card rounded-2xl p-6 shadow-lg mt-6">
          <h3 className="font-serif font-bold text-foreground mb-4">
            Precisa de Ajuda?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-2">
                📞 <strong>Telefone:</strong> (11) 99999-9999
              </p>
              <p className="text-muted-foreground">
                ✉️ <strong>E-mail:</strong> contato@docedelicia.com.br
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-2">
                🕒 <strong>Horário de Atendimento:</strong>
              </p>
              <p className="text-muted-foreground">
                Segunda a Domingo: 8h às 20h
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}