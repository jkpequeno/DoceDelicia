import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import type { Product, Category } from "@shared/schema";

export default function Catalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("popular");

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Filter and sort products
  const filteredProducts = products?.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    
    const matchesPriceRange = (() => {
      if (!priceRange) return true;
      const price = parseFloat(product.price);
      switch (priceRange) {
        case "5-8": return price >= 5 && price <= 8;
        case "8-12": return price >= 8 && price <= 12;
        case "12+": return price >= 12;
        default: return true;
      }
    })();

    return matchesSearch && matchesCategory && matchesPriceRange;
  }).sort((a: Product, b: Product) => {
    switch (sortBy) {
      case "price-low": return parseFloat(a.price) - parseFloat(b.price);
      case "price-high": return parseFloat(b.price) - parseFloat(a.price);
      case "name": return a.name.localeCompare(b.name);
      default: return b.isFeatured ? 1 : -1; // Featured first
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-4" data-testid="text-catalog-title">
          Nosso Catálogo
        </h1>
        <p className="text-xl text-muted-foreground" data-testid="text-catalog-description">
          Descubra todos os nossos sabores especiais
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-card rounded-2xl p-6 mb-8 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Input
                type="text"
                placeholder="Buscar cupcakes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-category">
                <SelectValue placeholder="Todas as Categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as Categorias</SelectItem>
                {categories?.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-price">
                <SelectValue placeholder="Todas as Faixas de Preço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as Faixas de Preço</SelectItem>
                <SelectItem value="5-8">R$ 5 - R$ 8</SelectItem>
                <SelectItem value="8-12">R$ 8 - R$ 12</SelectItem>
                <SelectItem value="12+">R$ 12+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 w-full lg:w-auto">
            <span className="text-muted-foreground whitespace-nowrap">Ordenar por:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Mais Populares</SelectItem>
                <SelectItem value="price-low">Menor Preço</SelectItem>
                <SelectItem value="price-high">Maior Preço</SelectItem>
                <SelectItem value="name">Nome A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productsLoading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden">
              <Skeleton className="w-full h-48" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-3" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </div>
          ))
        ) : filteredProducts && filteredProducts.length > 0 ? (
          filteredProducts.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="col-span-full text-center py-12" data-testid="text-no-products">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou usar outros termos de busca.
            </p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
                setPriceRange("");
                setSortBy("popular");
              }}
              variant="outline"
              data-testid="button-clear-filters"
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* Results Count */}
      {filteredProducts && (
        <div className="text-center mt-8 text-muted-foreground" data-testid="text-results-count">
          Mostrando {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
