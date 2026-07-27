import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Upload, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Bot, 
  Layers, 
  Loader2,
  CheckCircle2,
  Wrench,
  AlertCircle
} from 'lucide-react';

const AVAILABLE_MODELS = [
  { 
    id: 'consensus', 
    name: 'Consensus Panel (Multi-AI)', 
    description: 'Queries Gemini, Groq, & Azure parallelly + synthesizes results', 
    badge: 'Highest Accuracy',
    icon: Layers,
    color: 'border-purple-500/40 text-purple-400 bg-purple-950/40'
  },
  { 
    id: 'azure-gpt4o', 
    name: 'Azure GPT-4o mini', 
    description: 'Methodical diagnostic logic & electrical safety verification', 
    provider: 'Microsoft Azure',
    icon: Bot,
    color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/40'
  },
  { 
    id: 'gemini-flash', 
    name: 'Gemini Flash', 
    description: 'High-detail visual inspection for PCBs, connectors, & wiring', 
    provider: 'Google AI',
    icon: Sparkles,
    color: 'border-amber-500/40 text-amber-400 bg-amber-950/40'
  },
  { 
    id: 'groq-llama3', 
    name: 'Groq Llama 3.3 (70B)', 
    description: 'Ultra-fast error code lookup and general troubleshooting', 
    provider: 'Groq Cloud',
    icon: Cpu,
    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40'
  },
];

export default function DiagnosticConsole() {
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [symptomText, setSymptomText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState('');
  const [result, setResult] = useState(null);
  const [showRawReports, setShowRawReports] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptomText.trim() && !imagePreview) return;

    setIsLoading(true);
    setResult(null);

    try {
      if (selectedModel.id === 'consensus') {
        setActiveStep('Querying Gemini, Groq, and Azure in parallel...');
      } else {
        setActiveStep(`Sending query to ${selectedModel.name}...`);
      }

      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: symptomText,
          imageUrl: imagePreview,
          modelMode: selectedModel.id,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Diagnostic call failed:', err);
    } finally {
      setIsLoading(false);
      setActiveStep('');
    }
  };

  const SelectedIcon = selectedModel.icon;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      
      {/* Engine Card */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800/80 bg-[#0E1322] p-5 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
              <Wrench size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Hardware Diagnostics</h2>
              <p className="text-[10px] text-slate-400">Multi-Model E-Bike & PCB Troubleshooting</p>
            </div>
          </div>
        </div>

        {/* Dropdown Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Diagnostic Model Mode
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition shadow-sm text-left"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl border ${selectedModel.color}`}>
                  <SelectedIcon size={18} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-xs">{selectedModel.name}</span>
                    {selectedModel.badge && (
                      <span className="text-[9px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                        {selectedModel.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">{selectedModel.description}</p>
                </div>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-800/60">
                {AVAILABLE_MODELS.map((m) => {
                  const IconComponent = m.icon;
                  const isSelected = m.id === selectedModel.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/50 transition ${
                        isSelected ? 'bg-cyan-950/40' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl border ${m.color}`}>
                          <IconComponent size={16} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white text-xs">{m.name}</span>
                            {m.badge && (
                              <span className="text-[9px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full">
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">{m.description}</p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Symptom Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Symptom Description or Error Codes
          </label>
          <textarea
            value={symptomText}
            onChange={(e) => setSymptomText(e.target.value)}
            rows={3}
            placeholder="e.g., Error 30 on screen, throttle cuts out on hills, motor stuttering, or hot controller casing..."
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-2xl focus:border-cyan-500 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
          />
        </div>

        {/* Image Attachment */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Attach Inspection Photo (Wiring, BMS, Screen, Controller PCB)
          </label>
          
          {imagePreview ? (
            <div className="relative inline-block border border-slate-700 rounded-2xl overflow-hidden">
              <img src={imagePreview} alt="Diagnostic Attachment" className="h-28 w-auto object-cover" />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-1 right-1 bg-slate-950/80 text-white p-1 rounded-full hover:bg-slate-900"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-800 rounded-2xl hover:border-slate-700 cursor-pointer transition bg-slate-900/50">
              <Upload size={20} className="text-cyan-400 mb-1" />
              <span className="text-xs font-medium text-slate-300">Upload photo or schematic</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Supports PNG, JPG</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || (!symptomText && !imagePreview)}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-2xl transition shadow-sm flex items-center justify-center space-x-2 text-xs"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin text-slate-950" />
              <span>{activeStep || 'Processing Diagnostic Check...'}</span>
            </>
          ) : (
            <span>Run Diagnostic Check</span>
          )}
        </button>
      </form>

      {/* Output Panel */}
      {result && (
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-800/80 bg-[#0E1322] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <h3 className="font-semibold text-white text-sm">Diagnostic Guide</h3>
              </div>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full font-medium">
                Engine: {selectedModel.name}
              </span>
            </div>

            <div className="text-xs leading-relaxed whitespace-pre-wrap text-slate-200 font-sans">
              {result.result}
            </div>
          </div>

          {result.rawReports && (
            <div className="rounded-3xl border border-slate-800/80 bg-[#0E1322] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRawReports(!showRawReports)}
                className="w-full p-4 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 transition text-left"
              >
                <div className="flex items-center space-x-2">
                  <Layers size={16} className="text-purple-400" />
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Individual AI Reports (Gemini, Groq, Azure)
                  </span>
                </div>
                {showRawReports ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {showRawReports && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-800 bg-slate-950/50">
                  <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                    <span className="font-bold text-amber-400 block text-[11px]">Gemini 1.5 Flash</span>
                    <p className="text-slate-300 text-[11px] whitespace-pre-wrap">{result.rawReports.reportGemini}</p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                    <span className="font-bold text-emerald-400 block text-[11px]">Groq Llama 3</span>
                    <p className="text-slate-300 text-[11px] whitespace-pre-wrap">{result.rawReports.reportGroq}</p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                    <span className="font-bold text-cyan-400 block text-[11px]">Azure GPT-4o mini</span>
                    <p className="text-slate-300 text-[11px] whitespace-pre-wrap">{result.rawReports.reportAzure}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}