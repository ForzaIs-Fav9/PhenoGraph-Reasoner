
import React, { useState } from 'react';
import { X, HelpCircle, BookOpen, Mic, Activity, BarChart2, Database, PlayCircle, Hash, Stethoscope, MessageCircle, Send, Loader2 } from 'lucide-react';
import { askHelpCenter } from '../services/geminiService';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  t: (section: string, key: string) => string;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onStartTour, t }) => {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const resp = await askHelpCenter(query);
      setAnswer(resp || "No answer received.");
    } catch (e) {
      setAnswer("Sorry, I couldn't connect to the help desk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-clinical-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="p-4 border-b border-clinical-100 flex justify-between items-center bg-clinical-50">
          <h3 className="font-bold text-clinical-900 flex items-center gap-2">
            <HelpCircle size={18} className="text-brand-600" />
            Help & Reference Center
          </h3>
          <button onClick={onClose} className="text-clinical-400 hover:text-clinical-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* AI Help Desk */}
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-5">
             <h4 className="flex items-center gap-2 text-brand-900 font-bold text-sm mb-3">
               <MessageCircle size={16} /> AI Help Desk
             </h4>
             <div className="flex gap-2 mb-3">
               <input 
                 type="text" 
                 value={query}
                 onChange={e => setQuery(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleAsk()}
                 placeholder="Ask a question (e.g., 'What is HPO?', 'How to upload video?')"
                 className="flex-1 p-2 text-sm border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
               />
               <button 
                 onClick={handleAsk}
                 disabled={loading || !query}
                 className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700 disabled:opacity-50"
               >
                 {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
               </button>
             </div>
             {answer && (
               <div className="bg-white p-3 rounded-lg border border-brand-100 text-sm text-brand-900 animate-in fade-in">
                 {answer}
               </div>
             )}
          </div>

          {/* Welcome Tour Banner */}
          <div className="bg-gradient-to-r from-gray-100 to-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">App Tour</h4>
              <p className="text-gray-600 text-xs">Re-play the interactive walkthrough.</p>
            </div>
            <button 
              onClick={onStartTour}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
            >
              <PlayCircle size={16} /> Start
            </button>
          </div>

          <div className="prose prose-sm prose-clinical max-w-none">
            
            {/* Quick Reference Grid */}
            <h4 className="flex items-center gap-2 text-clinical-900 font-bold text-lg border-b pb-2 mb-4">
               <Database size={20} className="text-brand-500" /> Vocal Biomarker Reference
            </h4>
            
            <p className="text-xs text-clinical-600 mb-4">
              Use this guide when inputting values in the <strong>Speech</strong> tab if you don't have automated measurement tools.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="border border-clinical-200 rounded-lg overflow-hidden">
                <div className="bg-clinical-50 px-3 py-2 border-b border-clinical-100 font-bold text-xs uppercase text-clinical-700 flex justify-between">
                  <span>Fundamental Frequency (Pitch/F0)</span>
                  <Mic size={14} className="text-clinical-400"/>
                </div>
                <div className="p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                     <span className="text-clinical-500">Low (&lt;85 Hz)</span>
                     <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Hypothyroidism, Edema</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-clinical-500">High (&gt;255 Hz)</span>
                     <span className="font-medium bg-orange-50 text-orange-700 px-2 py-0.5 rounded">Stress, Glottic tension</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-clinical-500">Monotone</span>
                     <span className="font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded">Parkinson's, Depression</span>
                  </div>
                </div>
              </div>

              <div className="border border-clinical-200 rounded-lg overflow-hidden">
                <div className="bg-clinical-50 px-3 py-2 border-b border-clinical-100 font-bold text-xs uppercase text-clinical-700 flex justify-between">
                  <span>Speech Rate</span>
                  <Activity size={14} className="text-clinical-400"/>
                </div>
                <div className="p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                     <span className="text-clinical-500">Bradyphasia (&lt;120 wpm)</span>
                     <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Parkinsonism, Dementia</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-clinical-500">Tachyphasia (&gt;160 wpm)</span>
                     <span className="font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded">Mania, Anxiety, Cluttering</span>
                  </div>
                </div>
              </div>

              <div className="border border-clinical-200 rounded-lg overflow-hidden">
                <div className="bg-clinical-50 px-3 py-2 border-b border-clinical-100 font-bold text-xs uppercase text-clinical-700 flex justify-between">
                  <span>Articulation Quality</span>
                  <BarChart2 size={14} className="text-clinical-400"/>
                </div>
                <div className="p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                     <span className="text-clinical-500">Slurred (Dysarthria)</span>
                     <span className="font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded">Stroke, ALS, CP</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-clinical-500">Staccato (Scanning)</span>
                     <span className="font-medium bg-orange-50 text-orange-700 px-2 py-0.5 rounded">Cerebellar Ataxia</span>
                  </div>
                </div>
              </div>

            </div>

            {/* HPO Reference Table */}
            <h4 className="flex items-center gap-2 text-clinical-900 font-bold text-lg border-b pb-2 mb-4 mt-8">
               <Hash size={20} className="text-brand-500" /> Common HPO Codes
            </h4>
            <p className="text-xs text-clinical-600 mb-4">
              Common terms used by the AI when analyzing phenotypes.
            </p>

            <div className="border border-clinical-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-clinical-50 text-clinical-700 font-semibold border-b border-clinical-200">
                  <tr>
                    <th className="px-4 py-2 w-24">Code</th>
                    <th className="px-4 py-2 w-40">Term</th>
                    <th className="px-4 py-2">Clinical Definition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clinical-100">
                  <tr>
                    <td className="px-4 py-2 font-mono text-brand-600">HP:0001260</td>
                    <td className="px-4 py-2 font-medium">Dysarthria</td>
                    <td className="px-4 py-2 text-clinical-600">Difficult or unclear articulation of speech that is otherwise linguistically normal.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-brand-600">HP:0002066</td>
                    <td className="px-4 py-2 font-medium">Gait Ataxia</td>
                    <td className="px-4 py-2 text-clinical-600">Unsteady, staggering gait (walking) often described as "drunken".</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-brand-600">HP:0000252</td>
                    <td className="px-4 py-2 font-medium">Microcephaly</td>
                    <td className="px-4 py-2 text-clinical-600">Occipito-frontal circumference (OFC) less than the 3rd percentile.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-brand-600">HP:0002322</td>
                    <td className="px-4 py-2 font-medium">Resting Tremor</td>
                    <td className="px-4 py-2 text-clinical-600">Involuntary rhythmic shaking of a limb when relaxed.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-brand-600">HP:0000298</td>
                    <td className="px-4 py-2 font-medium">Mask-like Facies</td>
                    <td className="px-4 py-2 text-clinical-600">Reduction of facial movements and expression (Hypomimia).</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-brand-600">HP:0001263</td>
                    <td className="px-4 py-2 font-medium">Dev. Delay</td>
                    <td className="px-4 py-2 text-clinical-600">Intellectual and developmental delay affecting multiple areas.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800 text-xs font-medium flex items-start gap-2">
              <Activity size={16} className="shrink-0 mt-0.5"/>
              <span>
                <strong>Note:</strong> This reference is not exhaustive. The AI model has access to the full HPO database (over 13,000 terms) during analysis.
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-clinical-100 bg-clinical-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-clinical-200 text-clinical-700 text-sm font-medium rounded-lg hover:bg-clinical-300 transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
