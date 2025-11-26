import { Chroma } from "@langchain/community/vectorstores/chroma";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Classification, MenuItem } from '@menu-ai/shared-types';

const llm = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY || "mock-key",
});

let vectorStore: Chroma | null = null;

async function getRetriever() {
  if (!vectorStore) {
    try {
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY || "mock-key",
      });
      vectorStore = await Chroma.fromExistingCollection(embeddings, {
        collectionName: "ingredients",
        url: "http://localhost:8000",
      });
    } catch (error) {
      console.warn('ChromaDB collection not found. RAG disabled. Run seed script first.');
      return null;
    }
  }
  return vectorStore.asRetriever(3);
}

// Multilingual keywords (English + Ukrainian)
const NON_VEG_KEYWORDS = {
  en: ["steak", "chicken", "beef", "pork", "bacon", "fish", "salmon", "tuna", "shrimp", "lamb", "meat", "crab", "eel"],
  uk: ["стейк", "курка", "куряч", "яловичина", "свинина", "бекон", "риба", "лосос", "тунець", "креветка", "креветк", "краб", "м'яс", "вугр", "телятин", "каперс", "боніто"]
};

const VEG_KEYWORDS = {
  en: ["tofu", "seitan", "tempeh", "vegetable", "vegan", "cheese", "tomato", "eggplant", "mushroom", "salad"],
  uk: ["тофу", "сейтан", "темпе", "овоч", "веган", "сир", "страчателла", "буррата", "томат", "баклажан", "грібк", "рукол", "авокадо", "салат"]
};

export async function classifyItem(item: MenuItem, requestId: string): Promise<Classification> {
  const lowerName = item.name.toLowerCase();
  const lowerDesc = (item.description || "").toLowerCase();
  const text = `${lowerName} ${lowerDesc}`;

  // Check non-vegetarian keywords (all languages)
  const allNonVegKeywords = [...NON_VEG_KEYWORDS.en, ...NON_VEG_KEYWORDS.uk];
  for (const kw of allNonVegKeywords) {
    if (text.includes(kw)) {
      return {
        is_vegetarian: false,
        confidence: 0.95,
        reasoning: `Contains non-vegetarian ingredient: '${kw}'`,
        flags: []
      };
    }
  }

  // Check vegetarian keywords (all languages)
  const allVegKeywords = [...VEG_KEYWORDS.en, ...VEG_KEYWORDS.uk];
  for (const kw of allVegKeywords) {
    if (text.includes(kw)) {
      return {
        is_vegetarian: true,
        confidence: 0.85,
        reasoning: `Contains vegetarian ingredient: '${kw}'`,
        flags: []
      };
    }
  }

  // Fallback to LLM if no keywords matched
  try {
    const retriever = await getRetriever();
    let context = "No ingredient database available.";
    
    if (retriever) {
      const docs = await retriever.getRelevantDocuments(text);
      context = docs.map((d: any) => d.pageContent).join("\n");
    }

    const prompt = PromptTemplate.fromTemplate(`
You are a multilingual food analyst. Determine if this menu item is vegetarian.

Item Name: {name}
Description: {description}

Knowledge Base: {context}

Rules:
- Vegetarian = NO meat, poultry, fish, seafood
- Dairy (сир, молоко) and eggs ARE vegetarian
- Common NON-VEG Ukrainian: креветка (shrimp), курка/куряч (chicken), лосось (salmon), тунець (tuna), краб (crab), м'ясом (meat), вугр (eel), телятин (veal), каперс (capers with anchovies), боніто (bonito fish)
- Common VEG Ukrainian: салат, овочі (vegetables), сир (cheese), томати (tomatoes), баклажан (eggplant), рукола (arugula), авокадо (avocado)

Return ONLY valid JSON with no markdown:
{{"is_vegetarian": true/false, "confidence": 0.0-1.0, "reasoning": "brief explanation", "flags": []}}
    `);

    const chain = RunnableSequence.from([
      prompt,
      llm,
      new StringOutputParser()
    ]);

    const result = await chain.invoke({
      name: item.name,
      description: item.description || "N/A",
      context: context
    });

    const cleanedResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedResult);
    
    return {
      is_vegetarian: parsed.is_vegetarian,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      flags: parsed.flags || []
    };

  } catch (error) {
    console.error(`[${requestId}] Agent classification failed:`, error);
    // Default to non-vegetarian when uncertain
    return {
      is_vegetarian: false,
      confidence: 0.0,
      reasoning: "Error during classification",
      flags: ["error"]
    };
  }
}
