// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { vectorStore } from '@/lib/vectorStore';

// Semantic search over the knowledge base.
// POST { query: string, topK?: number, threshold?: number }
export async function POST(request: NextRequest) {
  try {
    const { query, topK = 3, threshold = 0.4 } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query requise' }, { status: 400 });
    }

    const results = await vectorStore.search(query, topK, threshold);

    return NextResponse.json({
      query,
      count: results.length,
      results: results.map((r) => ({
        id: r.id,
        question: r.question,
        answer: r.answer,
        category: r.category,
        similarity: r.similarity ?? 0,
      })),
    });
  } catch (error) {
    console.error('❌ Erreur API Search:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function GET() {
  const categories = await vectorStore.getAllCategories();
  return NextResponse.json({ message: 'API Search active — utilisez POST { query }', categories });
}
