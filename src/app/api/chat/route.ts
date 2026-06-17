// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ragQuery, ragQueryWithReasoning } from '@/lib/ragPipeline';

export async function POST(request: NextRequest) {
  try {
    const { message, useReasoning = false } = await request.json();
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message requis' },
        { status: 400 }
      );
    }

    // Vérification de la longueur du message
    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message trop long (max 500 caractères)' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    
    const result = useReasoning 
      ? await ragQueryWithReasoning(message)
      : await ragQuery(message);
    
    const responseTime = Date.now() - startTime;
    
    // Log pour monitoring
    console.log(`📊 RAG Query - Time: ${responseTime}ms, Sources: ${result.sources.length}, Confidence: ${result.confidence}`);

    return NextResponse.json({
      response: result.answer,
      sources: result.sources,
      confidence: result.confidence,
      responseTime
    });

  } catch (error) {
    console.error('❌ Erreur API Chat:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        response: 'Une erreur s\'est produite. Veuillez contacter le support à support@monapp.com.'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'API Chat active - utilisez POST pour envoyer des messages' },
    { status: 200 }
  );
}