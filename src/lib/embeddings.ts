// src/lib/embeddings.ts
import { gemini, GEMINI_MODELS } from './gemini';

export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await gemini.embeddings.create({
      model: GEMINI_MODELS.EMBEDDING,
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Erreur lors de la création de l\'embedding:', error);
    throw error;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Les vecteurs doivent avoir la même dimension');
  }
  
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function batchCreateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await gemini.embeddings.create({
      model: GEMINI_MODELS.EMBEDDING,
      input: texts,
    });
    
    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Erreur lors de la création des embeddings en batch:', error);
    throw error;
  }
}