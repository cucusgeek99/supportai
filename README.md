# SupportAI — RAG Customer-Support Chatbot

An intelligent customer-support chatbot built with **Retrieval-Augmented Generation (RAG)**. It answers questions in French, grounded strictly in a knowledge base — so it never invents answers — and cites the sources it used, with a confidence score derived from retrieval similarity.

Built with **Next.js 15 (App Router)** and **Google Gemini** (accessed through the OpenAI-compatible SDK).

> ℹ️ Demo project. The knowledge base (`src/data/knowledge-base.json`) ships with 15 sample SaaS FAQs; swap in your own to adapt it to any product.

## How it works

```
user question
   │
   ▼
embed query (text-embedding-004)
   │
   ▼
cosine-similarity search over the knowledge base   ← in-memory vector store
   │
   ▼
top-K relevant FAQs (above similarity threshold)
   │
   ▼
grounded prompt + context → Gemini (gemini-2.0-flash)
   │
   ▼
answer + sources + confidence
```

The system prompt instructs the model to answer **only** from the retrieved context and to point users to human support when the knowledge base has no match — the core anti-hallucination guarantee of RAG.

## Features

- **Semantic retrieval** — cosine similarity over Gemini embeddings, not keyword matching.
- **Grounded generation** — answers constrained to retrieved context, with `[n]` source citations.
- **Confidence scoring** — `high` / `medium` / `low` from average retrieval similarity.
- **Optional reasoning mode** — routes hard questions to a reasoning model (`ragQueryWithReasoning`).
- **Batch embeddings + lazy single-init** vector store for fast cold starts.

## API

| Endpoint | Method | Body | Description |
|---|---|---|---|
| `/api/chat` | POST | `{ message, useReasoning? }` | Full RAG answer with sources + confidence |
| `/api/search` | POST | `{ query, topK?, threshold? }` | Raw semantic search over the knowledge base |
| `/api/embeddings` | POST | `{ text }` | Embedding vector for any text |

## Getting started

```bash
npm install

# add your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

npm run dev   # http://localhost:3000
```

Get a key from [Google AI Studio](https://aistudio.google.com/apikey).

## Tech stack

- **Framework:** Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **AI:** Google Gemini — `gemini-2.0-flash` (chat), `text-embedding-004` (embeddings)
- **Retrieval:** in-memory vector store with cosine similarity

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/         # RAG pipeline endpoint
│   │   ├── search/       # semantic search endpoint
│   │   └── embeddings/   # embedding generation endpoint
│   ├── page.tsx          # chat UI
│   └── layout.tsx
├── components/           # ChatBot, MessageBubble, SearchResults
├── lib/
│   ├── gemini.ts         # Gemini client + model config
│   ├── embeddings.ts     # embedding + cosine similarity
│   ├── vectorStore.ts    # in-memory vector store
│   └── ragPipeline.ts    # retrieve → ground → generate
└── data/
    └── knowledge-base.json
```
