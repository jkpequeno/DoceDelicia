import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen">
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
                <a href="/api/login" data-testid="button-hero-login">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Entrar e Ver Catálogo
                  </Button>
                </a>
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

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4" data-testid="text-features-title">
              Por que escolher a Doce Delícia?
            </h2>
            <p className="text-xl text-muted-foreground" data-testid="text-features-description">
              Qualidade e sabor que fazem a diferença
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6" data-testid="feature-quality">
              <div className="text-6xl mb-4">🥇</div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">Ingredientes Premium</h3>
              <p className="text-muted-foreground">Selecionamos apenas os melhores ingredientes para criar sabores únicos e inesquecíveis.</p>
            </div>

            <div className="text-center p-6" data-testid="feature-delivery">
              <div className="text-6xl mb-4">🚚</div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">Entrega Rápida</h3>
              <p className="text-muted-foreground">Receba seus cupcakes fresquinhos em até 2 horas, mantendo toda a qualidade e sabor.</p>
            </div>

            <div className="text-center p-6" data-testid="feature-fresh">
              <div className="text-6xl mb-4">❄️</div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">Sempre Frescos</h3>
              <p className="text-muted-foreground">Preparamos seus cupcakes sob demanda para garantir máxima frescura e qualidade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-6" data-testid="text-cta-title">
            Pronto para experimentar?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-cta-description">
            Junte-se a milhares de clientes satisfeitos e descubra por que somos a cupcakeria favorita do Brasil.
          </p>
          <a href="/api/login" data-testid="button-cta-login">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Criar Conta Grátis
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
