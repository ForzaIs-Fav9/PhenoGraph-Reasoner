
import React from 'react';
import { RankedCondition } from '../types';
import { AlertCircle, CheckCircle2, ArrowRight, BookOpen, Percent } from 'lucide-react';

interface ConditionCardProps {
  condition: RankedCondition;
  rank: number;
}

export const ConditionCard: React.FC<ConditionCardProps> = ({ condition, rank }) => {
  // Safe parsing of probability to avoid NaN
  const safeProb = typeof condition.estimated_probability === 'number' && !isNaN(condition.estimated_probability) 
    ? condition.estimated_probability 
    : 0;
    
  const percentage = Math.round(safeProb * 100);
  
  // Determine color coding based on probability
  const colorClass = percentage > 75 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                     percentage > 40 ? 'text-amber-700 bg-amber-50 border-amber-100' :
                                       'text-clinical-600 bg-clinical-50 border-clinical-200';
  
  const barColor = percentage > 75 ? 'bg-emerald-500' :
                   percentage > 40 ? 'bg-amber-500' :
                                     'bg-clinical-400';

  return (
    <div className="bg-white rounded-lg border border-clinical-200 shadow-sm overflow-hidden mb-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 ${colorClass}`}>
            {rank}
          </div>
          <div>
            <h3 className="text-lg font-bold text-clinical-900 leading-tight mb-1">{condition.name}</h3>
            <div className="flex items-center gap-2 text-sm text-clinical-500">
               <span className="font-medium text-clinical-700">Confidence: {(condition.confidence * 100).toFixed(0)}%</span>
               <span>•</span>
               <div className="flex gap-1">
                 {condition.citations?.map((cite, idx) => (
                    <span key={idx} className="bg-clinical-100 px-1.5 py-0.5 rounded text-xs text-clinical-600 flex items-center gap-1">
                       <BookOpen size={10} />
                       {cite}
                    </span>
                 ))}
               </div>
            </div>
          </div>
        </div>
        
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-clinical-900 flex items-center justify-end gap-0.5">
            {isNaN(percentage) ? '?' : percentage}<span className="text-sm">%</span>
          </div>
          <div className="text-xs text-clinical-500 uppercase tracking-wider font-semibold">Match</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-clinical-100 h-1.5">
        <div 
          className={`h-1.5 rounded-r-full ${barColor}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        
        {/* Match Analysis (NEW) */}
        {condition.match_analysis && (
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-md">
             <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-indigo-800 mb-1">
               <Percent size={12} /> Why this match score?
             </h4>
             <p className="text-indigo-900 text-sm leading-snug">
               {condition.match_analysis}
             </p>
          </div>
        )}

        {/* Rationale */}
        <div>
           <h4 className="text-xs font-semibold uppercase tracking-wide text-clinical-400 mb-2">Clinical Rationale</h4>
           <p className="text-clinical-700 text-sm leading-relaxed bg-clinical-50/50 p-3 rounded-md border border-clinical-100">
             {condition.brief_rationale}
           </p>
        </div>

        {/* Supporting Terms */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-clinical-400 mb-2">Supporting Evidence</h4>
          <div className="flex flex-wrap gap-2">
            {condition.supporting_terms?.map((term, i) => (
              <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-clinical-200 bg-white text-xs font-medium text-clinical-700 shadow-sm">
                <CheckCircle2 size={12} className="text-brand-500" />
                {term.term}
                {term.evidence_pointers?.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded text-[10px]">
                    {term.evidence_pointers.length} ref
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="pt-2 border-t border-dashed border-clinical-200">
           <h4 className="text-xs font-semibold uppercase tracking-wide text-clinical-400 mb-2 mt-2">Suggested Next Steps</h4>
           <ul className="space-y-2">
             {condition.suggested_next_steps?.map((step, idx) => (
               <li key={idx} className="flex items-start gap-2 text-sm text-clinical-700">
                 <ArrowRight size={14} className="mt-0.5 text-brand-500 shrink-0" />
                 <span>{step}</span>
               </li>
             ))}
           </ul>
        </div>

      </div>
    </div>
  );
};
