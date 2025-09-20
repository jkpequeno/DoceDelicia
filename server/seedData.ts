import { storage } from "./storage";
import type { InsertCategory, InsertProduct } from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Check if categories already exist
    const existingCategories = await storage.getCategories();
    if (existingCategories.length > 0) {
      console.log("📋 Categories already exist, skipping seed...");
      return;
    }

    // Create categories
    const categories = [
      {
        name: "Clássicos",
        description: "Sabores tradicionais que conquistaram corações"
      },
      {
        name: "Chocolate",
        description: "Para os amantes do chocolate mais intenso"
      },
      {
        name: "Frutas",
        description: "Sabores refrescantes com frutas brasileiras"
      },
      {
        name: "Especiais",
        description: "Criações únicas da casa"
      },
      {
        name: "Temporada",
        description: "Sabores sazonais por tempo limitado"
      }
    ];

    const createdCategories = [];
    for (const category of categories) {
      const created = await storage.createCategory(category as InsertCategory);
      createdCategories.push(created);
      console.log(`✅ Created category: ${created.name}`);
    }

    // Find category IDs
    const classicosId = createdCategories.find(c => c.name === "Clássicos")?.id;
    const chocolateId = createdCategories.find(c => c.name === "Chocolate")?.id;
    const frutasId = createdCategories.find(c => c.name === "Frutas")?.id;
    const especialId = createdCategories.find(c => c.name === "Especiais")?.id;
    const temporadaId = createdCategories.find(c => c.name === "Temporada")?.id;

    // Create products
    const products = [
      // Clássicos
      {
        name: "Red Velvet Brasileiro",
        description: "Massa vermelha aveludada com cream cheese artesanal e um toque especial de cacau nacional. Uma receita que combina tradição americana com ingredientes brasileiros.",
        price: "8.90",
        imageUrl: "https://images.unsplash.com/photo-1587668178277-295251f900ce?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: classicosId,
        ingredients: ["Farinha de trigo especial", "Cacau brasileiro", "Cream cheese artesanal", "Ovos frescos", "Açúcar refinado", "Corante natural"],
        isAvailable: true,
        isFeatured: true
      },
      {
        name: "Baunilha Clássica",
        description: "O tradicional cupcake de baunilha com cobertura cremosa. Simplicidade e perfeição em cada mordida.",
        price: "6.90",
        imageUrl: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: classicosId,
        ingredients: ["Farinha de trigo", "Essência de baunilha", "Ovos", "Açúcar", "Manteiga", "Leite"],
        isAvailable: true,
        isFeatured: false
      },

      // Chocolate
      {
        name: "Brigadeiro Gourmet",
        description: "Cupcake de chocolate com cobertura de brigadeiro tradicional e granulado belga. O sabor da infância brasileiro em formato sofisticado.",
        price: "9.50",
        imageUrl: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: chocolateId,
        ingredients: ["Massa de chocolate", "Leite condensado", "Cacau em pó", "Manteiga", "Granulado belga"],
        isAvailable: true,
        isFeatured: true
      },
      {
        name: "Nutella Dream",
        description: "Massa de chocolate recheada com Nutella e cobertura de cream cheese com avelãs tostadas. Uma explosão de sabor irresistível.",
        price: "11.90",
        imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: chocolateId,
        ingredients: ["Chocolate belga", "Nutella", "Avelãs tostadas", "Cream cheese", "Cacau em pó"],
        isAvailable: true,
        isFeatured: false
      },
      {
        name: "Chocolate Duplo",
        description: "Para os verdadeiros amantes do chocolate. Massa de chocolate com chips de chocolate e cobertura de ganache.",
        price: "10.50",
        imageUrl: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: chocolateId,
        ingredients: ["Chocolate 70% cacau", "Chips de chocolate", "Ganache", "Manteiga", "Açúcar mascavo"],
        isAvailable: true,
        isFeatured: false
      },

      // Frutas
      {
        name: "Limão Siciliano",
        description: "Massa leve com raspas de limão siciliano e cobertura de cream cheese cítrica. Refrescante e equilibrado, perfeito para os dias quentes.",
        price: "7.90",
        imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: frutasId,
        ingredients: ["Limão siciliano", "Farinha de trigo", "Cream cheese", "Açúcar", "Raspas de limão"],
        isAvailable: true,
        isFeatured: true
      },
      {
        name: "Morango Premium",
        description: "Cupcake com pedaços de morango fresco e cobertura rosada com morangos desidratados. Feito com morangos selecionados.",
        price: "10.50",
        imageUrl: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: frutasId,
        ingredients: ["Morangos frescos", "Morangos desidratados", "Farinha de trigo", "Açúcar", "Corante natural"],
        isAvailable: true,
        isFeatured: false
      },
      {
        name: "Coco Tropical",
        description: "Sabor do Brasil com massa de coco fresco e cobertura de beijinho. Decorado com coco ralado tostado.",
        price: "8.50",
        imageUrl: "https://images.unsplash.com/photo-1607478900766-efe13248b125?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: frutasId,
        ingredients: ["Coco fresco", "Leite de coco", "Coco ralado", "Leite condensado", "Açúcar cristal"],
        isAvailable: true,
        isFeatured: false
      },
      {
        name: "Maracujá Brasileiro",
        description: "Massa suave com polpa de maracujá natural e cobertura azedinha. O sabor tropical que representa o Brasil.",
        price: "9.90",
        imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: frutasId,
        ingredients: ["Polpa de maracujá", "Açúcar", "Farinha de trigo", "Ovos", "Cream cheese"],
        isAvailable: true,
        isFeatured: false
      },

      // Especiais
      {
        name: "Doce de Leite Artesanal",
        description: "Cupcake com doce de leite caseiro no recheio e na cobertura. Uma especialidade da casa que derrete na boca.",
        price: "12.50",
        imageUrl: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: especialId,
        ingredients: ["Doce de leite artesanal", "Leite condensado", "Açúcar queimado", "Farinha especial", "Flor de sal"],
        isAvailable: true,
        isFeatured: true
      },
      {
        name: "Churros Cupcake",
        description: "Inovação da casa: massa com canela e açúcar, recheio de doce de leite e cobertura que imita a textura do churros.",
        price: "13.90",
        imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: especialId,
        ingredients: ["Canela do Ceilão", "Açúcar cristal", "Doce de leite", "Farinha de trigo", "Essence de baunilha"],
        isAvailable: true,
        isFeatured: false
      },
      {
        name: "Café Brasileiro",
        description: "Massa com café expresso brasileiro e cobertura de buttercream com grãos de café. Para os amantes do café.",
        price: "10.90",
        imageUrl: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: especialId,
        ingredients: ["Café expresso", "Grãos de café", "Buttercream", "Açúcar mascavo", "Essência de café"],
        isAvailable: true,
        isFeatured: false
      },

      // Temporada
      {
        name: "Panetone Natalino",
        description: "Edição especial de Natal com massa de panetone, frutas cristalizadas e cobertura nevada. Disponível apenas em dezembro.",
        price: "15.90",
        imageUrl: "https://images.unsplash.com/photo-1607478900766-efe13248b125?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: temporadaId,
        ingredients: ["Frutas cristalizadas", "Farinha especial", "Fermento natural", "Açúcar", "Cobertura nevada"],
        isAvailable: false,
        isFeatured: false
      },
      {
        name: "Açaí Gourmet",
        description: "Cupcake com açaí natural, granola crocante e cobertura de cream cheese roxo. Sabor do verão brasileiro.",
        price: "11.50",
        imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: temporadaId,
        ingredients: ["Açaí natural", "Granola artesanal", "Cream cheese", "Corante natural", "Mel"],
        isAvailable: true,
        isFeatured: false
      }
    ];

    // Create products
    for (const product of products) {
      try {
        const created = await storage.createProduct(product as InsertProduct);
        console.log(`✅ Created product: ${created.name} - R$ ${created.price}`);
      } catch (error) {
        console.error(`❌ Error creating product ${product.name}:`, error);
      }
    }

    console.log("🎉 Database seeded successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}
