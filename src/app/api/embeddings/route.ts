// src/app/api/embeddings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createEmbedding } from '@/lib/embeddings';

// Generate an embedding vector for an arbitrary text.
// POST { text: string }
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Texte requis' }, { status: 400 });
    }

    const embedding = await createEmbedding(text);

    return NextResponse.json({
      text,
      dimensions: embedding.length,
      embedding,
    });
  } catch (error) {
    console.error('❌ Erreur API Embeddings:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération de l\'embedding' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'API Embeddings active — utilisez POST { text }' });
}
