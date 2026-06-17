// src/lib/vectorStore.ts
import { createEmbedding, cosineSimilarity, batchCreateEmbeddings } from './embeddings';
import knowledgeBase from '../data/knowledge-base.json';

interface VectorizedFAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  embedding: number[];
  similarity?: number;
}

class VectorStore {
  private vectorizedFAQs: VectorizedFAQ[] = [];
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    console.log('🚀 Initialisation du store vectoriel avec Gemini...');
    
    try {
      // Préparer les textes pour les embeddings
      const textsForEmbedding = knowledgeBase.faqs.map(faq => 
        `${faq.question} ${faq.answer} ${faq.keywords.join(' ')} ${faq.category}`
      );
      
      // Créer tous les embeddings en batch pour plus d'efficacité
      const embeddings = await batchCreateEmbeddings(textsForEmbedding);
      
      // Construire le store vectoriel
      this.vectorizedFAQs = knowledgeBase.faqs.map((faq, index) => ({
        ...faq,
        embedding: embeddings[index]
      }));
      
      this.isInitialized = true;
      console.log('✅ Store vectoriel initialisé avec', this.vectorizedFAQs.length, 'documents');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du store vectoriel:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  async search(query: string, topK: number = 3, threshold: number = 0.5): Promise<VectorizedFAQ[]> {
    await this.initialize();

    try {
      const queryEmbedding = await createEmbedding(query);
      
      const results = this.vectorizedFAQs
        .map(faq => ({
          ...faq,
          similarity: cosineSimilarity(queryEmbedding, faq.embedding)
        }))
        .filter(faq => faq.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      console.log(`🔍 Recherche pour "${query}" - ${results.length} résultats trouvés`);
      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return [];
    }
  }

  async searchByCategory(category: string, topK: number = 5): Promise<VectorizedFAQ[]> {
    await this.initialize();
    
    return this.vectorizedFAQs
      .filter(faq => faq.category === category)
      .slice(0, topK);
  }

  async getAllCategories(): Promise<string[]> {
    await this.initialize();
    
    const categories = [...new Set(this.vectorizedFAQs.map(faq => faq.category))];
    return categories;
  }
}

export const vectorStore = new VectorStore();