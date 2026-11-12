import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  User,
  ShoppingBag,
  RotateCcw
} from 'lucide-react';
import * as api from '../api';

interface AIAssistantViewProps {
  onRefreshData: () => void;
  currency: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  onRefreshData,
  currency = 'USD'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am ShopPilot AI Assistant. I can analyze your sales revenue, audit low stock, surface top customers, and answer operational business questions grounded strictly in your live database.',
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (queryToSend = input) => {
    if (!queryToSend.trim() || loading) return;
    const userMsg: ChatMessage = {
      role: 'user',
      content: queryToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askAIAssistant(queryToSend);
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: res.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
      onRefreshData();
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue querying the database.',
          time: 'Error'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'How much did I sell today?',
    'Which products are running low?',
    'Show my top customers',
    'Which orders have pending payments?',
    'What is our total gross revenue?'
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">ShopPilot AI Assistant</h3>
            <p className="text-[11px] text-slate-400">
              Grounded Natural Language SQL Engine • Groq Cloud & Ollama Hybrid
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            setMessages([
              {
                role: 'assistant',
                content: 'Chat session reset. What can I help you analyze in the store today?',
                time: 'Just now'
              }
            ])
          }
          className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-[300px]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                  : 'bg-[#0f172a] border border-slate-800 text-slate-200 rounded-bl-none whitespace-pre-line'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75 font-mono">
                <span>{m.role === 'user' ? 'Store Owner' : 'ShopPilot AI'}</span>
                <span>{m.time}</span>
              </div>
              <div className="font-sans">{m.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl rounded-bl-none p-3.5 text-xs text-slate-400 flex items-center gap-2">
              <Bot className="w-4 h-4 animate-spin text-purple-400" />
              <span>Querying database telemetry via LLM tools...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input & Prompt Pills */}
      <div className="space-y-2 shrink-0">
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full border border-slate-700 transition"
            >
              "{p}"
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about sales, low inventory, customer balances..."
            className="flex-1 bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl text-xs font-semibold flex items-center justify-center transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
