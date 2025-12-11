export const cleanJsonString = (str: string): string => {
  // Remove markdown code blocks if present (e.g. ```json ... ```)
  let cleaned = str.replace(/```json/g, '').replace(/```/g, '');
  // Trim whitespace
  cleaned = cleaned.trim();
  return cleaned;
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
