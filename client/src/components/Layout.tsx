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
import { DevScreenshot } from "./DevScreenshot";
import { ScreenshotCapture, AutoScreenshotCapture } from "./ScreenshotCapture";
import { BatchScreenshotCapture } from "./BatchScreenshotCapture";

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
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left section - Logo */}
            <div className="flex justify-start">
              <Link href="/" className="flex items-center space-x-1 sm:space-x-2 cursor-pointer" data-testid="link-home">
                <div className="text-2xl sm:text-3xl lg:text-4xl transform hover:scale-110 transition-transform duration-200">🧁</div>
                <h1 className="text-xl sm:text-xl lg:text-2xl font-serif font-bold text-primary whitespace-nowrap">Doce Delícia</h1>
              </Link>
            </div>
            
            {/* Center section - Navigation */}
            <nav className="hidden md:flex items-center justify-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
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
            <div className="flex items-center space-x-2">
              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" data-testid="button-menu">
                    <Menu className="h-5 w-5" />
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
                    {!isAuthenticated && (
                      <div className="border-t pt-4 space-y-3">
                        <a
                          href="/api/login"
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 font-medium block text-center"
                          data-testid="button-mobile-login"
                        >
                          Entrar
                        </a>
                        <a
                          href="/api/login"
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 font-medium block text-center"
                          data-testid="button-mobile-register"
                        >
                          Criar Conta
                        </a>
                      </div>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>

              {isAuthenticated ? (
                <>
                  {/* Profile Icon - First on mobile, last on desktop */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        size="icon" 
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 w-9 order-1 sm:order-2"
                        data-testid="button-profile-menu"
                      >
                        <User className="h-4 w-4" />
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
                  
                  {/* Cart Icon - Last on mobile, first on desktop */}
                  <Link href="/cart" data-testid="link-cart">
                    <Button 
                      size="icon" 
                      className="relative bg-primary text-primary-foreground hover:bg-primary/90 h-9 w-9 order-2 sm:order-1"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {itemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-background text-foreground rounded-full px-1.5 py-0.5 text-xs min-w-[18px] text-center font-semibold shadow-lg border" data-testid="text-cart-count">
                          {itemCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="hidden sm:flex items-center space-x-2">
                  <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-9">
                    <a href="/api/login" data-testid="button-login">
                      Entrar
                    </a>
                  </Button>
                  <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-9">
                    <a href="/api/login" data-testid="button-register">
                      <span className="hidden lg:inline">Criar Conta</span>
                      <span className="lg:hidden">Cadastro</span>
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
      
      {/* Development Screenshot Tools */}
      <DevScreenshot />
      <ScreenshotCapture />
      <AutoScreenshotCapture />
      <BatchScreenshotCapture />
    </div>
  );
}
