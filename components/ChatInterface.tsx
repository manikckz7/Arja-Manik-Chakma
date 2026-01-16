
import React, { useState, useRef, useEffect } from 'react';
import { AIMode, Message } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  mode: AIMode;
  messages: Message[];
  onSendMessage: (msg: Message) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode, messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      type: mode === AIMode.CHAT ? 'text' : mode === AIMode.IMAGE ? 'image' : 'search'
    };

    onSendMessage(userMsg);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      if (mode === AIMode.IMAGE) {
        // Image generation logic
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: input }] },
          config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
        });

        let imageUrl = '';
        let textResponse = '';
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          } else if (part.text) {
            textResponse += part.text;
          }
        }

        onSendMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: textResponse || 'Here is your generated masterpiece:',
          timestamp: Date.now(),
          type: 'image',
          imageUrl: imageUrl
        });

      } else if (mode === AIMode.SEARCH) {
        // Search Grounding logic
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: input,
          config: { tools: [{ googleSearch: {} }] }
        });

        const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
          ?.filter(c => c.web)
          ?.map(c => ({ title: c.web?.title || 'Source', uri: c.web?.uri || '' })) || [];

        onSendMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.text || "I couldn't find specific information on that.",
          timestamp: Date.now(),
          type: 'search',
          groundingLinks: links
        });

      } else {
        // Standard reasoning chat
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: input,
          config: { 
            thinkingConfig: { thinkingBudget: 4096 } 
          }
        });

        onSendMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.text || '',
          timestamp: Date.now(),
          type: 'text'
        });
      }
    } catch (error) {
      console.error("AI Error:", error);
      onSendMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered a digital singularity error. Please verify your connection or try a different request.",
        timestamp: Date.now(),
        type: 'text'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-medium text-white">How can I assist your brilliance today?</h3>
              <p className="text-gray-400 mt-2">Gemini 3 Pro is ready for complex reasoning, creative synthesis, and world-knowledge synthesis.</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${
              msg.role === 'user' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
              : 'bg-gray-900 border border-white/5 text-gray-200'
            }`}>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              
              {msg.imageUrl && (
                <div className="mt-4 rounded-xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={msg.imageUrl} alt="AI Generated" className="w-full h-auto object-cover" />
                  <button 
                    onClick={() => window.open(msg.imageUrl, '_blank')}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-xs text-center transition-colors"
                  >
                    Download Original
                  </button>
                </div>
              )}

              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">Sources & Verification</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingLinks.map((link, i) => (
                      <a 
                        key={i} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {link.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-gray-900 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="text-sm text-gray-500 font-medium">Synthesizing response...</span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-6 bg-gray-950 border-t border-white/5">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === AIMode.IMAGE ? "Describe an image to generate (e.g., 'A cyberpunk city at night with neon rains')..." :
              mode === AIMode.SEARCH ? "Ask a real-time question (e.g., 'What is the current stock price of NVIDIA?')..." :
              "Command Astra AI..."
            }
            className="w-full bg-gray-900 border border-white/10 rounded-2xl py-4 pl-6 pr-24 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all placeholder-gray-600 shadow-2xl"
          />
          <div className="absolute right-2 top-2 bottom-2 flex gap-2">
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-800 text-white rounded-xl font-semibold transition-all shadow-lg active:scale-95"
            >
              {isLoading ? (
                 <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
          </div>
        </form>
        <p className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-widest font-bold">
          Astra AI uses the latest Gemini 3 Pro reasoning engine.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
