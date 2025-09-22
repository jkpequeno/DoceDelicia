import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  Calendar,
  MapPin,
  ArrowRight,
  ShoppingBag
} from "lucide-react";
import { useEffect } from "react";
import type { Order } from "@shared/schema";

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
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
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const },
      confirmed: { label: "Confirmado", variant: "default" as const },
      preparing: { label: "Preparando", variant: "default" as const },
      ready: { label: "Pronto", variant: "default" as const },
      delivered: { label: "Entregue", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant={config.variant} data-testid={`status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Data não disponível";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: string) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  if (error || !orders) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
            Erro ao carregar pedidos
          </h1>
          <p className="text-muted-foreground mb-6">
            Não foi possível carregar seus pedidos. Tente novamente.
          </p>
          <Button onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-8">
            Meus Pedidos
          </h1>
          
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-serif font-bold text-foreground mb-2">
              Nenhum pedido encontrado
            </h2>
            <p className="text-muted-foreground mb-6">
              Você ainda não fez nenhum pedido. Que tal explorar nossos deliciosos cupcakes?
            </p>
            <Link href="/catalog">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Ver Catálogo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8" data-testid="heading-orders">
          Meus Pedidos
        </h1>
        
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
              data-testid={`order-card-${order.id}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium text-foreground" data-testid={`text-order-id-${order.id}`}>
                      Pedido #{order.id.slice(-8)}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span data-testid={`text-order-date-${order.id}`}>
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(order.status)}
                  <Link href={`/order/${order.id}`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid={`button-view-order-${order.id}`}
                    >
                      Ver Detalhes
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Entrega: 
                  </span>
                  <span className="text-sm text-foreground font-medium" data-testid={`text-delivery-address-${order.id}`}>
                    {order.deliveryAddress || "Endereço não informado"}
                  </span>
                </div>
                
                <div className="flex items-center justify-end">
                  <span className="text-lg font-bold text-primary" data-testid={`text-order-total-${order.id}`}>
                    {formatPrice(order.total)}
                  </span>
                  {order.appliedCouponCode && (
                    <Badge variant="secondary" className="ml-2">
                      Cupom: {order.appliedCouponCode}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/catalog">
            <Button variant="outline">
              Fazer Novo Pedido
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}