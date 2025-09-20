export default function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-serif font-bold text-foreground mb-6" data-testid="text-about-title">
          Sobre Nós
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-about-subtitle">
          Conheça a história por trás da Doce Delícia e descubra como nasceu nossa paixão pelos cupcakes mais deliciosos do Brasil.
        </p>
      </div>

      {/* Story Sections */}
      <div className="space-y-16">
        {/* Our Beginning */}
        <section className="bg-card rounded-2xl p-8 shadow-lg" data-testid="section-beginning">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="lg:w-1/2">
              <div className="text-6xl mb-4">🧁</div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
                O Início de Tudo
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A Doce Delícia nasceu em 2014 no coração de São Paulo, mais precisamente na Vila Madalena. 
                Tudo começou com Maria Santos, uma confeiteira apaixonada que decidiu transformar sua cozinha 
                em um pequeno ateliê de cupcakes artesanais.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Com apenas R$ 2.000 de investimento inicial e muita determinação, Maria começou fazendo 
                encomendas para amigos e vizinhos, sempre priorizando ingredientes frescos e receitas 
                desenvolvidas com muito carinho.
              </p>
            </div>
            <div className="lg:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1486427944299-d1955d23e34d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Cupcakes artesanais coloridos onde tudo começou"
                className="w-full h-80 object-cover rounded-2xl"
                data-testid="img-beginning"
              />
            </div>
          </div>
        </section>

        {/* Growth */}
        <section className="bg-accent/20 rounded-2xl p-8" data-testid="section-growth">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
                Crescimento e Expansão
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Em 2016, a demanda cresceu tanto que Maria precisou alugar o primeiro ponto comercial na 
                própria Vila Madalena. Com uma equipe pequena mas dedicada, a Doce Delícia começou a 
                atender pedidos corporativos e eventos especiais.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O grande salto veio em 2019 com o lançamento da nossa plataforma online, permitindo que 
                clientes de toda São Paulo pudessem saborear nossos cupcakes. Foi quando desenvolvemos 
                nosso sistema de entrega rápida e embalagens especiais que mantêm o frescor.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Hoje, atendemos mais de 10.000 clientes satisfeitos e temos planos de expandir para 
                outras capitais brasileiras, sempre mantendo nossa essência artesanal.
              </p>
            </div>
            <div className="lg:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1519869325930-281384150729?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Variedade de cupcakes gourmet da Doce Delícia"
                className="w-full h-80 object-cover rounded-2xl"
                data-testid="img-growth"
              />
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="text-center" data-testid="section-values">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-8">
            Nossos Valores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-2xl shadow-lg" data-testid="value-quality">
              <div className="text-5xl mb-4">🥇</div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">Qualidade Premium</h3>
              <p className="text-muted-foreground">
                Selecionamos apenas os melhores ingredientes para criar sabores únicos e inesquecíveis.
              </p>
            </div>
            <div className="bg-card p-6 rounded-2xl shadow-lg" data-testid="value-artisanal">
              <div className="text-5xl mb-4">👩‍🍳</div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">Produção Artesanal</h3>
              <p className="text-muted-foreground">
                Cada cupcake é feito à mão com técnicas tradicionais e muito amor pela confeitaria.
              </p>
            </div>
            <div className="bg-card p-6 rounded-2xl shadow-lg" data-testid="value-innovation">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">Inovação Constante</h3>
              <p className="text-muted-foreground">
                Desenvolvemos novos sabores sazonais e aperfeiçoamos nossos processos continuamente.
              </p>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8" data-testid="section-timeline">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-8 text-center">
            Nossa Jornada
          </h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4" data-testid="timeline-2014">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold">
                2014
              </div>
              <div>
                <h3 className="font-bold text-foreground">Fundação</h3>
                <p className="text-muted-foreground">Maria Santos inicia a Doce Delícia na sua cozinha em Vila Madalena</p>
              </div>
            </div>
            <div className="flex items-start space-x-4" data-testid="timeline-2016">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold">
                2016
              </div>
              <div>
                <h3 className="font-bold text-foreground">Primeira Loja</h3>
                <p className="text-muted-foreground">Abertura do primeiro ponto comercial e contratação da equipe</p>
              </div>
            </div>
            <div className="flex items-start space-x-4" data-testid="timeline-2019">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold">
                2019
              </div>
              <div>
                <h3 className="font-bold text-foreground">Plataforma Online</h3>
                <p className="text-muted-foreground">Lançamento do e-commerce e sistema de delivery</p>
              </div>
            </div>
            <div className="flex items-start space-x-4" data-testid="timeline-2024">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold">
                2024
              </div>
              <div>
                <h3 className="font-bold text-foreground">Consolidação</h3>
                <p className="text-muted-foreground">Mais de 10.000 clientes atendidos e planos de expansão nacional</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}