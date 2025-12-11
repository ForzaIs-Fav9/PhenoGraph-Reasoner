
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Link2, RefreshCcw, Paperclip, File, Brain, Sparkles, Mic, MicOff, Activity, Volume2, ScanText, FileText, FileSpreadsheet, Presentation, FileType, FileVideo } from 'lucide-react';
import { createChatSession } from '../services/geminiService';
import { ChatMessage, WebSource, AppSettings } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality, GenerateContentResponse } from '@google/genai';
import { generateId } from '../utils';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (section: string, key: string) => string;
  settings: AppSettings;
}

// --- Audio Utils for Live API ---
const floatTo16BitPCM = (input: Float32Array) => {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
};

const base64ToFloat32Array = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
};

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, t, settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I am PhenoGraph Assistant. Upload any file (handwriting, video, Excel, Word, PPT) and I will analyze it automatically.",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<{name: string, mimeType: string, data: string}[]>([]);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  
  // --- Live Voice State ---
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs for Text Chat
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs for Live Audio
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<{buffer: AudioBuffer, duration: number}[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);
  const currentSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize Standard Chat
  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
      try {
        const memory = settings.chatMemory ? localStorage.getItem('phenograph_chat_context') || "" : undefined;
        chatSessionRef.current = createChatSession(settings, memory);
      } catch (e) {
        console.error("Failed to init chat", e);
      }
    }
    // Cleanup Live Session on Close
    if (!isOpen) {
      stopLiveSession();
    }
  }, [isOpen, settings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, expandedThoughts, voiceStatus]);

  // --- Live API Implementation ---
  const startLiveSession = async () => {
    if (!process.env.API_KEY) return alert("API Key Missing");

    try {
      setIsVoiceActive(true);
      setVoiceStatus("Connecting to Gemini Live...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Audio Contexts
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }); // Output rate
      audioContextRef.current = audioCtx;
      
      // Visualizer
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      analyserRef.current = analyser;
      drawVisualizer();

      // Input Processing (16kHz for API)
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      inputSourceRef.current = source;
      processorRef.current = processor;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Tools for Live Mode
      const tools: any[] = [];
      if (settings.enableInternet) tools.push({ googleSearch: {} });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: settings.customSystemPrompt || "You are PhenoGraph, an advanced clinical AI assistant. Speak professionally but warmly. Be concise.",
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          tools: tools,
          inputAudioTranscription: {}, // Transcribe user input (no model needed)
          outputAudioTranscription: {} // Transcribe bot output
        },
        callbacks: {
          onopen: () => {
             setVoiceStatus("Listening...");
             // Connect Mic Stream
             processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                // Simple VAD visual feedback
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
                const rms = Math.sqrt(sum/inputData.length);
                setAudioLevel(prev => (prev * 0.8) + (rms * 10)); // Smooth level

                const pcm16 = floatTo16BitPCM(inputData);
                const bytes = new Uint8Array(pcm16.buffer);
                const blob = btoa(String.fromCharCode(...new Uint8Array(bytes.buffer))); // Simple base64 for stream
                
                sessionPromise.then(session => session.sendRealtimeInput({ 
                  media: { mimeType: 'audio/pcm', data: blob } 
                }));
             };
             source.connect(processor);
             processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             // 1. Handle Audio Output
             const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (audioData) {
               playAudioChunk(audioData);
             }

             // 2. Handle Interruption
             if (msg.serverContent?.interrupted) {
               console.log("Interrupted by user");
               cancelAudioQueue();
             }

             // 3. Handle Transcriptions (User & Model)
             if (msg.serverContent?.modelTurn?.parts[0]?.text) {
                // Model text accumulation handled via state updates if needed
             }

             // 4. Turn Complete - Add to Chat History
             if (msg.serverContent?.turnComplete) {
                // ...
             }
             
             // Check explicit transcription fields
             const userTrans = msg.serverContent?.inputTranscription?.text;
             if (userTrans) {
                setMessages(prev => [...prev, {
                  id: generateId(),
                  role: 'user',
                  text: userTrans,
                  timestamp: Date.now()
                }]);
             }
             const modelTrans = msg.serverContent?.outputTranscription?.text;
             if (modelTrans) {
                 // Debounce/Aggregate model text? For now, append.
                 setMessages(prev => {
                   const last = prev[prev.length-1];
                   if (last?.role === 'model' && Date.now() - last.timestamp < 3000) {
                      return prev.map((m, i) => i === prev.length - 1 ? { ...m, text: m.text + modelTrans } : m);
                   }
                   return [...prev, {
                     id: generateId(),
                     role: 'model',
                     text: modelTrans,
                     timestamp: Date.now()
                   }];
                 });
             }
          },
          onclose: () => {
            setVoiceStatus("Disconnected");
            setIsVoiceActive(false);
          },
          onerror: (e) => {
            console.error(e);
            setVoiceStatus("Connection Error");
            setIsVoiceActive(false);
          }
        }
      });

      liveSessionRef.current = await sessionPromise;

    } catch (e) {
      console.error(e);
      alert("Failed to start Live Mode");
      setIsVoiceActive(false);
    }
  };

  const playAudioChunk = async (base64: string) => {
     if (!audioContextRef.current) return;
     const ctx = audioContextRef.current;
     
     const float32 = base64ToFloat32Array(base64);
     const buffer = ctx.createBuffer(1, float32.length, 24000);
     buffer.getChannelData(0).set(float32);
     
     audioQueueRef.current.push({ buffer, duration: buffer.duration });
     
     if (!isPlayingRef.current) {
       playNextChunk();
     }
  };

  const playNextChunk = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }
    
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const { buffer, duration } = audioQueueRef.current.shift()!;
    isPlayingRef.current = true;
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    // Connect to visualizer
    if (analyserRef.current) source.connect(analyserRef.current);

    const currentTime = ctx.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    
    source.start(startTime);
    nextStartTimeRef.current = startTime + duration;
    currentSourceNodeRef.current = source;
    
    source.onended = () => {
       playNextChunk();
    };
  };

  const cancelAudioQueue = () => {
     audioQueueRef.current = [];
     if (currentSourceNodeRef.current) {
       currentSourceNodeRef.current.stop();
       currentSourceNodeRef.current = null;
     }
     isPlayingRef.current = false;
     nextStartTimeRef.current = 0; // Reset timeline
     if (audioContextRef.current) nextStartTimeRef.current = audioContextRef.current.currentTime;
  };

  const stopLiveSession = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
       // disconnect
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    setIsVoiceActive(false);
    setVoiceStatus("");
    setAudioLevel(0);
  };

  const drawVisualizer = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume for visual
    let sum = 0;
    for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
    const avg = sum / dataArray.length;
    
    // Update state occasionally to drive React UI if needed, or just use ref
    // Using state 'audioLevel' for the simplified UI visualizer
    // We update audioLevel from input processing, but we can also add output level
    if (avg > 10) setAudioLevel(prev => Math.max(prev, avg / 5)); // Boost visual

    animationFrameRef.current = requestAnimationFrame(drawVisualizer);
  };

  // --- Normal Chat Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        
        let mime = file.type;
        // Basic Mime Inference if missing
        if (!mime || mime === '') {
           const ext = file.name.split('.').pop()?.toLowerCase();
           if (ext === 'pdf') mime = 'application/pdf';
           else if (ext === 'csv') mime = 'text/csv';
           else if (ext === 'txt') mime = 'text/plain';
           else if (ext === 'xlsx' || ext === 'xls') mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
           else if (ext === 'docx' || ext === 'doc') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
           else if (ext === 'pptx' || ext === 'ppt') mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        }

        setAttachments(prev => [...prev, {
          name: file.name,
          mimeType: mime,
          data: base64
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const getFileIcon = (mime: string, name: string) => {
    if (mime.includes('video')) return <FileVideo size={24} className="text-brand-600" />;
    if (mime.includes('image')) return <ScanText size={24} className="text-orange-500" />;
    if (mime.includes('pdf')) return <FileType size={24} className="text-red-500" />;
    if (mime.includes('spreadsheet') || mime.includes('csv') || name.endsWith('xls')) return <FileSpreadsheet size={24} className="text-green-600" />;
    if (mime.includes('presentation') || name.endsWith('ppt')) return <Presentation size={24} className="text-orange-600" />;
    if (mime.includes('word') || name.endsWith('doc')) return <FileText size={24} className="text-blue-600" />;
    return <File size={24} className="text-gray-500" />;
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || isTyping || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text: inputValue + (attachments.length > 0 ? `\n[Attached ${attachments.length} file(s)]` : ""),
      timestamp: Date.now(),
      attachments: attachments.map(a => ({ name: a.name, mimeType: a.mimeType }))
    };

    setMessages(prev => [...prev, userMsg]);
    // Save to memory if enabled
    if (settings.chatMemory) {
       const existing = localStorage.getItem('phenograph_chat_context') || "";
       localStorage.setItem('phenograph_chat_context', existing + `\nUser: ${inputValue}`);
    }

    const currentAttachments = [...attachments];
    setInputValue("");
    setAttachments([]);
    setIsTyping(true);

    try {
      let apiMessage: any = inputValue;
      if (currentAttachments.length > 0) {
        apiMessage = [];
        if (inputValue.trim()) {
           apiMessage.push({ text: inputValue });
        } else {
           apiMessage.push({ text: "Analyze the attached file(s)." });
        }
        currentAttachments.forEach(att => {
          apiMessage.push({
            inlineData: { mimeType: att.mimeType, data: att.data }
          });
        });
      }

      await processChatResponse(apiMessage);

    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'model',
        text: "I encountered an error connecting. Please try again.",
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const processChatResponse = async (messageContent: any) => {
    if (!chatSessionRef.current) return;

    const resultStream = await chatSessionRef.current.sendMessageStream({ message: messageContent });
    
    const botMsgId = generateId();
    let fullTextRaw = "";
    const sources: WebSource[] = [];

    setMessages(prev => [...prev, {
      id: botMsgId,
      role: 'model',
      text: "",
      timestamp: Date.now()
    }]);

    if (settings.transparentReasoning) {
      setExpandedThoughts(prev => ({ ...prev, [botMsgId]: true }));
    }

    for await (const chunk of resultStream) {
         const c = chunk as GenerateContentResponse;
         
         if (c.text) {
             fullTextRaw += c.text;
         }
         
         if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            c.candidates[0].groundingMetadata.groundingChunks.forEach((gc: any) => {
               if (gc.web?.uri && gc.web?.title) {
                 if (!sources.some(s => s.uri === gc.web.uri)) {
                    sources.push({ title: gc.web.title, uri: gc.web.uri });
                 }
               }
            });
         }

         let displayThought = "";
         let displayText = fullTextRaw;
         const thoughtMatch = fullTextRaw.match(/<thinking>([\s\S]*?)<\/thinking>/);
         if (thoughtMatch) {
            displayThought = thoughtMatch[1].trim();
            displayText = fullTextRaw.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
         }

         setMessages(prev => prev.map(m => m.id === botMsgId ? { 
           ...m, 
           text: displayText, 
           thinking: displayThought,
           sources: sources.length > 0 ? sources : undefined 
         } : m));
    }
      
    if (settings.chatMemory && fullTextRaw) {
      const existing = localStorage.getItem('phenograph_chat_context') || "";
      localStorage.setItem('phenograph_chat_context', existing + `\nAssistant: ${fullTextRaw}`);
    }
  };
  
  const handleClear = () => {
    if(confirm("Clear conversation history?")) {
      setMessages([]);
      localStorage.removeItem('phenograph_chat_context');
      chatSessionRef.current = createChatSession(settings);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] border border-clinical-200 overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="p-4 border-b border-clinical-100 flex justify-between items-center bg-brand-600 text-white shadow-md z-20">
          <div className="flex items-center gap-3">
             <Bot size={24} />
             <div>
                <h3 className="font-bold">PhenoGraph AI</h3>
                <p className="text-[10px] opacity-80 flex items-center gap-1">
                  {isVoiceActive ? <><Activity size={10} className="animate-pulse" /> Live Voice Mode</> : "Connected | Pro Vision Enabled"}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleClear} className="p-2 hover:bg-white/20 rounded-lg transition-colors" title="Reset Chat">
               <RefreshCcw size={18}/>
            </button>
            <button onClick={onClose}><X size={20}/></button>
          </div>
        </div>

        {/* Live Voice Overlay */}
        {isVoiceActive && (
          <div className="absolute inset-x-0 top-16 bottom-20 z-10 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
             <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Visualizer Orbs */}
                <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-2xl animate-pulse" style={{ transform: `scale(${1 + audioLevel/50})` }}></div>
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3s' }}></div>
                
                <div className="relative z-10 w-32 h-32 bg-gradient-to-br from-brand-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl transition-transform" style={{ transform: `scale(${1 + audioLevel/30})` }}>
                   <Mic size={48} className="text-white" />
                </div>
             </div>
             
             <div className="mt-8 text-center">
               <h3 className="text-2xl font-bold text-gray-800 mb-2">{voiceStatus}</h3>
               <p className="text-gray-500 text-sm">You can interrupt at any time.</p>
             </div>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
           {messages.map(msg => (
             <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-clinical-700 text-white' : 'bg-brand-100 text-brand-700'}`}>
                   {msg.role === 'user' ? <User size={16} /> : <Brain size={16} />}
                </div>
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap ${msg.role==='user'?'bg-clinical-700 text-white':'bg-white text-gray-800 border'}`}>
                     {msg.text}
                     {msg.isError && <span className="block mt-2 text-red-300 font-bold">Error connecting to server.</span>}
                  </div>
                  
                  {msg.thinking && (
                     <div className="text-[10px] text-gray-500 bg-gray-100 p-2 rounded-lg border border-gray-200">
                        <span className="font-bold uppercase tracking-wider text-gray-400 mb-1 block flex items-center gap-1">
                          <Sparkles size={10} /> Thought Process
                        </span>
                        {msg.thinking}
                     </div>
                  )}

                  {msg.sources && msg.sources.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-1">
                        {msg.sources.map((s, i) => (
                           <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors">
                              <Link2 size={10} /> {s.title}
                           </a>
                        ))}
                     </div>
                  )}

                  {msg.generatedMedia && msg.generatedMedia.map((m,i) => (
                     <div key={i} className="mt-2 rounded-lg overflow-hidden border border-gray-200 shadow-md">
                        {m.type === 'image' ? (
                           <img src={`data:${m.mimeType};base64,${m.data}`} className="w-full h-auto" />
                        ) : (
                           <video src={`data:${m.mimeType};base64,${m.data}`} controls className="w-full h-auto" />
                        )}
                        <div className="bg-black text-white text-[10px] p-1 text-center font-mono">
                           Generated by {m.type === 'image' ? 'Gemini 3 Pro Image' : 'Veo 3.1 Pro'}
                        </div>
                     </div>
                  ))}
                </div>
             </div>
           ))}
           
           {isTyping && !isVoiceActive && (
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                  <Brain size={16} />
                </div>
                <div className="bg-white border px-4 py-3 rounded-2xl shadow-sm flex items-center gap-2">
                   <Loader2 size={16} className="animate-spin text-brand-500" />
                   <span className="text-sm text-gray-500">
                     Thinking...
                   </span>
                </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-2 z-20">
           
           {attachments.length > 0 && (
             <div className="flex gap-2 overflow-x-auto py-2">
               {attachments.map((att, i) => (
                 <div key={i} className="relative group shrink-0">
                   <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex flex-col items-center justify-center overflow-hidden">
                      {getFileIcon(att.mimeType, att.name)}
                   </div>
                   <button 
                     onClick={() => removeAttachment(i)}
                     className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                   >
                     <X size={12} />
                   </button>
                 </div>
               ))}
             </div>
           )}

           <div className="relative flex items-center gap-2">
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               multiple 
               onChange={handleFileSelect}
             />
             
             {/* Unified Paperclip for all uploads */}
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors relative group"
                title="Attach Files (Video, Audio, PDF, Word, Excel, PPT)"
                disabled={isVoiceActive}
             >
                <Paperclip size={18} />
             </button>

             {/* Live Voice Button */}
             <button 
                onClick={isVoiceActive ? stopLiveSession : startLiveSession} 
                className={`p-3 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2
                  ${isVoiceActive ? 'bg-red-500 text-white animate-pulse w-full' : 'bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-600'}`}
             >
                {isVoiceActive ? (
                  <>
                    <MicOff size={18} /> <span className="font-bold">End Live Session</span>
                  </>
                ) : (
                  <Mic size={18} />
                )}
             </button>
             
             {!isVoiceActive && (
               <>
                 <input
                   type="text"
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                   placeholder="Ask, or describe uploaded files..."
                   className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                 />
                 <button 
                   onClick={handleSend} 
                   disabled={!inputValue && attachments.length === 0}
                   className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
                 >
                   <Send size={18} />
                 </button>
               </>
             )}
           </div>
           
           {!isVoiceActive && (
             <div className="text-[10px] text-gray-400 text-center">
               Pro tip: Tap the Mic to enter Live Mode for a fluid, hands-free conversation.
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
