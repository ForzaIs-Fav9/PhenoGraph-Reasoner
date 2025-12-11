
import React, { useState, useEffect } from 'react';
import { AppSettings, DeveloperConfig } from '../types';
import { X, Camera, Mic, BrainCircuit, Globe, Lock, Sliders, ChevronRight, HelpCircle, RotateCcw, AlertTriangle, Check, UploadCloud, Trash, Type, Moon, Sun, Contrast, Wifi, Sparkles, Database, Terminal, Activity, Eye, Zap, HardDrive, Cpu, Edit, Volume2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  t: (section: string, key: string) => any;
}

type SettingsCategory = 'input' | 'ai' | 'access' | 'privacy' | 'dev';

const DEFAULT_DEV_CONFIG: DeveloperConfig = {
  rawDataExplorer: false,
  ontologyTrace: false,
  reasoningChain: false,
  confidenceHeatmap: false,
  promptInjection: false,
  moduleBenchmark: false,
  simulationMode: false,
  datasetHook: false,
  testSuite: false,
  tokenStream: false,
  apiConfig: false,
  thresholdTuner: false,
  interventionTester: false,
  debugVideoPlayer: false,
  offlineLogExporter: false
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings, t }) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('input');
  const [showDevOptions, setShowDevOptions] = useState(settings.debugMode);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  if (!isOpen) return null;

  const updateDevConfig = (key: keyof DeveloperConfig, value: boolean) => {
    onUpdateSettings({
      developerConfig: { ...settings.developerConfig, [key]: value }
    });
  };

  const resetAll = () => {
    if (confirm("Reset all settings to default values?")) {
      onUpdateSettings({
        cameraSource: 'default',
        microphoneSource: 'default',
        resolution: 'Auto',
        frameRate: 'Normal',
        emergencyMode: false,
        liveAnalysis: true,
        postSessionAnalysis: 'Always On',
        feedbackType: 'Audio',
        aiTone: 'Friendly',
        reasoningDepth: 'detailed',
        enableInternet: true,
        transparentReasoning: true,
        chatMemory: false,
        language: 'English',
        voiceSpeed: 'Normal',
        textSize: 'Medium',
        theme: 'Light',
        screenReader: 'Auto',
        dyslexiaFont: false,
        ttsVoice: '',
        localStorage: true,
        dataRetention: 'Forever',
        cloudUpload: 'Ask',
        analytics: 'Anonymous',
        debugMode: false,
        modelTemperature: 0.2,
        autoPromptTest: false,
        developerConfig: DEFAULT_DEV_CONFIG,
        customSystemPrompt: ''
      });
      setShowDevOptions(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] border border-clinical-200 overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-clinical-50 border-r border-clinical-200 flex flex-col">
          <div className="p-5 border-b border-clinical-200">
            <h2 className="font-bold text-xl text-clinical-800 flex items-center gap-2">
              <Sliders className="text-brand-600" /> {t('settings', 'title')}
            </h2>
            <p className="text-xs text-clinical-500 mt-1">Configure your experience</p>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {['input', 'ai', 'access', 'privacy'].map((cat) => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat as SettingsCategory)} 
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between text-sm font-medium transition-colors capitalize ${activeCategory === cat ? 'bg-white text-brand-700 shadow-sm border border-clinical-100' : 'text-clinical-600 hover:bg-clinical-100'}`}
              >
                <span className="flex items-center gap-2">
                  {cat === 'input' && <Camera size={16}/>}
                  {cat === 'ai' && <BrainCircuit size={16}/>}
                  {cat === 'access' && <Globe size={16}/>}
                  {cat === 'privacy' && <Lock size={16}/>}
                  {t('settings', 'categories')[cat]}
                </span> 
                <ChevronRight size={14} className="opacity-50"/>
              </button>
            ))}
            
            {showDevOptions && (
              <button onClick={() => setActiveCategory('dev')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between text-sm font-medium transition-colors border border-dashed ${activeCategory === 'dev' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'text-clinical-500 border-clinical-300 hover:bg-clinical-100'}`}>
                <span className="flex items-center gap-2"><Terminal size={16}/> {t('settings', 'categories').dev}</span> <ChevronRight size={14} className="opacity-50"/>
              </button>
            )}
          </nav>

          <div className="p-4 border-t border-clinical-200">
             <label className="flex items-center gap-2 text-xs text-clinical-500 cursor-pointer">
               <input 
                  type="checkbox" 
                  checked={showDevOptions} 
                  onChange={e => {
                     setShowDevOptions(e.target.checked);
                     onUpdateSettings({ debugMode: e.target.checked });
                  }} 
                  className="rounded text-brand-600 focus:ring-brand-500" 
               />
               Enable Developer Mode
             </label>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
            
            {/* --- INPUT --- */}
            {activeCategory === 'input' && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-lg font-bold text-clinical-900 mb-4 border-b pb-2">Camera & Microphone</h3>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-clinical-700">Resolution</label>
                    <div className="flex bg-clinical-100 rounded-lg p-1">
                      {['SD', 'HD', 'Auto'].map((opt) => (
                        <button key={opt} onClick={() => onUpdateSettings({ resolution: opt as any })} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${settings.resolution === opt ? 'bg-white text-brand-700 shadow-sm' : 'text-clinical-500'}`}>{opt}</button>
                      ))}
                    </div>
                 </div>
              </div>
            )}

            {/* --- AI --- */}
            {activeCategory === 'ai' && (
              <div className="space-y-6 animate-in fade-in">
                 <h3 className="text-lg font-bold text-clinical-900 mb-4 border-b pb-2">AI Capabilities</h3>
                 
                 <div className="flex items-start justify-between p-4 bg-brand-50 rounded-lg border border-brand-100">
                    <div className="flex gap-3">
                      <div className="p-2 bg-white rounded-md text-brand-600 shadow-sm"><Wifi size={20} /></div>
                      <div>
                        <h4 className="font-bold text-brand-900 text-sm">Real-time Internet Access</h4>
                        <p className="text-xs text-brand-700 mt-1">Allows browsing for up-to-date medical info. Includes daily self-training.</p>
                      </div>
                    </div>
                    <input type="checkbox" checked={settings.enableInternet} onChange={e => onUpdateSettings({ enableInternet: e.target.checked })} className="rounded text-brand-600 mt-1" />
                 </div>

                 <div className="flex items-start justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex gap-3">
                      <div className="p-2 bg-white rounded-md text-purple-600 shadow-sm"><Sparkles size={20} /></div>
                      <div>
                        <h4 className="font-bold text-purple-900 text-sm">Transparent Reasoning Mode</h4>
                        <p className="text-xs text-purple-700 mt-1">AI will show its "thinking process" before answering.</p>
                      </div>
                    </div>
                    <input type="checkbox" checked={settings.transparentReasoning} onChange={e => onUpdateSettings({ transparentReasoning: e.target.checked })} className="rounded text-purple-600 mt-1" />
                 </div>

                 <div className="flex items-start justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex gap-3">
                      <div className="p-2 bg-white rounded-md text-blue-600 shadow-sm"><Database size={20} /></div>
                      <div>
                        <h4 className="font-bold text-blue-900 text-sm">Chatbot Memory</h4>
                        <p className="text-xs text-blue-700 mt-1">AI remembers context from previous sessions for a continuous experience.</p>
                      </div>
                    </div>
                    <input type="checkbox" checked={settings.chatMemory} onChange={e => onUpdateSettings({ chatMemory: e.target.checked })} className="rounded text-blue-600 mt-1" />
                 </div>
              </div>
            )}

            {/* --- ACCESS --- */}
            {activeCategory === 'access' && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-lg font-bold text-clinical-900 mb-4 border-b pb-2">Accessibility & Language</h3>
                <div className="space-y-4">
                  <div>
                     <label className="text-sm font-bold text-brand-900 block mb-2">Preferred Language</label>
                     <select className="w-full p-2 bg-white border border-brand-200 rounded-lg text-sm" value={settings.language} onChange={(e) => onUpdateSettings({ language: e.target.value })}>
                       <option value="English">🇺🇸 English</option>
                       <option value="Spanish">🇪🇸 Spanish</option>
                       <option value="French">🇫🇷 French</option>
                       <option value="German">🇩🇪 German</option>
                       <option value="Hindi">🇮🇳 Hindi</option>
                       <option value="Chinese">🇨🇳 Chinese</option>
                       <option value="Arabic">🇸🇦 Arabic</option>
                       <option value="Portuguese">🇧🇷 Portuguese</option>
                       <option value="Russian">🇷🇺 Russian</option>
                       <option value="Japanese">🇯🇵 Japanese</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-sm font-bold text-brand-900 block mb-2 flex items-center gap-2"><Volume2 size={16}/> Text-to-Speech Voice</label>
                     <select className="w-full p-2 bg-white border border-brand-200 rounded-lg text-sm" value={settings.ttsVoice} onChange={(e) => onUpdateSettings({ ttsVoice: e.target.value })}>
                       <option value="">Default Device Voice</option>
                       {voices.map(v => (
                         <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                       ))}
                     </select>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm font-semibold text-clinical-700">Dyslexia-Friendly Font</span>
                     <input type="checkbox" checked={settings.dyslexiaFont} onChange={e => onUpdateSettings({ dyslexiaFont: e.target.checked })} className="rounded text-brand-600" />
                  </div>
                </div>
              </div>
            )}
            
            {/* --- PRIVACY --- */}
            {activeCategory === 'privacy' && (
               <div className="space-y-6 animate-in fade-in">
                 <h3 className="text-lg font-bold text-clinical-900 mb-4 border-b pb-2">Privacy</h3>
                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <label className="flex items-center gap-2 text-sm font-bold">
                       <input type="checkbox" checked={settings.localStorage} onChange={e => onUpdateSettings({ localStorage: e.target.checked })} className="rounded text-brand-600" />
                       Store Data Locally
                    </label>
                    <p className="text-xs text-slate-500 mt-1 ml-6">Data stays on this device.</p>
                 </div>
               </div>
            )}

            {/* --- DEV --- */}
            {activeCategory === 'dev' && showDevOptions && (
              <div className="space-y-6 animate-in fade-in">
                 <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
                   <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
                      <AlertTriangle size={16} /> Warning: Developer Zone
                   </div>
                   <p className="text-xs text-amber-700 leading-relaxed">
                     These features offer low-level access to the PhenoGraph reasoning engine. 
                     Changing these settings may cause instability, hallucinations, or app crashes. 
                     Use only if you know what you are doing.
                   </p>
                 </div>

                 {/* Prompt Injection */}
                 <div className="space-y-2 border p-3 rounded-lg border-clinical-200">
                    <div className="flex justify-between items-center">
                       <label className="text-sm font-bold flex items-center gap-2"><Edit size={16} className="text-brand-500"/> 5. Prompt Injection Console</label>
                       <input type="checkbox" checked={settings.developerConfig.promptInjection} onChange={e => updateDevConfig('promptInjection', e.target.checked)} className="rounded" />
                    </div>
                    {settings.developerConfig.promptInjection && (
                       <textarea 
                          className="w-full h-32 p-2 text-xs font-mono bg-slate-900 text-green-400 rounded-md border border-slate-700"
                          value={settings.customSystemPrompt || ''}
                          onChange={e => onUpdateSettings({ customSystemPrompt: e.target.value })}
                          placeholder="Override System Prompt..."
                       />
                    )}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { k: 'rawDataExplorer', l: '1. Raw Data Explorer', i: Database },
                      { k: 'ontologyTrace', l: '2. Ontology Trace Visualizer', i: Activity },
                      { k: 'reasoningChain', l: '3. Reasoning Chain Logger', i: BrainCircuit },
                      { k: 'confidenceHeatmap', l: '4. Confidence Heatmap', i: Eye },
                      { k: 'moduleBenchmark', l: '6. Module Benchmarking', i: Cpu },
                      { k: 'simulationMode', l: '7. Simulation Mode', i: Zap },
                      { k: 'datasetHook', l: '8. Dataset Training Hook', i: HardDrive },
                      { k: 'testSuite', l: '9. Test Suite Integration', i: Check },
                      { k: 'tokenStream', l: '10. Real-time Token Stream', i: Terminal },
                      { k: 'apiConfig', l: '11. APIs & Webhooks', i: Globe },
                      { k: 'thresholdTuner', l: '12. Threshold Tuner', i: Sliders },
                      { k: 'interventionTester', l: '13. Intervention Tester', i: Activity },
                      { k: 'debugVideoPlayer', l: '14. Debug Video Player', i: Camera },
                      { k: 'offlineLogExporter', l: '15. Offline Log Exporter', i: UploadCloud },
                    ].map(opt => (
                       <div key={opt.k} className="flex items-center justify-between p-3 border border-clinical-200 rounded-lg bg-white">
                          <span className="text-xs font-semibold flex items-center gap-2">
                             <opt.i size={14} className="text-clinical-400" /> {opt.l}
                          </span>
                          <input 
                             type="checkbox" 
                             checked={settings.developerConfig[opt.k as keyof DeveloperConfig]} 
                             onChange={e => updateDevConfig(opt.k as keyof DeveloperConfig, e.target.checked)} 
                             className="rounded text-brand-600"
                          />
                       </div>
                    ))}
                 </div>
              </div>
            )}

          </div>

          <div className="p-4 border-t border-clinical-200 bg-clinical-50 flex justify-between items-center">
             <button onClick={resetAll} className="flex items-center gap-1 text-xs text-clinical-500 hover:text-red-500"><RotateCcw size={14} /> {t('settings', 'reset')}</button>
             <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 text-clinical-600 font-medium text-sm hover:bg-clinical-100 rounded-lg">{t('settings', 'cancel')}</button>
                <button onClick={onClose} className="px-6 py-2 bg-brand-600 text-white font-medium text-sm rounded-lg hover:bg-brand-700 shadow-md flex items-center gap-2"><Check size={16} /> {t('settings', 'save')}</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
