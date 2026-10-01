<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - AI Service ("ASR Water Assistant" / "Jala Mitra")
 * 
 * Provides:
 * 1. Multilingual Natural Language Understanding (English & Telugu)
 * 2. Civic Problem Classification (WATER, DRAINAGE, RAINWATER, WATERLOGGING, etc.)
 * 3. AI Priority Triage Suggestions (Low, Medium, High, Urgent) with non-official disclaimers
 * 4. Rainwater Drip & Opening Availability Intelligence (Available / Not Available / Not Sure)
 * 5. Complaint Staging & Pre-fill generation with explicit confirmation
 * 6. Complaint Tracking & Status Lookup (anonymized PII)
 * 7. Duplicate Complaint Detection Advisory
 * 8. Life-safety Hazard Guardrails (Live wires, electrical shock, hazardous confined spaces)
 * 9. RAG Knowledge Base Retrieval for all website modules and civic processes
 * 10. External API Provider integration (Gemini / OpenAI) with intelligent local fallback
 */

require_once __DIR__ . '/../config/environment.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Complaint.php';
require_once __DIR__ . '/../models/ComplaintUpdate.php';
require_once __DIR__ . '/../models/Location.php';

class AIService {

    /**
     * Check if external AI provider is configured with an active API key
     */
    public static function isConfigured(): bool {
        $provider = strtolower((string)env('AI_PROVIDER', 'none'));
        $apiKey = trim((string)env('AI_API_KEY', ''));
        return ($provider !== 'none' && !empty($apiKey));
    }

    /**
     * Get provider status and configuration details
     */
    public static function getProviderInfo(): array {
        $provider = strtolower((string)env('AI_PROVIDER', 'none'));
        $configured = self::isConfigured();
        $model = (string)env('AI_MODEL', 'gemini-1.5-flash');

        return [
            'provider'         => $provider,
            'model'            => $model,
            'is_configured'    => $configured,
            'mode'             => $configured ? 'cloud_llm' : 'local_knowledge_engine',
            'fallback_active'  => !$configured,
            'notice'           => $configured 
                ? 'External AI provider connected.' 
                : 'Local intelligent civic assistant active (Offline advisory mode).'
        ];
    }

    /**
     * Detect language: Telugu ('te') or English ('en')
     */
    public static function detectLanguage(string $text, string $default = 'en'): string {
        // Telugu Unicode Range: \x{0C00}-\x{0C7F}
        if (preg_match('/[\x{0C00}-\x{0C7F}]/u', $text)) {
            return 'te';
        }

        // Transliterated Telugu keywords
        $teluguKeywords = ['neellu', 'neeru', 'ravadam', 'ledu', 'roddubai', 'varsham', 'drip', 'naku', 'chudali', 'ela', 'bhavanam'];
        $clean = mb_strtolower($text);
        foreach ($teluguKeywords as $kw) {
            if (str_contains($clean, $kw)) {
                return 'te';
            }
        }

        return $default;
    }

    /**
     * Safety Hazard Check (Section 17)
     * Detects electricity hazards or dangerous water situations.
     */
    public static function detectSafetyHazard(string $message, string $lang = 'en'): ?array {
        $msg = mb_strtolower($message);

        $electricHazards = [
            'electric', 'wire', 'shock', 'current', 'transformer', 'pole', 'live wire',
            'కరెంట్', 'షాక్', 'వైర్', 'విద్యుత్', 'ట్రాన్స్‌ఫార్మర్', 'స్తంభం'
        ];

        $confinedSpaceHazards = [
            'enter sewer', 'enter manhole', 'inside drain', 'enter drainage',
            'మ్యాన్‌హోల్‌లోకి', 'డ్రైనేజీలోకి దిగడం'
        ];

        foreach ($electricHazards as $term) {
            if (str_contains($msg, $term)) {
                return [
                    'hazard_type' => 'ELECTRICAL_HAZARD',
                    'severity'    => 'URGENT',
                    'warning'     => ($lang === 'te')
                        ? "⚠️ **అత్యవసర హెచ్చరిక**: విద్యుత్ తీగలు లేదా ట్రాన్స్‌ఫార్మర్ల సమీపంలో ఉన్న నీటి నుండి వెంటనే దూరంగా ఉండండి! నీటిని ఎట్టి పరిస్థితుల్లోనూ తాకవద్దు మరియు విద్యుత్ మరమ్మతులు స్వయంగా చేయవద్దు. వెంటనే విద్యుత్ హెల్ప్‌లైన్ **1912** లేదా అత్యవసర సేవలు **112** కు కాల్ చేయండి."
                        : "⚠️ **CRITICAL SAFETY WARNING**: Stay completely away from water near electrical wires, fallen power cables, or submerged transformers! Do NOT touch the water or attempt repairs. Immediately contact the Electricity Emergency Helpline (**1912**) or Emergency Services (**112**)."
                ];
            }
        }

        foreach ($confinedSpaceHazards as $term) {
            if (str_contains($msg, $term)) {
                return [
                    'hazard_type' => 'CONFINED_SPACE_HAZARD',
                    'severity'    => 'HIGH',
                    'warning'     => ($lang === 'te')
                        ? "⚠️ **రక్షణ హెచ్చరిక**: మురుగు కాలువలు, లోతైన మ్యాన్‌హోల్స్ లేదా వరద నీటిలోకి స్వయంగా ప్రవేశించవద్దు. విష వాయువులు మరియు నీటి ప్రవాహం ప్రాణాపాయం కలిగించవచ్చు. అధికారిక పారిశుద్ధ్య సిబ్బంది మాత్రమే వీటిని సరిచేయాలి."
                        : "⚠️ **SAFETY WARNING**: Never enter underground drains, manholes, or deep floodwaters yourself. Toxic gases and swift water can be life-threatening. Only authorized municipal sanitation teams with protective gear should enter."
                ];
            }
        }

        return null;
    }

