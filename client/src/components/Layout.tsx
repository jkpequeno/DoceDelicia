import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu, Package, Settings, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const { itemCount } = useCart();
  const [location] = useLocation();

  const navigation = [
    { name: "Início", href: "/" },
    { name: "Catálogo", href: "/catalog" },
    { name: "Sobre Nós", href: "/about" },
    ...((user as any)?.isAdmin ? [{ name: "Admin", href: "/admin" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
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
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 font-medium block text-center"
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="icon" 
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-profile-menu"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center w-full" data-testid="menu-profile">
                        <Settings className="mr-2 h-4 w-4" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center w-full" data-testid="menu-orders">
                        <Package className="mr-2 h-4 w-4" />
                        Meus Pedidos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/api/logout" className="flex items-center w-full" data-testid="menu-logout">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer">
                  📘
                </div>
                <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer">
                  📷
                </div>
                <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer">
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
