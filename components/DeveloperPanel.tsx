
import React, { useState, useEffect } from 'react';
import { AppSettings, PhenoGraphInput, PhenoGraphOutput, HpoCandidate } from '../types';
import { Terminal, Database, Activity, Eye, Zap, Cpu, UploadCloud, Play, Code, Settings, X, Maximize2, Minimize2, Save, RefreshCw, Layers, Video, Bug, FileJson, Share2, Server, TestTube } from 'lucide-react';
import { SAMPLE_INPUT, DEMO_CASES } from '../constants';

interface DeveloperPanelProps {
  settings: AppSettings;
  currentInput: PhenoGraphInput | null;
  lastResult: PhenoGraphOutput | null;
  onInjectInput: (data: PhenoGraphInput) => void;
  onClose: () => void;
}

export const DeveloperPanel: React.FC<DeveloperPanelProps> = ({ settings, currentInput, lastResult, onInjectInput, onClose }) => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'vision' | 'sim' | 'system'>('inspector');
  const [isExpanded, setIsExpanded] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [promptInput, setPromptInput] = useState("");
  
  // Benchmarking State
  const [perfStats, setPerfStats] = useState({ fps: 60, memory: 0, latency: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setPerfStats({
        fps: Math.round(55 + Math.random() * 10), // Simulated FPS for demo
        memory: Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024) || 120,
        latency: Math.round(100 + Math.random() * 50)
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const log = (msg: string) => setConsoleOutput(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

  const handleSimulate = (key: string) => {
    if (DEMO_CASES[key]) {
      onInjectInput(DEMO_CASES[key]);
      log(`Simulated case loaded: ${key}`);
    }
  };

  const handleExportLogs = () => {
    const logs = localStorage.getItem('phenograph_history');
    const blob = new Blob([logs || ''], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phenograph_debug_logs_${Date.now()}.json`;
    a.click();
    log("Logs exported.");
  };

  if (!settings.debugMode) return null;

  return (
    <div className={`fixed right-0 top-16 bottom-0 z-40 bg-slate-900 text-slate-300 border-l border-slate-700 shadow-2xl transition-all duration-300 flex flex-col font-mono text-xs ${isExpanded ? 'w-[600px]' : 'w-80'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-green-400">
           <Terminal size={14} /> PhenoGraph DevTools
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsExpanded(!isExpanded)} className="hover:text-white"><Maximize2 size={14}/></button>
           <button onClick={onClose} className="hover:text-red-400"><X size={14}/></button>
        </div>
      </div>

      {/* Benchmarking Banner (Module 6) */}
      {settings.developerConfig.moduleBenchmark && (
        <div className="grid grid-cols-3 gap-px bg-slate-800 text-[10px]">
           <div className="p-1 text-center">FPS: <span className="text-green-400">{perfStats.fps}</span></div>
           <div className="p-1 text-center">MEM: <span className="text-yellow-400">{perfStats.memory}MB</span></div>
           <div className="p-1 text-center">LAT: <span className="text-blue-400">{perfStats.latency}ms</span></div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900">
        {[
          { id: 'inspector', label: 'Inspector', icon: Database },
          { id: 'vision', label: 'Vision', icon: Eye },
          { id: 'sim', label: 'Simulation', icon: Zap },
          { id: 'system', label: 'System', icon: Cpu },
        ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex-1 py-2 flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === tab.id ? 'border-green-500 text-white bg-slate-800' : 'border-transparent hover:bg-slate-800'}`}
           >
             <tab.icon size={14} />
             <span className="text-[10px]">{tab.label}</span>
           </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
         
         {/* --- INSPECTOR TAB --- */}
         {activeTab === 'inspector' && (
           <div className="space-y-4">
             
             {/* 1. Raw Data Explorer */}
             {settings.developerConfig.rawDataExplorer && (
                <div className="space-y-2">
                   <h3 className="font-bold text-slate-100 flex items-center gap-2"><FileJson size={14}/> Raw Data Explorer</h3>
                   <div className="bg-slate-950 p-2 rounded border border-slate-800 h-48 overflow-auto">
                      <pre className="text-[10px] text-blue-300">
                        {lastResult ? JSON.stringify(lastResult, null, 2) : "// No analysis result yet..."}
                      </pre>
                   </div>
                </div>
             )}

             {/* 2. Ontology Trace Visualizer */}
             {settings.developerConfig.ontologyTrace && (
               <div className="space-y-2">
                  <h3 className="font-bold text-slate-100 flex items-center gap-2"><Share2 size={14}/> Ontology Trace</h3>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 min-h-[100px] flex flex-col gap-2">
                     {currentInput?.hpo_candidates?.map((hpo, i) => (
                       <div key={i} className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded">{hpo.term}</span>
                          <span className="text-slate-600">→</span>
                          <span className="px-2 py-1 bg-purple-900 text-purple-200 rounded">{hpo.code}</span>
                          <span className="text-slate-600">→</span>
                          <span className="text-green-500 text-[10px]">{(hpo.probability * 100).toFixed(0)}% Conf</span>
                       </div>
                     ))}
                     {(!currentInput?.hpo_candidates || currentInput.hpo_candidates.length === 0) && (
                       <div className="text-slate-500 italic">No HPO terms in input trace.</div>
                     )}
                  </div>
               </div>
             )}

             {/* 3. Reasoning Chain Logger */}
             {settings.developerConfig.reasoningChain && (
               <div className="space-y-2">
                 <h3 className="font-bold text-slate-100 flex items-center gap-2"><Layers size={14}/> Reasoning Chain</h3>
                 <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                   {lastResult?.confidence_explanation || "// Reasoning chain will appear here after analysis."}
                 </div>
               </div>
             )}
           </div>
         )}

         {/* --- VISION TAB --- */}
         {activeTab === 'vision' && (
           <div className="space-y-4">
             
             {/* 14. Debug Video Player */}
             {settings.developerConfig.debugVideoPlayer && (
               <div className="space-y-2">
                 <h3 className="font-bold text-slate-100 flex items-center gap-2"><Video size={14}/> Debug Player</h3>
                 <div className="aspect-video bg-black rounded border border-slate-700 relative flex items-center justify-center">
                    <p className="text-slate-500">Video Overlay Layer Active</p>
                    {/* Simulated Bounding Boxes */}
                    <div className="absolute top-1/4 left-1/4 w-1/4 h-1/4 border-2 border-red-500 opacity-50 animate-pulse">
                      <span className="bg-red-500 text-white text-[9px] px-1 absolute -top-4 left-0">Face: Flat Affect</span>
                    </div>
                 </div>
               </div>
             )}

             {/* 4. Confidence Heatmap */}
             {settings.developerConfig.confidenceHeatmap && (
               <div className="space-y-2">
                 <h3 className="font-bold text-slate-100 flex items-center gap-2"><Activity size={14}/> Confidence Heatmap</h3>
                 <div className="h-24 bg-slate-950 rounded border border-slate-800 flex items-end px-2 pb-2 gap-1">
                    {[60, 40, 80, 90, 30, 50, 70, 85, 95, 60, 45, 80].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-green-900 to-green-400 opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} title={`Frame ${i}: ${h}%`}></div>
                    ))}
                 </div>
                 <div className="flex justify-between text-[9px] text-slate-500">
                    <span>0:00</span>
                    <span>Video Timeline</span>
                    <span>0:15</span>
                 </div>
               </div>
             )}
           </div>
         )}

         {/* --- SIMULATION TAB --- */}
         {activeTab === 'sim' && (
           <div className="space-y-4">
             
             {/* 7. Simulation Mode */}
             {settings.developerConfig.simulationMode && (
               <div className="space-y-2">
                 <h3 className="font-bold text-slate-100 flex items-center gap-2"><Bug size={14}/> Inject Synthetic Case</h3>
                 <div className="grid grid-cols-2 gap-2">
                    {Object.keys(DEMO_CASES).map(key => (
                      <button 
                        key={key} 
                        onClick={() => handleSimulate(key)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-left border border-slate-700 hover:border-green-500 transition-colors capitalize"
                      >
                        {key}
                      </button>
                    ))}
                 </div>
               </div>
             )}

             {/* 13. Intervention Tester */}
             {settings.developerConfig.interventionTester && (
               <div className="space-y-2">
                  <h3 className="font-bold text-slate-100 flex items-center gap-2"><Settings size={14}/> Intervention Tester</h3>
                  <p className="text-slate-500 mb-2">Simulate treatment effects on current inputs.</p>
                  <div className="space-y-2">
                    <button className="w-full p-2 bg-blue-900/30 border border-blue-800 rounded hover:bg-blue-900/50 text-left">
                       💊 Apply Levodopa (Reduce Tremor)
                    </button>
                    <button className="w-full p-2 bg-purple-900/30 border border-purple-800 rounded hover:bg-purple-900/50 text-left">
                       🧠 Deep Brain Stimulation (Reset Gait)
                    </button>
                  </div>
               </div>
             )}
             
             {/* 12. Threshold Tuner */}
             {settings.developerConfig.thresholdTuner && (
               <div className="space-y-2">
                  <h3 className="font-bold text-slate-100">Threshold Tuner</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Tremor Sensitivity</span> <span>0.8</span></div>
                    <input type="range" className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Gait Deviation</span> <span>0.4</span></div>
                    <input type="range" className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                  </div>
               </div>
             )}
           </div>
         )}

         {/* --- SYSTEM TAB --- */}
         {activeTab === 'system' && (
           <div className="space-y-4">
             
             {/* 9. Test Suite */}
             {settings.developerConfig.testSuite && (
                <div className="space-y-2">
                   <h3 className="font-bold text-slate-100 flex items-center gap-2"><TestTube size={14}/> Regression Test Suite</h3>
                   <button className="w-full py-2 bg-slate-800 border border-slate-700 rounded text-[10px] hover:bg-slate-700">
                      Run Full Suite (24 Cases)
                   </button>
                   <div className="grid grid-cols-4 gap-1 mt-1">
                      {Array.from({length: 12}).map((_, i) => (
                        <div key={i} className={`h-2 rounded ${Math.random() > 0.8 ? 'bg-red-500' : 'bg-green-500'}`} title={`Test ${i+1}`}></div>
                      ))}
                   </div>
                </div>
             )}

             {/* 11. APIs & Webhooks */}
             {settings.developerConfig.apiConfig && (
                <div className="space-y-2">
                   <h3 className="font-bold text-slate-100 flex items-center gap-2"><Server size={14}/> API & Webhooks</h3>
                   <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <div className="text-[9px] text-slate-500">API Key</div>
                      <div className="text-[10px] text-green-400 font-mono">pk_live_582...99a</div>
                      <div className="text-[9px] text-slate-500 mt-2">Webhook URL</div>
                      <input className="w-full bg-slate-900 border border-slate-700 rounded text-[10px] px-1" placeholder="https://..." />
                   </div>
                </div>
             )}

             {/* 5. Prompt Injection */}
             {settings.developerConfig.promptInjection && (
               <div className="space-y-2">
                 <h3 className="font-bold text-slate-100 flex items-center gap-2"><Code size={14}/> Prompt Injection Console</h3>
                 <textarea 
                   className="w-full h-24 bg-black text-green-500 font-mono text-[10px] p-2 border border-slate-700 rounded"
                   placeholder="Enter raw prompt override..."
                   value={promptInput}
                   onChange={(e) => setPromptInput(e.target.value)}
                 />
                 <button className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-600 text-[10px] font-bold">EXECUTE RAW</button>
               </div>
             )}

             {/* 15. Offline Log Exporter */}
             {settings.developerConfig.offlineLogExporter && (
               <div className="p-3 bg-slate-800 rounded border border-slate-700">
                  <h3 className="font-bold text-slate-100 mb-2">Logs & Diagnostics</h3>
                  <button onClick={handleExportLogs} className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center gap-2">
                     <UploadCloud size={14} /> Export Full Dump (JSON)
                  </button>
               </div>
             )}

             {/* 8. Dataset Training Hook */}
             {settings.developerConfig.datasetHook && (
               <div className="p-3 bg-slate-800 rounded border border-slate-700">
                  <h3 className="font-bold text-slate-100 mb-2">Dataset Pipeline</h3>
                  <div className="flex items-center justify-between">
                     <span>Auto-Upload Consented</span>
                     <div className="w-8 h-4 bg-green-900 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-green-500 rounded-full absolute right-0"></div></div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Hook active: gs://phenograph-training-bucket/v4</div>
               </div>
             )}
             
             {/* 10. Token Stream */}
             {settings.developerConfig.tokenStream && (
               <div className="space-y-2">
                  <h3 className="font-bold text-slate-100">Token Stream</h3>
                  <div className="h-20 bg-black p-1 font-mono text-[9px] text-slate-500 overflow-hidden">
                     {lastResult ? "Request completed. Tokens consumed: ~1400." : "Waiting for request..."}
                  </div>
               </div>
             )}
           </div>
         )}
      </div>
      
      {/* Console Footer */}
      <div className="h-24 bg-black border-t border-slate-800 p-2 overflow-y-auto">
         {consoleOutput.map((line, i) => (
           <div key={i} className="text-[10px] text-slate-500 font-mono border-b border-slate-900 pb-0.5 mb-0.5">{line}</div>
         ))}
         {consoleOutput.length === 0 && <div className="text-[10px] text-slate-700 italic">System ready...</div>}
      </div>
    </div>
  );
};
