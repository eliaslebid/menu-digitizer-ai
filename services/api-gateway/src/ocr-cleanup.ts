import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY || "mock-key",
});

export async function cleanOCRText(rawText: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "mock-key") {
    console.warn('No OpenAI API key - skipping OCR cleanup');
    return rawText;
  }

  try {
    const prompt = PromptTemplate.fromTemplate(`
You are an OCR correction expert. Fix OCR errors in this menu text while preserving the exact structure.

Common OCR errors to fix:
- "3" → "з" (Ukrainian preposition)
- Mixed Latin/Cyrillic (e.g., "Kapnauo" → "Карпачо")
- Misspelled Ukrainian words
- Wrong characters that break words

Rules:
1. Keep all prices exactly as-is
2. Keep line breaks
3. Only fix obvious OCR errors
4. Don't add or remove lines
5. Return ONLY the corrected text, no explanations

Raw OCR text:
{rawText}

Corrected text:`);

    const chain = RunnableSequence.from([
      prompt,
      llm,
      new StringOutputParser()
    ]);

    const corrected = await chain.invoke({ rawText });
    return corrected.trim();
  } catch (error) {
    console.error('OCR cleanup failed:', error);
    return rawText; // Fallback to raw text
  }
}
