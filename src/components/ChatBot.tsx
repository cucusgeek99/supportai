// src/components/ChatBot.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sources?: Array<{
    id: string;
    question: string;
    similarity: number;
  }>;
  confidence?: 'high' | 'medium' | 'low';
}

interface ChatBotProps {
  className?: string;
}

export default function ChatBot({ className = '' }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Bonjour ! Je suis votre assistant de support. Comment puis-je vous aider aujourd\'hui ?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputText.trim(),
          useReasoning: inputText.length > 100 // Utiliser le raisonnement pour les questions complexes
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || data.error || 'Réponse vide reçue',
        isUser: false,
        timestamp: new Date(),
        sources: data.sources || [],
        confidence: data.confidence || 'low'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Une erreur de connexion s\'est produite. Veuillez vérifier votre connexion internet et réessayer.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const provideFeedback = (messageId: string, isPositive: boolean) => {
    console.log(`Feedback pour ${messageId}: ${isPositive ? 'Positif' : 'Négatif'}`);
    // Ici vous pourriez envoyer le feedback à votre système d'analytics
  };

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`flex flex-col h-[600px] w-full max-w-2xl mx-auto border rounded-xl bg-white shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-xl">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6" />
          <div>
            <h3 className="font-semibold"> APEX CARGO Assistant Support IA</h3>
            {/* <p className="text-sm text-blue-100">Propulsé par Gemini</p> */}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.isUser ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-start space-x-2 ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.isUser ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                  {message.isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-gray-600" />}
                </div>
                
                <div className={`px-4 py-3 rounded-lg ${
                  message.isUser 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 rounded-bl-none border shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  
                  {!message.isUser && message.confidence && (
                    <div className={`text-xs mt-2 ${getConfidenceColor(message.confidence)}`}>
                      Confiance: {message.confidence}
                    </div>
                  )}
                  
                  {!message.isUser && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <details className="cursor-pointer">
                        <summary>Sources ({message.sources.length})</summary>
                        <ul className="mt-1 space-y-1">
                          {message.sources.map((source, index) => (
                            <li key={source.id} className="truncate">
                              {index + 1}. {source.question} ({Math.round(source.similarity * 100)}%)
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                  
                  {!message.isUser && (
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => provideFeedback(message.id, true)}
                        className="text-gray-400 hover:text-green-500 transition-colors"
                        title="Réponse utile"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => provideFeedback(message.id, false)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Réponse peu utile"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`text-xs text-gray-400 mt-1 ${message.isUser ? 'text-right' : 'text-left'}`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-white text-gray-800 px-4 py-3 rounded-lg rounded-bl-none border shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>L'assistant réfléchit...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-white rounded-b-xl">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre question..."
            className="flex-1 border text-black border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            maxLength={500}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputText.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          {inputText.length}/500 caractères
        </div>
      </div>
    </div>
  );
}