    /**
     * Civic Problem Classification (Section 14)
     */
    public static function classifyProblem(string $message): array {
        $text = mb_strtolower($message);

        // Water supply & drinking water keywords
        $isWaterSupply = (
            str_contains($text, 'drinking water') || str_contains($text, 'no water') ||
            str_contains($text, 'water supply') || str_contains($text, 'tap dry') ||
            str_contains($text, 'dirty water') || str_contains($text, 'water coming') ||
            str_contains($text, 'తాగునీరు') || str_contains($text, 'నీళ్లు రావడం లేదు') ||
            str_contains($text, 'నీరు రావడం') || str_contains($text, 'మంచినీరు') ||
            str_contains($text, 'సప్లై లేదు')
        );

        // Pipeline leakage keywords
        $isPipeline = (
            str_contains($text, 'pipeline') || str_contains($text, 'pipe burst') ||
            str_contains($text, 'pipe leak') || str_contains($text, 'పైపు పగిలింది') ||
            str_contains($text, 'పైప్ లీకేజీ')
        );

        // Public tap keywords
        $isPublicTap = (
            str_contains($text, 'public tap') || str_contains($text, 'standpost') ||
            str_contains($text, 'street tap') || str_contains($text, 'బోరు') ||
            str_contains($text, 'పబ్లిక్ ట్యాప్') || str_contains($text, 'స్టాండ్‌పోస్ట్')
        );

        // Rainwater opening & drip keywords
        $isRainwaterOpening = (
            str_contains($text, 'rainwater drip') || str_contains($text, 'drip opening') ||
            str_contains($text, 'rainwater opening') || str_contains($text, 'rainwater outlet') ||
            str_contains($text, 'రెయిన్ వాటర్ డ్రిప్') || str_contains($text, 'డ్రిప్ ఓపెనింగ్') ||
            str_contains($text, 'వర్షపు నీటి రంధ్రం')
        );

        // Waterlogging keywords
        $isWaterlogging = (
            str_contains($text, 'waterlogging') || str_contains($text, 'water logging') ||
            str_contains($text, 'water staying on road') || str_contains($text, 'water collecting on the road') ||
            str_contains($text, 'rain water is staying') || str_contains($text, 'flooding road') ||
            str_contains($text, 'entering house') || str_contains($text, 'నీరు రోడ్డుపై నిలిచి') ||
            str_contains($text, 'ఇంట్లోకి నీరు') || str_contains($text, 'నీరు నిలిచింది')
        );

        // Rainwater blockage & damage
        $isRainwaterBlockage = (
            $isRainwaterOpening && (str_contains($text, 'block') || str_contains($text, 'clog') || str_contains($text, 'జామ్'))
        );

        $isRainwaterDamage = (
            str_contains($text, 'rainwater drain is damaged') || str_contains($text, 'rain drain broken') ||
            str_contains($text, 'వర్షపు కాలువ పాడైంది') || str_contains($text, 'డ్రైన్ దెబ్బతింది')
        );

        // Drainage keywords
        $isDrainage = (
            str_contains($text, 'drainage') || str_contains($text, 'drain') ||
            str_contains($text, 'sewage') || str_contains($text, 'gutter') ||
            str_contains($text, 'overflow') || str_contains($text, 'blocked drainage') ||
            str_contains($text, 'డ్రైనేజ్') || str_contains($text, 'కాలువ') ||
            str_contains($text, 'మురుగు') || str_contains($text, 'ఓవర్‌ఫ్లో') ||
            str_contains($text, 'మురుగునీరు')
        );

        // General rainwater
        $isRainwater = (
            str_contains($text, 'rainwater') || str_contains($text, 'rain water') ||
            str_contains($text, 'వర్షపు నీరు') || str_contains($text, 'వర్షం')
        );

        // Determine specific category
        if ($isRainwaterBlockage) {
            $cat = 'RAINWATER_BLOCKAGE';
            $mainType = 'rainwater';
        } elseif ($isRainwaterDamage) {
            $cat = 'RAINWATER_DAMAGE';
            $mainType = 'rainwater';
        } elseif ($isRainwaterOpening) {
            $cat = 'RAINWATER_OPENING';
            $mainType = 'rainwater';
        } elseif ($isWaterlogging) {
            $cat = 'WATERLOGGING';
            $mainType = 'rainwater';
        } elseif ($isPipeline) {
            $cat = 'PIPELINE';
            $mainType = 'water';
        } elseif ($isPublicTap) {
            $cat = 'PUBLIC_TAP';
            $mainType = 'water';
        } elseif ($isWaterSupply) {
            $cat = 'WATER';
            $mainType = 'water';
        } elseif ($isDrainage) {
            $cat = 'DRAINAGE';
            $mainType = 'drainage';
        } elseif ($isRainwater) {
            $cat = 'RAINWATER';
            $mainType = 'rainwater';
        } else {
            $cat = 'OTHER';
            $mainType = 'water';
        }

        return [
            'category'           => $cat,
            'main_type'          => $mainType,
            'is_water'           => in_array($cat, ['WATER', 'PIPELINE', 'PUBLIC_TAP']),
            'is_drainage'        => in_array($cat, ['DRAINAGE']),
            'is_rainwater'       => in_array($cat, ['RAINWATER', 'WATERLOGGING', 'RAINWATER_OPENING', 'RAINWATER_BLOCKAGE', 'RAINWATER_DAMAGE']),
            'confidence'         => ($cat !== 'OTHER') ? 0.90 : 0.40,
            'is_ai_suggestion'   => true
        ];
    }

    /**
     * Priority Suggestion (Section 15)
     * Output: LOW, MEDIUM, HIGH, URGENT.
     * With strict non-official disclaimer.
     */
    public static function suggestPriority(string $category, string $message): array {
        $msg = mb_strtolower($message);

        // Urgent conditions: flooding inside homes, complete water cutoff for large community, electrical/water combo
        if (
            str_contains($msg, 'entering house') || str_contains($msg, 'inside house') ||
            str_contains($msg, 'ఇంట్లోకి') || str_contains($msg, 'hospital') ||
            str_contains($msg, 'school') || str_contains($msg, 'contamination') ||
            str_contains($msg, 'poison') || str_contains($msg, 'illness')
        ) {
            $priority = 'URGENT';
            $reason = 'High civic impact (homes/health/education affected)';
        } elseif (
            str_contains($msg, 'major road') || str_contains($msg, 'main road') ||
            str_contains($msg, 'overflowing') || str_contains($msg, 'burst') ||
            str_contains($msg, 'heavy') || str_contains($msg, 'రోడ్డుపైకి') ||
            str_contains($msg, 'పూర్తిగా') || $category === 'WATERLOGGING'
        ) {
            $priority = 'HIGH';
            $reason = 'Substantial disruption to traffic or public water access';
        } elseif ($category === 'PUBLIC_TAP' || $category === 'RAINWATER_OPENING' || str_contains($msg, 'small') || str_contains($msg, 'leakage')) {
            $priority = 'MEDIUM';
            $reason = 'Local infrastructure maintenance issue';
        } else {
            $priority = 'MEDIUM';
            $reason = 'Standard civic problem triage';
        }

        return [
            'suggested_priority' => $priority,
            'reason'             => $reason,
            'display_label'      => "AI suggested priority: " . ucfirst(strtolower($priority)),
            'disclaimer'         => 'Advisory triage score only. Official priority is assigned upon verification by authorized administrators.'
        ];
    }

