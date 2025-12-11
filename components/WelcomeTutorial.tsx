
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, X, Volume2, RotateCcw, Check, BrainCircuit } from 'lucide-react';

interface WelcomeTutorialProps {
  onComplete: () => void;
  language: string;
}

interface TourStep {
  title: string;
  content: string;
  tooltip: string;
  targetId: string | null; // null means centered modal
  voiceText: string;
}

// BCP 47 Language Tags
const LANG_MAP: Record<string, string> = {
  'English': 'en-US',
  'Spanish': 'es-ES',
  'French': 'fr-FR',
  'German': 'de-DE',
  'Chinese': 'zh-CN',
  'Hindi': 'hi-IN',
  'Arabic': 'ar-SA',
  'Portuguese': 'pt-BR',
  'Russian': 'ru-RU',
  'Japanese': 'ja-JP',
};

// Translations Dictionary
const TRANSLATIONS: Record<string, TourStep[]> = {
  'English': [
    { title: "Welcome to PhenoGraph", content: "Your smart health screening companion. Let's walk through how it works.", tooltip: "", targetId: null, voiceText: "Welcome to PhenoGraph. Your smart health screening companion. Let's walk through how it works. Tap Start to begin." },
    { title: "Upload Section", content: "Upload patient video, add voice notes, or enter clinical history here. We don’t store data unless you save it.", tooltip: "Video files (.mp4), audio, or text notes.", targetId: "tour-tab-video", voiceText: "Upload patient video, add voice notes, or enter clinical history here." },
    { title: "Live Capture", content: "Want real-time AI feedback? Tap here and start recording.", tooltip: "PhenoGraph will give instant insights — on-screen or via voice — as you speak or move.", targetId: "tour-tab-live", voiceText: "Want real-time AI feedback? Tap here and start recording." },
    { title: "Reference Library", content: "Access our built-in medical database for information on conditions, treatments, and HPO terms.", tooltip: "Great for quick lookups without leaving the app.", targetId: "tour-nav-knowledge", voiceText: "Access our built-in medical database for information on conditions, treatments, and HPO terms." },
    { title: "Analysis Section", content: "After uploading or recording, we run a deep analysis on your input to find patterns.", tooltip: "You’ll also get possible conditions and next-step suggestions.", targetId: "tour-btn-analyze", voiceText: "After uploading or recording, we run a deep analysis on your input." },
    { title: "AI Chat Assistant", content: "Have questions about a report? Tap here to chat with PhenoGraph AI for detailed explanations.", tooltip: "Supports text, voice, and file attachments.", targetId: "tour-nav-chat", voiceText: "Have questions about a report? Tap here to chat with PhenoGraph AI." },
    { title: "Settings Panel", content: "Customize how PhenoGraph behaves. Change language, input sources, AI tone, and privacy settings.", tooltip: "Tap here if you want AI to speak gently, formally, or just show text.", targetId: "tour-nav-settings", voiceText: "Customize how PhenoGraph behaves. Change language, input sources, AI tone, and privacy settings." },
    { title: "Progress & Logs", content: "Track previous tests, results, and view detailed reports.", tooltip: "Great for showing doctors or family members what’s changed.", targetId: "tour-nav-history", voiceText: "Track previous tests, results, and view detailed reports." },
    { title: "Help & Support", content: "If you get stuck, come here. You can re-watch this tutorial or read the guide.", tooltip: "", targetId: "tour-nav-help", voiceText: "If you get stuck, come here. You can re-watch this tutorial or read the guide." },
    { title: "You're All Set!", content: "Upload or record to begin. PhenoGraph is here to guide you.", tooltip: "", targetId: null, voiceText: "You're all set! Upload or record to begin. PhenoGraph is here to guide you." }
  ],
  'Spanish': [
    { title: "Bienvenido a PhenoGraph", content: "Su compañero inteligente de evaluación de salud. Veamos cómo funciona.", tooltip: "", targetId: null, voiceText: "Bienvenido a PhenoGraph. Su compañero inteligente de evaluación de salud. Veamos cómo funciona. Toque Comenzar." },
    { title: "Sección de Carga", content: "Puede cargar video, audio o documentos médicos aquí. No guardamos sus datos a menos que usted lo permita.", tooltip: "Archivos de video, audio o PDF/imágenes.", targetId: "tour-tab-video", voiceText: "Puede cargar video, audio o documentos médicos aquí. No guardamos sus datos a menos que usted lo permita." },
    { title: "Captura en Vivo", content: "¿Quiere comentarios de IA en tiempo real? Toque aquí y comience a grabar.", tooltip: "PhenoGraph dará información instantánea mientras habla o se mueve.", targetId: "tour-tab-live", voiceText: "¿Quiere comentarios de IA en tiempo real? Toque aquí y comience a grabar." },
    { title: "Biblioteca de Referencia", content: "Acceda a nuestra base de datos médica para información sobre condiciones y tratamientos.", tooltip: "Ideal para consultas rápidas.", targetId: "tour-nav-knowledge", voiceText: "Acceda a nuestra base de datos médica para información sobre condiciones y tratamientos." },
    { title: "Sección de Análisis", content: "Después de cargar o grabar, ejecutamos un análisis profundo para encontrar patrones.", tooltip: "Obtendrá posibles condiciones y sugerencias.", targetId: "tour-btn-analyze", voiceText: "Después de cargar o grabar, ejecutamos un análisis profundo para encontrar patrones." },
    { title: "Asistente de Chat", content: "¿Tiene preguntas sobre un informe? Toque aquí para chatear con la IA de PhenoGraph.", tooltip: "Admite texto, voz y archivos.", targetId: "tour-nav-chat", voiceText: "¿Tiene preguntas sobre un informe? Toque aquí para chatear con la IA." },
    { title: "Configuración", content: "Personalice PhenoGraph. Cambie el idioma, el tono de la IA y la privacidad.", tooltip: "Toque aquí para cambiar la voz de la IA.", targetId: "tour-nav-settings", voiceText: "Personalice cómo se comporta PhenoGraph. Cambie el idioma y la privacidad." },
    { title: "Progreso y Registros", content: "Rastree pruebas anteriores, resultados y vea informes detallados.", tooltip: "Genial para mostrar a los médicos.", targetId: "tour-nav-history", voiceText: "Rastree pruebas anteriores, resultados y vea informes detallados." },
    { title: "Ayuda y Soporte", content: "Si se atasca, venga aquí. Puede volver a ver este tutorial.", tooltip: "", targetId: "tour-nav-help", voiceText: "Si necesita ayuda, venga aquí. Puede volver a ver este tutorial." },
    { title: "¡Todo Listo!", content: "Cargue o grabe para comenzar. PhenoGraph está aquí para guiarlo.", tooltip: "", targetId: null, voiceText: "¡Todo listo! Cargue o grabe para comenzar." }
  ],
  'Hindi': [
    { title: "PhenoGraph में आपका स्वागत है", content: "आपका स्मार्ट हेल्थ स्क्रीनिंग साथी। आइए देखें कि यह कैसे काम करता है।", tooltip: "", targetId: null, voiceText: "PhenoGraph में आपका स्वागत है। आइए देखें कि यह कैसे काम करता है। शुरू करने के लिए टैप करें।" },
    { title: "अपलोड अनुभाग", content: "आप यहाँ वीडियो, ऑडियो या दस्तावेज़ अपलोड कर सकते हैं। हम आपका डेटा स्टोर नहीं करते हैं।", tooltip: "वीडियो, ऑडियो, या पीडीएफ फाइलें।", targetId: "tour-tab-video", voiceText: "आप यहाँ वीडियो, ऑडियो या दस्तावेज़ अपलोड कर सकते हैं। हम आपकी अनुमति के बिना डेटा स्टोर नहीं करते।" },
    { title: "लाइव कैप्चर", content: "वास्तविक समय में AI फीडबैक चाहिए? यहाँ टैप करें और रिकॉर्डिंग शुरू करें।", tooltip: "PhenoGraph तुरंत जानकारी देगा।", targetId: "tour-tab-live", voiceText: "वास्तविक समय में AI फीडबैक चाहिए? यहाँ टैप करें और रिकॉर्डिंग शुरू करें।" },
    { title: "संदर्भ पुस्तकालय", content: "स्थितियों और उपचारों की जानकारी के लिए हमारे मेडिकल डेटाबेस का उपयोग करें।", tooltip: "त्वरित जानकारी के लिए।", targetId: "tour-nav-knowledge", voiceText: "स्थितियों और उपचारों की जानकारी के लिए हमारे मेडिकल डेटाबेस का उपयोग करें।" },
    { title: "विश्लेषण अनुभाग", content: "अपलोड या रिकॉर्डिंग के बाद, हम पैटर्न खोजने के लिए गहरा विश्लेषण करते हैं।", tooltip: "आपको संभावित स्थितियां और सुझाव मिलेंगे।", targetId: "tour-btn-analyze", voiceText: "अपलोड या रिकॉर्डिंग के बाद, हम गहरा विश्लेषण करते हैं।" },
    { title: "चैट असिस्टेंट", content: "रिपोर्ट के बारे में प्रश्न पूछें या AI के साथ चर्चा करें।", tooltip: "टेक्स्ट, वॉयस और फाइलों का समर्थन करता है।", targetId: "tour-nav-chat", voiceText: "रिपोर्ट के बारे में प्रश्न पूछें या AI के साथ चर्चा करें।" },
    { title: "सेटिंग्स", content: "PhenoGraph को कस्टमाइज़ करें। भाषा, AI टोन और गोपनीयता बदलें।", tooltip: "सेटिंग्स बदलने के लिए यहाँ टैप करें।", targetId: "tour-nav-settings", voiceText: "भाषा, AI टोन और गोपनीयता सेटिंग्स बदलें।" },
    { title: "प्रगति और लॉग", content: "पिछले परीक्षणों और परिणामों को ट्रैक करें।", tooltip: "डॉक्टरों को दिखाने के लिए बढ़िया।", targetId: "tour-nav-history", voiceText: "पिछले परीक्षणों और परिणामों को ट्रैक करें।" },
    { title: "मदद", content: "यदि आप फंस गए हैं, तो यहाँ आएं। आप यह ट्यूटोरियल फिर से देख सकते हैं।", tooltip: "", targetId: "tour-nav-help", voiceText: "यदि आप फंस गए हैं, तो यहाँ आएं।" },
    { title: "आप तैयार हैं!", content: "शुरू करने के लिए अपलोड या रिकॉर्ड करें।", tooltip: "", targetId: null, voiceText: "आप तैयार हैं! शुरू करने के लिए अपलोड या रिकॉर्ड करें।" }
  ],
  'Chinese': [
    { title: "欢迎使用 PhenoGraph", content: "您的智能健康筛查伴侣。让我们看看它是如何工作的。", tooltip: "", targetId: null, voiceText: "欢迎使用 PhenoGraph。让我们看看它是如何工作的。点击开始。" },
    { title: "上传部分", content: "您可以在此处上传视频、音频或医疗文档。除非您允许，否则我们不会存储您的数据。", tooltip: "支持视频、音频或 PDF。", targetId: "tour-tab-video", voiceText: "您可以在此处上传视频、音频或文档。" },
    { title: "实时捕捉", content: "想要实时 AI 反馈？点击此处开始录制。", tooltip: "PhenoGraph 将提供即时见解。", targetId: "tour-tab-live", voiceText: "想要实时 AI 反馈？点击此处开始录制。" },
    { title: "参考资料库", content: "访问我们的内置医疗数据库，获取有关疾病和治疗的信息。", tooltip: "快速查找信息。", targetId: "tour-nav-knowledge", voiceText: "访问我们的内置医疗数据库，获取有关疾病和治疗的信息。" },
    { title: "分析部分", content: "上传后，我们会对您的输入进行深入分析以发现模式。", tooltip: "您将获得可能的状况和建议。", targetId: "tour-btn-analyze", voiceText: "上传后，我们会进行深入分析。" },
    { title: "聊天助手", content: "询问有关报告的问题或与 PhenoGraph AI 讨论病例。", tooltip: "支持文本、语音和文件附件。", targetId: "tour-nav-chat", voiceText: "询问有关报告的问题或与 AI 讨论病例。" },
    { title: "设置面板", content: "自定义 PhenoGraph。更改语言、AI 语气和隐私设置。", tooltip: "点击此处更改设置。", targetId: "tour-nav-settings", voiceText: "自定义 PhenoGraph。更改语言和隐私设置。" },
    { title: "进度与记录", content: "跟踪之前的测试和结果。", tooltip: "非常适合向医生展示。", targetId: "tour-nav-history", voiceText: "跟踪之前的测试和结果。" },
    { title: "帮助与支持", content: "如果您遇到困难，请来这里。您可以重看此教程。", tooltip: "", targetId: "tour-nav-help", voiceText: "如果您遇到困难，请来这里。" },
    { title: "准备就绪！", content: "上传或录制以开始。", tooltip: "", targetId: null, voiceText: "准备就绪！上传或录制以开始。" }
  ],
  'French': [
    { title: "Bienvenue sur PhenoGraph", content: "Votre compagnon intelligent de dépistage santé. Voyons comment cela fonctionne.", tooltip: "", targetId: null, voiceText: "Bienvenue sur PhenoGraph. Voyons comment cela fonctionne. Appuyez sur Démarrer." },
    { title: "Section Téléchargement", content: "Téléchargez vidéo, audio ou documents ici. Nous ne stockons pas vos données sans accord.", tooltip: "Fichiers vidéo, audio ou PDF.", targetId: "tour-tab-video", voiceText: "Téléchargez vidéo, audio ou documents ici." },
    { title: "Capture en Direct", content: "Besoin d'un retour IA en temps réel ? Appuyez ici et enregistrez.", tooltip: "PhenoGraph donne des aperçus instantanés.", targetId: "tour-tab-live", voiceText: "Besoin d'un retour IA en temps réel ? Appuyez ici." },
    { title: "Bibliothèque de Référence", content: "Accédez à notre base de données pour des infos sur les conditions et traitements.", tooltip: "Recherche rapide.", targetId: "tour-nav-knowledge", voiceText: "Accédez à notre base de données pour des infos sur les conditions et traitements." },
    { title: "Section Analyse", content: "Après l'envoi, nous analysons vos données pour trouver des modèles.", tooltip: "Vous recevrez des suggestions.", targetId: "tour-btn-analyze", voiceText: "Nous analysons vos données pour trouver des modèles." },
    { title: "Assistant Chat", content: "Posez des questions sur le rapport ou discutez avec l'IA PhenoGraph.", tooltip: "Supporte texte, voix et fichiers.", targetId: "tour-nav-chat", voiceText: "Posez des questions sur le rapport ou discutez avec l'IA." },
    { title: "Paramètres", content: "Personnalisez PhenoGraph. Changez la langue, le ton de l'IA et la confidentialité.", tooltip: "Appuyez ici pour les réglages.", targetId: "tour-nav-settings", voiceText: "Changez la langue et les paramètres de confidentialité." },
    { title: "Progrès et Journaux", content: "Suivez vos tests précédents et consultez les rapports.", tooltip: "Idéal pour montrer aux médecins.", targetId: "tour-nav-history", voiceText: "Suivez vos tests précédents et consultez les rapports." },
    { title: "Aide", content: "Si vous êtes bloqué, venez ici. Vous pouvez revoir ce tutoriel.", tooltip: "", targetId: "tour-nav-help", voiceText: "Si vous êtes bloqué, venez ici." },
    { title: "Tout est prêt !", content: "Téléchargez ou enregistrez pour commencer.", tooltip: "", targetId: null, voiceText: "Tout est prêt ! Téléchargez ou enregistrez pour commencer." }
  ],
  'German': [
    { title: "Willkommen bei PhenoGraph", content: "Ihr intelligenter Begleiter für Gesundheitsscreenings. Lassen Sie uns sehen, wie es funktioniert.", tooltip: "", targetId: null, voiceText: "Willkommen bei PhenoGraph. Ihr intelligenter Begleiter für Gesundheitsscreenings. Tippen Sie auf Start, um zu beginnen." },
    { title: "Upload-Bereich", content: "Laden Sie hier Patientenvideos, Sprachnotizen oder klinische Verläufe hoch. Wir speichern keine Daten ohne Ihre Zustimmung.", tooltip: "Videodateien, Audio oder Textnotizen.", targetId: "tour-tab-video", voiceText: "Laden Sie hier Patientenvideos, Sprachnotizen oder klinische Verläufe hoch." },
    { title: "Live-Erfassung", content: "Möchten Sie KI-Feedback in Echtzeit? Tippen Sie hier und starten Sie die Aufnahme.", tooltip: "PhenoGraph liefert sofortige Erkenntnisse.", targetId: "tour-tab-live", voiceText: "Möchten Sie KI-Feedback in Echtzeit? Tippen Sie hier und starten Sie die Aufnahme." },
    { title: "Referenzbibliothek", content: "Greifen Sie auf unsere medizinische Datenbank zu, um Informationen zu Erkrankungen und Behandlungen zu erhalten.", tooltip: "Ideal zum schnellen Nachschlagen.", targetId: "tour-nav-knowledge", voiceText: "Greifen Sie auf unsere medizinische Datenbank zu, um Informationen zu Erkrankungen und Behandlungen zu erhalten." },
    { title: "Analyse-Bereich", content: "Nach dem Hochladen oder Aufnehmen führen wir eine Tiefenanalyse durch, um Muster zu finden.", tooltip: "Sie erhalten auch mögliche Erkrankungen und Vorschläge.", targetId: "tour-btn-analyze", voiceText: "Nach dem Hochladen oder Aufnehmen führen wir eine Tiefenanalyse durch." },
    { title: "KI-Chat-Assistent", content: "Haben Sie Fragen zu einem Bericht? Tippen Sie hier, um mit der PhenoGraph-KI zu chatten.", tooltip: "Unterstützt Text, Sprache und Dateianhänge.", targetId: "tour-nav-chat", voiceText: "Haben Sie Fragen zu einem Bericht? Tippen Sie hier, um mit der KI zu chatten." },
    { title: "Einstellungen", content: "Passen Sie PhenoGraph an. Ändern Sie Sprache, KI-Ton und Datenschutzeinstellungen.", tooltip: "Tippen Sie hier für Einstellungen.", targetId: "tour-nav-settings", voiceText: "Passen Sie PhenoGraph an. Ändern Sie Sprache, KI-Ton und Datenschutzeinstellungen." },
    { title: "Fortschritt & Protokolle", content: "Verfolgen Sie frühere Tests und Ergebnisse und sehen Sie detaillierte Berichte an.", tooltip: "Gut, um es Ärzten zu zeigen.", targetId: "tour-nav-history", voiceText: "Verfolgen Sie frühere Tests und Ergebnisse." },
    { title: "Hilfe & Support", content: "Wenn Sie nicht weiterkommen, kommen Sie hierher. Sie können dieses Tutorial erneut ansehen.", tooltip: "", targetId: "tour-nav-help", voiceText: "Wenn Sie nicht weiterkommen, kommen Sie hierher." },
    { title: "Alles bereit!", content: "Laden Sie hoch oder nehmen Sie auf, um zu beginnen.", tooltip: "", targetId: null, voiceText: "Alles bereit! Laden Sie hoch oder nehmen Sie auf, um zu beginnen." }
  ],
  'Arabic': [
    { title: "مرحبًا بك في PhenoGraph", content: "رفيقك الذكي للفحص الصحي. دعنا نرى كيف يعمل.", tooltip: "", targetId: null, voiceText: "مرحبًا بك في PhenoGraph. رفيقك الذكي للفحص الصحي. اضغط على ابدأ." },
    { title: "قسم التحميل", content: "قم بتحميل فيديو المريض أو الملاحظات الصوتية أو التاريخ السريري هنا. لا نقوم بتخزين البيانات دون موافقتك.", tooltip: "ملفات الفيديو أو الصوت أو الملاحظات النصية.", targetId: "tour-tab-video", voiceText: "قم بتحميل فيديو المريض أو الملاحظات الصوتية هنا." },
    { title: "الالتقاط المباشر", content: "هل تريد تعليقات الذكاء الاصطناعي في الوقت الفعلي؟ اضغط هنا وابدأ التسجيل.", tooltip: "سيقدم PhenoGraph رؤى فورية.", targetId: "tour-tab-live", voiceText: "هل تريد تعليقات الذكاء الاصطناعي في الوقت الفعلي؟ اضغط هنا وابدأ التسجيل." },
    { title: "مكتبة المراجع", content: "الوصول إلى قاعدة البيانات الطبية الخاصة بنا للحصول على معلومات حول الحالات والعلاجات.", tooltip: "عظيم لعمليات البحث السريعة.", targetId: "tour-nav-knowledge", voiceText: "الوصول إلى قاعدة البيانات الطبية الخاصة بنا للحصول على معلومات حول الحالات والعلاجات." },
    { title: "قسم التحليل", content: "بعد التحميل أو التسجيل، نقوم بإجراء تحليل عميق لمدخلاتك للعثور على الأنماط.", tooltip: "ستحصل أيضًا على الحالات المحتملة والاقتراحات.", targetId: "tour-btn-analyze", voiceText: "بعد التحميل أو التسجيل، نقوم بإجراء تحليل عميق لمدخلاتك." },
    { title: "مساعد الدردشة", content: "هل لديك أسئلة حول التقرير؟ اضغط هنا للدردشة مع PhenoGraph AI.", tooltip: "يدعم النص والصوت والمرفقات.", targetId: "tour-nav-chat", voiceText: "هل لديك أسئلة حول التقرير؟ اضغط هنا للدردشة مع الذكاء الاصطناعي." },
    { title: "الإعدادات", content: "تخصيص PhenoGraph. تغيير اللغة ونبرة الذكاء الاصطناعي والخصوصية.", tooltip: "اضغط هنا للإعدادات.", targetId: "tour-nav-settings", voiceText: "تخصيص PhenoGraph. تغيير اللغة ونبرة الذكاء الاصطناعي والخصوصية." },
    { title: "التقدم والسجلات", content: "تتبع الاختبارات والنتائج السابقة وعرض التقارير التفصيلية.", tooltip: "عظيم لإظهار الأطباء.", targetId: "tour-nav-history", voiceText: "تتبع الاختبارات والنتائج السابقة وعرض التقارير التفصيلية." },
    { title: "المساعدة والدعم", content: "إذا واجهت مشكلة، تعال إلى هنا. يمكنك إعادة مشاهدة هذا البرنامج التعليمي.", tooltip: "", targetId: "tour-nav-help", voiceText: "إذا واجهت مشكلة، تعال إلى هنا." },
    { title: "أنت جاهز تمامًا!", content: "قم بالتحميل أو التسجيل للبدء.", tooltip: "", targetId: null, voiceText: "أنت جاهز تمامًا! قم بالتحميل أو التسجيل للبدء." }
  ],
  'Portuguese': [
    { title: "Bem-vindo ao PhenoGraph", content: "Seu companheiro inteligente de triagem de saúde. Vamos ver como funciona.", tooltip: "", targetId: null, voiceText: "Bem-vindo ao PhenoGraph. Seu companheiro inteligente de triagem de saúde. Toque em Iniciar para começar." },
    { title: "Seção de Upload", content: "Faça upload de vídeo do paciente, adicione notas de voz ou insira o histórico clínico aqui. Não armazenamos dados sem sua permissão.", tooltip: "Arquivos de vídeo, áudio ou notas de texto.", targetId: "tour-tab-video", voiceText: "Faça upload de vídeo do paciente, adicione notas de voz ou insira o histórico clínico aqui." },
    { title: "Captura ao Vivo", content: "Quer feedback de IA em tempo real? Toque aqui e comece a gravar.", tooltip: "O PhenoGraph fornecerá insights instantâneos.", targetId: "tour-tab-live", voiceText: "Quer feedback de IA em tempo real? Toque aqui e comece a gravar." },
    { title: "Biblioteca de Referência", content: "Acesse nosso banco de dados médico para informações sobre condições e tratamentos.", tooltip: "Ótimo para pesquisas rápidas.", targetId: "tour-nav-knowledge", voiceText: "Acesse nosso banco de dados médico para informações sobre condições e tratamentos." },
    { title: "Seção de Análise", content: "Após o upload ou gravação, executamos uma análise profunda em sua entrada para encontrar padrões.", tooltip: "Você também receberá possíveis condições e sugestões.", targetId: "tour-btn-analyze", voiceText: "Após o upload ou gravação, executamos uma análise profunda em sua entrada." },
    { title: "Assistente de Chat IA", content: "Tem perguntas sobre um relatório? Toque aqui para conversar com a IA do PhenoGraph.", tooltip: "Suporta texto, voz e anexos.", targetId: "tour-nav-chat", voiceText: "Tem perguntas sobre um relatório? Toque aqui para conversar com a IA." },
    { title: "Configurações", content: "Personalize o PhenoGraph. Altere o idioma, o tom da IA e as configurações de privacidade.", tooltip: "Toque aqui para configurações.", targetId: "tour-nav-settings", voiceText: "Personalize o PhenoGraph. Altere o idioma, o tom da IA e as configurações de privacidade." },
    { title: "Progresso e Registros", content: "Acompanhe testes e resultados anteriores e veja relatórios detalhados.", tooltip: "Ótimo para mostrar aos médicos.", targetId: "tour-nav-history", voiceText: "Acompanhe testes e resultados anteriores." },
    { title: "Ajuda e Suporte", content: "Se você ficar preso, venha aqui. Você pode rever este tutorial.", tooltip: "", targetId: "tour-nav-help", voiceText: "Se você ficar preso, venha aqui." },
    { title: "Tudo Pronto!", content: "Faça upload ou grave para começar.", tooltip: "", targetId: null, voiceText: "Tudo pronto! Faça upload ou grave para começar." }
  ],
  'Russian': [
    { title: "Добро пожаловать в PhenoGraph", content: "Ваш умный помощник по скринингу здоровья. Давайте посмотрим, как это работает.", tooltip: "", targetId: null, voiceText: "Добро пожаловать в PhenoGraph. Ваш умный помощник по скринингу здоровья. Нажмите Старт, чтобы начать." },
    { title: "Раздел загрузки", content: "Загрузите видео пациента, добавьте голосовые заметки или введите историю болезни здесь. Мы не храним данные без вашего согласия.", tooltip: "Видеофайлы, аудио или текстовые заметки.", targetId: "tour-tab-video", voiceText: "Загрузите видео пациента, добавьте голосовые заметки или введите историю болезни здесь." },
    { title: "Живой захват", content: "Хотите обратную связь от ИИ в реальном времени? Нажмите здесь и начните запись.", tooltip: "PhenoGraph даст мгновенные инсайты.", targetId: "tour-tab-live", voiceText: "Хотите обратную связь от ИИ в реальном времени? Нажмите здесь и начните запись." },
    { title: "Справочная библиотека", content: "Получите доступ к нашей медицинской базе данных для информации о состояниях и лечении.", tooltip: "Отлично подходит для быстрого поиска.", targetId: "tour-nav-knowledge", voiceText: "Получите доступ к нашей медицинской базе данных для информации о состояниях и лечении." },
    { title: "Раздел анализа", content: "После загрузки или записи мы проводим глубокий анализ ваших данных для поиска закономерностей.", tooltip: "Вы также получите возможные диагнозы и предложения.", targetId: "tour-btn-analyze", voiceText: "После загрузки или записи мы проводим глубокий анализ ваших данных." },
    { title: "Чат-ассистент ИИ", content: "Есть вопросы по отчету? Нажмите здесь, чтобы пообщаться с ИИ PhenoGraph.", tooltip: "Поддерживает текст, голос и вложения.", targetId: "tour-nav-chat", voiceText: "Есть вопросы по отчету? Нажмите здесь, чтобы пообщаться с ИИ." },
    { title: "Панель настроек", content: "Настройте PhenoGraph. Измените язык, тон ИИ и настройки конфиденциальности.", tooltip: "Нажмите здесь для настроек.", targetId: "tour-nav-settings", voiceText: "Настройте PhenoGraph. Измените язык, тон ИИ и настройки конфиденциальности." },
    { title: "Прогресс и журналы", content: "Отслеживайте предыдущие тесты и результаты, просматривайте подробные отчеты.", tooltip: "Отлично подходит для показа врачам.", targetId: "tour-nav-history", voiceText: "Отслеживайте предыдущие тесты и результаты." },
    { title: "Помощь и поддержка", content: "Если вы застряли, зайдите сюда. Вы можете пересмотреть это руководство.", tooltip: "", targetId: "tour-nav-help", voiceText: "Если вы застряли, зайдите сюда." },
    { title: "Все готово!", content: "Загрузите или запишите, чтобы начать.", tooltip: "", targetId: null, voiceText: "Все готово! Загрузите или запишите, чтобы начать." }
  ],
  'Japanese': [
    { title: "PhenoGraphへようこそ", content: "あなたのスマートな健康スクリーニングコンパニオンです。使いを見てみましょう。", tooltip: "", targetId: null, voiceText: "PhenoGraphへようこそ。あなたのスマートな健康スクリーニングコンパニオンです。開始をタップしてください。" },
    { title: "アップロードセクション", content: "患者の動画、音声メモ、または臨床歴をここにアップロードします。許可なくデータを保存することはありません。", tooltip: "動画ファイル、音声、またはテキストメモ。", targetId: "tour-tab-video", voiceText: "患者の動画、音声メモ、または臨床歴をここにアップロードします。" },
    { title: "ライブキャプチャ", content: "リアルタイムのAIフィードバックが必要ですか？ここをタップして録画を開始してください。", tooltip: "PhenoGraphは即座に洞察を提供します。", targetId: "tour-tab-live", voiceText: "リアルタイムのAIフィードバックが必要ですか？ここをタップして録画を開始してください。" },
    { title: "リファレンスライブラリ", content: "状態や治療に関する情報については、組み込みの医療データベースにアクセスしてください。", tooltip: "素早い検索に最適です。", targetId: "tour-nav-knowledge", voiceText: "状態や治療に関する情報については、組み込みの医療データベースにアクセスしてください。" },
    { title: "分析セクション", content: "アップロードまたは録画後、入力内容を深く分析してパターンを見つけます。", tooltip: "可能性のある状態や提案も得られます。", targetId: "tour-btn-analyze", voiceText: "アップロードまたは録画後、入力内容を深く分析します。" },
    { title: "AIチャットアシスタント", content: "レポートについて質問がありますか？ここをタップしてPhenoGraph AIとチャットしてください。", tooltip: "テキスト、音声、添付ファイルをサポートしています。", targetId: "tour-nav-chat", voiceText: "レポートについて質問がありますか？ここをタップしてAIとチャットしてください。" },
    { title: "設定パネル", content: "PhenoGraphをカスタマイズします。言語、AIのトーン、プライバシー設定を変更します。", tooltip: "設定はこちらをタップしてください。", targetId: "tour-nav-settings", voiceText: "PhenoGraphをカスタマイズします。言語、AIのトーン、プライバシー設定を変更します。" },
    { title: "進捗とログ", content: "過去のテスト、結果を追跡し、詳細なレポートを表示します。", tooltip: "医師に見せるのに最適です。", targetId: "tour-nav-history", voiceText: "過去のテスト、結果を追跡します。" },
    { title: "ヘルプとサポート", content: "行き詰まった場合は、ここに来てください。このチュートリアルをもう一度見ることができます。", tooltip: "", targetId: "tour-nav-help", voiceText: "行き詰まった場合は、ここに来てください。" },
    { title: "準備完了！", content: "開始するにはアップロードまたは録画してください。", tooltip: "", targetId: null, voiceText: "準備完了！開始するにはアップロードまたは録画してください。" }
  ]
};

