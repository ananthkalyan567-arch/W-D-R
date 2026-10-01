/**
 * ASR Water & Drainage - AI Assistant Frontend Engine ("ASR Water Assistant" / "Jala Mitra")
 * 
 * Features:
 * 1. Global singleton floating chatbot across desktop and mobile
 * 2. Multilingual English & Telugu support synced with site language
 * 3. Web Speech API Voice Recognition (te-IN / en-IN)
 * 4. Staged complaint pre-filling for report.html & rainwater.html
 * 5. Complaint Tracking & Status Cards
 * 6. Rainwater Opening 3-choice advisory protocol
 * 7. Helpful / Not Helpful Feedback recording
 * 8. Session memory & local conversation persistence
 */

// ============================================================
// GEMINI API CONFIGURATION
// ============================================================
const GEMINI_API_KEY = 'AIzaSyAQ.Ab8RN6IruWXFHm4cxdbSVtzUbIqvjpe46fJtK-tMCoolu27UNA';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const ASR_CHATBOT = {
  isOpen: false,
  isMinimized: false,
  currentLang: 'en',
  sessionId: null,
  recognition: null,
  isListening: false,
  conversationHistory: [], // Stores [{role, parts}] for Gemini multi-turn context

  welcomeMessages: {
    en: `Namaste! 👋 I'm the ASR Water Assistant.\n\nI can help you with drinking water, drainage and rainwater problems.\n\nYou can ask me things like:\n\n• How do I report a drainage problem?\n• There is no drinking water in my area.\n• Rainwater is collecting on the road.\n• Is there a rainwater opening here?\n• How can I track my complaint?\n\nHow can I help you?`,
    te: `నమస్కారం! 👋 నేను ASR వాటర్ అసిస్టెంట్ (జల మిత్ర).\n\nతాగునీరు, డ్రైనేజీ మరియు వర్షపు నీటి సమస్యలలో నేను మీకు సహాయం చేయగలను.\n\nమీరు నన్ను ఇలా అడగవచ్చు:\n\n• డ్రైనేజ్ సమస్యను ఎలా నివేదించాలి?\n• మా ఊరిలో తాగునీరు రావడం లేదు.\n• వర్షపు నీరు రోడ్డుపై నిలిచిపోయింది.\n• ఇక్కడ రెయిన్ వాటర్ డ్రిప్ ఉందా?\n• నా కంప్లైంట్ స్టేటస్ ఎలా చూడాలి?\n\nనేను మీకు ఎలా సహాయపడగలను?`
  },

  /**
   * Initialize Chatbot DOM, Listeners, and Session
   */
  init() {
    if (document.getElementById('asr-ai-container')) return;

    // Detect initial language
    if (typeof ASR_I18N !== 'undefined' && ASR_I18N.currentLang) {
      this.currentLang = ASR_I18N.currentLang;
    } else {
      const savedLang = localStorage.getItem('asr_wd_lang') || 'en';
      this.currentLang = savedLang;
    }

    // Session ID
    this.sessionId = sessionStorage.getItem('asr_ai_session_id');
    if (!this.sessionId) {
      this.sessionId = 'sess_' + Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem('asr_ai_session_id', this.sessionId);
    }

    this.render();
    this.initSpeechRecognition();
    this.restoreSessionMessages();
    this.bindEvents();
  },

  /**
   * Render HTML structure into page body
   */
  render() {
    const container = document.createElement('div');
    container.id = 'asr-ai-container';
    container.innerHTML = `
      <!-- Floating Launcher Button -->
      <button type="button" id="asr-ai-launcher" class="asr-ai-launcher" aria-label="Open ASR Water Assistant" title="Open AI Assistant">
        <span class="asr-ai-launcher-icon">💧</span>
        <div class="asr-ai-launcher-label">
          <span class="asr-ai-launcher-title" id="asr-launcher-text">${this.currentLang === 'te' ? 'జల మిత్ర' : 'Water AI'}</span>
          <span class="asr-ai-launcher-sub">${this.currentLang === 'te' ? 'AI అసిస్టెంట్' : 'Assistant'}</span>
        </div>
        <span class="asr-ai-launcher-dot"></span>
      </button>

      <!-- Chat Panel -->
      <div id="asr-ai-panel" class="asr-ai-panel" role="dialog" aria-modal="true" aria-labelledby="asr-panel-title">
        <!-- Header -->
        <div class="asr-ai-header">
          <div class="asr-ai-header-left">
            <div class="asr-ai-avatar">💧</div>
            <div class="asr-ai-titles">
              <div class="asr-ai-title-row">
                <span class="asr-ai-name" id="asr-panel-title">${this.currentLang === 'te' ? 'ASR వాటర్ అసిస్టెంట్' : 'ASR Water Assistant'}</span>
                <span class="asr-ai-badge">AI</span>
              </div>
              <span class="asr-ai-subtitle" id="asr-panel-sub">Water • Drainage • Rainwater</span>
            </div>
          </div>
          <div class="asr-ai-header-actions">
            <button type="button" id="asr-btn-toggle-lang" class="asr-ai-lang-pill" title="Toggle English / Telugu">${this.currentLang === 'te' ? 'EN' : 'తెలుగు'}</button>
            <button type="button" id="asr-btn-minimize" class="asr-ai-tool-btn" title="Minimize" aria-label="Minimize">─</button>
            <button type="button" id="asr-btn-clear" class="asr-ai-tool-btn" title="Clear Chat" aria-label="Clear Chat">🗑️</button>
            <button type="button" id="asr-btn-close" class="asr-ai-tool-btn" title="Close" aria-label="Close">✕</button>
          </div>
        </div>

        <!-- Government Disclaimer Notice Banner (Section 18) -->
        <div class="asr-ai-disclaimer-banner">
          <span>ℹ️</span>
          <div id="asr-disclaimer-text">
            ${this.currentLang === 'te' 
              ? 'ఈ అసిస్టెంట్ అధికారిక ప్రభుత్వ సంస్థ కాదు. పౌర నివేదికలు అధికారుల ధృవీకరణకు లోబడి ఉంటాయి.' 
              : 'AI-generated guidance may contain errors. This assistant is not an official government authority. Citizen reports are subject to verification.'}
          </div>
        </div>

        <!-- Quick Action Chips (Section 3) -->
        <div class="asr-ai-quick-chips">
          <button type="button" class="asr-ai-chip" data-prompt="There is no drinking water in my area">🚰 ${this.currentLang === 'te' ? 'తాగునీటి సమస్య' : 'Water Problem'}</button>
          <button type="button" class="asr-ai-chip" data-prompt="Drainage is blocked and overflowing on road">🚧 ${this.currentLang === 'te' ? 'డ్రైనేజీ సమస్య' : 'Drainage'}</button>
          <button type="button" class="asr-ai-chip" data-prompt="Rainwater is collecting on the road">🌧️ ${this.currentLang === 'te' ? 'వర్షపు నీరు' : 'Rainwater'}</button>
          <button type="button" class="asr-ai-chip" data-prompt="How do I report a problem?">📍 ${this.currentLang === 'te' ? 'రిపోర్ట్ చేయడం ఎలా' : 'Report Problem'}</button>
          <button type="button" class="asr-ai-chip" data-prompt="Track my complaint">🔎 ${this.currentLang === 'te' ? 'ఫిర్యాదు ట్రాకింగ్' : 'Track Complaint'}</button>
        </div>

        <!-- Messages Area -->
        <div id="asr-ai-messages" class="asr-ai-body">
          <!-- Dynamic chat messages inserted here -->
        </div>

        <!-- Bottom Input Bar -->
        <form id="asr-ai-input-form" class="asr-ai-footer" autocomplete="off">
          <div class="asr-ai-input-wrap">
            <input type="text" id="asr-ai-input" class="asr-ai-input" 
              placeholder="${this.currentLang === 'te' ? 'మీ సమస్యను ఇక్కడ టైప్ చేయండి...' : 'Type your problem...'}" 
              aria-label="Type your message" required>
            <button type="button" id="asr-btn-mic" class="asr-ai-mic-btn" title="Speak problem (Microphone)" aria-label="Voice input">
              🎤
            </button>
          </div>
          <button type="submit" id="asr-btn-send" class="asr-ai-send-btn" title="Send message" aria-label="Send message">
            ➤
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(container);
  },

  /**
   * Bind DOM Events
   */
  bindEvents() {
    const launcher = document.getElementById('asr-ai-launcher');
    const panel = document.getElementById('asr-ai-panel');
    const btnClose = document.getElementById('asr-btn-close');
    const btnMinimize = document.getElementById('asr-btn-minimize');
    const btnClear = document.getElementById('asr-btn-clear');
    const btnToggleLang = document.getElementById('asr-btn-toggle-lang');
    const form = document.getElementById('asr-ai-input-form');
    const input = document.getElementById('asr-ai-input');
    const btnMic = document.getElementById('asr-btn-mic');
    const quickChips = document.querySelectorAll('.asr-ai-chip');

    // Launcher click
    launcher.addEventListener('click', () => {
      this.togglePanel();
    });

    // Close click
    btnClose.addEventListener('click', () => {
      this.closePanel();
    });

    // Minimize click
    btnMinimize.addEventListener('click', () => {
      this.toggleMinimize();
    });

    // Clear click
    btnClear.addEventListener('click', () => {
      if (confirm(this.currentLang === 'te' ? 'సంభాషణను క్లియర్ చేయాలా?' : 'Clear conversation history?')) {
        this.clearMessages();
      }
    });

    // Toggle Language
    btnToggleLang.addEventListener('click', () => {
      this.setLanguage(this.currentLang === 'en' ? 'te' : 'en');
    });

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this.handleUserMessage(text);
    });

    // Mic Voice Input
    if (btnMic) {
      btnMic.addEventListener('click', () => {
        this.toggleVoiceInput();
      });
    }

    // Quick Action Chips
    quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          this.handleUserMessage(prompt);
        }
      });
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closePanel();
      }
    });
  },

  /**
   * Speech Recognition (Web Speech API) (Section 13)
   */
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const micBtn = document.getElementById('asr-btn-mic');
      if (micBtn) {
        micBtn.title = 'Voice input not supported in this browser';
        micBtn.style.opacity = '0.5';
      }
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      this.isListening = true;
      const micBtn = document.getElementById('asr-btn-mic');
      if (micBtn) micBtn.classList.add('listening');
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('asr-ai-input');
      if (input) {
        input.value = transcript;
        this.handleUserMessage(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      this.stopVoiceInput();
    };

    this.recognition.onend = () => {
      this.stopVoiceInput();
    };
  },

  toggleVoiceInput() {
    if (!this.recognition) {
      alert(this.currentLang === 'te' 
        ? 'మీ బ్రౌజర్ వాయిస్ రికగ్నిషన్‌కు మద్దతు ఇవ్వడం లేదు. దయచేసి టెక్స్ట్ ద్వారా టైప్ చేయండి.' 
        : 'Voice input is not supported in this browser. Please type your message.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.stopVoiceInput();
    } else {
      this.recognition.lang = (this.currentLang === 'te') ? 'te-IN' : 'en-IN';
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Could not start speech recognition:', e);
      }
    }
  },

  stopVoiceInput() {
    this.isListening = false;
    const micBtn = document.getElementById('asr-btn-mic');
    if (micBtn) micBtn.classList.remove('listening');
  },

  togglePanel() {
    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  },

  openPanel() {
    const panel = document.getElementById('asr-ai-panel');
    if (!panel) return;
    this.isOpen = true;
    panel.classList.add('open');
    panel.classList.remove('minimized');
    this.isMinimized = false;

    // Focus input
    setTimeout(() => {
      const input = document.getElementById('asr-ai-input');
      if (input) input.focus();
    }, 300);

    // If no messages yet, show welcome message
    const msgBox = document.getElementById('asr-ai-messages');
    if (msgBox && msgBox.children.length === 0) {
      this.appendBotMessage(this.welcomeMessages[this.currentLang] || this.welcomeMessages.en);
    }
  },

  closePanel() {
    const panel = document.getElementById('asr-ai-panel');
    if (!panel) return;
    this.isOpen = false;
    panel.classList.remove('open');
    if (this.isListening) this.stopVoiceInput();
  },

  toggleMinimize() {
    const panel = document.getElementById('asr-ai-panel');
    if (!panel) return;
    this.isMinimized = !this.isMinimized;
    panel.classList.toggle('minimized', this.isMinimized);
  },

  /**
   * Set Language (English or Telugu)
   */
  setLanguage(lang) {
    this.currentLang = lang;
    const btnToggleLang = document.getElementById('asr-btn-toggle-lang');
    const input = document.getElementById('asr-ai-input');
    const launcherText = document.getElementById('asr-launcher-text');
    const panelTitle = document.getElementById('asr-panel-title');
    const disclaimerText = document.getElementById('asr-disclaimer-text');

    if (btnToggleLang) btnToggleLang.textContent = (lang === 'te') ? 'EN' : 'తెలుగు';
    if (launcherText) launcherText.textContent = (lang === 'te') ? 'జల మిత్ర' : 'Water AI';
    if (panelTitle) panelTitle.textContent = (lang === 'te') ? 'ASR వాటర్ అసిస్టెంట్' : 'ASR Water Assistant';

    if (disclaimerText) {
      disclaimerText.textContent = (lang === 'te')
        ? 'ఈ అసిస్టెంట్ అధికారిక ప్రభుత్వ సంస్థ కాదు. పౌర నివేదికలు అధికారుల ధృవీకరణకు లోబడి ఉంటాయి.'
        : 'AI-generated guidance may contain errors. This assistant is not an official government authority. Citizen reports are subject to verification.';
    }

    if (input) {
      input.placeholder = (lang === 'te') ? 'మీ సమస్యను ఇక్కడ టైప్ చేయండి...' : 'Type your problem...';
    }

    // Refresh quick chips text
    const chips = document.querySelectorAll('.asr-ai-chip');
    if (chips.length >= 5) {
      chips[0].innerHTML = `🚰 ${lang === 'te' ? 'తాగునీటి సమస్య' : 'Water Problem'}`;
      chips[1].innerHTML = `🚧 ${lang === 'te' ? 'డ్రైనేజీ సమస్య' : 'Drainage'}`;
      chips[2].innerHTML = `🌧️ ${lang === 'te' ? 'వర్షపు నీరు' : 'Rainwater'}`;
      chips[3].innerHTML = `📍 ${lang === 'te' ? 'రిపోర్ట్ చేయడం ఎలా' : 'Report Problem'}`;
      chips[4].innerHTML = `🔎 ${lang === 'te' ? 'ఫిర్యాదు ట్రాకింగ్' : 'Track Complaint'}`;
    }
  },

  /**
   * Build Gemini System Prompt based on current language
   */
  buildSystemPrompt(lang) {
    if (lang === 'te') {
      return `మీరు "జల మిత్ర" — ASR వాటర్ & డ్రైనేజ్ పోర్టల్ యొక్క AI అసిస్టెంట్.

మీరు తెలుగులో స్పష్టంగా, సహాయంగా మాట్లాడాలి.

మీరు సహాయపడే విషయాలు:
1. తాగునీటి సమస్యలు (నీరు రాకపోవడం, నీటి నాణ్యత, పైప్ లీకేజీ)
2. డ్రైనేజీ సమస్యలు (అడ్డుపడటం, overflow, దుర్వాసన)
3. వర్షపు నీటి నిర్వహణ (waterlogging, రోడ్డుపై నీరు నిలబడటం)
4. రెయిన్ వాటర్ డ్రిప్/ఓపెనింగ్ సమాచారం
5. ఫిర్యాదు నమోదు మరియు ట్రాకింగ్ సహాయం
6. స్థానిక పౌర జల సంబంధిత ఫిర్యాదులు

ముఖ్యమైన సూచనలు:
- మీరు అధికారిక ప్రభుత్వ సంస్థ కాదు.
- ఫిర్యాదు నమోదు చేయడానికి report.html పేజీకి వెళ్ళమని చెప్పండి.
- ఫిర్యాదు ట్రాక్ చేయడానికి track.html పేజీకి వెళ్ళమని చెప్పండి.
- అత్యవసర పరిస్థితుల్లో (నీటి పంపింగ్ స్టేషన్ వైఫల్యం, పెద్ద పైప్ పగలడం) వెంటనే స్థానిక అధికారులను సంప్రదించమని చెప్పండి.
- ప్రతి సమాధానాన్ని తెలుగులో ఇవ్వండి.
- సంక్షిప్తంగా, స్పష్టంగా సమాధానం ఇవ్వండి.`;
    } else {
      return `You are "Jala Mitra" — the AI Assistant for the ASR Water & Drainage Portal.

You help citizens in the local area with water and drainage related civic issues.

You assist with:
1. Drinking water problems (no water supply, water quality issues, pipe leaks/bursts)
2. Drainage problems (blocked drains, overflow, foul smell)
3. Rainwater management (waterlogging, water stagnation on roads)
4. Rainwater drip / opening availability queries
5. Complaint registration and tracking guidance
6. Local civic water-related complaints and escalation

Important rules:
- You are NOT an official government authority. Always clarify this.
- For submitting a new complaint, direct users to the "Report a Problem" page (report.html).
- For tracking complaints, direct users to the "Track Complaint" page (track.html).
- In genuine emergencies (large pipe burst, pump station failure, contamination), advise calling local municipal authorities immediately.
- Keep responses concise, clear, and helpful.
- Respond only in English unless the user writes in Telugu.`;
    }
  },

  /**
   * Call Gemini API directly from the browser
   */
  async callGeminiAPI(userMessage, lang) {
    const systemPrompt = this.buildSystemPrompt(lang);

    // Build contents array: system instruction + history + new user message
    const contents = [
      ...this.conversationHistory,
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
        topP: 0.9
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ]
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!replyText) {
      throw new Error('Empty response from Gemini API');
    }

    // Update conversation history for multi-turn memory (keep last 10 turns)
    this.conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });
    this.conversationHistory.push({ role: 'model', parts: [{ text: replyText }] });
    if (this.conversationHistory.length > 20) {
      this.conversationHistory.splice(0, 2); // Remove oldest turn
    }

    return replyText;
  },

  /**
   * Detect if message needs a quick action button based on keywords
   */
  detectActions(text, lang) {
    const lower = text.toLowerCase();
    const actions = [];

    const reportKeywords = ['report', 'submit', 'register', 'complaint', 'file', 'నమోదు', 'ఫిర్యాదు', 'నివేదించు', 'report.html'];
    const trackKeywords = ['track', 'status', 'my complaint', 'track.html', 'ట్రాక్', 'స్థితి', 'ఫిర్యాదు స్థితి'];

    if (reportKeywords.some(k => lower.includes(k))) {
      actions.push({
        type: 'NAVIGATE',
        label: lang === 'te' ? '📋 ఫిర్యాదు నమోదు చేయండి' : '📋 Report a Problem',
        url: 'report.html'
      });
    }

    if (trackKeywords.some(k => lower.includes(k))) {
      actions.push({
        type: 'NAVIGATE',
        label: lang === 'te' ? '🔎 ఫిర్యాదు ట్రాక్ చేయండి' : '🔎 Track My Complaint',
        url: 'track.html'
      });
    }

    return actions;
  },

  /**
   * Process User Message — powered by Gemini AI
   */
  async handleUserMessage(text) {
    this.appendUserMessage(text);
    this.showTypingIndicator();

    try {
      const reply = await this.callGeminiAPI(text, this.currentLang);
      this.removeTypingIndicator();

      // Detect any action buttons based on reply content
      const actions = this.detectActions(reply, this.currentLang);

      this.appendBotMessage(reply, { actions });

    } catch (err) {
      console.warn('Gemini API call failed:', err);
      this.removeTypingIndicator();

      if (err.message && err.message.includes('API key')) {
        this.appendBotMessage(
          this.currentLang === 'te'
            ? '⚠️ API కీ సమస్య ఉంది. దయచేసి అడ్మిన్‌ను సంప్రదించండి.'
            : '⚠️ There is an issue with the API configuration. Please contact the admin.',
          {}
        );
      } else {
        this.appendBotMessage(
          this.currentLang === 'te'
            ? 'దయచేసి మీ ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేయండి లేదా నేరుగా సమస్యను నివేదించండి పేజీని ఉపయోగించండి.'
            : 'Please check your internet connection or use the Report a Problem page to submit your complaint directly.',
          {
            actions: [
              { type: 'NAVIGATE', label: (this.currentLang === 'te' ? '📋 సమస్యను నివేదించండి' : '📋 Report a Problem'), url: 'report.html' }
            ]
          }
        );
      }
    }
  },

  /**
   * Append User Message Bubble
   */
  appendUserMessage(text) {
    const msgBox = document.getElementById('asr-ai-messages');
    if (!msgBox) return;

    const row = document.createElement('div');
    row.className = 'asr-msg-row user';
    row.innerHTML = `
      <div class="asr-msg-content">
        <div class="asr-msg-bubble">${this.escapeHtml(text)}</div>
        <div class="asr-msg-time">${this.getTimeString()}</div>
      </div>
    `;

    msgBox.appendChild(row);
    this.scrollToBottom();
    this.saveSessionMessage({ sender: 'user', text });
  },

  /**
   * Append Assistant Message Bubble
   */
  appendBotMessage(text, meta = {}) {
    const msgBox = document.getElementById('asr-ai-messages');
    if (!msgBox) return;

    const row = document.createElement('div');
    row.className = 'asr-msg-row bot';

    let extraHtml = '';

    // Priority Tag (Section 15)
    if (meta.priorityLabel && meta.suggestedPriority) {
      extraHtml += `<div class="asr-ai-prio-tag ${meta.suggestedPriority}">⚡ ${this.escapeHtml(meta.priorityLabel)}</div>`;
    }

    // Tracking Card (Section 10)
    if (meta.trackingCard) {
      const tc = meta.trackingCard;
      extraHtml += `
        <div class="asr-ai-track-card">
          <div class="asr-ai-track-row">
            <strong>${this.escapeHtml(tc.complaint_number)}</strong>
            <span class="asr-ai-status-badge">${this.escapeHtml(tc.status)}</span>
          </div>
          <div style="font-size: 0.78rem; color: var(--ai-gray-500); margin-top: 4px;">
            ${tc.location ? '📍 ' + this.escapeHtml(tc.location) : ''}
          </div>
        </div>
      `;
    }

    // Confirmation Card (Section 8)
    if (meta.stagedComplaint) {
      const sc = meta.stagedComplaint;
      extraHtml += `
        <div class="asr-ai-confirm-box">
          <div class="asr-ai-confirm-title">📋 ${this.currentLang === 'te' ? 'ఫిర్యాదు ముసాయిదా' : 'Staged Complaint Summary'}</div>
          <div class="asr-ai-confirm-grid">
            <span class="asr-ai-confirm-lbl">${this.currentLang === 'te' ? 'విభాగం:' : 'Category:'}</span>
            <span class="asr-ai-confirm-val">${this.escapeHtml(sc.category_name)}</span>
            <span class="asr-ai-confirm-lbl">${this.currentLang === 'te' ? 'ప్రాంతం:' : 'Location:'}</span>
            <span class="asr-ai-confirm-val">${this.escapeHtml(sc.location)}</span>
            <span class="asr-ai-confirm-lbl">${this.currentLang === 'te' ? 'సమస్య:' : 'Details:'}</span>
            <span class="asr-ai-confirm-val">${this.escapeHtml(sc.description)}</span>
          </div>
        </div>
      `;
    }

    // Action Buttons
    if (meta.actions && meta.actions.length > 0) {
      extraHtml += `<div class="asr-ai-actions">`;
      meta.actions.forEach(act => {
        if (act.type === 'CONFIRM_REPORT') {
          extraHtml += `<button type="button" class="asr-ai-action-btn primary" data-action="confirm-report" data-url="${this.escapeHtml(act.url)}">${this.escapeHtml(act.label)}</button>`;
        } else if (act.type === 'EDIT_REPORT') {
          extraHtml += `<button type="button" class="asr-ai-action-btn" data-action="edit-report">${this.escapeHtml(act.label)}</button>`;
        } else if (act.type === 'CANCEL_REPORT') {
          extraHtml += `<button type="button" class="asr-ai-action-btn danger" data-action="cancel-report">${this.escapeHtml(act.label)}</button>`;
        } else if (act.url && act.url.startsWith('tel:')) {
          extraHtml += `<a href="${this.escapeHtml(act.url)}" class="asr-ai-action-btn danger">${this.escapeHtml(act.label)}</a>`;
        } else if (act.url) {
          extraHtml += `<a href="${this.escapeHtml(act.url)}" class="asr-ai-action-btn">${this.escapeHtml(act.label)}</a>`;
        }
      });
      extraHtml += `</div>`;
    }

    // Helpful / Not Helpful Feedback Bar (Section 30)
    extraHtml += `
      <div class="asr-ai-feedback-bar">
        <span>${this.currentLang === 'te' ? 'సహాయకరంగా ఉందా?' : 'Helpful?'}</span>
        <button type="button" class="asr-ai-fb-btn" data-rating="helpful" data-mid="${meta.messageId || ''}">👍 ${this.currentLang === 'te' ? 'అవును' : 'Yes'}</button>
        <button type="button" class="asr-ai-fb-btn" data-rating="not_helpful" data-mid="${meta.messageId || ''}">👎 ${this.currentLang === 'te' ? 'లేదు' : 'No'}</button>
      </div>
    `;

    // Format markdown bolding
    const formattedText = this.formatMarkdown(text);

    row.innerHTML = `
      <div class="asr-msg-avatar">💧</div>
      <div class="asr-msg-content">
        <div class="asr-msg-bubble">${formattedText}</div>
        ${extraHtml}
        <div class="asr-msg-time">${this.getTimeString()}</div>
      </div>
    `;

    msgBox.appendChild(row);
    this.scrollToBottom();
    this.saveSessionMessage({ sender: 'assistant', text, meta });

    // Attach dynamic listeners for buttons in this bubble
    this.bindMessageRowEvents(row, meta);
  },

  bindMessageRowEvents(row, meta) {
    // Action button clicks
    row.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        if (action === 'confirm-report') {
          const url = e.target.getAttribute('data-url');
          if (meta.stagedComplaint) {
            sessionStorage.setItem('asr_staged_complaint', JSON.stringify(meta.stagedComplaint));
          }
          if (url && url !== '#') {
            window.location.href = url;
          } else {
            window.location.href = 'report.html';
          }
        } else if (action === 'edit-report') {
          this.appendBotMessage(
            this.currentLang === 'te'
              ? 'మీరు ఏ సమాచారాన్ని మార్చాలనుకుంటున్నారు? దయచేసి కొత్త వివరాలను లేదా ప్రాంతాన్ని టైప్ చేయండి.'
              : 'What would you like to edit? Please type the updated details or location.'
          );
        } else if (action === 'cancel-report') {
          this.appendBotMessage(
            this.currentLang === 'te'
              ? 'ఫిర్యాదు ముసాయిదా రద్దు చేయబడింది. మీకు ఇంకేదైనా సహాయం కావాలా?'
              : 'Report draft cancelled. Please let me know if I can help you with anything else!'
          );
        }
      });
    });

    // Feedback rating clicks
    row.querySelectorAll('[data-rating]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const rating = e.target.getAttribute('data-rating');
        const mid = e.target.getAttribute('data-mid');
        const parentBar = e.target.closest('.asr-ai-feedback-bar');

        if (parentBar) {
          parentBar.innerHTML = `<span style="color: var(--ai-teal); font-weight: 600;">✓ ${this.currentLang === 'te' ? 'మీ అభిప్రాయానికి ధన్యవాదాలు!' : 'Thank you for your feedback!'}</span>`;
        }

        if (rating === 'not_helpful') {
          const reason = prompt(this.currentLang === 'te' ? 'సమాధానంలో ఏమి లోపం ఉంది? (ఐచ్ఛికం):' : 'What was wrong with the answer? (Optional):');
          try {
            await ASR_API.aiFeedback({ message_id: mid, rating: 'not_helpful', reason });
          } catch (err) {}
        } else {
          try {
            await ASR_API.aiFeedback({ message_id: mid, rating: 'helpful' });
          } catch (err) {}
        }
      });
    });
  },

  showTypingIndicator() {
    const msgBox = document.getElementById('asr-ai-messages');
    if (!msgBox || document.getElementById('asr-typing')) return;

    const row = document.createElement('div');
    row.id = 'asr-typing';
    row.className = 'asr-msg-row bot';
    row.innerHTML = `
      <div class="asr-msg-avatar">💧</div>
      <div class="asr-msg-content">
        <div class="asr-typing-indicator">
          <span class="asr-typing-dot"></span>
          <span class="asr-typing-dot"></span>
          <span class="asr-typing-dot"></span>
        </div>
      </div>
    `;

    msgBox.appendChild(row);
    this.scrollToBottom();
  },

  removeTypingIndicator() {
    const typing = document.getElementById('asr-typing');
    if (typing) typing.remove();
  },

  scrollToBottom() {
    const msgBox = document.getElementById('asr-ai-messages');
    if (msgBox) {
      msgBox.scrollTop = msgBox.scrollHeight;
    }
  },

  saveSessionMessage(msg) {
    try {
      const history = JSON.parse(sessionStorage.getItem('asr_ai_history') || '[]');
      history.push(msg);
      // Keep last 30 messages
      if (history.length > 30) history.shift();
      sessionStorage.setItem('asr_ai_history', JSON.stringify(history));
    } catch (e) {}
  },

  restoreSessionMessages() {
    try {
      const history = JSON.parse(sessionStorage.getItem('asr_ai_history') || '[]');
      if (history.length > 0) {
        history.forEach(item => {
          if (item.sender === 'user') {
            this.appendUserMessage(item.text);
          } else {
            this.appendBotMessage(item.text, item.meta || {});
          }
        });
      }
    } catch (e) {}
  },

  clearMessages() {
    sessionStorage.removeItem('asr_ai_history');
    this.conversationHistory = []; // Reset Gemini multi-turn memory
    const msgBox = document.getElementById('asr-ai-messages');
    if (msgBox) {
      msgBox.innerHTML = '';
      this.appendBotMessage(this.welcomeMessages[this.currentLang] || this.welcomeMessages.en);
    }
  },

  formatMarkdown(text) {
    if (!text) return '';
    let esc = this.escapeHtml(text);
    // Bold **text**
    esc = esc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet points
    esc = esc.replace(/•\s/g, '&bull; ');
    // Line breaks
    esc = esc.replace(/\n/g, '<br>');
    return esc;
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  getTimeString() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

// Global Bootstrapper
document.addEventListener('DOMContentLoaded', () => {
  ASR_CHATBOT.init();
});

// Window export
if (typeof window !== 'undefined') {
  window.ASR_CHATBOT = ASR_CHATBOT;
}
