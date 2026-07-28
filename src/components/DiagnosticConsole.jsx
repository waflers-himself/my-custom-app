import React, { useState } from 'react';
import { Sparkles, Cpu, Upload, X, ChevronDown, ChevronUp, Bot, Layers, Loader2, CheckCircle2, Wrench, MessageSquare } from 'lucide-react';

const AVAILABLE_MODELS = [
  {
    id: 'groq-llama3-70b',
    name: 'Groq Llama 3.3 70B',
    provider: 'groq',
    description: 'Fastest inference. Great for step-by-step diagnostics & code.',
    icon: Cpu,
    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40'
  },
  {
    id: 'groq-mixtral',
    name: 'Groq Mixtral 8x7B',
    provider: 'groq',
    description: 'Excellent reasoning balance. Slightly slower than 70B.',
    icon: Cpu,
    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40'
  },
  {
    id: 'gemini-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    description: 'Best for image/schematic analysis & visual inspection.',
    icon: Sparkles,
    color: 'border-amber-500/40 text-amber-400 bg-amber-950/40'
  },
  {
    id: 'openrouter-qwen',
    name: 'OpenRouter Qwen 2.5 32B',
    provider: 'openrouter',
    description: 'Open-source king. Excellent technical breakdowns.',
    icon: Layers,
    color: 'border-purple-500/40 text-purple-400 bg-purple-950/40'
  },
  {
    id: 'openrouter-llama3-70b',
    name: 'OpenRouter Llama 3.3 70B',
    provider: 'openrouter',
    description: 'Premium-tier reasoning. Best for complex fault isolation.',
    icon: Bot,
    color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/40'
  }
];

export default function DiagnosticConsole() {
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedModel.provider,
          mode: selectedModel.id.split('-').slice(1).join('-') || selectedModel.id,
          prompt: prompt + (imageBase64 ? '\n[Attached Diagnostic Image]' : ''),
          imageUrl: imageBase64
        })
      });
      const data = await res.json();
      setResult(data.result || data.error || 'No response from AI.');
    } catch (err) {
      setResult('⛔ Connection failed. Check your backend logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="rounded-3xl border border-slate-800/80 bg-[#0E1322] p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"><Wrench size={18} /></div>
          <div>
            <h2 className="text-sm font-bold text-white">AI Hardware Diagnostics</h2>
            <p className="text-[10px] text-slate-400">Multi-Provider E-Bike Troubleshooting</p>
          </div>
        </div>

        <div className="relative">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Select AI Engine</label>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-2xl text-left text-sm mt-1">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${selectedModel.color}`}><selectedModel.icon size={18} /></div>
              <span className="text-white font-medium">{selectedModel.name}</span>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
          {isDropdownOpen && (
            <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
              {AVAILABLE_MODELS.map(m => (
                <button key={m.id} onClick={() => { setSelectedModel(m); setIsDropdownOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 text-left ${selectedModel.id === m.id ? 'bg-cyan-950/40' : ''}`}>
                  <div className={`p-2 rounded-xl border ${m.color}`}><m.icon size={16} /></div>
                  <div>
                    <span className="text-white text-xs font-medium block">{m.name}</span>
                    <span className="text-[10px] text-slate-400">{m.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Symptom Description / Error Code</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
            placeholder="e.g., Error 30 on LCD, throttle cuts out under load, controller feels hot, motor stutters when climbing..."
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 outline-none" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Upload Photo (Wiring, BMS, Controller PCB)</label>
          {imageBase64 ? (
            <div className="relative inline-block border border-slate-700 rounded-2xl overflow-hidden">
              <img src={imageBase64} alt="Preview" className="h-24 object-cover" />
              <button onClick={() => setImageBase64(null)} className="absolute top-1 right-1 bg-slate-950/80 text-white p-1 rounded-full"><X size={14} /></button>
            </div>
          ) : (
            <label className="flex flex-col items-center p-4 border border-dashed border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 bg-slate-900/50">
              <Upload size={20} className="text-cyan-400 mb-1" />
              <span className="text-xs text-slate-300">Click to upload</span>
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
          )}
        </div>

        <button onClick={handleSubmit} disabled={loading || !prompt.trim()}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-2xl transition flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : 'Run Diagnostic Check'}
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-800/80 bg-[#0E1322] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-400" /><h3 className="text-sm font-semibold text-white">Engine Output</h3></div>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">{selectedModel.name}</span>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-200">{result}</div>
          </div>
        </div>
      )}
    </div>
  );
}
