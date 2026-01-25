
import React, { useState, useRef, useEffect } from 'react';
import { PhenoGraphInput, HpoCandidate, AudioFeatures, Patient } from '../types';
import { SAMPLE_INPUT, DEMO_CASES, LIVE_SYSTEM_INSTRUCTION, CLEAN_AUDIO_FEATURES } from '../constants';
import { Play, RotateCcw, User, Activity, Mic, Plus, Trash2, Video, Upload, FileVideo, X, Loader2, Camera, Link as LinkIcon, ExternalLink, Info, AlertCircle, Search, StopCircle, Globe, ChevronDown, Check, Zap, Eye, Volume2, Siren, Wind, Layers, ScanText, FileText, File, FileSpreadsheet, Presentation, FileType, ChevronRight, BrainCircuit, Filter, ScanLine } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface InputEditorProps {
  onAnalyze: (data: PhenoGraphInput) => void;
  isAnalyzing: boolean;
  isOnline: boolean;
  loadedData?: PhenoGraphInput | null;
  initialTab?: 'live' | 'patient';
  currentLanguage: string;
  t: (section: string, key: string) => any;
}

type Tab = 'live' | 'patient' | 'uploads' | 'links';

// Audio Utils for Live API
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
           resolve(reader.result.split(',')[1]);
        } else {
            reject(new Error('Buffer result'));
        }
    };
    reader.readAsDataURL(blob);
  });
}

