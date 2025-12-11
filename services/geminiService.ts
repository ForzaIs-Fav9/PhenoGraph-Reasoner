
import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { PhenoGraphInput, PhenoGraphOutput, WebSource, HistoryItem, AppSettings } from '../types';
import { cleanJsonString } from '../utils';

interface AnalysisOptions {
  reasoningDepth: 'concise' | 'detailed';
  history?: HistoryItem[];
  customPrompt?: string; // For prompt injection
  learnedKnowledge?: string[]; // For self-training context
}

const performAnalysisCall = async (
  ai: GoogleGenAI, 
  payload: any, 
  instruction: string,
  isFallback = false
): Promise<PhenoGraphOutput> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: payload,
      config: {
        systemInstruction: instruction,
        temperature: 0.2,
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response received.");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const potentialJson = jsonMatch ? jsonMatch[0] : text;
    const cleanedText = cleanJsonString(potentialJson);
    
    try {
      const parsed = JSON.parse(cleanedText) as PhenoGraphOutput;
      
      // Extract Grounding
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const webSources: WebSource[] = [];
      if (groundingChunks) {
        groundingChunks.forEach(chunk => {
          if (chunk.web && chunk.web.uri) {
            webSources.push({ title: chunk.web.title || "Web Source", uri: chunk.web.uri });
          }
        });
      }
      const uniqueSources = webSources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);
      parsed.web_sources = uniqueSources;

      return parsed;

    } catch (parseError) {
      console.error("JSON Parse Error", text);
      throw new Error("Failed to parse response.");
    }
  } catch (error) {
    if (!isFallback) {
      throw error; // Rethrow to let the main handler try fallback
    }
    throw error;
  }
};

