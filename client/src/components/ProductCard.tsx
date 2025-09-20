import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, Favorite } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

export default function ProductCard({ product, featured = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's favorites
  const { data: favorites } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  // Check if this product is favorited
  const isFavorite = favorites && Array.isArray(favorites) 
    ? favorites.some((fav: any) => fav.productId === product.id)
    : false;

  // Favorites mutation
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${product.id}`);
      } else {
        await apiRequest("POST", "/api/favorites", { productId: product.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
        description: isFavorite 
          ? "Produto removido da sua lista de favoritos" 
          : "Produto adicionado à sua lista de favoritos",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para gerenciar seus favoritos",
        variant: "destructive",
      });
      return;
    }
    
    favoriteMutation.mutate();
  };

  return (
    <Link href={`/product/${product.id}`} className="block" data-testid={`card-product-${product.id}`}>
      <div className={`bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer ${
        featured ? "lg:col-span-1" : ""
      }`}>
        <div className="relative">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            data-testid={`img-product-${product.id}`}
          />
          <button 
            className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
            onClick={handleToggleFavorite}
            disabled={favoriteMutation.isPending}
            data-testid={`button-favorite-${product.id}`}
          >
            <Heart className={`h-4 w-4 transition-colors ${
              isFavorite 
                ? "text-red-500 fill-red-500" 
                : "text-muted-foreground hover:text-red-500"
            }`} />
          </button>
        </div>
        
        <div className="p-4">
          <h3 className="font-serif font-bold text-foreground mb-2" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-product-description-${product.id}`}>
            {product.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
              R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
            </span>
            
            <div className="flex items-center space-x-2">
              {product.isFeatured && (
                <Badge variant="secondary" className="text-xs" data-testid={`badge-featured-${product.id}`}>
                  Destaque
                </Badge>
              )}
              
              <Button 
                size="sm" 
                onClick={handleAddToCart}
                className="bg-primary hover:bg-primary/90"
                data-testid={`button-add-cart-${product.id}`}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
