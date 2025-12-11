
export const TRANSLATIONS: Record<string, any> = {
  English: {
    nav: {
      title: "PhenoGraph Reasoner",
      subtitle: "Clinical Decision Support AI",
      knowledge: "Library",
      history: "History",
      help: "Guide",
      settings: "Settings"
    },
    input: {
      tabs: { live: "Live Mode", patient: "Patient", video: "Video", speech: "Speech", links: "Links", hpo: "Symptoms" },
      age: "Age",
      sex: "Sex",
      note: "Clinical Note / History",
      notePlaceholder: "Type symptoms (e.g. history of seizures...)",
      record: "Record Voice Note",
      recording: "Recording...",
      reset: "Reset",
      analyze: "Analyze",
      analyzing: "Analyzing...",
      upload: "Tap to Upload / Record",
      remove: "Remove",
      add: "Add",
      noTerms: "No terms added. Video analysis will extract terms automatically.",
      manualSpeech: "Manual Entry: Enter vocal biomarkers if you have existing measurements."
    },
    live: {
      start: "Start Live Assessment",
      stop: "Stop Session",
      listening: "Co-pilot Listening...",
      init: "Initializing Co-pilot...",
      desc: "The AI will watch your camera stream and provide brief, spoken observations in real-time."
    },
    report: {
      back: "Back to Input",
      export: "Export JSON",
      summary: "Patient Summary",
      caregiver: "Caregiver Summary",
      progression: "Disease Progression",
      differential: "Differential Ranking",
      timeline: "Observation Timeline",
      sources: "Web Sources & Media Context",
      confidence: "Confidence",
      match: "Match",
      evidence: "Supporting Evidence",
      rationale: "Clinical Rationale",
      nextSteps: "Suggested Next Steps",
      disclaimer: "Medical Disclaimer"
    },
    settings: {
      title: "Settings",
      categories: { input: "Input", ai: "AI", access: "Language", privacy: "Privacy", dev: "Developer" },
      save: "Save Changes",
      cancel: "Cancel",
      reset: "Reset All"
    },
    knowledge: {
      search: "Search Handbook...",
      noResults: "No matching conditions found.",
      management: "Standard Management",
      redFlags: "Key Clinical Signs (Red Flags)",
      similar: "Similar / Related Conditions"
    },
    history: {
      title: "Patient History",
      noHistory: "No analysis history found.",
      clear: "Clear All",
      close: "Close"
    }
  },
  Spanish: {
    nav: {
      title: "Razonador PhenoGraph",
      subtitle: "IA de Soporte Clínico",
      knowledge: "Biblioteca",
      history: "Historial",
      help: "Guía",
      settings: "Ajustes"
    },
    input: {
      tabs: { live: "En Vivo", patient: "Paciente", video: "Video", speech: "Habla", links: "Enlaces", hpo: "Síntomas" },
      age: "Edad",
      sex: "Sexo",
      note: "Nota Clínica / Historia",
      notePlaceholder: "Escriba síntomas (ej. historial de convulsiones...)",
      record: "Grabar Nota de Voz",
      recording: "Grabando...",
      reset: "Reiniciar",
      analyze: "Analizar",
      analyzing: "Analizando...",
      upload: "Tocar para Subir / Grabar",
      remove: "Eliminar",
      add: "Añadir",
      noTerms: "No hay términos. El análisis de vídeo los extraerá.",
      manualSpeech: "Entrada Manual: Ingrese biomarcadores vocales si los tiene."
    },
    live: {
      start: "Iniciar Evaluación en Vivo",
      stop: "Detener Sesión",
      listening: "Copiloto Escuchando...",
      init: "Iniciando Copiloto...",
      desc: "La IA observará su cámara y dará observaciones breves en tiempo real."
    },
    report: {
      back: "Volver",
      export: "Exportar JSON",
      summary: "Resumen del Paciente",
      caregiver: "Resumen para Cuidadores",
      progression: "Progresión de la Enfermedad",
      differential: "Clasificación Diferencial",
      timeline: "Línea de Tiempo",
      sources: "Fuentes Web y Contexto",
      confidence: "Confianza",
      match: "Coincidencia",
      evidence: "Evidencia de Apoyo",
      rationale: "Razonamiento Clínico",
      nextSteps: "Próximos Pasos Sugeridos",
      disclaimer: "Aviso Médico"
    },
    settings: {
      title: "Ajustes",
      categories: { input: "Entrada", ai: "IA", access: "Idioma", privacy: "Privacidad", dev: "Desarrollador" },
      save: "Guardar Cambios",
      cancel: "Cancelar",
      reset: "Restablecer"
    },
    knowledge: {
      search: "Buscar Manual...",
      noResults: "No se encontraron condiciones.",
      management: "Manejo Estándar",
      redFlags: "Signos Clínicos Clave (Banderas Rojas)",
      similar: "Condiciones Similares / Relacionadas"
    },
    history: {
      title: "Historial del Paciente",
      noHistory: "No se encontró historial.",
      clear: "Borrar Todo",
      close: "Cerrar"
    }
  },
  French: {
    nav: {
      title: "PhenoGraph Raisonneur",
      subtitle: "IA d'Aide à la Décision",
      knowledge: "Bibliothèque",
      history: "Historique",
      help: "Guide",
      settings: "Paramètres"
    },
    input: {
      tabs: { live: "Direct", patient: "Patient", video: "Vidéo", speech: "Parole", links: "Liens", hpo: "Symptômes" },
      age: "Âge",
      sex: "Sexe",
      note: "Note Clinique",
      notePlaceholder: "Tapez les symptômes...",
      record: "Enregistrer Note Vocale",
      recording: "Enregistrement...",
      reset: "Réinitialiser",
      analyze: "Analyser",
      analyzing: "Analyse en cours...",
      upload: "Appuyez pour Télécharger",
      remove: "Supprimer",
      add: "Ajouter",
      noTerms: "Aucun terme ajouté.",
      manualSpeech: "Saisie Manuelle: Entrez les biomarqueurs vocaux."
    },
    live: {
      start: "Démarrer l'Évaluation",
      stop: "Arrêter la Session",
      listening: "Le copilote écoute...",
      init: "Initialisation...",
      desc: "L'IA observera votre caméra et fournira des observations en temps réel."
    },
    report: {
      back: "Retour",
      export: "Exporter JSON",
      summary: "Résumé Patient",
      caregiver: "Résumé pour Aidants",
      progression: "Progression de la Maladie",
      differential: "Classement Différentiel",
      timeline: "Chronologie",
      sources: "Sources Web",
      confidence: "Confiance",
      match: "Correspondance",
      evidence: "Preuves",
      rationale: "Raisonnement Clinique",
      nextSteps: "Étapes Suivantes",
      disclaimer: "Avis Médical"
    },
    settings: {
      title: "Paramètres",
      categories: { input: "Entrée", ai: "IA", access: "Langue", privacy: "Confidentialité", dev: "Dév" },
      save: "Enregistrer",
      cancel: "Annuler",
      reset: "Réinitialiser"
    },
    knowledge: {
      search: "Rechercher...",
      noResults: "Aucun résultat.",
      management: "Gestion Standard",
      redFlags: "Signes Cliniques Clés",
      similar: "Conditions Similaires"
    },
    history: {
      title: "Historique Patient",
      noHistory: "Aucun historique.",
      clear: "Tout Effacer",
      close: "Fermer"
    }
  },
  Hindi: {
    nav: {
      title: "PhenoGraph",
      subtitle: "नैदानिक निर्णय सहायता AI",
      knowledge: "लाइब्रेरी",
      history: "इतिहास",
      help: "गाइड",
      settings: "सेटिंग्स"
    },
    input: {
      tabs: { live: "लाइव मोड", patient: "मरीज", video: "वीडियो", speech: "भाषण", links: "लिंक्स", hpo: "लक्षण" },
      age: "उम्र",
      sex: "लिंग",
      note: "नैदानिक नोट",
      notePlaceholder: "लक्षण लिखें...",
      record: "वॉयस नोट रिकॉर्ड करें",
      recording: "रिकॉर्डिंग...",
      reset: "रीसेट",
      analyze: "विश्लेषण करें",
      analyzing: "विश्लेषण हो रहा है...",
      upload: "अपलोड / रिकॉर्ड करें",
      remove: "हटाएं",
      add: "जोड़ें",
      noTerms: "कोई शब्द नहीं जोड़ा गया।",
      manualSpeech: "मैनुअल प्रविष्टि: यदि आपके पास माप हैं तो दर्ज करें।"
    },
    live: {
      start: "लाइव मूल्यांकन शुरू करें",
      stop: "सत्र रोकें",
      listening: "सह-पायलट सुन रहा है...",
      init: "आरंभ हो रहा है...",
      desc: "AI आपके कैमरे को देखेगा और वास्तविक समय में संक्षिप्त अवलोकन प्रदान करेगा।"
    },
    report: {
      back: "वापस जाएं",
      export: "JSON निर्यात करें",
      summary: "मरीज का सारांश",
      caregiver: "देखभाल करने वाले का सारांश",
      progression: "रोग की प्रगति",
      differential: "विभेदक रैंकिंग",
      timeline: "समय रेखा",
      sources: "वेब स्रोत",
      confidence: "आत्मविश्वास",
      match: "मैच",
      evidence: "सहायक साक्ष्य",
      rationale: "नैदानिक तर्क",
      nextSteps: "सुझाए गए अगले कदम",
      disclaimer: "चिकित्सा अस्वीकरण"
    },
    settings: {
      title: "सेटिंग्स",
      categories: { input: "इनपुट", ai: "AI", access: "भाषा", privacy: "गोपनीयता", dev: "डेवलपर" },
      save: "बदलाव सहेजें",
      cancel: "रद्द करें",
      reset: "रीसेट करें"
    },
    knowledge: {
      search: "हैंडबुक खोजें...",
      noResults: "कोई परिणाम नहीं मिला।",
      management: "मानक प्रबंधन",
      redFlags: "मुख्य नैदानिक संकेत",
      similar: "समान / संबंधित स्थितियां"
    },
    history: {
      title: "मरीज का इतिहास",
      noHistory: "कोई इतिहास नहीं मिला।",
      clear: "सब साफ़ करें",
      close: "बंद करें"
    }
  },
  Chinese: {
    nav: {
      title: "PhenoGraph 推理器",
      subtitle: "临床决策支持 AI",
      knowledge: "资料库",
      history: "历史",
      help: "指南",
      settings: "设置"
    },
    input: {
      tabs: { live: "实时模式", patient: "患者", video: "视频", speech: "语音", links: "链接", hpo: "症状" },
      age: "年龄",
      sex: "性别",
      note: "临床笔记 / 病史",
      notePlaceholder: "输入症状...",
      record: "录制语音笔记",
      recording: "录音中...",
      reset: "重置",
      analyze: "分析",
      analyzing: "分析中...",
      upload: "点击上传 / 录制",
      remove: "移除",
      add: "添加",
      noTerms: "未添加术语。视频分析将自动提取。",
      manualSpeech: "手动输入：如果您有现有测量值，请输入。"
    },
    live: {
      start: "开始实时评估",
      stop: "停止会话",
      listening: "副驾驶正在聆听...",
      init: "正在初始化...",
      desc: "AI 将观察您的摄像头流并实时提供简短的语音观察。"
    },
    report: {
      back: "返回输入",
      export: "导出 JSON",
      summary: "患者摘要",
      caregiver: "看护者摘要",
      progression: "疾病进展",
      differential: "鉴别排名",
      timeline: "观察时间线",
      sources: "网络来源与媒体背景",
      confidence: "置信度",
      match: "匹配度",
      evidence: "支持证据",
      rationale: "临床基本原理",
      nextSteps: "建议的下一步",
      disclaimer: "医疗免责声明"
    },
    settings: {
      title: "设置",
      categories: { input: "输入", ai: "AI", access: "语言", privacy: "隐私", dev: "开发者" },
      save: "保存更改",
      cancel: "取消",
      reset: "全部重置"
    },
    knowledge: {
      search: "搜索手册...",
      noResults: "未找到匹配的状况。",
      management: "标准管理",
      redFlags: "关键临床体征 (红旗)",
      similar: "相似 / 相关状况"
    },
    history: {
      title: "患者历史",
      noHistory: "未找到分析历史。",
      clear: "全部清除",
      close: "关闭"
    }
  },
  German: {
    nav: {
      title: "PhenoGraph Reasoner",
      subtitle: "Klinische Entscheidungshilfe KI",
      knowledge: "Bibliothek",
      history: "Verlauf",
      help: "Hilfe",
      settings: "Einstellungen"
    },
    input: {
      tabs: { live: "Live-Modus", patient: "Patient", video: "Video", speech: "Sprache", links: "Links", hpo: "Symptome" },
      age: "Alter",
      sex: "Geschlecht",
      note: "Klinische Notiz / Anamnese",
      notePlaceholder: "Symptome eingeben (z.B. Krampfanfälle...)",
      record: "Sprachnotiz aufnehmen",
      recording: "Aufnahme...",
      reset: "Zurücksetzen",
      analyze: "Analysieren",
      analyzing: "Analysiere...",
      upload: "Tippen zum Hochladen / Aufnehmen",
      remove: "Entfernen",
      add: "Hinzufügen",
      noTerms: "Keine Begriffe hinzugefügt. Videoanalyse extrahiert automatisch.",
      manualSpeech: "Manuelle Eingabe: Geben Sie vokale Biomarker ein, falls vorhanden."
    },
    live: {
      start: "Live-Bewertung starten",
      stop: "Sitzung beenden",
      listening: "Co-Pilot hört zu...",
      init: "Initialisiere Co-Pilot...",
      desc: "Die KI beobachtet Ihren Kamerastream und gibt kurze, gesprochene Beobachtungen in Echtzeit."
    },
    report: {
      back: "Zurück zur Eingabe",
      export: "JSON exportieren",
      summary: "Patientenzusammenfassung",
      caregiver: "Zusammenfassung für Pflegekräfte",
      progression: "Krankheitsverlauf",
      differential: "Differentialdiagnose",
      timeline: "Beobachtungszeitachse",
      sources: "Webquellen & Medienkontext",
      confidence: "Vertrauen",
      match: "Übereinstimmung",
      evidence: "Unterstützende Beweise",
      rationale: "Klinische Begründung",
      nextSteps: "Vorgeschlagene nächste Schritte",
      disclaimer: "Medizinischer Haftungsausschluss"
    },
    settings: {
      title: "Einstellungen",
      categories: { input: "Eingabe", ai: "KI", access: "Sprache", privacy: "Datenschutz", dev: "Entwickler" },
      save: "Änderungen speichern",
      cancel: "Abbrechen",
      reset: "Alles zurücksetzen"
    },
    knowledge: {
      search: "Handbuch durchsuchen...",
      noResults: "Keine passenden Zustände gefunden.",
      management: "Standardmanagement",
      redFlags: "Wichtige klinische Zeichen (Red Flags)",
      similar: "Ähnliche / Verwandte Zustände"
    },
    history: {
      title: "Patientenverlauf",
      noHistory: "Kein Analyse-Verlauf gefunden.",
      clear: "Alle löschen",
      close: "Schließen"
    }
  },
  Arabic: {
    nav: {
      title: "PhenoGraph Reasoner",
      subtitle: "نظام دعم القرار السريري",
      knowledge: "المكتبة",
      history: "السجل",
      help: "مساعدة",
      settings: "الإعدادات"
    },
    input: {
      tabs: { live: "مباشر", patient: "مريض", video: "فيديو", speech: "صوت", links: "روابط", hpo: "أعراض" },
      age: "العمر",
      sex: "الجنس",
      note: "ملاحظة سريرية / التاريخ",
      notePlaceholder: "اكتب الأعراض (مثل تاريخ النوبات...)",
      record: "تسجيل ملاحظة صوتية",
      recording: "جاري التسجيل...",
      reset: "إعادة تعيين",
      analyze: "تحليل",
      analyzing: "جاري التحليل...",
      upload: "انقر للرفع / التسجيل",
      remove: "إزالة",
      add: "إضافة",
      noTerms: "لم يتم إضافة مصطلحات. سيقوم تحليل الفيديو باستخراج المصطلحات تلقائيًا.",
      manualSpeech: "إدخال يدوي: أدخل المؤشرات الحيوية الصوتية إذا كانت لديك قياسات حالية."
    },
    live: {
      start: "بدء التقييم المباشر",
      stop: "إيقاف الجلسة",
      listening: "مساعد الطيار يستمع...",
      init: "جاري التهيئة...",
      desc: "سيراقب الذكاء الاصطناعي الكاميرا ويقدم ملاحظات صوتية موجزة في الوقت الفعلي."
    },
    report: {
      back: "رجوع للإدخال",
      export: "تصدير JSON",
      summary: "ملخص المريض",
      caregiver: "ملخص لمقدمي الرعاية",
      progression: "تطور المرض",
      differential: "التصنيف التفريقي",
      timeline: "الجدول الزمني للملاحظات",
      sources: "مصادر الويب وسياق الوسائط",
      confidence: "الثقة",
      match: "تطابق",
      evidence: "أدلة داعمة",
      rationale: "المنطق السريري",
      nextSteps: "الخطوات التالية المقترحة",
      disclaimer: "إخلاء مسؤولية طبي"
    },
    settings: {
      title: "الإعدادات",
      categories: { input: "إدخال", ai: "ذكاء اصطناعي", access: "لغة", privacy: "خصوصية", dev: "مطور" },
      save: "حفظ التغييرات",
      cancel: "إلغاء",
      reset: "إعادة تعيين الكل"
    },
    knowledge: {
      search: "بحث في الدليل...",
      noResults: "لم يتم العثور على حالات مطابقة.",
      management: "الإدارة القياسية",
      redFlags: "العلامات السريرية الرئيسية (أعلام حمراء)",
      similar: "حالات مشابهة / ذات صلة"
    },
    history: {
      title: "سجل المريض",
      noHistory: "لم يتم العثور على سجل تحليل.",
      clear: "مسح الكل",
      close: "إغلاق"
    }
  },
  Portuguese: {
    nav: {
      title: "PhenoGraph Reasoner",
      subtitle: "IA de Suporte à Decisão Clínica",
      knowledge: "Biblioteca",
      history: "Histórico",
      help: "Guia",
      settings: "Configurações"
    },
    input: {
      tabs: { live: "Modo Vivo", patient: "Paciente", video: "Vídeo", speech: "Fala", links: "Links", hpo: "Sintomas" },
      age: "Idade",
      sex: "Sexo",
      note: "Nota Clínica / Histórico",
      notePlaceholder: "Digite sintomas (ex: histórico de convulsões...)",
      record: "Gravar Nota de Voz",
      recording: "Gravando...",
      reset: "Redefinir",
      analyze: "Analisar",
      analyzing: "Analisando...",
      upload: "Toque para Carregar / Gravar",
      remove: "Remover",
      add: "Adicionar",
      noTerms: "Nenhum termo adicionado. A análise de vídeo extrairá termos automaticamente.",
      manualSpeech: "Entrada Manual: Insira biomarcadores vocais se tiver medições existentes."
    },
    live: {
      start: "Iniciar Avaliação ao Vivo",
      stop: "Parar Sessão",
      listening: "Copiloto Ouvindo...",
      init: "Inicializando Copiloto...",
      desc: "A IA observará sua câmera e fornecerá observações breves e faladas em tempo real."
    },
    report: {
      back: "Voltar para Entrada",
      export: "Exportar JSON",
      summary: "Resumo do Paciente",
      caregiver: "Resumo para Cuidadores",
      progression: "Progressão da Doença",
      differential: "Classificação Diferencial",
      timeline: "Linha do Tempo de Observação",
      sources: "Fontes Web e Contexto de Mídia",
      confidence: "Confiança",
      match: "Correspondência",
      evidence: "Evidência de Apoio",
      rationale: "Justificativa Clínica",
      nextSteps: "Próximos Passos Sugeridos",
      disclaimer: "Aviso Médico"
    },
    settings: {
      title: "Configurações",
      categories: { input: "Entrada", ai: "IA", access: "Idioma", privacy: "Privacidade", dev: "Desenvolvedor" },
      save: "Salvar Alterações",
      cancel: "Cancelar",
      reset: "Redefinir Tudo"
    },
    knowledge: {
      search: "Pesquisar no Manual...",
      noResults: "Nenhuma condição correspondente encontrada.",
      management: "Gestão Padrão",
      redFlags: "Sinais Clínicos Chave (Bandeiras Vermelhas)",
      similar: "Condições Semelhantes / Relacionadas"
    },
    history: {
      title: "Histórico do Paciente",
      noHistory: "Nenhum histórico de análise encontrado.",
      clear: "Limpar Tudo",
      close: "Fechar"
    }
  },
  Russian: {
    nav: {
      title: "PhenoGraph Reasoner",
      subtitle: "ИИ для поддержки клинических решений",
      knowledge: "Библиотека",
      history: "История",
      help: "Руководство",
      settings: "Настройки"
    },
    input: {
      tabs: { live: "Live Режим", patient: "Пациент", video: "Видео", speech: "Речь", links: "Ссылки", hpo: "Симптомы" },
      age: "Возраст",
      sex: "Пол",
      note: "Клиническая заметка / История",
      notePlaceholder: "Введите симптомы (например, история судорог...)",
      record: "Записать голосовую заметку",
      recording: "Запись...",
      reset: "Сброс",
      analyze: "Анализировать",
      analyzing: "Анализ...",
      upload: "Нажмите для загрузки / записи",
      remove: "Удалить",
      add: "Добавить",
      noTerms: "Термины не добавлены. Видеоанализ извлечет их автоматически.",
      manualSpeech: "Ручной ввод: введите вокальные биомаркеры, если они есть."
    },
    live: {
      start: "Начать Live оценку",
      stop: "Остановить сессию",
      listening: "Ко-пилот слушает...",
      init: "Инициализация ко-пилота...",
      desc: "ИИ будет наблюдать за камерой и давать краткие голосовые наблюдения в реальном времени."
    },
    report: {
      back: "Назад к вводу",
      export: "Экспорт JSON",
      summary: "Сводка по пациенту",
      caregiver: "Сводка для опекунов",
      progression: "Прогрессирование болезни",
      differential: "Дифференциальный рейтинг",
      timeline: "Хронология наблюдений",
      sources: "Веб-источники и медиа",
      confidence: "Уверенность",
      match: "Совпадение",
      evidence: "Подтверждающие данные",
      rationale: "Клиническое обоснование",
      nextSteps: "Предлагаемые следующие шаги",
      disclaimer: "Медицинский отказ от ответственности"
    },
    settings: {
      title: "Настройки",
      categories: { input: "Ввод", ai: "ИИ", access: "Язык", privacy: "Конфиденциальность", dev: "Разработчик" },
      save: "Сохранить изменения",
      cancel: "Отмена",
      reset: "Сбросить все"
    },
    knowledge: {
      search: "Поиск в справочнике...",
      noResults: "Совпадающие состояния не найдены.",
      management: "Стандартное ведение",
      redFlags: "Ключевые клинические признаки (красные флаги)",
      similar: "Похожие / связанные состояния"
    },
    history: {
      title: "История пациента",
      noHistory: "История анализов не найдена.",
      clear: "Очистить все",
      close: "Закрыть"
    }
  },
  Japanese: {
    nav: {
      title: "PhenoGraph Reasoner",
      subtitle: "臨床意思決定支援AI",
      knowledge: "ライブラリ",
      history: "履歴",
      help: "ガイド",
      settings: "設定"
    },
    input: {
      tabs: { live: "ライブモード", patient: "患者", video: "動画", speech: "音声", links: "リンク", hpo: "症状" },
      age: "年齢",
      sex: "性別",
      note: "臨床メモ / 病歴",
      notePlaceholder: "症状を入力 (例: 発作の既往...)",
      record: "音声メモを録音",
      recording: "録音中...",
      reset: "リセット",
      analyze: "分析",
      analyzing: "分析中...",
      upload: "タップしてアップロード / 録音",
      remove: "削除",
      add: "追加",
      noTerms: "用語が追加されていません。動画分析が自動的に抽出します。",
      manualSpeech: "手動入力: 既存の測定値がある場合は、音声バイオマーカーを入力してください。"
    },
    live: {
      start: "ライブ評価を開始",
      stop: "セッションを停止",
      listening: "副操縦士が聞いています...",
      init: "副操縦士を初期化中...",
      desc: "AIがカメラ映像を観察し、リアルタイムで簡潔な音声所見を提供します。"
    },
    report: {
      back: "入力に戻る",
      export: "JSONをエクスポート",
      summary: "患者サマリー",
      caregiver: "介護者向けサマリー",
      progression: "疾患の進行",
      differential: "鑑別ランキング",
      timeline: "観察タイムライン",
      sources: "Webソースとメディアコンテキスト",
      confidence: "信頼度",
      match: "一致率",
      evidence: "裏付けとなる証拠",
      rationale: "臨床的根拠",
      nextSteps: "提案される次のステップ",
      disclaimer: "医療免責事項"
    },
    settings: {
      title: "設定",
      categories: { input: "入力", ai: "AI", access: "言語", privacy: "プライバシー", dev: "開発者" },
      save: "変更を保存",
      cancel: "キャンセル",
      reset: "すべてリセット"
    },
    knowledge: {
      search: "ハンドブックを検索...",
      noResults: "一致する状態が見つかりませんでした。",
      management: "標準的な管理",
      redFlags: "重要な臨床兆候 (レッドフラグ)",
      similar: "類似 / 関連する状態"
    },
    history: {
      title: "患者履歴",
      noHistory: "分析履歴が見つかりませんでした。",
      clear: "すべて消去",
      close: "閉じる"
    }
  }
};

export const getTranslation = (lang: string, section: string, key: string) => {
  const dataset = TRANSLATIONS[lang] || TRANSLATIONS['English'];
  return dataset[section]?.[key] || TRANSLATIONS['English'][section]?.[key] || key;
};
