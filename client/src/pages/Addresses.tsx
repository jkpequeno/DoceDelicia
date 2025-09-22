import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Plus, Pencil, Trash2, Star, Home, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Address } from "@shared/schema";

export default function Addresses() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  const [cepLoading, setCepLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Fetch user's saved addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery<Address[]>({
    queryKey: ["/api/addresses"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para gerenciar seus endereços",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

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
      setIsDialogOpen(false);
      clearForm();
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
      setIsDialogOpen(false);
      clearForm();
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

  const clearForm = () => {
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
    setFormErrors([]);
    setEditingAddress(null);
  };

  const handleEdit = (address: Address) => {
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
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
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
      // Preserve existing isDefault status when editing, set false for new addresses
      isDefault: editingAddress ? editingAddress.isDefault : false
    };

    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressData });
    } else {
      createAddressMutation.mutate(addressData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este endereço?")) {
      deleteAddressMutation.mutate(id);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground" data-testid="text-addresses-title">
            Meus Endereços
          </h1>
          <p className="text-muted-foreground">Gerencie seus endereços de entrega</p>
        </div>
      </div>

      {addressesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add new address card */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              clearForm();
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
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {editingAddress ? "Editar Endereço" : "Novo Endereço"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
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
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Home className="h-4 w-4" />
                      {address.name}
                    </CardTitle>
                    {address.isDefault && (
                      <Badge variant="default" className="mt-1" data-testid={`badge-default-${address.id}`}>
                        <Star className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p>{address.street}, {address.number}</p>
                  {address.complement && <p>{address.complement}</p>}
                  <p>{address.neighborhood}</p>
                  <p>{address.city} - {address.state}</p>
                  <p>CEP: {address.cep}</p>
                </div>
                
                <div className="flex gap-2 pt-3">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate(address.id)}
                      disabled={setDefaultMutation.isPending}
                      data-testid={`button-set-default-${address.id}`}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Definir como padrão
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(address)}
                    data-testid={`button-edit-${address.id}`}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(address.id)}
                    disabled={deleteAddressMutation.isPending}
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
        <div className="text-center py-16" data-testid="empty-addresses">
          <MapPin className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
            Nenhum endereço cadastrado
          </h2>
          <p className="text-muted-foreground mb-8">
            Adicione um endereço para facilitar seus pedidos futuros
          </p>
        </div>
      )}
    </div>
  );
}