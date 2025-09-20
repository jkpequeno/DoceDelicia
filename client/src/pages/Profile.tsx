import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  User, 
  FileText, 
  MapPin, 
  Heart, 
  Package, 
  Star 
} from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para acessar seu perfil",
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
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-8" data-testid="text-profile-title">
          Meu Perfil
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-6 text-center shadow-lg">
              <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center text-primary-foreground text-3xl font-bold" data-testid="avatar-initials">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
              <h2 className="text-xl font-serif font-bold text-foreground mb-2" data-testid="text-user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || 'Usuário'
                }
              </h2>
              <p className="text-muted-foreground mb-4" data-testid="text-user-email">
                {user?.email}
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-primary" data-testid="text-total-orders">
                    {orders?.length || 0}
                  </div>
                  <div className="text-muted-foreground">Pedidos</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-primary" data-testid="text-total-favorites">
                    {favorites?.length || 0}
                  </div>
                  <div className="text-muted-foreground">Favoritos</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="font-serif font-bold text-foreground mb-4">Menu</h3>
              <nav className="space-y-2">
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-primary/10 text-primary font-medium">
                  <User className="w-5 h-5" />
                  <span>Dados Pessoais</span>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-xl hover:bg-accent transition-colors text-muted-foreground cursor-pointer">
                  <FileText className="w-5 h-5" />
                  <span>Histórico de Pedidos</span>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-xl hover:bg-accent transition-colors text-muted-foreground cursor-pointer">
                  <MapPin className="w-5 h-5" />
                  <span>Endereços</span>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-xl hover:bg-accent transition-colors text-muted-foreground cursor-pointer">
                  <Heart className="w-5 h-5" />
                  <span>Favoritos</span>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Data */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-bold text-foreground">Dados Pessoais</h3>
                <Button variant="ghost" className="text-primary hover:underline" data-testid="button-edit-profile">
                  Editar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-foreground mb-2">
                    Nome
                  </Label>
                  <Input 
                    id="firstName"
                    value={user?.firstName || ''} 
                    readOnly
                    className="bg-input"
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-foreground mb-2">
                    Sobrenome
                  </Label>
                  <Input 
                    id="lastName"
                    value={user?.lastName || ''} 
                    readOnly
                    className="bg-input"
                    data-testid="input-last-name"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2">
                    E-mail
                  </Label>
                  <Input 
                    id="email"
                    value={user?.email || ''} 
                    readOnly
                    className="bg-input"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground mb-2">
                    Telefone
                  </Label>
                  <Input 
                    id="phone"
                    value={user?.phone || ''} 
                    readOnly
                    className="bg-input"
                    data-testid="input-phone"
                  />
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-bold text-foreground">Pedidos Recentes</h3>
                <Button variant="ghost" className="text-primary hover:underline" data-testid="button-view-all-orders">
                  Ver todos
                </Button>
              </div>

              <div className="space-y-4">
                {ordersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))
                ) : orders && orders.length > 0 ? (
                  orders.slice(0, 3).map((order: any) => {
                    const statusInfo = formatOrderStatus(order.status);
                    return (
                      <div 
                        key={order.id} 
                        className="border border-border rounded-xl p-4 hover:bg-accent transition-colors"
                        data-testid={`order-${order.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-foreground">
                              Pedido #{order.id.slice(-8)}
                            </span>
                            <Badge variant={statusInfo.variant} className="text-xs">
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Total do pedido
                          </div>
                          <span className="font-bold text-primary">
                            R$ {parseFloat(order.total).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8" data-testid="no-orders">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
                    <Link href="/catalog" className="inline-block mt-4">
                      <Button variant="outline" data-testid="button-start-shopping">
                        Começar a Comprar
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Favorite Products */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-serif font-bold text-foreground mb-6">Produtos Favoritos</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favoritesLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))
                ) : favorites && favorites.length > 0 ? (
                  favorites.slice(0, 4).map((favorite: any) => (
                    <Link 
                      key={favorite.id} 
                      href={`/product/${favorite.product.id}`}
                      className="block"
                      data-testid={`favorite-${favorite.product.id}`}
                    >
                      <div className="flex items-center space-x-4 p-4 border border-border rounded-xl hover:bg-accent transition-colors cursor-pointer">
                        <img 
                          src={favorite.product.imageUrl} 
                          alt={favorite.product.name}
                          className="w-16 h-16 object-cover rounded-xl"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">
                            {favorite.product.name}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {favorite.product.description}
                          </p>
                          <span className="text-primary font-bold">
                            R$ {parseFloat(favorite.product.price).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8" data-testid="no-favorites">
                    <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Você não tem produtos favoritos ainda.</p>
                    <Link href="/catalog" className="inline-block mt-4">
                      <Button variant="outline" data-testid="button-browse-products">
                        Explorar Produtos
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
