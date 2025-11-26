import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";

// Sample knowledge base for vegetarian/non-vegetarian ingredients
const INGREDIENTS = [
  { text: "Parmesan cheese often contains animal rennet and is not vegetarian.", metadata: { type: "ingredient", is_veg: false, name: "Parmesan" } },
  { text: "Gelatin is derived from animal collagen and is not vegetarian.", metadata: { type: "ingredient", is_veg: false, name: "Gelatin" } },
  { text: "Tofu is made from soybeans and is vegetarian.", metadata: { type: "ingredient", is_veg: true, name: "Tofu" } },
  { text: "Chicken stock is made from chicken bones and meat, not vegetarian.", metadata: { type: "ingredient", is_veg: false, name: "Chicken Stock" } },
  { text: "Fish sauce is made from fermented fish, not vegetarian.", metadata: { type: "ingredient", is_veg: false, name: "Fish Sauce" } },
  { text: "Worcestershire sauce often contains anchovies (fish).", metadata: { type: "ingredient", is_veg: false, name: "Worcestershire Sauce" } },
  { text: "Lard is pig fat, not vegetarian.", metadata: { type: "ingredient", is_veg: false, name: "Lard" } },
  { text: "Agar agar is a plant-based gelatin substitute, vegetarian.", metadata: { type: "ingredient", is_veg: true, name: "Agar Agar" } },
  { text: "Seitan is wheat gluten, vegetarian meat substitute.", metadata: { type: "ingredient", is_veg: true, name: "Seitan" } },
  { text: "Tempeh is fermented soy, vegetarian.", metadata: { type: "ingredient", is_veg: true, name: "Tempeh" } },
];

export async function seedVectorStore() {
  console.log("Seeding vector store...");
  
  // Note: Using OpenAI Embeddings for simplicity in this skeleton.
  // In a real local setup, we would use a local model or Ollama.
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY || "mock-key", // Fallback for build
  });

  const docs = INGREDIENTS.map(i => new Document({
    pageContent: i.text,
    metadata: i.metadata
  }));

  try {
    await Chroma.fromDocuments(docs, embeddings, {
      collectionName: "ingredients",
      url: "http://localhost:8000", // ChromaDB URL
    });
    console.log("Vector store seeded successfully.");
  } catch (error) {
    console.error("Failed to seed vector store (is ChromaDB running?):", error);
  }
}

// Allow running directly
if (require.main === module) {
  seedVectorStore();
}
