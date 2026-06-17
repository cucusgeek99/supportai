// src/app/page.tsx
import ChatBot from '@/components/ChatBot';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Support Client Intelligent
          </h1>
          <p className="text-gray-600 text-lg">
            Assistant IA propulsé par Gemini avec technologie RAG
          </p>
        </div>
        
        <ChatBot />
        
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Pour une assistance personnalisée, contactez-nous à support@monapp.com</p>
        </div>
      </div>
    </div>
  );
}