    /**
     * Extract Location name or ID from message
     */
    public static function extractLocation(string $message): ?array {
        $text = mb_strtolower($message);

        $mandalCatalog = [
            ['id' => 2, 'name' => 'Paderu', 'name_te' => 'పాడేరు', 'keys' => ['paderu', 'paduru', 'పాడేరు']],
            ['id' => 3, 'name' => 'Araku Valley', 'name_te' => 'అరకు లోయ', 'keys' => ['araku', 'araku valley', 'అరకు', 'అరకు లోయ']],
            ['id' => 4, 'name' => 'Chintapalle', 'name_te' => 'చింతపల్లి', 'keys' => ['chintapalle', 'chintapalli', 'చింతపల్లి', 'లంబసింగి', 'lambasingi']],
            ['id' => 5, 'name' => 'Ananthagiri', 'name_te' => 'అనంతగిరి', 'keys' => ['ananthagiri', 'anantagiri', 'అనంతగిరి']],
            ['id' => 6, 'name' => 'Dumbriguda', 'name_te' => 'డుంబ్రిగుడ', 'keys' => ['dumbriguda', 'డుంబ్రిగుడ']],
            ['id' => 7, 'name' => 'G. Madugula', 'name_te' => 'జి. మాడుగుల', 'keys' => ['g madugula', 'g. madugula', 'madugula', 'మాడుగుల']],
            ['id' => 8, 'name' => 'G.K. Veedhi', 'name_te' => 'గూడెం కొత్త వీధి', 'keys' => ['gk veedhi', 'g.k. veedhi', 'gudem kotha veedhi', 'గూడెం']],
            ['id' => 9, 'name' => 'Hukumpeta', 'name_te' => 'హుకుంపేట', 'keys' => ['hukumpeta', 'hukumpet', 'హుకుంపేట']],
            ['id' => 10, 'name' => 'Koyyuru', 'name_te' => 'కొయ్యూరు', 'keys' => ['koyyuru', 'కొయ్యూరు']],
            ['id' => 11, 'name' => 'Munchingput', 'name_te' => 'ముంచంగిపుట్టు', 'keys' => ['munchingput', 'munchingiputtu', 'ముంచంగిపుట్టు']],
            ['id' => 12, 'name' => 'Pedabayalu', 'name_te' => 'పెదబయలు', 'keys' => ['pedabayalu', 'పెదబయలు']]
        ];

        foreach ($mandalCatalog as $loc) {
            foreach ($loc['keys'] as $k) {
                if (str_contains($text, $k)) {
                    return [
                        'id'      => $loc['id'],
                        'name'    => $loc['name'],
                        'name_te' => $loc['name_te']
                    ];
                }
            }
        }

        return null;
    }

    /**
     * Extract Tracking Number from user message (e.g. ASR-WD-2026-00125 or ASR-WD-000001 or RW-2026-00001)
     */
    public static function extractTrackingNumber(string $message): ?string {
        if (preg_match('/(ASR-[A-Z0-9-]+|RW-[A-Z0-9-]+)/i', $message, $matches)) {
            return strtoupper(trim($matches[1]));
        }
        return null;
    }

