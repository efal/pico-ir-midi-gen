import React, { useState } from 'react';
import { askGemini } from '../services/geminiService';
import { Bot, Send, Loader2 } from 'lucide-react';

interface Props {
  currentCode: string;
}

const Assistant: React.FC<Props> = ({ currentCode }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    const answer = await askGemini(query, currentCode);
    setResponse(answer);
    setLoading(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex items-center gap-2">
        <Bot className="text-purple-400" size={20} />
        <h3 className="font-semibold text-gray-200">AI Assistent</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {!response && !loading && (
          <p className="text-gray-500 text-sm italic">
            Frag mich etwas über den Code, MIDI-Werte oder wie du die Libraries installierst.
          </p>
        )}
        
        {loading && (
          <div className="flex items-center gap-2 text-blue-400">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-sm">Denke nach...</span>
          </div>
        )}

        {response && (
          <div className="bg-gray-700/50 p-3 rounded text-sm text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-600">
            {response}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-700 flex gap-2">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Frage stellen..."
          className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
        />
        <button 
          onClick={handleAsk}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default Assistant;