// Default fallback if language not found
const getStepsForLanguage = (lang: string): TourStep[] => {
  return TRANSLATIONS[lang] || TRANSLATIONS['English'];
};

export const WelcomeTutorial: React.FC<WelcomeTutorialProps> = ({ onComplete, language }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const steps = getStepsForLanguage(language);
  const step = steps[currentStepIndex] || steps[0];
  const langTag = LANG_MAP[language] || 'en-US';

  // Load Voices (Async)
  useEffect(() => {
    const loadVoices = () => {
      const vs = window.speechSynthesis.getVoices();
      setVoices(vs);
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Handle Resize for overlay calculation
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // "Smart" Voice Selection for Realism
  const getBestVoice = (langTag: string) => {
    // 1. Try to find "Google" voices (usually Neural/High Quality on Chrome)
    const googleVoice = voices.find(v => v.lang.startsWith(langTag.split('-')[0]) && v.name.includes('Google'));
    if (googleVoice) return googleVoice;

    // 2. Try to find "Microsoft" voices (Edge/Windows Natural)
    const msVoice = voices.find(v => v.lang.startsWith(langTag.split('-')[0]) && v.name.includes('Microsoft'));
    if (msVoice) return msVoice;
    
    // 3. Try exact match
    const exact = voices.find(v => v.lang === langTag);
    if (exact) return exact;

    // 4. Loose match
    return voices.find(v => v.lang.startsWith(langTag.split('-')[0]));
  };

  // Calculate Target Position & Voice Narration
  useEffect(() => {
    if (step.targetId) {
      const el = document.getElementById(step.targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }

    // Speak
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(step.voiceText);
      
      // Setup Voice
      const bestVoice = getBestVoice(langTag);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      } else {
        utterance.lang = langTag;
      }

      // Tuning for realism
      utterance.rate = 1.0; 
      utterance.pitch = 1.0; 

      window.speechSynthesis.speak(utterance);
    }

  }, [currentStepIndex, language, voices]); // Re-run if language or voices change

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem('onboarding_complete', 'true');
    }
    window.speechSynthesis.cancel();
    onComplete();
  };

  const handleRestart = () => setCurrentStepIndex(0);

  // Overlay Path Construction
  const getClipPath = () => {
    if (!targetRect) return 'none';
    const padding = 8;
    const l = targetRect.left - padding;
    const t = targetRect.top - padding;
    const r = targetRect.right + padding;
    const b = targetRect.bottom + padding;

    return `polygon(
      0% 0%, 
      0% 100%, 
      ${l}px 100%, 
      ${l}px ${t}px, 
      ${r}px ${t}px, 
      ${r}px ${b}px, 
      ${l}px ${b}px, 
      ${l}px 100%, 
      100% 100%, 
      100% 0%
    )`;
  };

  const getCardStyle = () => {
    if (!targetRect) return {}; 
    const cardWidth = 320;
    const padding = 20;
    let top = targetRect.bottom + padding;
    let left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);

    if (top + 200 > windowSize.height) {
      top = targetRect.top - padding - 200; 
    }
    if (left < padding) left = padding;
    if (left + cardWidth > windowSize.width - padding) left = windowSize.width - cardWidth - padding;

    return {
      position: 'absolute' as const,
      top: top,
      left: left,
      width: cardWidth
    };
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      
      {targetRect ? (
         <div 
           className="absolute inset-0 bg-black/60 transition-all duration-300 ease-out"
           style={{ clipPath: getClipPath() }}
         />
      ) : (
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300" />
      )}

      {targetRect && (
        <div 
          className="absolute border-2 border-brand-400 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 pointer-events-none animate-pulse"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      <div 
        className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col
          ${!targetRect ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md' : ''}`}
        style={targetRect ? getCardStyle() : {}}
      >
        {currentStepIndex === 0 && (
           <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-6 flex justify-center">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
                <BrainCircuit size={48} className="text-white" />
              </div>
           </div>
        )}

        <div className="p-6">
           <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-full border border-brand-100 uppercase tracking-wider">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <div className="flex gap-2">
                 <button onClick={handleRestart} className="text-gray-400 hover:text-gray-600 transition-colors" title="Restart">
                   <RotateCcw size={16} />
                 </button>
                 <button onClick={handleComplete} className="text-gray-400 hover:text-gray-600 transition-colors" title="Close">
                   <X size={20} />
                 </button>
              </div>
           </div>

           <h2 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h2>
           <p className="text-gray-600 leading-relaxed mb-4">{step.content}</p>

           {step.tooltip && (
             <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-4 rounded-r-md">
                <p className="text-xs text-amber-800 font-medium">{step.tooltip}</p>
             </div>
           )}

           <div className="flex flex-col gap-3 mt-4">
              <button 
                onClick={handleNext}
                className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 transform active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {currentStepIndex === 0 ? "Start" : 
                 currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
                {currentStepIndex !== steps.length - 1 && <ChevronRight size={18} />}
              </button>
              
              {currentStepIndex === steps.length - 1 && (
                 <label className="flex items-center justify-center gap-2 text-sm text-gray-500 cursor-pointer mt-2">
                   <input 
                     type="checkbox" 
                     checked={dontShowAgain} 
                     onChange={(e) => setDontShowAgain(e.target.checked)}
                     className="rounded text-brand-600 focus:ring-brand-500" 
                   />
                   Don't show this again
                 </label>
              )}
           </div>
        </div>
      </div>

    </div>
  );
};