    /**
     * Dedicated AI Knowledge Base (Section 11)
     * Search and retrieve verified context about ASR Water & Drainage
     */
    public static function getRelevantKnowledge(string $query, string $lang = 'en'): ?array {
        $q = mb_strtolower($query);

        $kb = [
            [
                'id'       => 'report_problem',
                'keywords' => ['how do i report', 'how to report', 'create complaint', 'submit problem', 'ఎలా రిపోర్ట్ చేయాలి', 'ఫిర్యాదు చేయడం ఎలా', 'కంప్లైంట్ ఇవ్వడం'],
                'en'       => "To report a problem:\n1. Click **Report a Problem** or visit `/report.html`.\n2. Select your Mandal and Locality in ASR District.\n3. Choose whether it's a **Water** or **Drainage** problem.\n4. Describe the problem, add a landmark, and optionally take a photo.\n5. Click **Submit Complaint**. You will receive an immediate Complaint ID (e.g., `ASR-WD-000001`) to track.",
                'te'       => "సమస్యను నివేదించడానికి:\n1. **సమస్యను నివేదించండి** పై క్లిక్ చేయండి లేదా `/report.html` కి వెళ్లండి.\n2. అల్లూరి జిల్లాలోని మీ మండలం మరియు గ్రామాన్ని ఎంచుకోండి.\n3. సమస్య రకాన్ని (తాగునీరు లేదా డ్రైనేజీ) ఎంచుకోండి.\n4. సమస్య వివరాలు, ల్యాండ్‌మార్క్ రాయండి మరియు ఫోటో జోడించండి.\n5. **ఫిర్యాదు సమర్పించండి** పై క్లిక్ చేయండి. మీకు వెంటనే ట్రాకింగ్ కోసం కంప్లైంట్ ఐడీ (ఉదా: `ASR-WD-000001`) లభిస్తుంది.",
                'action'   => ['type' => 'NAVIGATE', 'label' => ($lang === 'te' ? 'సమస్యను నివేదించండి' : 'Report Problem Now'), 'url' => 'report.html']
            ],
            [
                'id'       => 'track_complaint',
                'keywords' => ['track', 'status', 'check complaint', 'where is my complaint', 'ట్రాక్', 'స్టేటస్', 'ఫిర్యాదు స్థితి'],
                'en'       => "You can track your complaint anytime using your unique Complaint Number (e.g. `ASR-WD-000001` or `RW-2026-00001`). Visit `/track.html` and enter your number to see the current status, assignment details, and resolution timeline.",
                'te'       => "మీరు మీ కంప్లైంట్ నంబర్ (ఉదా: `ASR-WD-000001` లేదా `RW-2026-00001`) ఉపయోగించి ఎప్పుడైనా మీ ఫిర్యాదును ట్రాక్ చేయవచ్చు. `/track.html` కి వెళ్లి ప్రస్తుత స్థితి మరియు టైమ్‌లైన్ చూడవచ్చు.",
                'action'   => ['type' => 'NAVIGATE', 'label' => ($lang === 'te' ? 'కంప్లైంట్ ట్రాక్ చేయండి' : 'Open Complaint Tracker'), 'url' => 'track.html']
            ],
            [
                'id'       => 'rainwater_module',
                'keywords' => ['rainwater module', 'rainwater harvesting', 'rainwater', 'వర్షపు నీరు', 'రెయిన్ వాటర్', 'వాన నీరు'],
                'en'       => "The Rainwater Module helps identify whether rainwater drainage/drip openings exist on roads, records citizen observations, and prevents waterlogging. Visit `/rainwater.html` to view the district map or record an observation.",
                'te'       => "రెయిన్ వాటర్ మాడ్యూల్ రోడ్లపై వర్షపు నీటి ఓపెనింగ్‌లు/డ్రిప్‌లు ఉన్నాయో లేదో పరిశీలించడానికి మరియు వాటర్‌లాగింగ్‌ను నివారించడానికి ఉపయోగపడుతుంది. వివరాలకు `/rainwater.html` చూడండి.",
                'action'   => ['type' => 'NAVIGATE', 'label' => ($lang === 'te' ? 'రెయిన్ వాటర్ మాడ్యూల్' : 'Explore Rainwater Module'), 'url' => 'rainwater.html']
            ],
            [
                'id'       => 'complaint_statuses',
                'keywords' => ['complaint status', 'statuses', 'submitted', 'assigned', 'in progress', 'resolved', 'స్టేటస్ అర్థాలు', 'దశలు'],
                'en'       => "Complaint Lifecycle Statuses:\n• **Submitted**: Received in system, awaiting administrative review.\n• **Under Review**: Verified by district triage team.\n• **Assigned**: Dispatched to responsible department/engineer.\n• **In Progress**: Field work actively underway.\n• **Resolved**: Maintenance complete with verified resolution notes.\n• **Rejected / Duplicate**: Closed with specific reason recorded.",
                'te'       => "ఫిర్యాదు స్థితి దశలు:\n• **Submitted (సమర్పించబడింది)**: నమోదు చేయబడింది, పరిశీలనలో ఉంది.\n• **Under Review (సమీక్షలో ఉంది)**: అడ్మినిస్ట్రేటర్లు పరిశీలిస్తున్నారు.\n• **Assigned (కేటాయించబడింది)**: సంబంధిత విభాగానికి పంపబడింది.\n• **In Progress (పని జరుగుతోంది)**: ఫీల్డ్ వర్క్ జరుగుతోంది.\n• **Resolved (పరిష్కరించబడింది)**: సమస్య విజయవంతంగా పరిష్కరించబడింది.",
                'action'   => ['type' => 'NAVIGATE', 'label' => ($lang === 'te' ? 'కంప్లైంట్ ట్రాకింగ్' : 'Track Complaint'), 'url' => 'track.html']
            ],
            [
                'id'       => 'location_coverage',
                'keywords' => ['locations', 'mandals', 'coverage', 'which areas', 'ఏయే ప్రాంతాలు', 'మండలాలు', 'పాడేరు', 'అరకు'],
                'en'       => "The platform covers all mandals in Alluri Sitharama Raju District including Paderu, Araku Valley, Chintapalle, Ananthagiri, Dumbriguda, G. Madugula, G.K. Veedhi, Hukumpeta, Koyyuru, Munchingput, Pedabayalu, and surrounding rural localities.",
                'te'       => "ఈ వేదిక అల్లూరి సీతారామరాజు జిల్లాలోని అన్ని మండలాలను కవర్ చేస్తుంది: పాడేరు, అరకు వ్యాలీ, చింతపల్లి, అనంతగిరి, డుంబ్రిగుడ, జి. మాడుగుల, జికె వీధి, హుకుంపేట, కొయ్యూరు, ముంచంగిపుట్టు, పెదబయలు మరియు గ్రామాలు.",
                'action'   => ['type' => 'NAVIGATE', 'label' => ($lang === 'te' ? 'సమస్యల మ్యాప్ చూడండి' : 'View Problem Map'), 'url' => 'map.html']
            ]
        ];

        foreach ($kb as $item) {
            foreach ($item['keywords'] as $kw) {
                if (str_contains($q, $kw)) {
                    return [
                        'id'     => $item['id'],
                        'answer' => ($lang === 'te') ? $item['te'] : $item['en'],
                        'action' => $item['action']
                    ];
                }
            }
        }

        return null;
    }