function createAudioBlob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  let binary = '';
  const len = int16.byteLength;
  const bytes = new Uint8Array(int16.buffer);
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const InputEditor: React.FC<InputEditorProps> = ({ onAnalyze, isAnalyzing, isOnline, loadedData, initialTab = 'live', currentLanguage, t }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab as Tab); 
  const [isEmergency, setIsEmergency] = useState(false);
  const [showCalmMode, setShowCalmMode] = useState(false);
  const [liveRiskAlert, setLiveRiskAlert] = useState<string | null>(null);

  // Toggle states for Manual vs Auto-Infer
  const [manualSymptoms, setManualSymptoms] = useState(false);
  const [manualSpeech, setManualSpeech] = useState(false);

  // Update active tab if initialTab changes (e.g. from tutorial)
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab as Tab);
  }, [initialTab]);
  
  const [patient, setPatient] = useState<Patient>({ 
    age: 0,
    age_unit: 'years',
    sex: 'female', 
    note: '' 
  });
  
  const [hpoCandidates, setHpoCandidates] = useState<HpoCandidate[]>([]);
  
  // Use CLEAN/Healthy defaults initially, not the demo case data
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures>(CLEAN_AUDIO_FEATURES as AudioFeatures);
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState<{data: string, mimeType: string} | undefined>(undefined);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Unified Uploads State
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, data: string, mimeType: string}[]>([]);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newUrl, setNewUrl] = useState('');

  // --- LIVE SESSION STATE ---
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState<string>("");
  const [liveObservations, setLiveObservations] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  
  const liveSessionRef = useRef<any>(null);
  const liveSessionRecorderRef = useRef<MediaRecorder | null>(null);
  const liveSessionChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (loadedData) {
      setPatient(loadedData.patient);
      setHpoCandidates(loadedData.hpo_candidates);
      setAudioFeatures(loadedData.audio_features);
      setSourceUrls(loadedData.source_urls || []);
      setVoiceNote(loadedData.voiceNote);
      setUploadedFiles(loadedData.mediaFiles || []);
      
      // If loaded data has specific HPOs, enable manual mode to show them
      if (loadedData.hpo_candidates && loadedData.hpo_candidates.length > 0) {
        setManualSymptoms(true);
      }
    }
  }, [loadedData]);

  // Fix: Ensure video plays when live stream is active
  useEffect(() => {
    if (isLiveActive && liveStream && videoRef.current) {
      videoRef.current.srcObject = liveStream;
      videoRef.current.play().catch(e => console.error("Video play failed", e));
    }
  }, [isLiveActive, liveStream]);

  const handleAnalyze = () => {
    if (!isOnline) return;
    
    // Client-side Data Validation
    if (patient.age > 125) {
      alert("Invalid age input. Please enter a realistic age.");
      return;
    }
    
    onAnalyze({
      patient,
      // Only send candidates if manual mode is ON, otherwise send empty to trigger auto-extraction
      hpo_candidates: manualSymptoms ? hpoCandidates : [],
      // Only send manual features if manual mode is ON, otherwise send clean defaults to trigger auto-extraction
      audio_features: manualSpeech ? audioFeatures : CLEAN_AUDIO_FEATURES as AudioFeatures,
      source_urls: sourceUrls,
      morphological_flags: {},
      mediaFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      voiceNote,
      reportLanguage: currentLanguage
    });
  };

  const loadDemo = (key: string) => {
    const demo = DEMO_CASES[key];
    if (demo) {
      setPatient(demo.patient);
      setHpoCandidates(demo.hpo_candidates);
      setAudioFeatures(demo.audio_features);
      setSourceUrls([]);
      setUploadedFiles([]);
      setVoiceNote(undefined);
      setManualSymptoms(true); // Show the demo data
      setManualSpeech(true);
    }
  };

  const clearForm = () => {
    setPatient({ age: 0, age_unit: 'years', sex: 'female', note: '' });
    setHpoCandidates([]);
    // Reset to clean defaults
    setAudioFeatures(CLEAN_AUDIO_FEATURES as AudioFeatures);
    setSourceUrls([]);
    setUploadedFiles([]);
    setVoiceNote(undefined);
    setManualSymptoms(false);
    setManualSpeech(false);
  };

  // --- LIVE SESSION LOGIC ---
  const startLiveSession = async () => {
    if (!process.env.API_KEY) {
      alert("No API Key found");
      return;
    }

    try {
      // 1. Setup Audio Output Context FIRST to satisfy browser autoplay policies
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      await outputAudioContext.resume(); // CRITICAL: Explicit resume on user click
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLiveStream(stream);
      liveStreamRef.current = stream;
      
      setIsLiveActive(true); // Trigger render of video element
      
      setLiveTranscription(t('live','init'));
      setLiveObservations([]);
      setLiveRiskAlert(null);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
      
      let nextStartTime = 0;
      let currentResponseText = ""; // Buffer for text chunks

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setLiveTranscription("Scanning...");
            
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createAudioBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);

            const interval = setInterval(async () => {
              if (canvasRef.current && videoRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                canvasRef.current.width = videoRef.current.videoWidth / 4; 
                canvasRef.current.height = videoRef.current.videoHeight / 4;
                ctx?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                
                canvasRef.current.toBlob(async (blob) => {
                   if (blob) {
                     const base64 = await blobToBase64(blob);
                     sessionPromise.then(session => session.sendRealtimeInput({ 
                       media: { data: base64, mimeType: 'image/jpeg' } 
                     }));
                   }
                }, 'image/jpeg', 0.6);
              }
            }, 1000);
            
            (window as any)._liveInterval = interval;
            (window as any)._audioProcessor = scriptProcessor;
            (window as any)._audioSource = source;
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const binaryString = atob(audioData);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                 bytes[i] = binaryString.charCodeAt(i);
              }
              const int16Data = new Int16Array(bytes.buffer);
              
              // Manual Decode for Raw PCM (API sends raw PCM, not WAV/MP3)
              const audioBuffer = outputAudioContext.createBuffer(1, int16Data.length, 24000);
              const channelData = audioBuffer.getChannelData(0);
              for (let i = 0; i < int16Data.length; i++) {
                 channelData[i] = int16Data[i] / 32768.0;
              }
              
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              
              nextStartTime = Math.max(outputAudioContext.currentTime, nextStartTime);
              source.start(nextStartTime);
              nextStartTime += audioBuffer.duration;
            }

            // Handle Text Transcription (Required for visual feedback)
            const transcriptionChunk = msg.serverContent?.outputTranscription?.text;
            if (transcriptionChunk) {
               currentResponseText += transcriptionChunk;
               setLiveTranscription(currentResponseText);
               
               const riskWords = ['seizure', 'choking', 'stroke', 'unconscious', 'heart attack', 'suicide', 'blue lips', 'not breathing'];
               if (riskWords.some(w => currentResponseText.toLowerCase().includes(w))) {
                 setLiveRiskAlert("EMERGENCY RISK DETECTED");
                 if (!isEmergency) setIsEmergency(true);
               }
            }

            // Handle Turn Completion
            if (msg.serverContent?.turnComplete) {
               if (currentResponseText) {
                 setLiveObservations(prev => [currentResponseText, ...prev].slice(0, 5));
                 // Note: We don't clear currentResponseText immediately so it stays on screen 
                 // until the next utterance starts, or we can clear it here.
                 // Let's clear it to indicate the AI has finished that thought.
                 setTimeout(() => {
                    if (currentResponseText) setLiveTranscription(""); 
                    currentResponseText = ""; 
                 }, 2000);
               }
            }
          },
          onclose: () => {
             console.log("Live session closed");
          },
          onerror: (e) => {
             console.error(e);
             setLiveTranscription("Connection Error");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO], 
          // FIX: outputAudioTranscription should be an empty object, not contain 'model'
          outputAudioTranscription: {},
          systemInstruction: LIVE_SYSTEM_INSTRUCTION + (isEmergency ? " URGENT MODE: BE BRIEF AND DIRECT." : ""),
          speechConfig: {
             voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' }}
          }
        }
      });
      
      sessionPromise.then(session => {
        liveSessionRef.current = session;
      });

      const localRecorder = new MediaRecorder(stream);
      liveSessionRecorderRef.current = localRecorder;
      liveSessionChunksRef.current = [];
      localRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) liveSessionChunksRef.current.push(e.data);
      };
      localRecorder.onstop = () => {
         const blob = new Blob(liveSessionChunksRef.current, { type: 'video/webm' });
         const reader = new FileReader();
         reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            
            // AUTOMATICALLY PREPARE FOR ANALYSIS
            setUploadedFiles(prev => [...prev, {
              name: `Live Capture ${new Date().toLocaleTimeString()}.webm`,
              data: base64,
              mimeType: 'video/webm'
            }]);
            
            // Switch tab to uploads to show the user the file is ready
            setActiveTab('uploads');
            
            // Optionally, we could auto-analyze here, but better to let user confirm inputs
            if (patient.note === '') {
               setPatient(prev => ({ ...prev, note: `Video captured via Live Co-pilot.\nAI Observations: ${liveObservations.join(' ')}` }));
            }
         };
         reader.readAsDataURL(blob);
      };
      localRecorder.start();

    } catch (e) {
      console.error(e);
      alert("Failed to start live session. Ensure microphone permissions are allowed.");
    }
  };

  const stopLiveSession = () => {
     if (liveSessionRef.current) {
       liveSessionRef.current.close();
       liveSessionRef.current = null;
     }

     if (liveStreamRef.current) {
       liveStreamRef.current.getTracks().forEach(t => t.stop());
       liveStreamRef.current = null;
     }
     setLiveStream(null);

     if ((window as any)._liveInterval) {
       clearInterval((window as any)._liveInterval);
       (window as any)._liveInterval = null;
     }

     if ((window as any)._audioProcessor) {
        (window as any)._audioProcessor.disconnect();
        (window as any)._audioProcessor = null;
     }
     if ((window as any)._audioSource) {
        try { (window as any)._audioSource.disconnect(); } catch(e) {}
     }

     if (liveSessionRecorderRef.current && liveSessionRecorderRef.current.state !== 'inactive') {
       liveSessionRecorderRef.current.stop();
     }
     
     setIsLiveActive(false);
     setLiveTranscription("");
     setLiveRiskAlert(null);
  };

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveStreamRef.current) {
        liveStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (liveSessionRef.current) {
        liveSessionRef.current.close();
      }
    };
  }, []);

  // Ensure cleanup when switching away from Live tab
  useEffect(() => {
    if (activeTab !== 'live' && isLiveActive) {
      stopLiveSession();
    }
  }, [activeTab]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          setVoiceNote({ data: base64, mimeType: 'audio/webm' });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- UNIFIED FILE UPLOAD ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsReadingFile(true);
      const newFiles = Array.from(e.target.files) as File[];
      let loadedCount = 0;
      const loaded: {name: string, data: string, mimeType: string}[] = [];

      newFiles.forEach(file => {
        if (file.size > 512 * 1024 * 1024) {
          alert(`File ${file.name} too large (>512MB). Skipped.`);
          loadedCount++;
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const parts = result.split(',');
          // Use browser detected type or infer from extension for common docs
          let mime = file.type;
          
          // Fallback inference if browser gives empty type (common for some office files)
          if (!mime || mime === '') {
             const ext = file.name.split('.').pop()?.toLowerCase();
             if (ext === 'pdf') mime = 'application/pdf';
             else if (ext === 'csv') mime = 'text/csv';
             else if (ext === 'txt') mime = 'text/plain';
             else if (ext === 'xlsx' || ext === 'xls') mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
             else if (ext === 'docx' || ext === 'doc') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
             else if (ext === 'pptx' || ext === 'ppt') mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          }

          loaded.push({
            name: file.name,
            data: parts[1],
            mimeType: mime
          });
          loadedCount++;
          
          if (loadedCount === newFiles.length) {
            setUploadedFiles(prev => [...prev, ...loaded]);
            setIsReadingFile(false);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- URL ---
  const handleAddUrl = () => {
    if (!newUrl) return;
    setSourceUrls([...sourceUrls, newUrl]);
    setNewUrl('');
  };

  // --- HPO ---
  const addHpo = () => setHpoCandidates([...hpoCandidates, { term: '', code: '', probability: 0.5, evidence: [] }]);
  const updateHpo = (idx: number, field: string, val: any) => {
    const next = [...hpoCandidates];
    (next[idx] as any)[field] = val;
    setHpoCandidates(next);
  };
  const removeHpo = (idx: number) => setHpoCandidates(hpoCandidates.filter((_, i) => i !== idx));

  // File Icon Helper
  const getFileIcon = (mime: string, name: string) => {
    if (mime.includes('video')) return <FileVideo size={16} className="text-brand-600 flex-shrink-0" />;
    if (mime.includes('image')) return <ScanText size={16} className="text-orange-500 flex-shrink-0" />;
    if (mime.includes('pdf')) return <FileType size={16} className="text-red-500 flex-shrink-0" />;
    if (mime.includes('spreadsheet') || mime.includes('csv') || name.endsWith('xls')) return <FileSpreadsheet size={16} className="text-green-600 flex-shrink-0" />;
    if (mime.includes('presentation') || name.endsWith('ppt')) return <Presentation size={16} className="text-orange-600 flex-shrink-0" />;
    if (mime.includes('word') || name.endsWith('doc')) return <FileText size={16} className="text-blue-600 flex-shrink-0" />;
    return <File size={16} className="text-gray-500 flex-shrink-0" />;
  };

  const isBusy = isAnalyzing || isReadingFile;

  return (
    <div className={`rounded-xl shadow-sm border flex flex-col h-full overflow-hidden transition-colors duration-500
      ${isEmergency ? 'bg-red-50 border-red-500' : 'bg-white border-clinical-200'}`}>
      
      {showCalmMode && (
        <div className="absolute inset-0 z-[60] bg-blue-900/95 flex flex-col items-center justify-center text-white backdrop-blur-md">
           <div className="w-48 h-48 border-4 border-white/30 rounded-full animate-ping absolute opacity-20"></div>
           <div className="w-32 h-32 bg-blue-400/20 rounded-full animate-pulse flex items-center justify-center mb-8 relative">
              <div className="w-24 h-24 bg-blue-500/40 rounded-full"></div>
           </div>
           <h2 className="text-2xl font-bold mb-2">Breathe In... Breathe Out...</h2>
           <p className="opacity-70 mb-8">Take a moment to center yourself.</p>
           <button onClick={() => setShowCalmMode(false)} className="px-6 py-2 border border-white/50 rounded-full hover:bg-white/10">
             Close Calm Mode
           </button>
        </div>
      )}

      {/* Top Controls */}
      <div className={`p-4 border-b flex flex-col gap-3 ${isEmergency ? 'bg-red-100 border-red-200' : 'bg-clinical-50 border-clinical-100'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-clinical-600 flex items-center gap-2">
              <Globe size={14} className="text-brand-500" /> 
              {currentLanguage}
            </div>
            
            <button 
              onClick={() => setIsEmergency(!isEmergency)}
              className={`text-xs px-2 py-1 rounded font-bold border transition-colors flex items-center gap-1
                ${isEmergency ? 'bg-red-600 text-white border-red-700 animate-pulse' : 'bg-white text-clinical-500 border-clinical-300'}`}
            >
              <Siren size={12} /> {isEmergency ? 'EMERGENCY MODE ON' : 'Emergency Mode'}
            </button>
            
            <button onClick={() => setShowCalmMode(true)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
               <Wind size={12} /> Calm
            </button>
          </div>
          
          <button onClick={clearForm} className="text-xs text-red-500 hover:text-red-700 font-medium">{t('input', 'reset')}</button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
           {Object.keys(DEMO_CASES).map(key => (
             <button 
                key={key} 
                onClick={() => loadDemo(key)} 
                className="flex-shrink-0 text-[10px] py-2 px-3 bg-white border border-clinical-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors flex flex-col items-center min-w-[70px]"
             >
               <span className="font-bold text-clinical-800 capitalize">{key.replace('_', ' ')}</span>
               <span className="text-clinical-500">Demo</span>
             </button>
           ))}
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b shrink-0 overflow-x-auto ${isEmergency ? 'bg-red-50 border-red-200' : 'bg-clinical-50 border-clinical-200'}`}>
        <button 
           id="tour-tab-live"
           onClick={() => setActiveTab('live')} 
           className={`flex-1 min-w-[60px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 
             ${activeTab === 'live' ? 'border-red-500 text-red-600 bg-red-50' : 'border-transparent text-clinical-500 hover:bg-clinical-100'}`}
        >
          <Zap size={16} className={isLiveActive ? "animate-pulse" : ""} />
          <span className="hidden sm:inline uppercase">{t('input', 'tabs').live || "Live"}</span>
        </button>

        {['patient', 'uploads', 'links'].map((tabKey) => (
          <button 
            key={tabKey}
            id={tabKey === 'uploads' ? 'tour-tab-video' : undefined}
            onClick={() => setActiveTab(tabKey as Tab)} 
            className={`flex-1 min-w-[60px] py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 
              ${activeTab === tabKey ? 'border-brand-500 text-brand-700 bg-white' : 'border-transparent text-clinical-500 hover:bg-clinical-100'}`}
          >
            {tabKey === 'patient' && <User size={16} />}
            {tabKey === 'uploads' && <Upload size={16} />}
            {tabKey === 'links' && <LinkIcon size={16} />}
            <span className="hidden sm:inline capitalize">{t('input', 'tabs')[tabKey] || (tabKey === 'uploads' ? "Uploads" : tabKey)}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 min-h-0 bg-white">
        
        {activeTab === 'live' && (
          <div className="h-full flex flex-col items-center justify-start space-y-4 animate-in fade-in">
             {!isLiveActive ? (
                <div className="text-center space-y-4 p-8 border-2 border-dashed border-clinical-200 rounded-xl bg-clinical-50 w-full">
                   <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                     <Eye size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-clinical-900">Start Live Clinical Co-pilot</h3>
                   <p className="text-sm text-clinical-500 max-w-xs mx-auto">
                     {t('live', 'desc')}
                   </p>
                   <button 
                     onClick={startLiveSession}
                     className="bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-red-700 hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                   >
                     <Zap size={18} fill="currentColor" /> {t('live', 'start')}
                   </button>
                </div>
             ) : (
                <div className="w-full relative bg-black rounded-xl overflow-hidden aspect-video shadow-lg group">
                   <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                   <canvas ref={canvasRef} className="hidden" />
                   
                   {/* HUD OVERLAY */}
                   <div className="absolute inset-0 pointer-events-none">
                      {/* Top Bar */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                         <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-2 border border-white/20">
                           <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> 
                           LIVE ANALYSIS ACTIVE
                         </div>
                         <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded border border-white/20 font-mono">
                           AI: INSTRUCTOR MODE
                         </div>
                      </div>

                      {/* Center Reticle */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 border-2 border-white/30 rounded-lg flex flex-col justify-between">
                         <div className="flex justify-between">
                            <div className="w-4 h-4 border-t-2 border-l-2 border-white"></div>
                            <div className="w-4 h-4 border-t-2 border-r-2 border-white"></div>
                         </div>
                         <div className="flex justify-between">
                            <div className="w-4 h-4 border-b-2 border-l-2 border-white"></div>
                            <div className="w-4 h-4 border-b-2 border-r-2 border-white"></div>
                         </div>
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50">
                            <ScanLine size={32} className="animate-pulse opacity-50" />
                         </div>
                      </div>

                      {/* AI Feedback Text Area */}
                      <div className="absolute bottom-20 left-4 right-4 text-center">
                         <div className="inline-block bg-black/70 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10">
                            <p className="text-white font-bold text-lg leading-tight drop-shadow-md">
                              {liveTranscription || "Waiting for observations..."}
                            </p>
                         </div>
                      </div>
                   </div>

                   {liveRiskAlert && (
                     <div className="absolute top-16 left-4 right-4 bg-red-600 text-white p-3 rounded-lg shadow-xl animate-bounce flex items-center gap-2 z-20">
                        <AlertCircle size={24} className="shrink-0" />
                        <span className="font-bold text-sm uppercase">{liveRiskAlert}</span>
                     </div>
                   )}
                   
                   {/* Controls (Pointer Events Re-enabled) */}
                   <button 
                      onClick={stopLiveSession}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-xl transition-transform hover:scale-110 cursor-pointer z-50 pointer-events-auto flex items-center gap-2"
                   >
                     <StopCircle size={24} fill="currentColor" />
                     <span className="font-bold pr-1">STOP & ANALYZE</span>
                   </button>
                </div>
             )}
          </div>
        )}

        {activeTab === 'patient' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs font-bold text-clinical-500 uppercase">{t('input', 'age')}</label>
                 <div className="flex">
                   <input 
                     type="number" 
                     value={patient.age === 0 ? '' : patient.age} 
                     onChange={(e) => setPatient({...patient, age: Number(e.target.value)})} 
                     placeholder="Age"
                     className="w-full p-2 border border-clinical-200 rounded-l-md border-r-0 bg-white text-clinical-900 placeholder:text-clinical-300" 
                   />
                   <select 
                     value={patient.age_unit || 'years'} 
                     onChange={(e) => setPatient({...patient, age_unit: e.target.value as any})}
                     className="p-2 border border-clinical-200 rounded-r-md bg-clinical-50 text-clinical-700 text-sm"
                   >
                     <option value="years">Years</option>
                     <option value="months">Months</option>
                     <option value="days">Days</option>
                   </select>
                 </div>
               </div>
               <div>
                 <label className="text-xs font-bold text-clinical-500 uppercase">{t('input', 'sex')}</label>
                 <select value={patient.sex} onChange={(e) => setPatient({...patient, sex: e.target.value})} className="w-full p-2 border border-clinical-200 rounded-md bg-white text-clinical-900">
                   <option value="male">Male</option>
                   <option value="female">Female</option>
                 </select>
               </div>
             </div>

             <div>
               <label className="text-xs font-bold text-clinical-500 uppercase block mb-1">{t('input', 'note')}</label>
               <textarea 
                 value={patient.note} 
                 onChange={(e) => setPatient({...patient, note: e.target.value})} 
                 rows={5} 
                 className="w-full p-2 border border-clinical-200 rounded-md mb-2 text-sm bg-white text-clinical-900 placeholder:text-clinical-300" 
                 placeholder={t('input', 'notePlaceholder')} 
               />
               <div className={`p-3 rounded-lg border flex items-center justify-between ${isRecording ? 'bg-red-50 border-red-200' : 'bg-clinical-50 border-clinical-200'}`}>
                 <div className="flex items-center gap-3">
                   <button 
                     onClick={isRecording ? stopRecording : startRecording}
                     className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-brand-600 hover:bg-brand-700'}`}
                   >
                     {isRecording ? <StopCircle className="text-white" /> : <Mic className="text-white" />}
                   </button>
                   <div>
                     <div className={`text-sm font-bold ${isRecording ? 'text-red-700' : 'text-clinical-700'}`}>
                       {isRecording ? t('input', 'recording') : t('input', 'record')}
                     </div>
                     <div className="text-[10px] text-clinical-500">
                       {voiceNote ? "Voice note saved" : "Speak clinical details instead of typing"}
                     </div>
                   </div>
                 </div>
                 {voiceNote && <Check className="text-green-500" size={20} />}
               </div>
             </div>

             {/* SYMPTOMS SECTION */}
             <div className="border border-clinical-200 rounded-xl overflow-hidden">
                <div 
                  className="bg-clinical-50 p-4 border-b border-clinical-200 flex items-center justify-between cursor-pointer"
                  onClick={() => setManualSymptoms(!manualSymptoms)}
                >
                   <div className="flex items-center gap-2">
                      <Activity size={18} className="text-brand-500" />
                      <span className="font-bold text-sm text-clinical-800">{t('input', 'tabs').hpo}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${!manualSymptoms ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-600'}`}>
                        {!manualSymptoms ? "Auto-Detect (AI)" : "Manual Entry"}
                      </span>
                      {manualSymptoms ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                   </div>
                </div>
                
                {manualSymptoms ? (
                  <div className="p-4 bg-white space-y-3 animate-in fade-in">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-clinical-500">Add known HPO terms:</span>
                      <button onClick={()=> setHpoCandidates([...hpoCandidates, { term: '', code: '', probability: 0.5, evidence: [] }])} className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded flex items-center gap-1"><Plus size={12}/> Add Term</button>
                    </div>
                    {hpoCandidates.length === 0 && <div className="text-center text-clinical-400 py-4 text-xs italic">List empty. Switch to Auto-Detect if unsure.</div>}
                    {hpoCandidates.map((c, i) => (
                      <div key={i} className="bg-clinical-50 p-2 rounded border flex gap-2">
                         <div className="flex-1 space-y-1">
                           <input className="w-full text-sm p-1 border rounded" placeholder="Term (e.g. Microcephaly)" value={c.term} onChange={e=>{
                             const next = [...hpoCandidates]; next[i].term = e.target.value; setHpoCandidates(next);
                           }} />
                           <input className="w-full text-xs p-1 border rounded font-mono" placeholder="HP:Code (Optional)" value={c.code} onChange={e=>{
                             const next = [...hpoCandidates]; next[i].code = e.target.value; setHpoCandidates(next);
                           }} />
                         </div>
                         <button onClick={()=> setHpoCandidates(hpoCandidates.filter((_,x)=>x!==i))} className="text-clinical-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-brand-50/50 flex items-start gap-3">
                     <BrainCircuit size={20} className="text-brand-500 mt-1" />
                     <div>
                       <p className="text-xs font-bold text-brand-900 mb-1">AI Auto-Extraction Active</p>
                       <p className="text-xs text-brand-700 leading-relaxed">
                         I will analyze your clinical notes and uploaded media to automatically identify symptoms and HPO terms. 
                         <br/><span className="italic opacity-80">Toggle to "Manual" if you want to input specific terms yourself.</span>
                       </p>
                     </div>
                  </div>
                )}
             </div>

             {/* SPEECH SECTION */}
             <div className="border border-clinical-200 rounded-xl overflow-hidden">
                <div 
                  className="bg-clinical-50 p-4 border-b border-clinical-200 flex items-center justify-between cursor-pointer"
                  onClick={() => setManualSpeech(!manualSpeech)}
                >
                   <div className="flex items-center gap-2">
                      <Volume2 size={18} className="text-brand-500" />
                      <span className="font-bold text-sm text-clinical-800">{t('input', 'tabs').speech}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${!manualSpeech ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-600'}`}>
                        {!manualSpeech ? "Auto-Detect (AI)" : "Manual Entry"}
                      </span>
                      {manualSpeech ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                   </div>
                </div>

                {manualSpeech ? (
                  <div className="p-4 bg-white space-y-4 animate-in fade-in">
                     <div className="bg-clinical-50 p-2 rounded text-xs text-clinical-600 mb-2">
                       Only adjust if you have clinical measurements.
                     </div>
                     {[
                       { l: 'Pitch (F0)', k: 'f0_mean', min: 50, max: 500, unit: 'Hz' },
                       { l: 'Articulation', k: 'articulation_score', min: 0, max: 1, step: 0.1, unit: '' }
                     ].map((f: any) => (
                       <div key={f.k}>
                         <label className="text-xs font-bold text-clinical-600 uppercase flex justify-between">
                           {f.l} <span>{(audioFeatures as any)[f.k]} {f.unit}</span>
                         </label>
                         <input type="range" min={f.min} max={f.max} step={f.step||1} value={(audioFeatures as any)[f.k]} onChange={e=>setAudioFeatures({...audioFeatures, [f.k]: Number(e.target.value)})} className="w-full" />
                       </div>
                     ))}
                     <div>
                       <label className="text-xs font-bold text-clinical-600 uppercase">Speech Rate</label>
                       <div className="flex gap-1 mt-1">
                         {['low','normal','high'].map(v => (
                           <button key={v} onClick={()=>setAudioFeatures({...audioFeatures, speech_rate: v})} className={`flex-1 py-1 text-xs capitalize border rounded ${audioFeatures.speech_rate===v?'bg-brand-600 text-white':'bg-white'}`}>{v}</button>
                         ))}
                       </div>
                     </div>
                  </div>
                ) : (
                  <div className="p-4 bg-brand-50/50 flex items-start gap-3">
                     <BrainCircuit size={20} className="text-brand-500 mt-1" />
                     <div>
                       <p className="text-xs font-bold text-brand-900 mb-1">AI Voice Analysis Active</p>
                       <p className="text-xs text-brand-700 leading-relaxed">
                         I will listen to audio files or uploaded videos to detect speech abnormalities (slurring, rate, pitch) automatically.
                       </p>
                     </div>
                  </div>
                )}
             </div>

          </div>
        )}

        {/* UNIFIED UPLOADS TAB */}
        {activeTab === 'uploads' && (
          <div className="space-y-4 animate-in fade-in h-full flex flex-col">
            <div className="bg-brand-50 p-4 rounded-lg border border-brand-200 text-sm text-brand-800">
              <Upload size={18} className="inline mr-2" /> <strong>Universal Upload:</strong> Add PDF, Excel, Word, PowerPoint, Videos, or Images. I will analyze them all.
            </div>
            
            <div className={`flex-grow border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 relative ${uploadedFiles.length > 0 ? 'border-brand-500 bg-brand-50' : 'border-clinical-300'}`}>
               <input type="file" ref={fileInputRef} multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isBusy} />
               
               {isReadingFile ? <Loader2 className="animate-spin text-brand-500" size={32} /> : 
                uploadedFiles.length > 0 ? (
                  <div className="w-full space-y-2">
                    <div className="text-center mb-2 font-bold text-brand-900 flex items-center justify-center gap-2">
                       <File size={16} /> Attached Files ({uploadedFiles.length})
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-brand-200 shadow-sm">
                           <div className="flex items-center gap-2 truncate">
                             {getFileIcon(file.mimeType, file.name)}
                             <span className="text-xs font-medium text-gray-700 truncate max-w-[150px]">{file.name}</span>
                           </div>
                           <button onClick={(e) => {e.stopPropagation(); removeFile(idx);}} className="text-red-500 hover:text-red-700">
                             <X size={14} />
                           </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-center text-brand-600 mt-1">Automatic OCR & Universal Document Analysis Enabled</p>
                  </div>
                ) : (
                  <div className="text-center text-clinical-400 pointer-events-none">
                    <Upload size={32} className="mx-auto mb-2" />
                    <p>{t('input', 'upload')}</p>
                    <p className="text-[10px] text-clinical-300 mt-2">All Formats: PDF, Excel, Word, PPT, Video</p>
                    <p className="text-[10px] font-bold text-brand-500 mt-1">Intelligent Type Detection</p>
                  </div>
                )}
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-amber-700 text-xs">
              <AlertCircle size={16} />
              <span>Large files (>512MB) may take longer to process.</span>
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex gap-2">
              <input type="url" value={newUrl} onChange={e=>setNewUrl(e.target.value)} placeholder="https://" className="flex-1 p-2 border rounded text-sm" />
              <button onClick={handleAddUrl} className="bg-brand-600 text-white px-3 rounded text-sm">{t('input', 'add')}</button>
            </div>
            {sourceUrls.map((u, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-2 bg-clinical-50 rounded border">
                 <span className="truncate flex-1">{u}</span>
                 <button onClick={()=>setSourceUrls(sourceUrls.filter((_,x)=>x!==i))}><Trash2 size={14} className="text-clinical-400" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`p-4 border-t space-y-3 ${isEmergency ? 'border-red-200 bg-red-50' : 'border-clinical-100'}`}>
        
        <button 
          id="tour-btn-analyze"
          onClick={handleAnalyze} 
          disabled={isBusy || !isOnline}
          className={`w-full py-3 rounded-lg font-bold text-white shadow-md flex items-center justify-center gap-2 
             ${isBusy||!isOnline ? 'bg-clinical-400': isEmergency ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-brand-600 hover:bg-brand-700'}`}
        >
          {isBusy ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
          {isBusy ? t('input', 'analyzing') : `${t('input', 'analyze')} (${currentLanguage})`}
        </button>
      </div>
    </div>
  );
};