export const analyzePhenotypes = async (
  inputData: PhenoGraphInput, 
  options: AnalysisOptions = { reasoningDepth: 'detailed' }
): Promise<PhenoGraphOutput> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Base Instruction (Use custom if provided via Dev Options)
  let instruction = options.customPrompt || SYSTEM_INSTRUCTION;
  
  if (options.reasoningDepth === 'concise') {
    instruction += " KEEP RATIONALE BRIEF.";
  }

  // Inject Self-Learned Knowledge
  if (options.learnedKnowledge && options.learnedKnowledge.length > 0) {
    instruction += `\n\n*** UPDATED CLINICAL KNOWLEDGE (VERIFIED) ***\n${options.learnedKnowledge.join('\n')}\nUse this recent knowledge to inform your analysis.`;
  }

  // Prepare Payload
  let contentsPayload: any;
  const historyContext = options.history ? options.history.map(h => ({
    date: new Date(h.timestamp).toISOString().split('T')[0],
    output: h.output
  })) : [];

  const { mediaFiles, voiceNote, ...jsonPayload } = inputData;
  const payloadWithHistory = {
    ...jsonPayload,
    historyContext: historyContext.length > 0 ? historyContext : undefined
  };

  const jsonString = JSON.stringify(payloadWithHistory);
  const targetLang = inputData.reportLanguage || "English";

  // Build prompt
  let textPrompt = `Generate a rigorous clinical report in language: ${targetLang}.`;
  textPrompt += `\n\nClinical Data JSON: ${jsonString}`;
  
  textPrompt += `\n\n*** AUTOMATIC UNIVERSAL DOCUMENT & MEDIA ANALYSIS ***`;
  textPrompt += `\nYou have received media attachments. For EACH attachment, you MUST AUTOMATICALLY IDENTIFY its type and process it accordingly:`;
  textPrompt += `\n1. IF HANDWRITING/NOTES: Perform expert OCR. Transcribe messy text verbatim. Analyze intent.`;
  textPrompt += `\n2. IF EXCEL/CSV/SPREADSHEET: Analyze the tabular data, trends, and values.`;
  textPrompt += `\n3. IF WORD/PDF/DOC: Summarize clinical findings, history, and referral letters.`;
  textPrompt += `\n4. IF POWERPOINT/SLIDES: Extract key points from the presentation.`;
  textPrompt += `\n5. IF PATIENT VIDEO/IMAGE: Analyze phenotype. IGNORE background noise (TV, chatter). Check for AI/Deepfake artifacts.`;
  textPrompt += `\nSynthesize all findings into the final JSON report.`;

  textPrompt += `\n\n*** CONTEXTUAL ANALYSIS ***`;
  textPrompt += `\nExplain symptoms in the context of lifestyle and environment.`;

  // Explicit inference instructions if data fields are missing
  if (!inputData.hpo_candidates || inputData.hpo_candidates.length === 0) {
    textPrompt += `\n\n*** INFERENCE REQUIRED: SYMPTOMS ***`;
    textPrompt += `\nThe user provided NO manual HPO terms ("I don't know"). You MUST infer symptoms/phenotypes strictly from the 'note' text and any media attachments. Do NOT hallucinate if no evidence exists.`;
  }

  // Check for speech auto-detection requirement
  const needsSpeechInference = !inputData.voiceNote && (!mediaFiles || mediaFiles.length === 0) 
    ? false // No media, cannot infer speech
    : (!inputData.audio_features || inputData.audio_features.speech_rate === "normal"); // Default or missing features means "Auto"

  if (needsSpeechInference) {
     textPrompt += `\n\n*** INFERENCE REQUIRED: SPEECH ***`;
     textPrompt += `\nThe user provided NO manual speech metrics ("I don't know"). You MUST analyze any attached audio/video for vocal biomarkers (pitch, rate, prosody, articulation) and infer them yourself.`;
  }

  textPrompt += `\n\n*** CONFIDENCE SCORING ***`;
  textPrompt += `\n1. Provide 'overall_confidence' (0.0-1.0).`;
  textPrompt += `\n2. Provide 'confidence_explanation' justifying the score.`;

  textPrompt += `\n\n*** SAFETY & REASONING CHECKLIST ***`;
  textPrompt += `\nComplete the 'reasoning_metadata' object in the JSON response:`;
  textPrompt += `\n- chain_of_thought: Step-by-step logic.`;
  textPrompt += `\n- alternate_possibilities: Top 3 ruled-out conditions.`;
  textPrompt += `\n- error_triggers: Quality issues (lighting, noise).`;
  textPrompt += `\n- false_positive_analysis: History of false alarms for this pattern.`;
  textPrompt += `\n- counterarguments: "Why might this be wrong?".`;
  textPrompt += `\n- bias_check: Check for demographic biases.`;
  textPrompt += `\n- trust_level: "Safe", "Caution", or "Expert Review".`;

  if (inputData.source_urls && inputData.source_urls.length > 0) {
    textPrompt += `\n\n*** EXTERNAL MEDIA ***`;
    textPrompt += `\nUser provided URLs: ${JSON.stringify(inputData.source_urls)}. Use 'googleSearch' to analyze them.`;
  }
  
  if (historyContext.length > 0) {
    textPrompt += `\n\n*** PROGRESSION ANALYSIS ***: Compare current data to ${historyContext.length} previous sessions.`;
  }

  const parts: any[] = [{ text: textPrompt }];

  let mediaAttached = false;
  if (mediaFiles && mediaFiles.length > 0) {
    mediaFiles.forEach(file => {
      parts.push({
        inlineData: { mimeType: file.mimeType, data: file.data }
      });
    });
    mediaAttached = true;
  }
  if (voiceNote && voiceNote.data) {
    parts.push({
      inlineData: { mimeType: voiceNote.mimeType, data: voiceNote.data }
    });
    mediaAttached = true;
  }

  if (!mediaAttached) {
    parts[0].text += "\n\n*** IMPORTANT: NO MEDIA FILES ATTACHED ***\n1. Set 'quality_check.media_relevance' to 'None'.\n2. Add 'No media given, only text analysis has been done.' to 'evidence_summaries'.\n3. Do NOT comment on recording quality, background noise, or lighting. Base your analysis SOLELY on the provided text history and parameters.";
  }

  contentsPayload = { parts };

  try {
    // Attempt 1: Use provided instruction (potentially custom/broken)
    return await performAnalysisCall(ai, contentsPayload, instruction);
  } catch (error) {
    // Attempt 2: FALLBACK RECOVERY
    // If the custom prompt failed or caused a hallucination, retry with the safe default system instruction.
    if (options.customPrompt) {
      console.warn("Analysis failed with custom prompt. Attempting recovery with Default System Instruction...", error);
      try {
        const fallbackResult = await performAnalysisCall(ai, contentsPayload, SYSTEM_INSTRUCTION, true);
        // Mark that this was a recovery
        fallbackResult.disclaimer = (fallbackResult.disclaimer || "") + " [Note: Analysis recovered from a faulty configuration.]";
        return fallbackResult;
      } catch (fallbackError) {
        console.error("Recovery failed:", fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
};

// Chat with Report
export const chatAboutReport = async (
  report: PhenoGraphOutput, 
  question: string,
  history: {role: 'user'|'model', text: string}[]
) => {
  if (!process.env.API_KEY) throw new Error("API Key Missing");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const context = `
    You are an expert clinical assistant discussing a phenotype report.
    REPORT: ${JSON.stringify(report).slice(0, 5000)}... (truncated)
    QUESTION: ${question}
    Answer briefly and helpfully.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: context
  });

  return response.text;
};

// Help Center Q&A
export const askHelpCenter = async (query: string) => {
  if (!process.env.API_KEY) throw new Error("API Key Missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = `Help Desk for PhenoGraph. User Query: ${query}. Explain briefly.`;
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: context
  });
  return response.text;
};

// --- Self-Training Service ---
export const runDailySelfTraining = async (): Promise<string> => {
  if (!process.env.API_KEY) return "";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Use Google Search to find significant, verified medical updates, new guidelines, or newly discovered phenotypes in Neurology or Psychiatry from the last 24-48 hours.
    Verify that the sources are reputable (e.g., PubMed, major medical journals, CDC, WHO).
    Summarize any *confirmed* new findings in 2-3 bullet points. If nothing significant, say "No significant updates."
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });
  
  return response.text || "";
};

// Global Chat
export const createChatSession = (settings: AppSettings, memory?: string): Chat => {
  if (!process.env.API_KEY) throw new Error("API Key Missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Custom or Default System Instruction
  let systemInstruction = settings.customSystemPrompt || `You are PhenoGraph Assistant.
      You are not limited to specific diseases.
      
      *** ADVANCED UNIVERSAL RECOGNITION ***
      You possess world-class capabilities in analyzing ALL types of media.
      When the user provides an image or file:
      1. AUTOMATICALLY DETECT what it is (Handwriting, Medical Scan, Excel Sheet, PDF Report, Patient Video, etc).
      2. If Handwriting: Perform OCR, read sloppy text, analyze intent.
      3. If Spreadsheet/Doc: Extract data and summarize.
      4. If Patient Photo/Video: Analyze clinical signs/phenotypes. IGNORE background noise. DETECT AI/Deepfake content.
      
      *** SAFETY ***
      REFUSE 18+, explicit, or violent content.`;

  if (settings.chatMemory && memory) {
     systemInstruction += `\n\n*** LONG-TERM MEMORY ***\nHere is a summary of previous conversations with this user:\n${memory}\nUse this context to personalize your responses.`;
  }
  
  if (settings.learnedKnowledge && settings.learnedKnowledge.length > 0) {
     systemInstruction += `\n\n*** LEARNED MEDICAL KNOWLEDGE ***\n${settings.learnedKnowledge.join('\n')}`;
  }

  if (settings.transparentReasoning) {
    systemInstruction += `\n\n*** REASONING MODE ***\nThink out loud in <thinking> tags before answering.`;
  }

  const tools: any[] = [];
  if (settings.enableInternet) tools.push({ googleSearch: {} });

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction, tools }
  });
};