    /**
     * Query existing complaint status for public tracking safely
     */
    public static function lookupComplaint(string $number, string $lang = 'en'): array {
        $cleanNumber = strtoupper(trim($number));
        $complaint = Complaint::findByComplaintNumber($cleanNumber);

        if (!$complaint) {
            return [
                'found'   => false,
                'message' => ($lang === 'te')
                    ? "ఫిర్యాదు సంఖ్య **{$cleanNumber}** తో ఏ రికార్డు కనపడలేదు. దయచేసి సంఖ్యను సరిచూసుకోండి."
                    : "No complaint found with tracking number **{$cleanNumber}**. Please verify the number."
            ];
        }

        // Anonymize citizen PII
        $statusLabels = [
            'submitted'    => ['en' => 'Submitted', 'te' => 'సమర్పించబడింది'],
            'under_review' => ['en' => 'Under Review', 'te' => 'సమీక్షలో ఉంది'],
            'assigned'     => ['en' => 'Assigned', 'te' => 'కేటాయించబడింది'],
            'in_progress'  => ['en' => 'In Progress', 'te' => 'పని జరుగుతోంది'],
            'resolved'     => ['en' => 'Resolved', 'te' => 'పరిష్కరించబడింది'],
            'rejected'     => ['en' => 'Rejected', 'te' => 'తిరస్కరించబడింది'],
            'duplicate'    => ['en' => 'Duplicate', 'te' => 'డూప్లికేట్'],
            'closed'       => ['en' => 'Closed', 'te' => 'ముగిసింది']
        ];

        $statusRaw = strtolower($complaint['status'] ?? 'submitted');
        $statusDisplay = $statusLabels[$statusRaw][$lang] ?? ucfirst($statusRaw);

        // Get latest timeline update
        $timeline = ComplaintUpdate::getByComplaintId((int)$complaint['id'], true);
        $latestUpdate = !empty($timeline) ? $timeline[0]['message'] : 'Complaint lodged in system.';

        return [
            'found'            => true,
            'complaint_number' => $complaint['complaint_number'],
            'category_name'    => $complaint['category_name'] ?? 'Water & Drainage',
            'location_name'    => $complaint['location_name'] ?? 'ASR District',
            'status'           => $statusDisplay,
            'status_raw'       => $statusRaw,
            'last_updated'     => $complaint['updated_at'] ?? $complaint['created_at'],
            'latest_update'    => $latestUpdate,
            'url'              => "track.html?id=" . urlencode($complaint['complaint_number'])
        ];
    }

