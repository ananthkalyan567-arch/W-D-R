/**
 * ASR Water & Drainage - Internationalization (i18n)
 * English and Telugu translation dictionary and switcher
 */

const ASR_I18N = {
  currentLang: localStorage.getItem('asr_wd_lang') || 'en',

  translations: {
    en: {
      // Branding & Common
      appName: 'ASR WATER & DRAINAGE',
      shortName: 'ASR-WD',
      tagline: 'Report. Track. Improve.',
      trustBanner: 'Civic-Tech Initiative for Alluri Sitharama Raju District. Independent platform — verified actions recorded by authorized administrators.',
      districtName: 'Alluri Sitharama Raju District',
      stateName: 'Andhra Pradesh',

      // Navigation
      navHome: 'Home',
      navReport: 'Report a Problem',
      navRainwater: 'Rainwater',
      navTrack: 'Track Complaint',
      navMap: 'Problem Map',
      navIssues: 'Community Issues',
      navAbout: 'About',
      navContact: 'Contact',
      navLogin: 'Admin Login',
      navDashboard: 'Dashboard',

      // Rainwater Module Specifics
      rwModuleTitle: 'Rainwater Drip & Drainage Management',
      rwModuleSubtitle: 'Check and report whether a suitable rainwater drip/drainage opening is available in your locality.',
      rwCheckHeading: 'Check Rainwater Management',
      rwOpeningQuestion: 'Is a rainwater drip/drainage opening available here?',
      rwBtnAvailable: 'YES, AVAILABLE',
      rwBtnNotAvailable: 'NO, NOT AVAILABLE',
      rwBtnNotSure: 'NOT SURE',
      rwOpeningAvailableAlert: 'Rainwater opening reported at this location. You can specify condition or upload photos.',
      rwOpeningMissingAlert: 'No rainwater drainage opening has been reported at this location. You can submit this as a rainwater management problem for review.',
      rwOpeningNotSureAlert: 'Recorded as unconfirmed observation. Does not claim opening is missing without verification.',
      rwConditionGood: 'Good / Clean Opening',
      rwConditionPartiallyBlocked: 'Partially Blocked',
      rwConditionBlocked: 'Blocked',
      rwConditionDamaged: 'Damaged',
      rwConditionUnknown: 'Unknown',
      rwRaiseProblemBtn: 'Raise a Problem',
      rwCategoryOpeningMissing: 'Rainwater Drip/Drainage Opening Not Available',
      rwCategoryBlocked: 'Rainwater Opening Blocked',
      rwCategoryDamaged: 'Rainwater Opening Damaged',
      rwCategoryOverflow: 'Rainwater Overflow',
      rwCategoryWaterlogging: 'Waterlogging',
      rwCategoryPathBlocked: 'Rainwater Path Blocked',
      rwCategoryCollection: 'Rainwater Collection Problem',
      rwCategoryConnection: 'Drainage Connection Problem',
      rwCategoryOther: 'Other Rainwater Issue',

      // Home Hero
      heroBadge: 'Active Civic Reporting System',
      heroTitle: 'Report Water & Drainage Problems in Your Area',
      heroDesc: 'Help identify local drinking-water and drainage problems by reporting issues with their location, description, and photograph.',
      btnReport: 'Report a Problem',
      btnTrack: 'Track Complaint',
      btnViewMap: 'View Problem Map',
      heroCoverage: 'Covering Paderu, Araku Valley, Chintapalle, Ananthagiri, and all mandals in ASR District.',
      quickTrackTitle: 'Quick Complaint Tracking',
      trackInputPlaceholder: 'Enter Complaint ID (e.g. ASR-WD-2026-000001)',
      btnQuickTrack: 'Track',

      // Statistics Cards
      statTotal: 'Total Reports',
      statWater: 'Water Reports',
      statDrainage: 'Drainage Reports',
      statPending: 'Pending',
      statProgress: 'In Progress',
      statResolved: 'Resolved',

      // Problem Categories Section
      catHeadingTag: 'Problem Catalog',
      catHeadingTitle: 'What Would You Like to Report?',
      catHeadingSub: 'Select a category to report drinking water or drainage sanitation issues directly to the platform.',
      catGroupWater: 'Drinking Water Issues',
      catGroupDrainage: 'Drainage & Sanitation Issues',

      // Water Category Items
      catNoWater: 'No Water Supply',
      catNoWaterDesc: 'Complete interruption of tap or borewell water supply',
      catIrregularWater: 'Irregular Water Supply',
      catIrregularWaterDesc: 'Erratic supply timings, insufficient quantity',
      catWaterLeakage: 'Water Leakage',
      catWaterLeakageDesc: 'Visible pipeline leaks or overflowing public overhead tanks',
      catPipelineDamage: 'Pipeline Damage',
      catPipelineDamageDesc: 'Broken distribution pipes or road construction damage',
      catWaterInfra: 'Water Infrastructure Damage',
      catWaterInfraDesc: 'Damaged hand pumps, motor failures, broken public taps',
      catWaterQuality: 'Water Quality Concern',
      catWaterQualityDesc: 'Muddy, colored, foul-smelling, or contaminated water',
      catOtherWater: 'Other Water Problem',
      catOtherWaterDesc: 'Any other drinking water or community supply issue',

      // Drainage Category Items
      catBlockedDrain: 'Blocked Drain',
      catBlockedDrainDesc: 'Drains blocked by silt, plastic, or debris',
      catDrainageOverflow: 'Drainage Overflow',
      catDrainageOverflowDesc: 'Wastewater spilling onto streets or public pathways',
      catStagnantWater: 'Stagnant Water',
      catStagnantWaterDesc: 'Standing dirty water breeding mosquitoes and foul odor',
      catSewageWastewater: 'Sewage / Wastewater',
      catSewageWastewaterDesc: 'Broken septic lines or hazardous untreated effluent',
      catDamagedDrain: 'Damaged Drain',
      catDamagedDrainDesc: 'Cracked concrete channels, missing culvert slabs',
      catDrainageFlooding: 'Drainage Flooding',
      catDrainageFloodingDesc: 'Monsoon waterlogging caused by inadequate drainage',
      catOtherDrainage: 'Other Sanitation Problem',
      catOtherDrainageDesc: 'Any other sanitation or community drainage concern',

      // How it Works
      howItWorksTag: 'Simple 4-Step Process',
      howItWorksTitle: 'How ASR Water & Drainage Works',
      step1Title: '1. Report',
      step1Desc: 'Submit issue with location, category, severity, and photo.',
      step2Title: '2. Track ID',
      step2Desc: 'Receive a unique complaint ID like ASR-WD-2026-000001.',
      step3Title: '3. Admin Review',
      step3Desc: 'Authorized administrators assess, prioritize, and assign.',
      step4Title: '4. Resolution',
      step4Desc: 'Track status updates and verified resolution evidence.',

      // Trust Banner
      trustCitizenTitle: 'Citizen Reported',
      trustCitizenDesc: 'Data submitted by local residents. Identified with citizen-reported severity.',
      trustAdminTitle: 'Administrator Reviewed',
      trustAdminDesc: 'Audited and classified by authorized administrators with assigned departments.',
      trustVerifiedTitle: 'Verified & Confirmed',
      trustVerifiedDesc: 'Status marked resolved only when verified evidence is officially recorded.',

      // Report Form
      reportPageTitle: 'Submit a Water or Drainage Complaint',
      reportPageSub: 'Please provide accurate details so administrators can review the problem quickly.',
      secLocation: 'Location Details',
      lblDistrict: 'District',
      lblMandal: 'Mandal / Area',
      lblLocality: 'Village / Locality / Ward',
      lblLandmark: 'Landmark or Street',
      btnCurrentLocation: 'Use My Current GPS Location',
      gpsHelp: 'Coordinates will help identify the exact site on the problem map (approximate location used publicly).',

      secProblem: 'Problem Description',
      lblCategory: 'Issue Category',
      selectCategoryPlaceholder: '-- Select a Category --',
      lblDescription: 'Detailed Description',
      descPlaceholder: 'Please explain what happened, where it is happening, and how long the problem has existed...',
      lblDateStarted: 'When did this problem start? (Optional)',
      lblSeverity: 'Citizen-Reported Severity',
      sevLow: 'Low',
      sevLowHelp: 'Minor inconvenience',
      sevMed: 'Medium',
      sevMedHelp: 'Affects daily routine',
      sevHigh: 'High',
      sevHighHelp: 'Severe water cut or road blockage',
      sevEmergency: 'Emergency',
      sevEmergencyHelp: 'Contamination hazard or major flood',

      secPhoto: 'Photo Upload',
      photoDropPrompt: 'Click or Drag & Drop photo here',
      photoDropHelp: 'Allowed: JPG, PNG, WEBP (Max 5MB). Photo evidence helps quick assessment.',
      btnRemovePhoto: 'Remove',

      secCitizen: 'Citizen Information (Confidential)',
      lblName: 'Your Name (Optional)',
      lblPhone: 'Phone Number (Optional)',
      lblEmail: 'Email Address (Optional)',
      privacyNote: '🔒 Your personal contact details are kept strictly confidential and never displayed on public maps or issue lists.',

      btnSubmitReport: 'Submit Complaint',
      btnSubmitting: 'Submitting...',

      // AI & Voice Assistant
      aiSuggestionTitle: 'AI Suggestion:',
      aiApplyBtn: 'Apply Suggestion',
      voiceBtnStart: '🎙️ Speak (Telugu / English)',
      voiceBtnStop: '⏹️ Stop Recording',
      voiceListening: 'Listening... speak clearly',

      // Track Page
      trackPageTitle: 'Track Your Complaint Status',
      trackPageSub: 'Enter your unique Complaint ID to check real-time status and administrative updates.',
      trackBtnSearch: 'Search Status',
      lblCurrentStatus: 'Current Status',
      lblDateSubmitted: 'Date Submitted',
      lblLastUpdated: 'Last Updated',
      lblCategoryField: 'Category',
      lblLocationField: 'Location',
      lblSeverityField: 'Citizen Severity',
      lblSystemPriority: 'System Priority',
      lblAssignedOrg: 'Assigned Department',
      lblPublicNotes: 'Public Administrator Note',
      timelineHeading: 'Resolution Progress Timeline',
      statusHistoryHeading: 'Audit & Update History',

      // Status Labels
      statusSubmitted: 'Submitted',
      statusReview: 'Under Review',
      statusAssigned: 'Assigned',
      statusProgress: 'In Progress',
      statusResolved: 'Resolved',
      statusRejected: 'Rejected',
      statusDuplicate: 'Duplicate',
      statusClosed: 'Closed',

      // Map Page
      mapPageTitle: 'ASR Problem Map',
      mapPageSub: 'Explore reported water and drainage issues across Alluri Sitharama Raju District.',
      filterAllMandals: 'All Mandals / Areas',
      filterAllTypes: 'All Types (Water & Drainage)',
      filterWaterOnly: 'Water Issues Only',
      filterDrainageOnly: 'Drainage Issues Only',
      filterAllStatuses: 'All Statuses',
      filterPendingOnly: 'Pending / In Progress',
      filterResolvedOnly: 'Resolved Only',
      mapLegendWater: 'Water Issue',
      mapLegendDrainage: 'Drainage Issue',
      mapLegendOverflow: 'Emergency / Overflow',
      mapLegendResolved: 'Resolved',

      // Admin Login
      adminLoginTitle: 'Administrator Sign In',
      adminLoginSub: 'Authorized access for ASR Water & Drainage system officials.',
      lblAdminEmail: 'Email Address',
      lblAdminPassword: 'Password',
      btnLoginSubmit: 'Sign In to Dashboard',
      demoLoginBtn: '⚡ Quick Demo Admin Login',

      // Footer
      footerTagline: 'Civic Technology for Clean Water & Healthy Drainage.',
      footerDisclaimer: 'ASR Water & Drainage is an independent civic-tech platform for citizen reporting and community tracking. Not an official government body.',
      footerCopyright: '© 2026 ASR Water & Drainage (ASR-WD). Alluri Sitharama Raju District.'
    },

    te: {
      // Telugu Translations (తెలుగు)
      appName: 'ఏఎస్ఆర్ నీరు మరియు డ్రైనేజీ',
      shortName: 'ASR-WD',
      tagline: 'నివేదించండి. ట్రాక్ చేయండి. మెరుగుపరచండి.',
      trustBanner: 'అల్లూరి సీతారామరాజు జిల్లా పౌర సాంకేతిక వేదిక. స్వతంత్ర ప్లాట్‌ఫారమ్ — ధృవీకరించిన వివరాలు అధీకృత నిర్వాహకులు నమోదు చేస్తారు.',
      districtName: 'అల్లూరి సీతారామరాజు జిల్లా',
      stateName: 'ఆంధ్రప్రదేశ్',

      // Navigation
      navHome: 'హోమ్‌',
      navReport: 'సమస్యను నివేదించండి',
      navRainwater: 'వర్షపు నీరు',
      navTrack: 'ఫిర్యాదు ట్రాక్ చేయండి',
      navMap: 'సమస్యల మ్యాప్',
      navIssues: 'ప్రజా సమస్యలు',
      navAbout: 'మా గురించి',
      navContact: 'సంప్రదించండి',
      navLogin: 'అడ్మిన్ లాగిన్',
      navDashboard: 'డ్యాష్‌బోర్డ్',

      // Rainwater Module Specifics (వర్షపు నీరు)
      rwModuleTitle: 'వర్షపు నీటి డ్రిప్ / నీటి పారుదల మార్గం నిర్వహణ',
      rwModuleSubtitle: 'మీ ప్రాంతంలో తగిన వర్షపు నీటి డ్రిప్ లేదా పారుదల మార్గం అందుబాటులో ఉందో లేదో తనిఖీ చేసి నివేదించండి.',
      rwCheckHeading: 'వర్షపు నీటి నిర్వహణ తనిఖీ',
      rwOpeningQuestion: 'వర్షపు నీటి పారుదల మార్గం అందుబాటులో ఉందా?',
      rwBtnAvailable: 'అవును, అందుబాటులో ఉంది',
      rwBtnNotAvailable: 'లేదు, అందుబాటులో లేదు',
      rwBtnNotSure: 'తెలియదు',
      rwOpeningAvailableAlert: 'ఈ ప్రాంతంలో వర్షపు నీటి పారుదల మార్గం అందుబాటులో ఉన్నట్లు నమోదైంది. పరిస్థితిని పేర్కొనవచ్చు లేదా ఫోటో జోడించవచ్చు.',
      rwOpeningMissingAlert: 'ఈ ప్రాంతంలో వర్షపు నీటి పారుదల మార్గం అందుబాటులో లేదు. సమీక్ష కోసం దీనిని వర్షపు నీటి సమస్యగా సమర్పించవచ్చు.',
      rwOpeningNotSureAlert: 'ధృవీకరించని పరిశీలనగా నమోదు చేయబడింది. అధికారిక తనిఖీ లేకుండా తప్పిపోయినట్లు భావించబడదు.',
      rwConditionGood: 'బాగుంది / నీరు సజావుగా వెళ్తోంది',
      rwConditionPartiallyBlocked: 'పాక్షికంగా పూడిక చేరింది',
      rwConditionBlocked: 'మూసుకుపోయింది',
      rwConditionDamaged: 'దెబ్బతింది',
      rwConditionUnknown: 'తెలియదు',
      rwRaiseProblemBtn: 'సమస్యను నివేదించండి',
      rwCategoryOpeningMissing: 'వర్షపు నీటి డ్రిప్ / నీటి పారుదల మార్గం అందుబాటులో లేదు',
      rwCategoryBlocked: 'వర్షపు నీటి మార్గం మూసుకుపోయింది',
      rwCategoryDamaged: 'వర్షపు నీటి మార్గం దెబ్బతింది',
      rwCategoryOverflow: 'వర్షపు నీరు పొంగిపొర్లడం',
      rwCategoryWaterlogging: 'నీరు నిలవడం / వాటర్‌లాగింగ్',
      rwCategoryPathBlocked: 'వర్షపు నీటి దారి మూసుకుపోయింది',
      rwCategoryCollection: 'వర్షపు నీటి సేకరణ సమస్య',
      rwCategoryConnection: 'డ్రైనేజీ అనుసంధాన సమస్య',
      rwCategoryOther: 'ఇతర వర్షపు నీటి సమస్య',

      // Home Hero
      heroBadge: 'క్రియాశీల పౌర రిపోర్టింగ్ వ్యవస్థ',
      heroTitle: 'మీ ప్రాంతంలో నీరు మరియు డ్రైనేజీ సమస్యలను నివేదించండి',
      heroDesc: 'మీ ప్రాంతంలోని తాగునీరు, డ్రైనేజీ సమస్యలను లొకేషన్, వివరాలు మరియు ఫోటోతో నివేదించి పరిష్కారానికి తోడ్పడండి.',
      btnReport: 'సమస్యను నివేదించండి',
      btnTrack: 'ఫిర్యాదు ట్రాక్ చేయండి',
      btnViewMap: 'సమస్యల మ్యాప్ చూడండి',
      heroCoverage: 'పాడేరు, అరకు లోయ, చింతపల్లి, అనంతగిరి మరియు ఏఎస్ఆర్ జిల్లాలోని అన్ని మండలాల్లో అందుబాటులో ఉంది.',
      quickTrackTitle: 'ఫిర్యాదు శీఘ్ర ట్రాకింగ్',
      trackInputPlaceholder: 'ఫిర్యాదు సంఖ్య (ఉదా: ASR-WD-2026-000001)',
      btnQuickTrack: 'ట్రాక్ చేయండి',

      // Statistics Cards
      statTotal: 'మొత్తం నివేదికలు',
      statWater: 'తాగునీటి సమస్యలు',
      statDrainage: 'డ్రైనేజీ సమస్యలు',
      statPending: 'పెండింగ్‌లో ఉన్నవి',
      statProgress: 'పురోగతిలో ఉన్నవి',
      statResolved: 'పరిష్కరించబడినవి',

      // Problem Categories Section
      catHeadingTag: 'సమస్యల వర్గాలు',
      catHeadingTitle: 'మీరు ఏ సమస్యను నివేదించాలనుకుంటున్నారు?',
      catHeadingSub: 'తాగునీరు లేదా పారిశుధ్య డ్రైనేజీ సమస్యల వర్గాన్ని ఎంచుకుని నేరుగా నమోదు చేయండి.',
      catGroupWater: 'తాగునీటి సమస్యలు',
      catGroupDrainage: 'డ్రైనేజీ మరియు పారిశుధ్య సమస్యలు',

      // Water Category Items
      catNoWater: 'నీటి సరఫరా లేదు',
      catNoWaterDesc: 'కుళాయి లేదా బోరు నీరు పూర్తిగా రాకపోవడం',
      catIrregularWater: 'సక్రమంగా నీరు రాకపోవడం',
      catIrregularWaterDesc: 'సరైన సమయానికి నీరు రాకపోవడం, తక్కువ నీరు రావడం',
      catWaterLeakage: 'నీరు లీకేజీ',
      catWaterLeakageDesc: 'పైపుల నుండి నీరు కారడం లేదా ట్యాంక్ పొంగిపోవడం',
      catPipelineDamage: 'పైప్‌లైన్ డ్యామేజ్',
      catPipelineDamageDesc: 'పగిలిన మెయిన్ పైపులు లేదా రోడ్డు పనుల వల్ల నష్టం',
      catWaterInfra: 'నీటి వసతుల నష్టం',
      catWaterInfraDesc: 'చేతిపంపులు పనిచేయకపోవడం, మోటార్ పాడవడం, కొళాయిలు విరిగిపోవడం',
      catWaterQuality: 'కలుషిత నీరు / నాణ్యత సమస్య',
      catWaterQualityDesc: 'బురద నీరు, రంగు మారడం, దుర్వాసన రావడం',
      catOtherWater: 'ఇతర నీటి సమస్య',
      catOtherWaterDesc: 'తాగునీటికి సంబంధించిన ఏదైనా ఇతర సమస్య',

      // Drainage Category Items
      catBlockedDrain: 'డ్రైనేజీ పూడిక / మూసుకుపోవడం',
      catBlockedDrainDesc: 'మట్టి, ప్లాస్టిక్, చెత్త వల్ల కాలువలు పూడుకుపోవడం',
      catDrainageOverflow: 'డ్రైనేజీ పొంగిపొర్లడం',
      catDrainageOverflowDesc: 'మురుగునీరు రోడ్లపైకి మరియు నడవడికల్లోకి రావడం',
      catStagnantWater: 'నిలిచిన మురుగునీరు',
      catStagnantWaterDesc: 'నీరు నిలిచిపోయి దోమలు, దుర్వాసన ప్రబలడం',
      catSewageWastewater: 'మురుగునీరు / వ్యర్థాలు',
      catSewageWastewaterDesc: 'సెప్టిక్ లైన్లు దెబ్బతినడం, శుద్ధి చేయని వ్యర్థాలు రావడం',
      catDamagedDrain: 'డ్రైన్ కాలువ దెబ్బతినడం',
      catDamagedDrainDesc: 'సిమెంట్ కాలువలు పగిలిపోవడం, స్లాబులు లేకపోవడం',
      catDrainageFlooding: 'డ్రైనేజీ వరద / నీరు చేరడం',
      catDrainageFloodingDesc: 'వర్షపు నీరు డ్రైనేజీ సరిపోక నివాసాల్లోకి చేరడం',
      catOtherDrainage: 'ఇతర పారిశుధ్య సమస్య',
      catOtherDrainageDesc: 'డ్రైనేజీ లేదా పారిశుధ్యానికి సంబంధించిన ఇతర సమస్య',

      // How it Works
      howItWorksTag: 'సులభమైన 4-దశల ప్రక్రియ',
      howItWorksTitle: 'ఏఎస్ఆర్ నీరు & డ్రైనేజీ ఎలా పనిచేస్తుంది',
      step1Title: '1. నివేదించండి',
      step1Desc: 'సమస్య వివరాలు, ప్రదేశం, ఫోటోతో ఫిర్యాదు నమోదు చేయండి.',
      step2Title: '2. ట్రాక్ ఐడీ',
      step2Desc: 'ASR-WD-2026-000001 వంటి ప్రత్యేక ఫిర్యాదు సంఖ్య పొందండి.',
      step3Title: '3. అడ్మిన్ సమీక్ష',
      step3Desc: 'అధికారులు సమస్యను పరిశీలించి సంబంధిత విభాగానికి కేటాయిస్తారు.',
      step4Title: '4. పరిష్కారం',
      step4Desc: 'పురోగతిని ట్రాక్ చేయండి, పరిష్కార ఫోటో సాక్ష్యాన్ని చూడండి.',

      // Trust Banner
      trustCitizenTitle: 'పౌరులు నివేదించిన సమాచారం',
      trustCitizenDesc: 'స్థానిక ప్రజలు నమోదు చేసిన సమాచారం. పౌరుల తీవ్రతతో గుర్తించబడుతుంది.',
      trustAdminTitle: 'అడ్మినిస్ట్రేటర్ సమీక్షించినది',
      trustAdminDesc: 'అధికారిక నిర్వాహకులు పరిశీలించి, ప్రాధాన్యత నిర్ణయించి విభాగానికి పంపుతారు.',
      trustVerifiedTitle: 'ధృవీకరించబడిన పరిష్కారం',
      trustVerifiedDesc: 'సరైన పరిష్కార సాక్ష్యం అధికారికంగా నమోదయ్యాక మాత్రమే పరిష్కరించబడినట్లు చూపబడుతుంది.',

      // Report Form
      reportPageTitle: 'నీరు లేదా డ్రైనేజీ సమస్యను నమోదు చేయండి',
      reportPageSub: 'సమస్యను త్వరగా సమీక్షించడానికి దయచేసి సరైన వివరాలను అందించండి.',
      secLocation: 'ప్రదేశం వివరాలు (లొకేషన్)',
      lblDistrict: 'జిల్లా',
      lblMandal: 'మండలం / ప్రాంతం',
      lblLocality: 'గ్రామం / కాలనీ / వార్డు',
      lblLandmark: 'గుర్తు (ల్యాండ్‌మార్క్) లేదా వీధి',
      btnCurrentLocation: 'నా ప్రస్తుత GPS స్థానాన్ని తీసుకోండి',
      gpsHelp: 'GPS కోఆర్డినేట్లు మ్యాప్‌లో సమస్య స్థానాన్ని చూపించడానికి తోడ్పడతాయి (గోప్యత కోసం సుమారు స్థానం చూపబడుతుంది).',

      secProblem: 'సమస్య వివరాలు',
      lblCategory: 'సమస్య వర్గం',
      selectCategoryPlaceholder: '-- వర్గాన్ని ఎంచుకోండి --',
      lblDescription: 'పూర్తి వివరణ',
      descPlaceholder: 'సమస్య ఏమిటి, ఎక్కడ ఉంది, ఎన్ని రోజుల నుండి ఉంది అనే వివరాలను రాయండి...',
      lblDateStarted: 'సమస్య ఎప్పుడు మొదలైంది? (ఐచ్ఛికం)',
      lblSeverity: 'పౌరులు తెలిపిన తీవ్రత',
      sevLow: 'తక్కువ',
      sevLowHelp: 'చిన్నపాటి అసౌకర్యం',
      sevMed: 'మధ్యస్థం',
      sevMedHelp: 'రోజువారీ పనులకు ఆటంకం',
      sevHigh: 'తీవ్రమైనది',
      sevHighHelp: 'పూర్తిగా నీరు రాకపోవడం లేదా పెద్ద అవరోధం',
      sevEmergency: 'అత్యవసరం',
      sevEmergencyHelp: 'కలుషిత నీరు లేదా భారీ వరద ప్రమాదం',

      secPhoto: 'ఫోటో అప్‌లోడ్',
      photoDropPrompt: 'ఫోటో ఎంచుకోవడానికి ఇక్కడ క్లిక్ చేయండి',
      photoDropHelp: 'అనుమతించబడినవి: JPG, PNG, WEBP (గరిష్టంగా 5MB). ఫోటో ఉంటే సమస్య వేగంగా అర్థమవుతుంది.',
      btnRemovePhoto: 'తొలగించు',

      secCitizen: 'పౌరుల సమాచారం (గోప్యమైనది)',
      lblName: 'మీ పేరు (ఐచ్ఛికం)',
      lblPhone: 'ఫోన్ నంబర్ (ఐచ్ఛికం)',
      lblEmail: 'ఈమెయిల్ (ఐచ్ఛికం)',
      privacyNote: '🔒 మీ సంప్రదింపు వివరాలు అత్యంత గోప్యంగా ఉంచబడతాయి. పబ్లిక్ మ్యాప్‌లో లేదా జాబితాలో ఎప్పటికీ కనిపించవు.',

      btnSubmitReport: 'ఫిర్యాదును సమర్పించండి',
      btnSubmitting: 'సమర్పిస్తున్నాము...',

      // AI & Voice Assistant
      aiSuggestionTitle: 'AI సూచన:',
      aiApplyBtn: 'ఈ సూచనను ఎంచుకోండి',
      voiceBtnStart: '🎙️ మాట్లాడండి (తెలుగు / English)',
      voiceBtnStop: '⏹️ రికార్డింగ్ ఆపు',
      voiceListening: 'వినబడుతోంది... స్పష్టంగా మాట్లాడండి',

      // Track Page
      trackPageTitle: 'మీ ఫిర్యాదు స్థితిని ట్రాక్ చేయండి',
      trackPageSub: 'రియల్-టైమ్ స్టేటస్ మరియు అడ్మిన్ అప్‌డేట్‌లను తెలుసుకోవడానికి మీ ఫిర్యాదు సంఖ్యను నమోదు చేయండి.',
      trackBtnSearch: 'స్థితిని వెతకండి',
      lblCurrentStatus: 'ప్రస్తుత స్థితి',
      lblDateSubmitted: 'సమర్పించిన తేదీ',
      lblLastUpdated: 'చివరి అప్‌డేట్',
      lblCategoryField: 'వర్గం',
      lblLocationField: 'ప్రదేశం',
      lblSeverityField: 'పౌరుల తీవ్రత',
      lblSystemPriority: 'సిస్టమ్ ప్రాధాన్యత',
      lblAssignedOrg: 'కేటాయించిన విభాగం',
      lblPublicNotes: 'పబ్లిక్ అడ్మిన్ నోట్',
      timelineHeading: 'పరిష్కార పురోగతి కాలక్రమం',
      statusHistoryHeading: 'అప్‌డేట్‌ల చరిత్ర',

      // Status Labels
      statusSubmitted: 'సమర్పించబడింది',
      statusReview: 'పరిశీలనలో ఉంది',
      statusAssigned: 'కేటాయించబడింది',
      statusProgress: 'పని జరుగుతోంది',
      statusResolved: 'పరిష్కరించబడింది',
      statusRejected: 'తిరస్కరించబడింది',
      statusDuplicate: 'నకలు (డూప్లికేట్)',
      statusClosed: 'ముగిసింది',

      // Map Page
      mapPageTitle: 'ఏఎస్ఆర్ సమస్యల మ్యాప్',
      mapPageSub: 'అల్లూరి సీతారామరాజు జిల్లా వ్యాప్తంగా నమోదైన నీరు, డ్రైనేజీ సమస్యలను మ్యాప్‌లో వీక్షించండి.',
      filterAllMandals: 'అన్ని మండలాలు / ప్రాంతాలు',
      filterAllTypes: 'అన్ని రకాలు (నీరు & డ్రైనేజీ)',
      filterWaterOnly: 'తాగునీటి సమస్యలు మాత్రమే',
      filterDrainageOnly: 'డ్రైనేజీ సమస్యలు మాత్రమే',
      filterAllStatuses: 'అన్ని స్థితులు',
      filterPendingOnly: 'పెండింగ్ / పని జరుగుతున్నవి',
      filterResolvedOnly: 'పరిష్కరించబడినవి మాత్రమే',
      mapLegendWater: 'తాగునీటి సమస్య',
      mapLegendDrainage: 'డ్రైనేజీ సమస్య',
      mapLegendOverflow: 'అత్యవసరం / పొంగిపొర్లడం',
      mapLegendResolved: 'పరిష్కరించబడింది',

      // Admin Login
      adminLoginTitle: 'అడ్మినిస్ట్రేటర్ సైన్ ఇన్',
      adminLoginSub: 'ఏఎస్ఆర్ నీరు మరియు డ్రైనేజీ సిస్టమ్ అధికారుల అధికారిక లాగిన్.',
      lblAdminEmail: 'ఈమెయిల్ చిరునామా',
      lblAdminPassword: 'పాస్‌వర్డ్',
      btnLoginSubmit: 'డ్యాష్‌బోర్డ్‌లోకి లాగిన్ అవ్వండి',
      demoLoginBtn: '⚡ త్వరిత డెమో అడ్మిన్ లాగిన్',

      // Footer
      footerTagline: 'పరిశుభ్రమైన తాగునీరు మరియు సరైన డ్రైనేజీ కొరకు పౌర సాంకేతికత.',
      footerDisclaimer: 'ఏఎస్ఆర్ నీరు & డ్రైనేజీ అనేది ప్రజల సమస్యల నమోదు కొరకు పనిచేసే స్వతంత్ర పౌర సాంకేతిక వేదిక. ఇది అధికారిక ప్రభుత్వ సంస్థ కాదు.',
      footerCopyright: '© 2026 ఏఎస్ఆర్ నీరు & డ్రైనేజీ (ASR-WD). అల్లూరి సీతారామరాజు జిల్లా.'
    }
  },

  /**
   * Get translated string by key
   */
  t(key) {
    const lang = this.currentLang;
    if (this.translations[lang] && this.translations[lang][key]) {
      return this.translations[lang][key];
    }
    if (this.translations.en && this.translations.en[key]) {
      return this.translations.en[key];
    }
    return key;
  },

  /**
   * Switch active language
   */
  setLang(lang) {
    if (lang !== 'en' && lang !== 'te') lang = 'en';
    this.currentLang = lang;
    localStorage.setItem('asr_wd_lang', lang);
    this.applyTranslations();
  },

  /**
   * Apply translations to all DOM nodes with data-i18n attributes
   */
  applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.getAttribute('placeholder')) {
          el.setAttribute('placeholder', translation);
        }
      } else {
        el.textContent = translation;
      }
    });

    // Update active class on language toggle buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === this.currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Dispatch event so other components can re-render if needed
    window.dispatchEvent(new CustomEvent('asr-language-changed', { detail: { lang: this.currentLang } }));
  },

  init() {
    this.applyTranslations();
    document.addEventListener('click', (e) => {
      const langBtn = e.target.closest('.lang-btn');
      if (langBtn) {
        const lang = langBtn.getAttribute('data-lang');
        if (lang) {
          this.setLang(lang);
        }
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ASR_I18N.init();
});
