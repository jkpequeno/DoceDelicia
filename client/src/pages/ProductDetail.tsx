import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  Minus, 
  Plus, 
  Heart, 
  Star, 
  Truck, 
  Award, 
  Snowflake,
  ChevronLeft 
} from "lucide-react";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["/api/products", id],
    enabled: !!id,
  });

  const { data: favorites } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const isFavorite = favorites?.some((fav: any) => fav.productId === id);

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${id}`);
      } else {
        await apiRequest("POST", "/api/favorites", { productId: id });
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
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login necessário",
          description: "Faça login para gerenciar seus favoritos",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos",
        variant: "destructive",
      });
    },
  });

  // Mock additional images for demonstration
  const productImages = product ? [
    product.imageUrl,
    "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=150",
    "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=150",
    "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=150"
  ] : [];

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product.id, quantity);
  };

  const handleToggleFavorite = () => {
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-6 w-64 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="w-full h-96 rounded-3xl" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12" data-testid="text-product-not-found">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
            Produto não encontrado
          </h2>
          <p className="text-muted-foreground mb-8">
            O produto que você está procurando não existe ou foi removido.
          </p>
          <Link href="/catalog" data-testid="link-back-catalog">
            <Button>Voltar ao Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8" data-testid="breadcrumb">
        <Link href="/" className="hover:text-primary">Início</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-primary">Catálogo</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="bg-card rounded-3xl overflow-hidden shadow-lg">
            <img 
              src={productImages[selectedImage]} 
              alt={product.name}
              className="w-full h-96 object-cover"
              data-testid="img-product-main"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {productImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${product.name} - Vista ${index + 1}`}
                className={`w-full h-20 object-cover rounded-xl cursor-pointer transition-opacity ${
                  selectedImage === index ? "ring-2 ring-primary" : "hover:opacity-80"
                }`}
                onClick={() => setSelectedImage(index)}
                data-testid={`img-thumbnail-${index}`}
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-4xl font-serif font-bold text-foreground" data-testid="text-product-name">
                {product.name}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                disabled={favoriteMutation.isPending}
                className="flex-shrink-0"
                data-testid="button-toggle-favorite"
              >
                <Heart 
                  className={`h-6 w-6 transition-colors ${
                    isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"
                  }`} 
                />
              </Button>
            </div>
            <p className="text-xl text-muted-foreground" data-testid="text-product-subtitle">
              Delicioso cupcake artesanal
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-3xl font-bold text-primary" data-testid="text-product-price">
              R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
            </span>
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-muted-foreground text-sm">(127 avaliações)</span>
            </div>
            {product.isFeatured && (
              <Badge variant="secondary" data-testid="badge-featured">
                Destaque
              </Badge>
            )}
          </div>

          <div className="bg-card p-6 rounded-2xl">
            <h3 className="font-serif font-bold text-foreground mb-3">Descrição</h3>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-product-description">
              {product.description}
            </p>
          </div>

          {product.ingredients && product.ingredients.length > 0 && (
            <div className="bg-card p-6 rounded-2xl">
              <h3 className="font-serif font-bold text-foreground mb-3">Ingredientes</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {product.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center space-x-2" data-testid={`ingredient-${index}`}>
                    <span className="text-primary">•</span>
                    <span className="text-muted-foreground">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-accent p-6 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-foreground">Quantidade</span>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  data-testid="button-decrease-quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-medium px-4" data-testid="text-quantity">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  data-testid="button-increase-quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                size="lg"
                onClick={handleAddToCart}
                data-testid="button-add-to-cart"
              >
                Adicionar ao Carrinho - R$ {(parseFloat(product.price) * quantity).toFixed(2).replace('.', ',')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-card p-4 rounded-xl" data-testid="feature-delivery">
              <Truck className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Entrega Rápida</div>
              <div className="text-xs text-muted-foreground">1-2 horas</div>
            </div>
            <div className="bg-card p-4 rounded-xl" data-testid="feature-quality">
              <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Qualidade</div>
              <div className="text-xs text-muted-foreground">Ingredientes premium</div>
            </div>
            <div className="bg-card p-4 rounded-xl" data-testid="feature-fresh">
              <Snowflake className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Sempre Fresco</div>
              <div className="text-xs text-muted-foreground">Feito sob demanda</div>
            </div>
          </div>

          <Link href="/catalog" className="inline-flex" data-testid="link-back-catalog">
            <Button variant="outline" className="w-full sm:w-auto">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar ao Catálogo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