    /**
     * Check for potential duplicates nearby (Advisory Section 16)
     */
    public static function detectDuplicate(string $description, int $locationId, int $categoryId): array {
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT id, complaint_number, title, description, status, created_at 
                                   FROM complaints 
                                   WHERE location_id = :loc_id 
                                     AND category_id = :cat_id 
                                     AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
                                   LIMIT 5");
            $stmt->execute([':loc_id' => $locationId, ':cat_id' => $categoryId]);
            $recentComplaints = $stmt->fetchAll();

            if (empty($recentComplaints)) {
                return ['possible_duplicate' => false, 'candidates' => []];
            }

            $inputTokens = self::tokenize($description);
            $candidates = [];

            foreach ($recentComplaints as $recent) {
                $recentTokens = self::tokenize($recent['description']);
                $similarity = self::calculateJaccardSimilarity($inputTokens, $recentTokens);

                if ($similarity >= 0.35) {
                    $candidates[] = [
                        'complaint_number' => $recent['complaint_number'],
                        'status'           => $recent['status'],
                        'created_at'       => $recent['created_at']
                    ];
                }
            }

            return [
                'possible_duplicate' => !empty($candidates),
                'candidates'         => $candidates,
                'message'            => !empty($candidates) 
                    ? 'There may already be a similar complaint registered in this area within the last 7 days.' 
                    : null
            ];
        } catch (Exception $e) {
            return ['possible_duplicate' => false, 'candidates' => []];
        }
    }

    /**
     * Core Conversation Orchestrator: processMessage
     * Handles the complete natural language interaction with memory & context
     */
    public static function processMessage(
        string $message,
        string $preferredLang = 'en',
        ?string $sessionId = null,
        ?int $userId = null,
        array $context = []
    ): array {
        $message = trim($message);
        if (empty($message)) {
            return [
                'success' => false,
                'reply'   => 'Please enter a question or problem description.'
            ];
        }

        // Determine language: prioritize content language, fallback to user preference
        $lang = self::detectLanguage($message, $preferredLang);

        // 1. Safety Check (Immediate priority override)
        $safetyAlert = self::detectSafetyHazard($message, $lang);
        if ($safetyAlert !== null) {
            return [
                'success'            => true,
                'reply'              => $safetyAlert['warning'],
                'category'           => 'OTHER',
                'suggested_priority' => 'URGENT',
                'priority_label'     => 'AI suggested priority: Urgent (Emergency Hazard)',
                'safety_warning'     => $safetyAlert,
                'actions'            => [
                    [
                        'type'  => 'EMERGENCY_CALL',
                        'label' => ($lang === 'te' ? '📞 అత్యవసర సేవలు (112)' : '📞 Emergency Helpline (112)'),
                        'url'   => 'tel:112'
                    ],
                    [
                        'type'  => 'EMERGENCY_CALL',
                        'label' => ($lang === 'te' ? '⚡ విద్యుత్ హెల్ప్‌లైన్ (1912)' : '⚡ Electricity Helpline (1912)'),
                        'url'   => 'tel:1912'
                    ]
                ]
            ];
        }

        // 2. Complaint Tracking Intent (Section 10)
        $trackingNumber = self::extractTrackingNumber($message);
        $isTrackingIntent = (
            $trackingNumber !== null ||
            str_contains(mb_strtolower($message), 'track') ||
            str_contains(mb_strtolower($message), 'status') ||
            str_contains(mb_strtolower($message), 'ట్రాక్') ||
            str_contains(mb_strtolower($message), 'స్టేటస్')
        );

        if ($isTrackingIntent) {
            if ($trackingNumber !== null) {
                $lookup = self::lookupComplaint($trackingNumber, $lang);
                if ($lookup['found']) {
                    $reply = ($lang === 'te')
                        ? "మీ ఫిర్యాదు సమాచారం లభించింది:\n\n" .
                          "• **ఫిర్యాదు సంఖ్య**: {$lookup['complaint_number']}\n" .
                          "• **విభాగం**: {$lookup['category_name']}\n" .
                          "• **ప్రాంతం**: {$lookup['location_name']}\n" .
                          "• **ప్రస్తుత స్థితి**: **{$lookup['status']}**\n" .
                          "• **చివరి అప్‌డేట్**: {$lookup['latest_update']}"
                        : "Here is your complaint status:\n\n" .
                          "• **Complaint ID**: {$lookup['complaint_number']}\n" .
                          "• **Category**: {$lookup['category_name']}\n" .
                          "• **Location**: {$lookup['location_name']}\n" .
                          "• **Current Status**: **{$lookup['status']}**\n" .
                          "• **Latest Update**: {$lookup['latest_update']}";

                    return [
                        'success'            => true,
                        'reply'              => $reply,
                        'category'           => 'TRACKING',
                        'suggested_priority' => 'LOW',
                        'tracking_card'      => $lookup,
                        'actions'            => [
                            [
                                'type'  => 'TRACK_LINK',
                                'label' => ($lang === 'te' ? 'పూర్తి టైమ్‌లైన్ చూడండి →' : 'View Full Timeline →'),
                                'url'   => $lookup['url']
                            ]
                        ]
                    ];
                } else {
                    return [
                        'success'            => true,
                        'reply'              => $lookup['message'],
                        'category'           => 'TRACKING',
                        'suggested_priority' => 'LOW',
                        'actions'            => [
                            [
                                'type'  => 'NAVIGATE',
                                'label' => ($lang === 'te' ? 'ట్రాకింగ్ పేజీ తెరవండి' : 'Open Tracking Page'),
                                'url'   => 'track.html'
                            ]
                        ]
                    ];
                }
            } else {
                // Tracking query without explicit number
                $reply = ($lang === 'te')
                    ? "మీ కంప్లైంట్ స్థితిని తనిఖీ చేయడానికి నేను సహాయపడతాను. దయచేసి మీ ఫిర్యాదు సంఖ్యను నమోదు చేయండి (ఉదా: `ASR-WD-000001` లేదా `RW-2026-00001`), లేదా కింద ఉన్న బటన్ ద్వారా ట్రాకింగ్ పేజీని సందర్శించండి."
                    : "I can help you check your complaint status. Please provide your Complaint Number (e.g., `ASR-WD-000001` or `RW-2026-00001`), or click below to open the tracking page.";

                return [
                    'success'            => true,
                    'reply'              => $reply,
                    'category'           => 'TRACKING',
                    'suggested_priority' => 'LOW',
                    'actions'            => [
                        [
                            'type'  => 'NAVIGATE',
                            'label' => ($lang === 'te' ? '🔍 ట్రాకింగ్ పేజీకి వెళ్లండి' : '🔍 Track Complaint Page'),
                            'url'   => 'track.html'
                        ]
                    ]
                ];
            }
        }

        // 3. Rainwater Availability Logic (Section 7)
        // Question: "Is a rainwater drainage/drip opening available at this location?"
        $lowerMsg = mb_strtolower($message);
        if (
            str_contains($lowerMsg, 'rainwater drip') || str_contains($lowerMsg, 'rainwater opening') ||
            str_contains($lowerMsg, 'drip opening') || str_contains($lowerMsg, 'rainwater outlet') ||
            str_contains($lowerMsg, 'రెయిన్ వాటర్ డ్రిప్') || str_contains($lowerMsg, 'వర్షపు నీటి రంధ్రం') ||
            str_contains($lowerMsg, 'opening available')
        ) {
            // Check if user answered the 3-choice availability prompt
            if (str_contains($lowerMsg, 'not sure') || str_contains($lowerMsg, 'తెలీదు') || str_contains($lowerMsg, 'ఖచ్చితంగా తెలీదు')) {
                $reply = ($lang === 'te')
                    ? "ధన్యవాదాలు. మీరు ఖచ్చితంగా నిర్ధారించలేకపోతున్నందున, మేము దీనిని ధృవీకరణ అవసరమైన పౌర పరిశీలనగా నమోదు చేస్తాము.\n\nగుర్తుంచుకోండి: ఇది పౌర పరిశీలన మాత్రమే, అధికారిక నిర్ధారణ కాదు. ఫీల్డ్ అధికారులు దీనిని పరిశీలిస్తారు."
                    : "Thanks. Since you're not sure, we'll record this as an observation that needs verification.\n\n*Note: Citizen observations are maintained as observations until administrative field verification.*";

                return [
                    'success'            => true,
                    'reply'              => $reply,
                    'category'           => 'RAINWATER_OPENING',
                    'suggested_priority' => 'LOW',
                    'priority_label'     => 'AI suggested priority: Low (Observation)',
                    'actions'            => [
                        [
                            'type'  => 'RAINWATER_REPORT',
                            'label' => ($lang === 'te' ? '🌧️ రెయిన్ వాటర్ రికార్డు నమోదు' : '🌧️ Record Rainwater Observation'),
                            'url'   => 'rainwater.html?choice=notsure'
                        ]
                    ]
                ];
            } elseif (
                str_contains($lowerMsg, 'no opening') || str_contains($lowerMsg, 'not available') ||
                str_contains($lowerMsg, 'no drip') || str_contains($lowerMsg, 'లేదు') ||
                str_contains($lowerMsg, 'డ్రిప్ లేదు')
            ) {
                $reply = ($lang === 'te')
                    ? "ఈ రహదారి వద్ద వర్షపు నీటి డ్రిప్/కాలువ ఓపెనింగ్ లేదని మీరు పరిశీలించారు. వర్షపు నీటి నిల్వను నివారించడానికి మేము దీనిని నమోదు చేయడంలో సహాయపడతాము."
                    : "You observed that a rainwater drainage opening is not available here. I can guide you to create an infrastructure request with photo and location.";

                return [
                    'success'            => true,
                    'reply'              => $reply,
                    'category'           => 'RAINWATER_OPENING',
                    'suggested_priority' => 'MEDIUM',
                    'priority_label'     => 'AI suggested priority: Medium',
                    'actions'            => [
                        [
                            'type'  => 'RAINWATER_REPORT',
                            'label' => ($lang === 'te' ? '🌧️ మిస్సింగ్ డ్రిప్ రిపోర్ట్ చేయండి' : '🌧️ Report Missing Rainwater Opening'),
                            'url'   => 'rainwater.html?choice=not_available'
                        ]
                    ]
                ];
            } elseif (
                str_contains($lowerMsg, 'yes') || str_contains($lowerMsg, 'available') ||
                str_contains($lowerMsg, 'ఉంది') || str_contains($lowerMsg, 'అవును')
            ) {
                $reply = ($lang === 'te')
                    ? "వర్షపు నీటి ఓపెనింగ్ అందుబాటులో ఉన్నట్లు మీరు తెలిపారు. దీని పరిస్థితి ఎలా కనిపిస్తోంది?\n\n• బాగుంది (Good)\n• పాక్షికంగా అడ్డంకి ఉంది (Partially Blocked)\n• పూర్తిగా మూసుకుపోయింది (Blocked)\n• పాడైంది (Damaged)"
                    : "You observed that a rainwater opening is available. What condition does it appear to be in?\n\n• Good\n• Partially blocked\n• Blocked\n• Damaged\n• Unknown";

                return [
                    'success'            => true,
                    'reply'              => $reply,
                    'category'           => 'RAINWATER_OPENING',
                    'suggested_priority' => 'LOW',
                    'actions'            => [
                        [
                            'type'  => 'RAINWATER_CONDITION',
                            'label' => ($lang === 'te' ? 'బాగుంది (Good)' : 'Good'),
                            'url'   => 'rainwater.html?choice=available&cond=good'
                        ],
                        [
                            'type'  => 'RAINWATER_CONDITION',
                            'label' => ($lang === 'te' ? 'బ్లాక్ అయింది (Blocked)' : 'Blocked'),
                            'url'   => 'rainwater.html?choice=available&cond=blocked'
                        ],
                        [
                            'type'  => 'RAINWATER_CONDITION',
                            'label' => ($lang === 'te' ? 'పాడైంది (Damaged)' : 'Damaged'),
                            'url'   => 'rainwater.html?choice=available&cond=damaged'
                        ]
                    ]
                ];
            } else {
                // Initial prompt for rainwater opening
                $reply = ($lang === 'te')
                    ? "ఈ ప్రదేశంలో వర్షపు నీటి కాలువ లేదా డ్రిప్ ఓపెనింగ్ అందుబాటులో ఉందా?"
                    : "Is a rainwater drainage/drip opening available at this location?";

                return [
                    'success'            => true,
                    'reply'              => $reply,
                    'category'           => 'RAINWATER_OPENING',
                    'suggested_priority' => 'LOW',
                    'actions'            => [
                        [
                            'type'  => 'OPTION_YES',
                            'label' => ($lang === 'te' ? 'అవును - ఉంది' : 'YES - AVAILABLE'),
                            'url'   => 'rainwater.html?choice=available'
                        ],
                        [
                            'type'  => 'OPTION_NO',
                            'label' => ($lang === 'te' ? 'లేదు - అందుబాటులో లేదు' : 'NO - NOT AVAILABLE'),
                            'url'   => 'rainwater.html?choice=not_available'
                        ],
                        [
                            'type'  => 'OPTION_NOT_SURE',
                            'label' => ($lang === 'te' ? 'ఖచ్చితంగా తెలీదు' : 'NOT SURE'),
                            'url'   => 'rainwater.html?choice=unknown'
                        ]
                    ]
                ];
            }
        }

        // 4. Problem Classification & Natural Language Guidance (Sections 5 & 8)
        $classification = self::classifyProblem($message);
        $priorityData = self::suggestPriority($classification['category'], $message);
        $extractedLoc = self::extractLocation($message);

        // Check if message describes a concrete problem (water, drainage, rainwater)
        if ($classification['category'] !== 'OTHER') {
            $catName = match($classification['category']) {
                'WATER', 'PIPELINE', 'PUBLIC_TAP' => ($lang === 'te' ? 'తాగునీటి సమస్య' : 'Drinking Water Problem'),
                'DRAINAGE'                        => ($lang === 'te' ? 'డ్రైనేజీ సమస్య' : 'Drainage Problem'),
                'WATERLOGGING'                    => ($lang === 'te' ? 'వాటర్‌లాగింగ్ / నీరు నిలవడం' : 'Waterlogging Problem'),
                'RAINWATER', 'RAINWATER_BLOCKAGE', 'RAINWATER_DAMAGE' => ($lang === 'te' ? 'వర్షపు నీటి సమస్య' : 'Rainwater Problem'),
                default                           => ($lang === 'te' ? 'పౌర సమస్య' : 'Civic Problem')
            };

            $locName = $extractedLoc ? ($lang === 'te' ? $extractedLoc['name_te'] : $extractedLoc['name']) : ($lang === 'te' ? 'మీ ప్రాంతం' : 'Your area');

            // Build Confirmation Summary (Section 8)
            $reply = ($lang === 'te')
                ? "మీరు చెప్పిన సమస్య నాకు అర్థమైంది:\n\n" .
                  "• **విభాగం**: {$catName}\n" .
                  "• **సమస్య రకం**: " . self::getProblemSummary($classification['category'], 'te') . "\n" .
                  "• **ప్రాంతం**: {$locName}\n" .
                  "• **వివరణ**: {$message}\n\n" .
                  "దీనిని నమోదు చేయడానికి ముందుకు వెళ్లాలా?"
                : "Here is what I understood:\n\n" .
                  "• **Category**: {$catName}\n" .
                  "• **Problem**: " . self::getProblemSummary($classification['category'], 'en') . "\n" .
                  "• **Location**: {$locName}\n" .
                  "• **Description**: {$message}\n\n" .
                  "Would you like to continue to the report form?";

            $reportUrl = "report.html?type=" . urlencode($classification['main_type']) . 
                         "&desc=" . urlencode($message) . 
                         ($extractedLoc ? "&loc=" . urlencode((string)$extractedLoc['id']) : "");

            return [
                'success'            => true,
                'reply'              => $reply,
                'category'           => $classification['category'],
                'suggested_priority' => $priorityData['suggested_priority'],
                'priority_label'     => $priorityData['display_label'],
                'classification'     => $classification,
                'location'           => $extractedLoc,
                'staged_complaint'   => [
                    'category_type' => $classification['main_type'],
                    'category_name' => $catName,
                    'location'      => $locName,
                    'location_id'   => $extractedLoc['id'] ?? null,
                    'description'   => $message,
                    'priority'      => $priorityData['suggested_priority']
                ],
                'actions'            => [
                    [
                        'type'  => 'CONFIRM_REPORT',
                        'label' => ($lang === 'te' ? '✅ అవును, కొనసాగించండి' : '✅ Yes, Continue'),
                        'url'   => $reportUrl
                    ],
                    [
                        'type'  => 'EDIT_REPORT',
                        'label' => ($lang === 'te' ? '✏️ మార్చు (Edit)' : '✏️ Edit'),
                        'url'   => '#edit'
                    ],
                    [
                        'type'  => 'CANCEL_REPORT',
                        'label' => ($lang === 'te' ? '❌ రద్దు చేయి' : '❌ Cancel'),
                        'url'   => '#cancel'
                    ]
                ]
            ];
        }

        // 5. Knowledge Base Retrieval (Section 11)
        $kbMatch = self::getRelevantKnowledge($message, $lang);
        if ($kbMatch !== null) {
            return [
                'success'            => true,
                'reply'              => $kbMatch['answer'],
                'category'           => 'KNOWLEDGE',
                'suggested_priority' => 'LOW',
                'actions'            => [$kbMatch['action']]
            ];
        }

        // 6. External Cloud LLM Fallback (if configured)
        if (self::isConfigured()) {
            $cloudReply = self::callExternalAi($message, $lang);
            if (!empty($cloudReply)) {
                return [
                    'success'            => true,
                    'reply'              => $cloudReply,
                    'category'           => 'GENERAL',
                    'suggested_priority' => 'LOW',
                    'actions'            => [
                        [
                            'type'  => 'NAVIGATE',
                            'label' => ($lang === 'te' ? 'సమస్యను నివేదించండి' : 'Report a Problem'),
                            'url'   => 'report.html'
                        ]
                    ]
                ];
            }
        }

        // 7. Strict Safe Fallback (Section 11 & 24 - No fake AI)
        $unverifiedReply = ($lang === 'te')
            ? "ఆ అంశంపై నా వద్ద ఇంకా ధృవీకరించబడిన సమాచారం లేదు. మీరు 'సమస్యను నివేదించండి' విభాగాన్ని ఉపయోగించవచ్చు లేదా ఈ వెబ్‌సైట్‌లో అందించిన సమాచారం ద్వారా సంబంధిత బాధ్యతాయుత అధికారిని సంప్రదించవచ్చు."
            : "I don't have verified information about that yet. You can use the Report a Problem section or contact the responsible authority through the information provided on this website.";

        return [
            'success'            => true,
            'reply'              => $unverifiedReply,
            'category'           => 'OTHER',
            'suggested_priority' => 'LOW',
            'actions'            => [
                [
                    'type'  => 'NAVIGATE',
                    'label' => ($lang === 'te' ? '📝 సమస్యను నివేదించండి' : '📝 Report a Problem'),
                    'url'   => 'report.html'
                ],
                [
                    'type'  => 'NAVIGATE',
                    'label' => ($lang === 'te' ? '📞 మమ్మల్ని సంప్రదించండి' : '📞 Contact Support'),
                    'url'   => 'contact.html'
                ]
            ]
        ];
    }

    private static function getProblemSummary(string $category, string $lang = 'en'): string {
        $summaries = [
            'WATER'              => ['en' => 'Drinking water supply disruption', 'te' => 'తాగునీటి సరఫరా అంతరాయం'],
            'DRAINAGE'           => ['en' => 'Drainage blockage or sewage overflow', 'te' => 'డ్రైనేజీ అడ్డంకి లేదా మురుగు పొంగిపొర్లడం'],
            'RAINWATER'          => ['en' => 'Rainwater collection or path issue', 'te' => 'వర్షపు నీటి ప్రవాహ సమస్య'],
            'WATERLOGGING'       => ['en' => 'Road waterlogging or stagnant water', 'te' => 'రోడ్డుపై వర్షపు నీరు నిలవడం'],
            'PIPELINE'           => ['en' => 'Water pipeline leakage or burst', 'te' => 'వాటర్ పైపు లీకేజీ లేదా పగలడం'],
            'PUBLIC_TAP'         => ['en' => 'Public tap / standpost damage', 'te' => 'పబ్లిక్ ట్యాప్ దెబ్బతినడం'],
            'RAINWATER_OPENING'  => ['en' => 'Rainwater drip opening concern', 'te' => 'వర్షపు నీటి డ్రిప్ ఓపెనింగ్ సమస్య'],
            'RAINWATER_BLOCKAGE' => ['en' => 'Blocked rainwater opening/grate', 'te' => 'వర్షపు నీటి రంధ్రం మూసుకుపోవడం'],
            'RAINWATER_DAMAGE'   => ['en' => 'Damaged rainwater drainage channel', 'te' => 'వర్షపు కాలువ నిర్మాణం దెబ్బతినడం'],
            'OTHER'              => ['en' => 'General civic concern', 'te' => 'సాధారణ పౌర సమస్య']
        ];

        return $summaries[$category][$lang] ?? 'Civic infrastructure problem';
    }

    private static function tokenize(string $text): array {
        $clean = preg_replace('/[^\p{L}\p{N}\s]/u', '', mb_strtolower($text));
        $words = preg_split('/\s+/u', (string)$clean, -1, PREG_SPLIT_NO_EMPTY);
        return !empty($words) ? array_unique($words) : [];
    }

    private static function calculateJaccardSimilarity(array $setA, array $setB): float {
        if (empty($setA) || empty($setB)) return 0.0;
        $intersection = count(array_intersect($setA, $setB));
        $union = count(array_unique(array_merge($setA, $setB)));
        return $union > 0 ? ($intersection / $union) : 0.0;
    }

    private static function callExternalAi(string $prompt, string $lang = 'en'): ?string {
        $provider = strtolower((string)env('AI_PROVIDER', 'none'));
        $apiKey = trim((string)env('AI_API_KEY', ''));

        if ($provider === 'gemini' && !empty($apiKey)) {
            $model = env('AI_MODEL', 'gemini-1.5-flash');
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);

            $systemPrompt = "You are ASR Water Assistant (Jala Mitra), an AI assistant for ASR Water & Drainage portal in Alluri Sitharama Raju District, Andhra Pradesh. Help citizens with drinking water, drainage, and rainwater issues. You are NOT an official government authority. Always be polite and concise. Respond in " . ($lang === 'te' ? "Telugu" : "English") . ".";

            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $systemPrompt . "\nUser: " . $prompt]
                        ]
                    ]
                ]
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 6);

            $res = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200 && $res) {
                $data = json_decode($res, true);
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            }
        }

        return null;
    }
}
