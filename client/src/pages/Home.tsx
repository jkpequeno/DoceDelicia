import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";

export default function Home() {
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ["/api/products", { featured: "true" }],
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-background via-accent to-secondary/20 py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-5xl lg:text-6xl font-serif font-bold text-foreground mb-6" data-testid="text-hero-title">
                Os Melhores <span className="text-primary">Cupcakes</span> do Brasil
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed" data-testid="text-hero-description">
                Feitos com amor e ingredientes frescos, nossos cupcakes trazem o sabor da felicidade para cada momento especial.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/catalog" data-testid="link-hero-catalog">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Ver Catálogo
                  </Button>
                </Link>
                <Button variant="outline" size="lg" data-testid="button-hero-about">
                  Sobre Nós
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2 lg:pl-12">
              <img 
                src="https://images.unsplash.com/photo-1486427944299-d1955d23e34d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Cupcakes coloridos" 
                className="rounded-3xl shadow-2xl w-full h-auto"
                data-testid="img-hero-cupcakes"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4" data-testid="text-featured-title">
              Destaques da Semana
            </h2>
            <p className="text-xl text-muted-foreground" data-testid="text-featured-description">
              Sabores especiais que conquistaram nossos clientes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-accent rounded-2xl overflow-hidden">
                  <Skeleton className="w-full h-64" />
                  <div className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </div>
              ))
            ) : featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} featured />
              ))
            ) : (
              <div className="col-span-full text-center py-12" data-testid="text-no-featured">
                <p className="text-muted-foreground">Nenhum produto em destaque no momento.</p>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link href="/catalog" data-testid="link-view-all">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Ver Todos os Sabores
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=500" 
                alt="Nossa confeitaria" 
                className="rounded-3xl shadow-xl w-full h-auto"
                data-testid="img-about-bakery"
              />
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-serif font-bold text-foreground mb-6" data-testid="text-about-title">
                Nossa História Doce
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed" data-testid="text-about-description-1">
                Há mais de 10 anos criando momentos especiais através de cupcakes únicos. 
                Combinamos receitas tradicionais brasileiras com técnicas modernas de confeitaria.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed" data-testid="text-about-description-2">
                Cada cupcake é feito com ingredientes selecionados e muito carinho, 
                porque acreditamos que a felicidade vem em pequenas porções.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center" data-testid="stat-customers">
                  <div className="text-3xl font-bold text-primary mb-2">10k+</div>
                  <div className="text-muted-foreground">Clientes Felizes</div>
                </div>
                <div className="text-center" data-testid="stat-flavors">
                  <div className="text-3xl font-bold text-primary mb-2">50+</div>
                  <div className="text-muted-foreground">Sabores Únicos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
