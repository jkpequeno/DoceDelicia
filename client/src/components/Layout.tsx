import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useDelivery } from "@/contexts/DeliveryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, User, Menu, MapPin, CheckCircle, XCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const { itemCount } = useCart();
  const { cep, available, city, state, setCep, setDeliveryInfo } = useDelivery();
  const [location] = useLocation();
  const { toast } = useToast();

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

  // Delivery check mutation
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

  const navigation = [
    { name: "Início", href: "/" },
    { name: "Catálogo", href: "/catalog" },
    { name: "Sobre Nós", href: "/about" },
    ...((user as any)?.isAdmin ? [{ name: "Admin", href: "/admin" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          {/* Delivery Checker Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
              <div className="flex items-center gap-2 flex-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite seu CEP para verificar entrega"
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
              {available !== null && (
                <Badge 
                  variant={available ? "default" : "destructive"}
                  className="ml-2"
                  data-testid={`badge-delivery-${available ? 'available' : 'unavailable'}`}
                >
                  {available ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />Entregamos</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" />Não entregamos</>
                  )}
                </Badge>
              )}
            </div>
            {city && state && (
              <p className="text-xs text-center text-muted-foreground mt-1" data-testid="text-delivery-location">
                {city}, {state}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 items-center">
            {/* Left section - Logo */}
            <div className="flex justify-start">
              <Link href="/" className="flex items-center space-x-2 cursor-pointer" data-testid="link-home">
                <div className="text-4xl transform hover:scale-110 transition-transform duration-200">🧁</div>
                <h1 className="text-2xl font-serif font-bold text-primary">Doce Delícia</h1>
              </Link>
            </div>
            
            {/* Center section - Navigation */}
            <nav className="hidden md:flex items-center justify-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`transition-colors font-medium flex items-center space-x-1 ${
                    location === item.href ? "text-primary" : "text-foreground hover:text-primary"
                  }`}
                  data-testid={`link-${item.name.toLowerCase()}`}
                >
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Right section - Auth/Profile buttons */}
            <div className="flex items-center justify-end space-x-4">
              {/* Cart Icon - Only show when authenticated */}
              {isAuthenticated && (
                <Link href="/cart" data-testid="link-cart">
                  <Button 
                    size="icon" 
                    className="relative bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-background text-foreground rounded-full px-2 py-1 text-xs min-w-[20px] text-center font-semibold shadow-lg border" data-testid="text-cart-count">
                        {itemCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}
              
              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-menu">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <nav className="flex flex-col space-y-4 mt-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                        data-testid={`link-mobile-${item.name.toLowerCase()}`}
                      >
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    ))}
                    <Link
                      href="/cart"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                      data-testid="link-mobile-carrinho"
                    >
                      <span className="font-medium">Carrinho</span>
                      {itemCount > 0 && (
                        <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                          {itemCount}
                        </span>
                      )}
                    </Link>
                    {!isAuthenticated && (
                      <div className="border-t pt-4">
                        <a
                          href="/api/login"
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium block text-center"
                          data-testid="button-mobile-login"
                        >
                          Entrar
                        </a>
                      </div>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>

              {isAuthenticated ? (
                <Link href="/profile" data-testid="link-profile">
                  <Button 
                    size="icon" 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <a href="/api/login" data-testid="button-login">
                      Entrar
                    </a>
                  </Button>
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <a href="/api/login" data-testid="button-register">
                      Criar Conta
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-5xl">🧁</div>
                <h3 className="text-2xl font-serif font-bold text-primary">Doce Delícia</h3>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Criando momentos especiais através de cupcakes únicos há mais de 10 anos. 
                Sabores brasileiros com qualidade internacional.
              </p>
              <div className="flex space-x-4">
                <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer">
                  📘
                </div>
                <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer">
                  📷
                </div>
                <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer">
                  🐦
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="text-right">
                <h4 className="font-serif font-bold text-foreground mb-4">Contato</h4>
                <div className="space-y-2 text-muted-foreground text-sm">
                  <p>📍 Rua das Flores, 123<br />Vila Madalena - São Paulo, SP</p>
                  <p>📞 (11) 99999-9999</p>
                  <p>✉️ contato@docedelicia.com.br</p>
                  <p>🕒 Seg-Dom: 8h às 20h</p>
                </div>
              </div>
            </div>

          </div>

          <div className="border-t border-border pt-8 mt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Doce Delícia. Todos os direitos reservados. Feito com ❤️ no Brasil.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
