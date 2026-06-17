// src/lib/gemini.ts
import OpenAI from 'openai';

const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export { gemini };

export const GEMINI_MODELS = {
  CHAT: "gemini-2.0-flash",
  EMBEDDING: "text-embedding-004",
  REASONING: "gemini-2.5-flash-preview-04-17"
} as const;