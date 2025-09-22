import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { DeliveryProvider } from "@/contexts/DeliveryContext";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Profile from "@/pages/Profile";
import Orders from "@/pages/Orders";
import OrderTracking from "@/pages/OrderTracking";
import Admin from "@/pages/Admin";
import About from "@/pages/About";
import NotFound from "@/pages/not-found";

// Component to handle scroll to top on route change
function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Smooth scroll to top when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [location]);

  return null;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Layout>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={isLoading || !isAuthenticated ? Landing : Home} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/cart" component={Cart} />
        <Route path="/about" component={About} />
        <Route path="/profile" component={Profile} />
        <Route path="/orders" component={Orders} />
        <Route path="/order/:id" component={OrderTracking} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DeliveryProvider>
          <CartProvider>
            <Toaster />
            <Router />
          </CartProvider>
        </DeliveryProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
