// src/lib/ragPipeline.ts
import { gemini, GEMINI_MODELS } from './gemini';
import { vectorStore } from './vectorStore';

export interface RAGResponse {
  answer: string;
  sources: Array<{
    id: string;
    question: string;
    similarity: number;
  }>;
  confidence: 'high' | 'medium' | 'low';
}

export async function ragQuery(userQuestion: string): Promise<RAGResponse> {
  try {
    // 1. Recherche de documents pertinents
    const relevantDocs = await vectorStore.search(userQuestion, 3, 0.4);
    
    if (relevantDocs.length === 0) {
      return {
        answer: "Je n'ai pas trouvé d'information pertinente pour répondre à votre question. Vous pouvez contacter notre support à support@monapp.com pour une assistance personnalisée.",
        sources: [],
        confidence: 'low'
      };
    }

    // 2. Déterminer le niveau de confiance
    const avgSimilarity = relevantDocs.reduce((sum, doc) => sum + (doc.similarity || 0), 0) / relevantDocs.length;
    const confidence: 'high' | 'medium' | 'low' = 
      avgSimilarity > 0.8 ? 'high' : 
      avgSimilarity > 0.6 ? 'medium' : 'low';

    // 3. Construction du contexte
    const context = relevantDocs
      .map((doc, index) => 
        `[${index + 1}] Question: ${doc.question}\n   Réponse: ${doc.answer}\n   Catégorie: ${doc.category}`
      )
      .join('\n\n');

    // 4. Prompt optimisé pour Gemini
    const systemPrompt = `Tu es un assistant de support client intelligent et professionnel.

RÈGLES IMPORTANTES:
- Utilise UNIQUEMENT les informations fournies dans le contexte ci-dessous
- Si l'information n'est pas disponible, dis-le clairement et propose de contacter le support
- Réponds en français de manière claire, concise et utile
- Référence le numéro [X] de la source utilisée dans ta réponse
- Reste professionnel et empathique

CONTEXTE DISPONIBLE:
${context}

INSTRUCTIONS:
- Si plusieurs sources sont pertinentes, combine les informations intelligemment
- Si aucune source ne correspond exactement, explique ce que tu peux proposer à la place
- Termine toujours par une offre d'aide supplémentaire si nécessaire`;

    const userPrompt = `Question de l'utilisateur: ${userQuestion}`;

    // 5. Génération de la réponse avec Gemini
    const response = await gemini.chat.completions.create({
      model: GEMINI_MODELS.CHAT,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const answer = response.choices[0].message.content || 
      "Désolé, je n'ai pas pu générer une réponse appropriée.";

    // 6. Préparer les sources
    const sources = relevantDocs.map(doc => ({
      id: doc.id,
      question: doc.question,
      similarity: doc.similarity || 0
    }));

    return {
      answer,
      sources,
      confidence
    };
    
  } catch (error) {
    console.error('Erreur dans le pipeline RAG:', error);
    return {
      answer: "Une erreur technique s'est produite. Veuillez contacter notre support à support@monapp.com ou réessayer dans quelques instants.",
      sources: [],
      confidence: 'low'
    };
  }
}

export async function ragQueryWithReasoning(userQuestion: string): Promise<RAGResponse> {
  try {
    const relevantDocs = await vectorStore.search(userQuestion, 3, 0.4);
    
    if (relevantDocs.length === 0) {
      return {
        answer: "Je n'ai pas trouvé d'information pertinente dans ma base de connaissances.",
        sources: [],
        confidence: 'low'
      };
    }

    const context = relevantDocs
      .map((doc, index) => `[${index + 1}] ${doc.question} - ${doc.answer}`)
      .join('\n');

    // Utilisation du modèle de raisonnement pour des questions complexes
    const response = await gemini.chat.completions.create({
      model: GEMINI_MODELS.REASONING,
      reasoning_effort: "medium",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en support client. Analyse la question et le contexte disponible pour fournir la meilleure réponse possible.\n\nContexte:\n${context}`
        },
        { role: "user", content: userQuestion }
      ],
      temperature: 0.1,
    });

    return {
      answer: response.choices[0].message.content || "Erreur de génération",
      sources: relevantDocs.map(doc => ({
        id: doc.id,
        question: doc.question,
        similarity: doc.similarity || 0
      })),
      confidence: 'high'
    };
  } catch (error) {
    console.error('Erreur RAG avec raisonnement:', error);
    throw error;
  }
}