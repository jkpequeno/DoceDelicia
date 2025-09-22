import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  User as UserIcon, 
  FileText, 
  MapPin, 
  Heart, 
  Package, 
  Star,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Home
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { User, Order, Favorite, Address } from "@shared/schema";

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Address form state
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: ""
  });
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  const { data: favorites, isLoading: favoritesLoading } = useQuery<Favorite[]>({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  // Fetch user's saved addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery<Address[]>({
    queryKey: ["/api/addresses"],
    enabled: isAuthenticated,
  });

  const typedUser = user as User | undefined;

  // CEP lookup
  const handleCepLookup = async (cep: string) => {
    if (!cep || cep.length < 8) {
      setFormErrors(["CEP deve conter 8 dígitos"]);
      return;
    }

    setCepLoading(true);
    setFormErrors([]);

    try {
      const response = await fetch(`/api/cep/${cep.replace(/\D/g, '')}`);
      const data = await response.json();

      if (!response.ok) {
        setFormErrors([data.error || "Erro ao consultar CEP"]);
        return;
      }

      setAddressForm(prev => ({
        ...prev,
        cep: data.cep,
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state
      }));

      toast({
        title: "CEP encontrado!",
        description: `${data.street}, ${data.neighborhood}, ${data.city}`,
      });
    } catch (error) {
      setFormErrors(["Erro ao consultar CEP"]);
    } finally {
      setCepLoading(false);
    }
  };

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (addressData: any) => {
      return await apiRequest("POST", "/api/addresses", addressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setIsAddressDialogOpen(false);
      clearAddressForm();
      toast({
        title: "Endereço criado",
        description: "Endereço salvo com sucesso",
      });
    },
    onError: (error: any) => {
      setFormErrors([error.message || "Erro ao criar endereço"]);
    }
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/addresses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setIsAddressDialogOpen(false);
      clearAddressForm();
      setEditingAddress(null);
      toast({
        title: "Endereço atualizado",
        description: "Endereço atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      setFormErrors([error.message || "Erro ao atualizar endereço"]);
    }
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Endereço removido",
        description: "Endereço removido com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover endereço",
        variant: "destructive",
      });
    }
  });

  // Set default address mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PUT", `/api/addresses/${id}/default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Endereço padrão",
        description: "Endereço definido como padrão",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao definir endereço padrão",
        variant: "destructive",
      });
    }
  });

  const clearAddressForm = () => {
    setAddressForm({
      name: "",
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: ""
    });
    setSetAsDefault(false);
    setFormErrors([]);
    setEditingAddress(null);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name,
      cep: address.cep,
      street: address.street,
      number: address.number,
      complement: address.complement || "",
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state
    });
    setSetAsDefault(address.isDefault || false);
    setIsAddressDialogOpen(true);
  };

  const handleSubmitAddress = () => {
    // Validate form
    const errors: string[] = [];
    if (!addressForm.name.trim()) errors.push("Nome é obrigatório");
    if (!addressForm.cep.trim()) errors.push("CEP é obrigatório");
    if (!addressForm.street.trim()) errors.push("Rua é obrigatória");
    if (!addressForm.number.trim()) errors.push("Número é obrigatório");
    if (!addressForm.neighborhood.trim()) errors.push("Bairro é obrigatório");
    if (!addressForm.city.trim()) errors.push("Cidade é obrigatória");
    if (!addressForm.state.trim()) errors.push("Estado é obrigatório");

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const addressData = {
      name: addressForm.name,
      cep: addressForm.cep.replace(/\D/g, ''),
      street: addressForm.street,
      number: addressForm.number,
      complement: addressForm.complement,
      neighborhood: addressForm.neighborhood,
      city: addressForm.city,
      state: addressForm.state.toUpperCase(),
      // Use checkbox value, but for first address default to true if checkbox is not explicitly set
      isDefault: editingAddress 
        ? setAsDefault 
        : setAsDefault || (addresses?.length === 0 || !addresses)
    };

    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressData });
    } else {
      createAddressMutation.mutate(addressData);
    }
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm("Tem certeza que deseja remover este endereço?")) {
      deleteAddressMutation.mutate(id);
    }
  };

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

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
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

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          {/* Profile Sidebar - Mobile optimized */}
          <div className="lg:space-y-6">
            <div className="bg-card rounded-2xl p-4 lg:p-6 text-center shadow-lg">
              <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-lg sm:text-2xl lg:text-3xl font-bold" data-testid="avatar-initials">
                  {getInitials(typedUser?.firstName, typedUser?.lastName)}
                </div>
                <div className="text-center sm:text-left lg:text-center flex-1">
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground mb-1 lg:mb-2" data-testid="text-user-name">
                    {typedUser?.firstName && typedUser?.lastName 
                      ? `${typedUser.firstName} ${typedUser.lastName}`
                      : typedUser?.email || 'Usuário'
                    }
                  </h2>
                  <p className="text-sm text-muted-foreground mb-2 lg:mb-4" data-testid="text-user-email">
                    {typedUser?.email}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start lg:justify-center space-x-6 text-sm">
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
              </div>
            </div>

            <div className="bg-card rounded-2xl p-4 lg:p-6 shadow-lg">
              <h3 className="font-serif font-bold text-foreground mb-4 hidden lg:block">Menu</h3>
              <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                <button 
                  onClick={() => document.getElementById('personal-data')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex items-center space-x-2 p-3 rounded-xl hover:bg-accent transition-colors text-muted-foreground cursor-pointer whitespace-nowrap lg:w-full text-left"
                  data-testid="nav-personal-data"
                >
                  <UserIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Dados Pessoais</span>
                  <span className="sm:hidden">Dados</span>
                </button>
                <button 
                  onClick={() => document.getElementById('orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex items-center space-x-2 p-3 rounded-xl hover:bg-accent transition-colors text-muted-foreground cursor-pointer whitespace-nowrap lg:w-full text-left"
                  data-testid="nav-orders"
                >
                  <FileText className="w-5 h-5" />
                  <span className="hidden sm:inline">Histórico de Pedidos</span>
                  <span className="sm:hidden">Pedidos</span>
                </button>
                <button 
                  onClick={() => document.getElementById('addresses')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex items-center space-x-2 p-3 rounded-xl hover:bg-accent transition-colors text-muted-foreground cursor-pointer whitespace-nowrap lg:w-full text-left"
                  data-testid="nav-addresses"
                >
                  <MapPin className="w-5 h-5" />
                  <span>Endereços</span>
                </button>
                <button 
                  onClick={() => document.getElementById('favorites')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex items-center space-x-2 p-3 rounded-xl hover:bg-accent transition-colors text-muted-foreground cursor-pointer whitespace-nowrap lg:w-full text-left"
                  data-testid="nav-favorites"
                >
                  <Heart className="w-5 h-5" />
                  <span>Favoritos</span>
                </button>
                <a 
                  href="/api/logout" 
                  className="flex items-center space-x-2 p-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive cursor-pointer whitespace-nowrap"
                  data-testid="link-logout"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </a>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Data Section */}
            <div id="personal-data" className="bg-card rounded-2xl p-4 lg:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h3 className="text-lg lg:text-xl font-serif font-bold text-foreground">Dados Pessoais</h3>
                <Button variant="ghost" className="text-primary hover:underline text-sm lg:text-base" data-testid="button-edit-profile">
                  Editar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-foreground mb-2">
                    Nome
                  </Label>
                  <Input 
                    id="firstName"
                    value={typedUser?.firstName || ''} 
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
                    value={typedUser?.lastName || ''} 
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
                    value={typedUser?.email || ''} 
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
                    value={typedUser?.phone || ''} 
                    readOnly
                    className="bg-input"
                    data-testid="input-phone"
                  />
                </div>
              </div>
            </div>

            {/* Orders Section */}
            <div id="orders" className="bg-card rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-bold text-foreground">Histórico de Pedidos</h3>
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
                      <Link 
                        key={order.id} 
                        href={`/order/${order.id}`}
                        className="block"
                        data-testid={`link-order-${order.id}`}
                      >
                        <div 
                          className="border border-border rounded-xl p-4 hover:bg-accent transition-colors cursor-pointer"
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
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
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
                      </Link>
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
                {orders && orders.length > 3 && (
                  <div className="text-center pt-4">
                    <Link href="/orders">
                      <Button variant="outline" data-testid="button-view-all-orders">
                        Ver todos os pedidos
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Addresses Section */}
            <div id="addresses" className="bg-card rounded-2xl p-4 lg:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h3 className="text-lg lg:text-xl font-serif font-bold text-foreground">Meus Endereços</h3>
              </div>

              {addressesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  {/* Add new address card */}
                  <Dialog open={isAddressDialogOpen} onOpenChange={(open) => {
                    setIsAddressDialogOpen(open);
                    if (!open) {
                      clearAddressForm();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors cursor-pointer" data-testid="card-add-address">
                        <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                          <Plus className="h-12 w-12 text-primary/50 mb-4" />
                          <p className="text-foreground font-medium">Adicionar Endereço</p>
                          <p className="text-sm text-muted-foreground">Clique para criar um novo endereço</p>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          {editingAddress ? "Editar Endereço" : "Novo Endereço"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 px-1">
                        <div>
                          <Label htmlFor="name">Nome do Endereço *</Label>
                          <Input
                            id="name"
                            placeholder="Casa, Trabalho, etc."
                            value={addressForm.name}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                            data-testid="input-address-name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="cep">CEP *</Label>
                          <div className="flex gap-2">
                            <Input
                              id="cep"
                              placeholder="00000-000"
                              value={addressForm.cep}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2');
                                setAddressForm(prev => ({ ...prev, cep: value }));
                              }}
                              onBlur={() => addressForm.cep && handleCepLookup(addressForm.cep)}
                              maxLength={9}
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
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor="street">Logradouro *</Label>
                            <Input
                              id="street"
                              placeholder="Rua, Avenida, etc."
                              value={addressForm.street}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                              data-testid="input-street"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="number">Número *</Label>
                            <Input
                              id="number"
                              placeholder="123"
                              value={addressForm.number}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, number: e.target.value }))}
                              data-testid="input-number"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="complement">Complemento</Label>
                            <Input
                              id="complement"
                              placeholder="Apt 45, Bloco B, etc."
                              value={addressForm.complement}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, complement: e.target.value }))}
                              data-testid="input-complement"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="neighborhood">Bairro *</Label>
                            <Input
                              id="neighborhood"
                              placeholder="Nome do bairro"
                              value={addressForm.neighborhood}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                              data-testid="input-neighborhood"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="city">Cidade *</Label>
                            <Input
                              id="city"
                              placeholder="Nome da cidade"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                              data-testid="input-city"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="state">Estado *</Label>
                            <Input
                              id="state"
                              placeholder="UF"
                              value={addressForm.state}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                              maxLength={2}
                              data-testid="input-state"
                            />
                          </div>
                        </div>

                        {formErrors.length > 0 && (
                          <div className="text-sm text-red-600" data-testid="text-form-errors">
                            {formErrors.map((error, index) => (
                              <p key={index}>{error}</p>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="setAsDefault"
                            checked={setAsDefault}
                            onCheckedChange={setSetAsDefault}
                            data-testid="checkbox-set-default"
                          />
                          <Label htmlFor="setAsDefault" className="text-sm cursor-pointer">
                            Definir como endereço padrão
                          </Label>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsAddressDialogOpen(false)}
                            className="flex-1"
                            data-testid="button-cancel"
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleSubmitAddress}
                            disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                            className="flex-1"
                            data-testid="button-save-address"
                          >
                            {(createAddressMutation.isPending || updateAddressMutation.isPending) ? "Salvando..." : 
                             editingAddress ? "Atualizar" : "Salvar"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Address cards */}
                  {addresses?.map((address) => (
                    <Card key={address.id} className={`relative ${address.isDefault ? 'ring-2 ring-primary' : ''}`} data-testid={`card-address-${address.id}`}>
                      <CardHeader className="pb-2 lg:pb-3 p-3 lg:p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                              <Home className="h-4 w-4" />
                              {address.name}
                            </CardTitle>
                            {address.isDefault && (
                              <Badge variant="default" className="mt-1 text-xs" data-testid={`badge-default-${address.id}`}>
                                <Star className="h-3 w-3 mr-1" />
                                Padrão
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 p-3 lg:p-6 pt-0">
                        <div className="text-xs lg:text-sm text-muted-foreground">
                          <p className="break-words">{address.street}, {address.number}</p>
                          {address.complement && <p className="break-words">{address.complement}</p>}
                          <p>{address.neighborhood}</p>
                          <p>{address.city} - {address.state}</p>
                          <p>CEP: {address.cep}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 pt-3">
                          {!address.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDefaultMutation.mutate(address.id)}
                              disabled={setDefaultMutation.isPending}
                              className="flex-1 min-w-fit h-9 text-xs"
                              data-testid={`button-set-default-${address.id}`}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Definir padrão
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                            className="flex-1 min-w-fit h-9 text-xs"
                            data-testid={`button-edit-${address.id}`}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                            disabled={deleteAddressMutation.isPending}
                            className="flex-1 min-w-fit h-9 text-xs"
                            data-testid={`button-delete-${address.id}`}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {addresses && addresses.length === 0 && !addressesLoading && (
                <div className="text-center py-8 lg:py-16" data-testid="empty-addresses">
                  <MapPin className="h-16 w-16 lg:h-24 lg:w-24 mx-auto text-muted-foreground mb-4 lg:mb-6" />
                  <h2 className="text-xl lg:text-2xl font-serif font-bold text-foreground mb-3 lg:mb-4">
                    Nenhum endereço cadastrado
                  </h2>
                  <p className="text-muted-foreground mb-6 lg:mb-8">
                    Adicione um endereço para facilitar seus pedidos futuros
                  </p>
                </div>
              )}
            </div>

            {/* Favorites Section */}
            <div id="favorites" className="bg-card rounded-2xl p-4 lg:p-6 shadow-lg">
              <h3 className="text-lg lg:text-xl font-serif font-bold text-foreground mb-4 lg:mb-6">Produtos Favoritos</h3>
              
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
              {favorites && favorites.length > 4 && (
                <div className="text-center pt-6">
                  <Button variant="outline" data-testid="button-view-all-favorites">
                    Ver todos os favoritos
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
