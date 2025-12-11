
import React, { useEffect, useState } from 'react';
import { HistoryItem } from '../types';
import { getHistory, deleteHistoryItem, clearHistory } from '../services/storageService';
import { X, Clock, ChevronRight, Trash2, History } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadItem: (item: HistoryItem) => void;
  t: (section: string, key: string) => string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onLoadItem, t }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setItems(getHistory());
    }
  }, [isOpen]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteHistoryItem(id);
    setItems(updated);
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      clearHistory();
      setItems([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-clinical-200 overflow-hidden flex flex-col max-h-[80vh]">
        
        <div className="p-4 border-b border-clinical-100 flex justify-between items-center bg-clinical-50">
          <h3 className="font-bold text-clinical-900 flex items-center gap-2">
            <History size={18} className="text-brand-600" />
            {t('history', 'title')}
          </h3>
          <button onClick={onClose} className="text-clinical-400 hover:text-clinical-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 bg-clinical-50/50">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-clinical-400 p-8">
              <History size={48} className="mb-3 opacity-20" />
              <p className="text-sm">{t('history', 'noHistory')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => { onLoadItem(item); onClose(); }}
                  className="bg-white p-4 rounded-lg border border-clinical-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-clinical-900 text-sm">
                        {item.input.patient.age} {item.input.patient.age_unit || 'years'} • {item.input.patient.sex}
                      </div>
                      <div className="text-xs text-clinical-500 line-clamp-1">
                        {item.input.patient.note || "No clinical notes"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-clinical-100 text-clinical-600 px-1.5 py-0.5 rounded font-mono">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={(e) => handleDelete(e, item.id)}
                        className="text-clinical-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-clinical-100">
                     <div className="flex gap-2">
                        {item.output.ranked_conditions?.slice(0, 2)?.map((c, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded-full border border-brand-100 truncate max-w-[100px]">
                            {c.name}
                          </span>
                        ))}
                     </div>
                     <ChevronRight size={16} className="text-clinical-300 group-hover:text-brand-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-clinical-100 bg-white flex justify-between items-center">
          <button 
            onClick={handleClear}
            className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
            disabled={items.length === 0}
          >
            {t('history', 'clear')}
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-clinical-100 text-clinical-700 text-sm font-medium rounded-lg hover:bg-clinical-200 transition-colors"
          >
            {t('history', 'close')}
          </button>
        </div>

      </div>
    </div>
  );
};
