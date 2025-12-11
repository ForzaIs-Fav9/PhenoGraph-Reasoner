
import React, { useState, useEffect } from 'react';
import { PhenoGraphOutput, PhenoGraphInput, HistoryItem, AppSettings, DeveloperConfig } from './types';
import { InputEditor } from './components/InputEditor';
import { ReportView } from './components/ReportView';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { HistoryModal } from './components/HistoryModal';
import { ChatModal } from './components/ChatModal';
import { WelcomeTutorial } from './components/WelcomeTutorial';
import { KnowledgeBase } from './components/KnowledgeBase';
import { DeveloperPanel } from './components/DeveloperPanel';
import { analyzePhenotypes, runDailySelfTraining } from './services/geminiService';
import { saveHistoryItem } from './services/storageService';
import { TRANSLATIONS } from './translations';
import { BrainCircuit, Settings, HelpCircle, ShieldAlert, WifiOff, History, AlertTriangle, Book, MessageCircle } from 'lucide-react';

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

export default function App() {
  const [result, setResult] = useState<PhenoGraphOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [currentView, setCurrentView] = useState<'input' | 'report' | 'knowledge'>('input');
  
  const [loadedInputData, setLoadedInputData] = useState<PhenoGraphInput | null>(null);
  const [initialInputTab, setInitialInputTab] = useState<'live' | 'patient'>('patient');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [showTutorial, setShowTutorial] = useState(true);

  // New state to track current form input for dev tools and refinements
  const [currentFormInput, setCurrentFormInput] = useState<PhenoGraphInput | null>(null);

  const [appSettings, setAppSettings] = useState<AppSettings>({
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
    knowledgeBaseUpdate: 0,
    learnedKnowledge: [],
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
    developerConfig: DEFAULT_DEV_CONFIG
  });

  const currentLang = appSettings.language;
  const t = (section: string, key: string) => {
    const dataset = TRANSLATIONS[currentLang] || TRANSLATIONS['English'];
    return dataset[section]?.[key] || TRANSLATIONS['English'][section]?.[key] || key;
  };
  
  // Auto-Training Check
  useEffect(() => {
    const checkTraining = async () => {
       const now = Date.now();
       
       // Backoff check: Don't retry if we failed due to quota recently (1 hour)
       const lastFailure = localStorage.getItem('phenograph_training_failure');
       if (lastFailure && (now - parseInt(lastFailure) < 3600000)) {
         return;
       }

       if (appSettings.enableInternet && isOnline && (now - (appSettings.knowledgeBaseUpdate || 0) > 86400000)) {
         console.log("Running Daily Self-Training...");
         try {
           const newKnowledge = await runDailySelfTraining();
           if (newKnowledge) {
              setAppSettings(prev => ({
                ...prev,
                knowledgeBaseUpdate: now,
                learnedKnowledge: [newKnowledge, ...(prev.learnedKnowledge || []).slice(0, 5)] 
              }));
              localStorage.removeItem('phenograph_training_failure');
           }
         } catch(e: any) {
           // Handle Rate Limits (429) silently to avoid cluttering console
           if (e.message?.includes('429') || e.status === 429) {
             console.warn("Background Self-Training paused (Quota Exceeded). Will retry later.");
             localStorage.setItem('phenograph_training_failure', now.toString());
           } else {
             console.error("Self-Training Failed", e);
           }
         }
       }
    };
    checkTraining();
  }, [isOnline, appSettings.enableInternet]);
  
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    const map: Record<string,string> = {'es':'Spanish', 'fr':'French', 'de':'German', 'zh':'Chinese', 'hi':'Hindi', 'ar':'Arabic', 'pt':'Portuguese', 'ru':'Russian', 'ja':'Japanese'};
    if (map[browserLang]) {
       setAppSettings(prev => prev.language === 'English' ? { ...prev, language: map[browserLang] } : prev);
    }
    const seen = localStorage.getItem('onboarding_complete');
    if (seen) setShowTutorial(false);
  }, []);

  const triggerTutorial = () => {
    setShowTutorial(true);
    setCurrentView('input');
  };

  const speakStatus = (text: string) => {
    if (appSettings.feedbackType !== 'Audio') return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (appSettings.ttsVoice) {
         const voice = window.speechSynthesis.getVoices().find(v => v.name === appSettings.ttsVoice);
         if (voice) utterance.voice = voice;
      }
      utterance.rate = appSettings.voiceSpeed === 'Slow' ? 0.8 : appSettings.voiceSpeed === 'Fast' ? 1.2 : 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setAppSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleAnalyze = async (inputData: PhenoGraphInput, isRefinement = false) => {
    if (!isOnline) {
      alert("You are offline. Please check your internet connection to analyze.");
      return;
    }

    setIsAnalyzing(true);
    // CRITICAL FIX: Only clear result if this is a NEW analysis, NOT a refinement. 
    // This prevents the screen from going blank during Q&A.
    if (!isRefinement) {
      setResult(null);
    }
    
    speakStatus(isRefinement ? "Refining analysis." : "Starting analysis.");
    
    // Save current input context
    setCurrentFormInput(inputData);

    try {
      const output = await analyzePhenotypes(inputData, {
        reasoningDepth: appSettings.reasoningDepth,
        customPrompt: appSettings.developerConfig.promptInjection ? appSettings.customSystemPrompt : undefined,
        learnedKnowledge: appSettings.learnedKnowledge
      });
      
      // AUTO-UPDATE: If AI extracted features, merge them back into the input data state.
      // This ensures if the user clicks "Back", the form is populated with the AI's findings (Auto -> Manual transition).
      if (output.extracted_hpo || output.extracted_audio_features) {
         const updatedInput = { ...inputData };
         
         if (output.extracted_hpo && output.extracted_hpo.length > 0) {
            updatedInput.hpo_candidates = output.extracted_hpo;
         }
         
         if (output.extracted_audio_features) {
            updatedInput.audio_features = output.extracted_audio_features;
         }
         
         // Update the editor state so "Back" shows the extracted data
         setLoadedInputData(updatedInput);
         
         // Also update current context so future refinements use the UPDATED data
         setCurrentFormInput(updatedInput);
      }

      setResult(output);
      
      if (appSettings.localStorage) {
         saveHistoryItem(inputData, output);
      }
      speakStatus("Analysis complete.");
      setCurrentView('report');
    } catch (error: any) {
      console.error(error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefine = (additionalInfo: string) => {
    if (!currentFormInput) return;
    const newInput = { ...currentFormInput };
    // Append the user's answers to the note so the AI has context
    newInput.patient = { 
      ...newInput.patient, 
      note: newInput.patient.note + "\n\n*** USER FOLLOW-UP RESPONSES ***\n" + additionalInfo 
    };
    // Pass 'true' to indicate this is a refinement (preserves UI state)
    handleAnalyze(newInput, true);
  };

  const handleLoadHistoryItem = (item: HistoryItem) => {
    setResult(item.output);
    setLoadedInputData(item.input);
    setCurrentFormInput(item.input);
    setCurrentView('report'); 
  };
  
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('onboarding_complete', 'true');
  };

  const handleDevInject = (data: PhenoGraphInput) => {
    setLoadedInputData(data);
    setCurrentView('input');
  };

  const getThemeClass = () => {
    if (appSettings.theme === 'High Contrast') return 'bg-black text-white';
    if (appSettings.theme === 'Dark') return 'bg-slate-900 text-slate-100';
    return 'bg-clinical-100 text-clinical-900'; 
  };

  const getHeaderTheme = () => {
    if (appSettings.theme === 'High Contrast') return 'bg-black border-white';
    if (appSettings.theme === 'Dark') return 'bg-slate-800 border-slate-700 text-white';
    return 'bg-white border-clinical-200'; 
  };

  return (
    <div className={`h-screen w-full flex flex-col overflow-hidden relative transition-colors duration-300
       ${getThemeClass()}
       ${appSettings.dyslexiaFont ? 'font-mono' : 'font-sans'}
    `}>
      {showTutorial && <WelcomeTutorial onComplete={handleTutorialComplete} language={appSettings.language} />}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={appSettings}
        onUpdateSettings={handleUpdateSettings}
        t={t}
      />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} onStartTour={() => { setIsHelpOpen(false); triggerTutorial(); }} t={t} />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} onLoadItem={handleLoadHistoryItem} t={t} />
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} t={t} settings={appSettings} />
      
      {/* Developer Panel Overlay */}
      <DeveloperPanel 
        settings={appSettings} 
        currentInput={currentFormInput || loadedInputData} 
        lastResult={result}
        onInjectInput={handleDevInject}
        onClose={() => handleUpdateSettings({ debugMode: false })}
      />

      <header className={`border-b h-16 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm relative transition-colors duration-300 ${getHeaderTheme()}`}>
        <div className="flex items-center gap-3">
          <div className={`${appSettings.theme === 'High Contrast' ? 'bg-yellow-400 text-black' : appSettings.theme === 'Dark' ? 'bg-blue-600 text-white' : 'bg-brand-600 text-white'} p-1.5 rounded-lg`}>
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${appSettings.theme === 'High Contrast' ? 'text-white' : appSettings.theme === 'Dark' ? 'text-white' : 'text-clinical-900'}`}>{t('nav', 'title')}</h1>
            <p className={`text-[10px] font-medium uppercase tracking-widest ${appSettings.theme === 'High Contrast' ? 'text-yellow-400' : appSettings.theme === 'Dark' ? 'text-slate-400' : 'text-clinical-500'}`}>{t('nav', 'subtitle')}</p>
          </div>
        </div>
        
        {!isOnline && (
           <div className="absolute left-1/2 transform -translate-x-1/2 top-14 bg-amber-500 text-white text-xs px-4 py-1 rounded-b-lg shadow-md font-semibold flex items-center gap-2 z-20">
             <WifiOff size={12} /> Offline Mode
           </div>
        )}

        <div className="flex items-center gap-4">
           {!process.env.API_KEY && (
             <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-md border border-red-200 text-xs font-semibold">
               <ShieldAlert size={14} /> Missing API Key
             </div>
           )}
           {['knowledge', 'history', 'chat', 'help', 'settings'].map(view => (
             <button 
               key={view}
               id={`tour-nav-${view}`}
               onClick={() => {
                 if (view === 'settings') setIsSettingsOpen(true);
                 else if (view === 'help') setIsHelpOpen(true);
                 else if (view === 'history') setIsHistoryOpen(true);
                 else if (view === 'chat') setIsChatOpen(true);
                 else setCurrentView('knowledge');
               }} 
               className={`transition-colors p-1 rounded-full 
                 ${appSettings.theme === 'High Contrast' ? 'text-white hover:text-yellow-400' : 
                   appSettings.theme === 'Dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 
                   'text-clinical-400 hover:text-clinical-600 hover:bg-clinical-50'}`}
             >
               {view === 'knowledge' && <Book size={20} />}
               {view === 'history' && <History size={20} />}
               {view === 'help' && <HelpCircle size={20} />}
               {view === 'settings' && <Settings size={20} />}
               {view === 'chat' && (
                 <div className="relative">
                   <MessageCircle size={20} />
                   <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border border-white"></span>
                 </div>
               )}
             </button>
           ))}
           <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${appSettings.theme === 'High Contrast' ? 'bg-black border-white text-white' : appSettings.theme === 'Dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-brand-100 border-brand-200 text-brand-700'}`}>
             Dr
           </div>
        </div>
      </header>

      <div className={`${appSettings.theme === 'High Contrast' ? 'bg-yellow-400 text-black' : appSettings.theme === 'Dark' ? 'bg-slate-800 text-amber-400' : 'bg-clinical-900 text-white'} text-xs py-2 px-6 flex items-center justify-center gap-2 shrink-0 transition-colors duration-300`}>
        <AlertTriangle size={14} className={appSettings.theme === 'High Contrast' ? 'text-black' : 'text-amber-400'} />
        <span className="font-medium tracking-wide">
          RESEARCH USE ONLY. This tool is a screening aid, NOT a diagnostic device.
        </span>
      </div>

      <main className="flex-1 min-h-0 p-4 lg:p-6 overflow-hidden">
        <div className="h-full max-w-5xl mx-auto">
          <div style={{ display: currentView === 'input' ? 'block' : 'none', height: '100%' }} className="h-full animate-in fade-in duration-300">
             <InputEditor 
               onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} isOnline={isOnline}
               loadedData={loadedInputData} initialTab={initialInputTab} currentLanguage={appSettings.language} t={t}
             />
          </div>
          <div style={{ display: currentView === 'report' ? 'block' : 'none', height: '100%' }} className="h-full animate-in zoom-in-95 duration-300">
             <ReportView data={result} onBack={() => setCurrentView('input')} onRefine={handleRefine} t={t} isLoading={isAnalyzing} />
          </div>
          <div style={{ display: currentView === 'knowledge' ? 'block' : 'none', height: '100%' }} className="h-full animate-in zoom-in-95 duration-300">
            <KnowledgeBase onBack={() => setCurrentView('input')} t={t} />
          </div>
        </div>
      </main>
    </div>
  );
}
