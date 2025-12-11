
import React, { useState, useEffect } from 'react';
import { PhenoGraphOutput } from '../types';
import { ConditionCard } from './ConditionCard';
import { chatAboutReport } from '../services/geminiService';
import { AlertTriangle, FileText, Activity, User, Info, Clock, PlayCircle, Globe, ExternalLink, HeartHandshake, MessageCircle, Volume2, StopCircle, Download, ArrowLeft, TrendingUp, TrendingDown, Minus, Lightbulb, CameraOff, Calendar, Send, Edit, Printer, BookOpen, Loader2, ShieldCheck, ShieldAlert, XCircle, BrainCircuit, GitCompare, EyeOff, HelpCircle, FileDown } from 'lucide-react';

interface ReportViewProps {
  data: PhenoGraphOutput | null;
  onBack: () => void;
  onRefine: (additionalInfo: string) => void;
  t: (section: string, key: string) => string;
  isLoading?: boolean; // New prop for global loading state
}

export const ReportView: React.FC<ReportViewProps> = ({ data, onBack, onRefine, t, isLoading = false }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const [editableSummary, setEditableSummary] = useState(data?.patient_friendly_summary || "");
  const [editableNote, setEditableNote] = useState(data?.patient.note || "");
  const [storyContent, setStoryContent] = useState("");

  // Follow-up state
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isRefining, setIsRefining] = useState(false);

  // Update local state if data changes
  useEffect(() => {
     if (data) {
       setEditableSummary(data.patient_friendly_summary || "");
       setEditableNote(data.patient.note || "");
       setStoryContent("");
       
       // Reset local refining state (as we have received new data)
       setIsRefining(false);

       // Trigger follow-up modal if questions exist and we are not currently waiting for a refinement
       if (data.follow_up_questions && data.follow_up_questions.length > 0) {
         setShowFollowUp(true);
         setAnswers({}); // Clear previous answers for new questions
       } else {
         setShowFollowUp(false);
       }
     }
  }, [data]);

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleExportJSON = () => {
    if (!data) return;
    const exportData = { ...data, patient_friendly_summary: editableSummary, patient: { ...data.patient, note: editableNote } };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phenograph-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content-wrapper');
    if (!element) return;

    setIsGeneratingPDF(true);
    // Slight delay to allow React to render any expanded sections (like logic details)
    await new Promise(resolve => setTimeout(resolve, 100));

    const opt = {
      margin: [10, 10], // top, left, bottom, right
      filename: `PhenoGraph_Analysis_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // Re-query in case of re-render
      const el = document.getElementById('report-content-wrapper');
      // @ts-ignore
      await window.html2pdf().set(opt).from(el).save();
    } catch (e) {
      console.error("PDF Generation failed", e);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleStoryMode = async () => {
    if (!data) return;
    // Toggle off if already showing
    if (storyContent) {
      setStoryContent("");
      return;
    }
    
    setIsChatLoading(true);
    try {
      const resp = await chatAboutReport(data, "Explain this report to me like a gentle narrative story for a family member.", []);
      setStoryContent(resp || "Could not generate story.");
    } catch (e) {
      setStoryContent("Failed to generate story due to connection error.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !data) return;
    setIsChatLoading(true);
    setChatResponse(null);
    try {
      const resp = await chatAboutReport(data, chatInput, []);
      setChatResponse(resp);
    } catch (e) {
      setChatResponse("Failed to get answer. Please try again.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSubmitRefinement = () => {
    if (!data?.follow_up_questions) return;
    
    const qaPairs = data.follow_up_questions.map((q, i) => {
      const ans = answers[i];
      return ans ? `Q: ${q}\nA: ${ans}` : null;
    }).filter(Boolean);

    if (qaPairs.length > 0) {
      setIsRefining(true);
      onRefine(qaPairs.join('\n'));
    } else {
      setShowFollowUp(false); // No answers given, just close
    }
  };

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-clinical-400 p-8 text-center bg-white rounded-xl shadow-sm border border-clinical-200">
        <Activity size={48} className="mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-clinical-500">No Report Generated</h3>
        <p className="max-w-md mx-auto mt-2 text-sm text-clinical-400 mb-6">
          Please go back and input patient data to start an analysis.
        </p>
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
          <ArrowLeft size={16} /> Go to Input
        </button>
      </div>
    );
  }

  const getTrustLevelBadge = () => {
    const level = data.reasoning_metadata?.trust_level || 'Caution';
    if (level === 'Safe') return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200"><ShieldCheck size={14} /> Safe to act on</span>;
    if (level === 'Expert Review') return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200"><XCircle size={14} /> Expert Review Needed</span>;
    return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold border border-amber-200"><ShieldAlert size={14} /> Use with Caution</span>;
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-clinical-200 overflow-hidden relative">
      
      {/* FOLLOW UP MODAL OVERLAY */}
      {showFollowUp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-8 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-clinical-100 text-center">
                 <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3 text-brand-600">
                    <HelpCircle size={24} />
                 </div>
                 <h2 className="text-xl font-bold text-clinical-900">Refining Analysis</h2>
                 <p className="text-clinical-600 text-sm mt-1">Please answer these clarifying questions to improve accuracy.</p>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                 {data.follow_up_questions?.map((q, i) => (
                   <div key={i} className="space-y-2">
                      <label className="font-bold text-clinical-800 text-sm block leading-snug">{q}</label>
                      <textarea 
                        className="w-full p-3 border border-clinical-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-y min-h-[80px]"
                        placeholder="Type answer here..."
                        value={answers[i] || ""}
                        onChange={(e) => setAnswers(prev => ({...prev, [i]: e.target.value}))}
                      />
                   </div>
                 ))}
              </div>

              <div className="p-4 border-t border-clinical-100 bg-clinical-50 rounded-b-xl flex gap-3 shrink-0">
                 <button 
                   onClick={() => setShowFollowUp(false)}
                   className="flex-1 py-3 text-clinical-500 font-medium hover:bg-clinical-100 rounded-lg transition-colors text-sm"
                 >
                   Skip / I don't know
                 </button>
                 <button 
                   onClick={handleSubmitRefinement}
                   disabled={isRefining}
                   className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isRefining ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                   {isRefining ? "Re-analyzing..." : "Submit Answers"}
                 </button>
              </div>
           </div>
        </div>
      )}
      
      {/* Background Refinement Indicator (If modal dismissed or closed but loading persists) */}
      {!showFollowUp && isLoading && (
         <div className="bg-brand-50 border-b border-brand-100 p-2 text-center text-xs font-bold text-brand-700 flex items-center justify-center gap-2 animate-pulse">
            <Loader2 size={12} className="animate-spin" /> Updating Analysis with new information...
         </div>
      )}
      
      <div className="bg-white border-b border-clinical-100 p-4 flex items-center justify-between shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-clinical-600 hover:text-brand-600 transition-colors font-medium text-sm">
          <ArrowLeft size={18} /> {t('report', 'back')}
        </button>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border ${isEditing ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-clinical-600 border-clinical-200 hover:bg-clinical-50'}`}>
             <Edit size={14} /> {isEditing ? "Done Editing" : "Edit"}
           </button>
           
           <button 
             onClick={handleDownloadPDF} 
             disabled={isGeneratingPDF}
             className="flex items-center gap-1 text-xs font-bold text-clinical-600 hover:text-clinical-800 bg-white px-3 py-1.5 rounded-lg transition-colors border border-clinical-200 hover:bg-clinical-50 disabled:opacity-50"
           >
             {isGeneratingPDF ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} 
             {isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
           </button>

           <button onClick={handleExportJSON} className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 px-3 py-1.5 rounded-lg transition-colors border border-brand-100">
             <Download size={14} /> {t('report', 'export')}
           </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-clinical-50/50">
        {/* WRAPPER FOR PDF GENERATION - ENSURES FULL HEIGHT IS CAPTURED */}
        <div id="report-content-wrapper" className="space-y-6">

          {/* FAKE / AI MEDIA WARNING */}
          {data.quality_check?.media_authenticity === 'Suspected AI/Fake' && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-red-900 animate-in fade-in slide-in-from-top-2 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={24} />
                <div>
                  <h2 className="text-base font-bold mb-1">SUSPECTED AI-GENERATED MEDIA</h2>
                  <p className="text-sm mb-2 font-medium">The uploaded media shows signs of being fake or AI-generated (warping, deepfake artifacts). Analysis may be invalid.</p>
                  <div className="text-xs bg-white/50 p-2 rounded font-mono border border-red-200">
                    Reasoning: {data.quality_check.authenticity_reasoning || "Detected unnatural visual/audio artifacts."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEXT ONLY MODE INDICATOR */}
          {data.quality_check?.media_relevance === 'None' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 animate-in fade-in slide-in-from-top-2 shadow-sm mb-4">
              <div className="flex items-start gap-3">
                <FileText className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h2 className="text-sm font-bold mb-1">Text-Only Analysis</h2>
                  <p className="text-xs">No media given, only text analysis has been done based on your provided history.</p>
                </div>
              </div>
            </div>
          )}

          {/* IRRELEVANT MEDIA WARNING */}
          {data.quality_check?.media_relevance === 'Irrelevant' && (
            <div className="p-4 bg-gray-100 border border-gray-300 rounded-xl text-gray-800 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <EyeOff className="text-gray-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h2 className="text-sm font-bold mb-1">Media Ignored (Irrelevant)</h2>
                  <p className="text-xs">The uploaded files did not contain clear clinical information. Analysis proceeded based on your text notes only.</p>
                </div>
              </div>
            </div>
          )}

          {/* Missing Data Warning */}
          {data.missing && data.missing.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h2 className="text-sm font-bold mb-1">Incomplete Clinical Data Detected</h2>
                  <p className="text-xs mb-2 leading-relaxed">The analysis was performed with partial information. <strong>Predictions may be significantly less accurate due to missing context.</strong></p>
                  {data.missing.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Missing Fields:</span>
                      <ul className="list-disc list-inside bg-white/60 p-2 rounded border border-amber-100 mt-1 text-xs font-mono text-amber-800">
                        {data.missing.map((field, i) => <li key={i}>{field}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Quality Check Warning (General) */}
          {data.quality_check && !data.quality_check.usable && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-900 animate-in fade-in">
              <div className="flex items-start gap-3">
                <CameraOff className="text-orange-600 shrink-0 mt-0.5" size={20} />
                <div>
                    <h2 className="text-sm font-bold mb-1">Media Quality Issues Detected</h2>
                    <p className="text-xs mb-2">The video/audio quality may have impacted analysis accuracy.</p>
                    <ul className="list-disc list-inside text-xs font-mono">
                      {data.quality_check.issues?.map((iss,i)=> <li key={i}>{iss}</li>)}
                    </ul>
                </div>
              </div>
            </div>
          )}

          {/* Patient Header */}
          <div className="bg-white p-5 rounded-xl border border-clinical-200 shadow-sm flex flex-col md:flex-row items-start justify-between relative overflow-hidden gap-4">
            <div className="flex items-start gap-4 z-10 max-w-2xl w-full">
              <div className="p-3 bg-brand-100 text-brand-700 rounded-lg shrink-0">
                <User size={24} />
              </div>
              <div className="w-full">
                <h2 className="text-lg font-bold text-clinical-900">{t('report', 'summary')}</h2>
                <div className="flex items-center gap-4 text-sm text-clinical-500 mt-1">
                  <span>Age: <span className="font-medium text-clinical-800">{data.patient.age} {data.patient.age_unit || 'years'}</span></span>
                  <span>Sex: <span className="font-medium text-clinical-800 capitalize">{data.patient.sex}</span></span>
                </div>
                {isEditing ? (
                  <textarea className="mt-2 w-full p-2 border border-brand-300 rounded-md text-sm bg-brand-50" rows={3} value={editableNote} onChange={(e) => setEditableNote(e.target.value)} />
                ) : (
                  <p className="mt-2 text-sm text-clinical-600 italic border-l-2 border-brand-200 pl-3">"{editableNote}"</p>
                )}
              </div>
            </div>
            
            <div className="w-full md:w-auto flex flex-col md:items-end gap-2 z-10">
              <div className="flex flex-col md:items-end">
                <div className="text-xs font-semibold text-clinical-400 uppercase tracking-wider">{t('report', 'confidence')}</div>
                <div className="flex items-end justify-end gap-1">
                  <span className={`text-3xl font-bold leading-none ${data.low_confidence ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {data.overall_confidence ? (data.overall_confidence * 100).toFixed(0) : 0}
                  </span>
                  <span className="text-sm font-medium text-clinical-400 mb-1">%</span>
                </div>
              </div>
              {data.confidence_explanation && (
                <div className="bg-clinical-50 p-3 rounded-lg border border-clinical-100 text-xs text-clinical-600 max-w-xs md:text-right">
                  <div className="flex items-center gap-1 font-bold text-clinical-800 mb-1 md:justify-end"><Lightbulb size={12} className="text-amber-500" /> Analysis Logic</div>
                  {data.confidence_explanation}
                </div>
              )}
              
              {/* Trust Level Report Badge */}
              <div className="mt-1">{getTrustLevelBadge()}</div>
            </div>
          </div>

          {/* CLINICAL LOGIC & SAFETY SECTION (NEW) */}
          {data.reasoning_metadata && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedReasoning(!expandedReasoning)}>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider">
                  <BrainCircuit size={16} className="text-slate-600" /> Clinical Logic & Safety Report
                </h3>
                <button className="text-xs text-brand-600 font-medium hover:underline">
                  {expandedReasoning ? "Hide Details" : "Explain Reasoning"}
                </button>
              </div>
              
              {/* Always expand for PDF generation if needed, but keeping toggle for UX */}
              {(expandedReasoning || isGeneratingPDF) && (
                <div className="mt-4 space-y-4 animate-in fade-in">
                    
                    {/* Chain of Thought */}
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1"><GitCompare size={12} /> Chain of Thought</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        {data.reasoning_metadata.chain_of_thought.map((step, i) => (
                          <li key={i} className="text-xs text-slate-600 leading-relaxed">{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Alternates */}
                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                          <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Alternates Ruled Out</h4>
                          <ul className="space-y-2">
                            {data.reasoning_metadata.alternate_possibilities.map((alt, i) => (
                              <li key={i} className="text-xs text-slate-600 border-b border-slate-100 last:border-0 pb-1 last:pb-0">
                                <span className="font-bold text-slate-800 block">{alt.name}</span>
                                <span className="italic">{alt.rule_out_reason}</span>
                              </li>
                            ))}
                          </ul>
                      </div>

                      {/* Counterarguments & Bias */}
                      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Why Might This Be Wrong?</h4>
                            <p className="text-xs text-slate-600 italic border-l-2 border-red-300 pl-2">
                              "{data.reasoning_metadata.counterarguments}"
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Bias Check</h4>
                            <p className="text-xs text-slate-600 border-l-2 border-blue-300 pl-2">
                              {data.reasoning_metadata.bias_check}
                            </p>
                          </div>
                      </div>
                    </div>
                    
                    {/* Error Triggers */}
                    {data.reasoning_metadata.error_triggers.length > 0 && (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-xs text-red-800">
                          <span className="font-bold">Error Triggers:</span> {data.reasoning_metadata.error_triggers.join(", ")}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* PROGNOSIS SECTION */}
          {data.prognosis && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-purple-900 uppercase tracking-wider mb-3"><Calendar size={16} className="text-purple-600" /> Projected Trajectory</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <div className="text-xs text-purple-500 font-bold uppercase mb-1">Type</div>
                    <div className="text-sm font-bold text-purple-900">{data.prognosis.trajectory}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <div className="text-xs text-purple-500 font-bold uppercase mb-1">6-Month Outlook</div>
                    <div className="text-xs text-purple-900 leading-tight">{data.prognosis.prediction_6_month}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <div className="text-xs text-purple-500 font-bold uppercase mb-1">12-Month Outlook</div>
                    <div className="text-xs text-purple-900 leading-tight">{data.prognosis.prediction_12_month}</div>
                  </div>
              </div>
            </div>
          )}

          {/* PROGRESSION TRACKER */}
          {data.progression && data.progression.data_points && data.progression.data_points.length > 1 && (
            <div className="bg-white p-5 rounded-xl border border-clinical-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-clinical-800 uppercase tracking-wider"><Activity size={16} className="text-brand-500" /> {t('report', 'progression')}</h3>
                  <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${data.progression.alert_level === 'stable' ? 'bg-blue-50 text-blue-700' : data.progression.alert_level === 'improving' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <span className="uppercase">{data.progression.alert_level}</span>
                  </div>
                </div>
                <div className="h-32 flex items-end justify-between gap-1 px-2 border-b border-clinical-200 pb-2 relative">
                  {data.progression.data_points.map((pt, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 group w-full">
                        <div className="w-full max-w-[20px] bg-brand-300 rounded-t hover:bg-brand-500 transition-colors relative" style={{ height: `${pt.gait_score}%` }}>
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{pt.gait_score}</div>
                        </div>
                        <span className="text-[9px] text-clinical-400">{i === data.progression!.data_points.length - 1 ? 'Now' : i}</span>
                      </div>
                  ))}
                  <div className="absolute top-2 left-2 text-[10px] font-bold text-clinical-400 uppercase">Gait Score History</div>
                </div>
                <p className="text-sm text-clinical-600 bg-clinical-50 p-3 rounded-lg"><span className="font-bold text-clinical-900">Analysis: </span>{data.progression.trend_summary}</p>
            </div>
          )}

          {/* Caregiver Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 shadow-sm ring-1 ring-indigo-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700"><HeartHandshake size={24} /></div>
                  <div>
                    <h3 className="font-bold text-indigo-900 text-lg">{t('report', 'caregiver')}</h3>
                    <span className="text-xs text-indigo-500 font-medium">Spoken Explanation Available</span>
                  </div>
                </div>
                
                <div className="flex gap-2" data-html2canvas-ignore>
                  <button onClick={handleStoryMode} className="flex items-center gap-2 px-3 py-2 rounded-full font-medium transition-all shadow-sm bg-pink-100 text-pink-700 hover:bg-pink-200">
                    {isChatLoading ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                    <span className="text-xs">Story Mode</span>
                  </button>
                  <button onClick={() => handleSpeak(storyContent || editableSummary)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all shadow-sm ${isSpeaking ? 'bg-red-100 text-red-600' : 'bg-indigo-600 text-white hover:scale-105'}`}>
                    {isSpeaking ? <StopCircle size={18} /> : <Volume2 size={18} />}
                    <span className="text-sm">{isSpeaking ? 'Stop' : 'Listen'}</span>
                  </button>
                </div>
              </div>
              
              {/* Story Content Display */}
              {storyContent && (
                <div className="bg-pink-50 border border-pink-100 p-4 rounded-lg mb-4 animate-in fade-in">
                    <h4 className="text-xs font-bold text-pink-800 uppercase tracking-wider mb-2">Generated Story</h4>
                    <p className="text-pink-900 text-base leading-relaxed whitespace-pre-line">{storyContent}</p>
                </div>
              )}

              <div className="bg-white/60 p-4 rounded-lg border border-indigo-50">
                {isEditing ? (
                    <textarea className="w-full p-2 border border-indigo-200 rounded text-base text-indigo-900 bg-white" rows={6} value={editableSummary} onChange={(e) => setEditableSummary(e.target.value)} />
                ) : (
                  <p className="text-indigo-900 text-base leading-relaxed whitespace-pre-line">{editableSummary}</p>
                )}
              </div>
          </div>

          {/* Ranked Conditions */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-clinical-800 uppercase tracking-wider"><Activity size={16} className="text-brand-500" /> {t('report', 'differential')}</h3>
            <div className="space-y-4">
              {data.ranked_conditions?.map((condition, idx) => (
                <ConditionCard key={idx} condition={condition} rank={idx + 1} />
              ))}
            </div>
          </div>

          {/* ASK PHENOGRAPH (Ignored in PDF usually due to interactivity, but kept in DOM) */}
          <div className="bg-white border border-clinical-200 rounded-xl p-4 shadow-sm" data-html2canvas-ignore>
            <h3 className="flex items-center gap-2 text-sm font-bold text-clinical-800 uppercase tracking-wider mb-2"><MessageCircle size={16} className="text-brand-500" /> Ask PhenoGraph about this Report</h3>
            <div className="flex gap-2">
              <input type="text" className="flex-1 border border-clinical-200 rounded-lg px-3 py-2 text-sm" placeholder="E.g. What tests should I order next?" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChat()} />
              <button onClick={handleChat} disabled={isChatLoading || !chatInput} className="bg-brand-600 text-white p-2 rounded-lg disabled:opacity-50">
                {isChatLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
            {chatResponse && (
              <div className="mt-3 p-3 bg-brand-50 border border-brand-100 rounded-lg text-sm text-brand-900 animate-in fade-in"><strong>PhenoGraph:</strong> {chatResponse}</div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-clinical-900 text-clinical-300 p-4 rounded-lg text-xs leading-relaxed flex gap-3">
            <AlertTriangle size={16} className="shrink-0 text-yellow-500" />
            <div>
              <p className="font-semibold text-white mb-1">{t('report', 'disclaimer')}</p>
              {data.disclaimer || "PhenoGraph is a screening aid and NOT a diagnostic tool."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
