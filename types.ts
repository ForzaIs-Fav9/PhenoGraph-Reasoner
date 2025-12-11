
export interface EvidencePointer {
  type: string;
  file: string;
  start_s?: number;
  end_s?: number;
  confidence: number;
}

export interface HpoCandidate {
  term: string;
  code: string;
  probability: number;
  evidence: EvidencePointer[];
}

export interface AudioFeatures {
  speech_rate: string | number;
  f0_mean: number;
  pause_rate: string | number;
  articulation_score: number;
}

export interface Patient {
  age: number;
  age_unit: 'years' | 'months' | 'days';
  sex: string;
  note: string;
}

export interface PhenoGraphInput {
  patient: Patient;
  hpo_candidates: HpoCandidate[];
  audio_features: AudioFeatures;
  morphological_flags?: Record<string, any>;
  source_links?: any;
  source_urls?: string[];
  
  // Unified Media Field
  mediaFiles?: {
    data: string;
    mimeType: string;
    fileName?: string;
  }[];

  voiceNote?: {
    data: string;
    mimeType: string;
  };

  reportLanguage?: string;
  // For progression analysis
  historyContext?: PhenoGraphOutput[]; 
}

export interface SupportingTerm {
  term: string;
  code: string;
  term_confidence: number;
  evidence_pointers: EvidencePointer[];
}

export interface RankedCondition {
  name: string;
  estimated_probability: number;
  supporting_terms: SupportingTerm[];
  brief_rationale: string;
  match_analysis?: string; // Specific reasoning for the match %
  suggested_next_steps: string[];
  citations: string[];
  confidence: number;
}

export interface WebSource {
  title: string;
  uri: string;
}

export interface ProgressionPoint {
  date: string;
  gait_score: number; // 0-100
  speech_clarity: number; // 0-100
  facial_expressivity: number; // 0-100
  summary: string;
}

export interface ProgressionAnalysis {
  trend_summary: string;
  alert_level: 'stable' | 'improving' | 'declining' | 'critical';
  data_points: ProgressionPoint[];
}

export interface QualityCheck {
  usable: boolean;
  issues: string[]; 
  suggestions: string[];
  media_authenticity?: 'Genuine' | 'Suspected AI/Fake' | 'Unknown';
  media_relevance?: 'High' | 'Low' | 'Irrelevant' | 'None';
  authenticity_reasoning?: string;
}

export interface Prognosis {
  trajectory: string; // "Stable", "Degenerative", "Variable", "Acute/Self-Limiting"
  prediction_6_month: string;
  prediction_12_month: string;
}

// NEW TYPES FOR SAFETY & REASONING
export interface AlternateDiagnosis {
  name: string;
  rule_out_reason: string;
}

export interface ReasoningMetadata {
  chain_of_thought: string[];
  alternate_possibilities: AlternateDiagnosis[];
  error_triggers: string[];
  false_positive_analysis: string;
  counterarguments: string;
  bias_check: string;
  trust_level: 'Safe' | 'Caution' | 'Expert Review';
}

export interface PhenoGraphOutput {
  patient: Patient;
  missing?: string[];
  evidence_summaries?: string[];
  ranked_conditions?: RankedCondition[];
  overall_confidence?: number;
  confidence_explanation?: string; // Reason for the score
  low_confidence?: boolean;
  disclaimer: string;
  web_sources?: WebSource[];
  patient_friendly_summary?: string;
  progression?: ProgressionAnalysis;
  quality_check?: QualityCheck;
  prognosis?: Prognosis;
  reasoning_metadata?: ReasoningMetadata;
  follow_up_questions?: string[];
  // AI-Extracted Features to populate Input Form
  extracted_hpo?: HpoCandidate[];
  extracted_audio_features?: AudioFeatures;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: PhenoGraphInput;
  output: PhenoGraphOutput;
}

export interface DeveloperConfig {
  rawDataExplorer: boolean;
  ontologyTrace: boolean;
  reasoningChain: boolean;
  confidenceHeatmap: boolean;
  promptInjection: boolean;
  moduleBenchmark: boolean;
  simulationMode: boolean;
  datasetHook: boolean;
  testSuite: boolean;
  tokenStream: boolean;
  apiConfig: boolean;
  thresholdTuner: boolean;
  interventionTester: boolean;
  debugVideoPlayer: boolean;
  offlineLogExporter: boolean;
}

export interface AppSettings {
  // 1. Input
  cameraSource: string;
  microphoneSource: string;
  resolution: 'HD' | 'SD' | 'Auto';
  frameRate: 'Normal' | 'High' | 'Battery Saver';
  emergencyMode: boolean; 

  // 2. AI
  liveAnalysis: boolean;
  postSessionAnalysis: 'Always On' | 'Ask Every Time' | 'Off';
  feedbackType: 'Visual' | 'Audio' | 'Text';
  aiTone: 'Friendly' | 'Neutral' | 'Formal';
  reasoningDepth: 'concise' | 'detailed'; 
  enableInternet: boolean; 
  transparentReasoning: boolean;
  
  // New AI Features
  chatMemory: boolean; // Remembers context across sessions
  knowledgeBaseUpdate: number; // Timestamp of last self-training
  learnedKnowledge: string[]; // Summaries of verified internet data

  // 3. Accessibility
  language: string;
  voiceSpeed: 'Slow' | 'Normal' | 'Fast';
  textSize: 'Small' | 'Medium' | 'Large';
  theme: 'Light' | 'Dark' | 'High Contrast'; 
  screenReader: 'Auto' | 'On' | 'Off';
  dyslexiaFont: boolean;
  ttsVoice: string; // ID of the selected browser voice

  // 4. Privacy
  localStorage: boolean;
  dataRetention: 'Forever' | '24h' | '7days' | '30days';
  cloudUpload: 'Yes' | 'Ask' | 'Never';
  analytics: 'Anonymous' | 'Full' | 'Opt-out';

  // 5. Developer
  debugMode: boolean;
  modelTemperature: number;
  autoPromptTest: boolean;
  developerConfig: DeveloperConfig; // Granular toggles
  customSystemPrompt?: string; // For Prompt Injection
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: WebSource[];
  isError?: boolean;
  attachments?: { name: string; mimeType: string }[];
  thinking?: string; 
  generatedMedia?: {
    type: 'image' | 'video';
    mimeType: string;
    data: string; // Base64
    uri?: string; 
  }[];
}
