
import { HistoryItem, PhenoGraphInput, PhenoGraphOutput } from '../types';
import { generateId } from '../utils';

const STORAGE_KEY = 'phenograph_history';

export const getHistory = (): HistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveHistoryItem = (input: PhenoGraphInput, output: PhenoGraphOutput) => {
  try {
    // Clone input to avoid mutating the original
    const safeInput = JSON.parse(JSON.stringify(input));
    
    // Strip large video data to save LocalStorage space
    if (safeInput.videoData) {
      safeInput.videoData.data = ""; // Clear the base64 string
    }

    const newItem: HistoryItem = {
      id: generateId(),
      timestamp: Date.now(),
      input: safeInput,
      output: output
    };

    const history = getHistory();
    // Keep only the last 20 items to be safe with storage limits
    const updatedHistory = [newItem, ...history].slice(0, 20);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Failed to save history. Storage might be full.", e);
  }
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const deleteHistoryItem = (id: string) => {
  try {
    const history = getHistory();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to delete item", e);
    return [];
  }
};
