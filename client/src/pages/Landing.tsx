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
                Crie Sua Conta e Descubra os Melhores <span className="text-primary">Cupcakes</span> do Brasil
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed" data-testid="text-hero-description">
                Cadastre-se gratuitamente e tenha acesso a sabores únicos, ofertas exclusivas e entrega rápida direto na sua casa.
              </p>
              
              {/* Benefits List */}
              <div className="mb-8 space-y-3">
                <div className="flex items-center space-x-3 text-lg" data-testid="benefit-catalog">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">✓</div>
                  <span className="text-foreground">Catálogo completo com mais de 50 sabores</span>
                </div>
                <div className="flex items-center space-x-3 text-lg" data-testid="benefit-offers">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">✓</div>
                  <span className="text-foreground">Ofertas exclusivas para membros</span>
                </div>
                <div className="flex items-center space-x-3 text-lg" data-testid="benefit-history">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">✓</div>
                  <span className="text-foreground">Histórico de pedidos e favoritos</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-3">
                  <a href="/api/login" data-testid="button-hero-register">
                    🎉 Criar Conta
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                  <a href="/api/login" data-testid="button-hero-login">
                    Já tenho conta
                  </a>
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
              O que você ganha ao se cadastrar?
            </h2>
            <p className="text-xl text-muted-foreground" data-testid="text-features-description">
              Benefícios exclusivos para nossos membros cadastrados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-accent/30 rounded-2xl" data-testid="feature-exclusive">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">Ofertas Exclusivas</h3>
              <p className="text-muted-foreground">Descontos especiais, promoções antecipadas e brindes surpresa apenas para membros.</p>
            </div>

            <div className="text-center p-6 bg-accent/30 rounded-2xl" data-testid="feature-personalized">
              <div className="text-6xl mb-4">💝</div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">Experiência Personalizada</h3>
              <p className="text-muted-foreground">Recomendações baseadas nos seus gostos, histórico de compras e lista de favoritos.</p>
            </div>

            <div className="text-center p-6 bg-accent/30 rounded-2xl" data-testid="feature-priority">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">Atendimento Prioritário</h3>
              <p className="text-muted-foreground">Suporte dedicado, pedidos prioritários e acompanhamento em tempo real das entregas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-6" data-testid="text-cta-title">
            Comece Agora - É Grátis!
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-cta-description">
            Mais de 10.000 clientes já se cadastraram. Junte-se a eles e tenha acesso a todo nosso catálogo de sabores únicos.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-3">
              <a href="/api/login" data-testid="button-cta-register">
                ✨ Criar Conta
              </a>
            </Button>
            <p className="text-sm text-muted-foreground">💯 Sem taxas • 🔒 100% seguro • 🚀 Acesso imediato</p>
          </div>
        </div>
      </section>
    </div>
  );
}
