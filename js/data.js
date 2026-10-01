/**
 * ASR Water & Drainage - Seed Data & Location Catalog
 * Alluri Sitharama Raju District, Andhra Pradesh
 */

const ASR_INITIAL_DATA = {
  // District Metadata
  district: {
    name: 'Alluri Sitharama Raju',
    state: 'Andhra Pradesh',
    centerLat: 18.0827,
    centerLng: 82.6635,
    zoom: 9
  },

  // Dynamic Mandals and Localities Hierarchy
  locations: [
    {
      id: 'loc_paderu',
      name: 'Paderu',
      name_te: 'పాడేరు',
      type: 'mandal',
      lat: 18.0827,
      lng: 82.6635,
      active: true,
      localities: [
        { id: 'loc_pad_main', name: 'Paderu Main Road', name_te: 'పాడేరు మెయిన్ రోడ్డు', lat: 18.0835, lng: 82.6642 },
        { id: 'loc_pad_talari', name: 'Talari Singi', name_te: 'తలారి సింగి', lat: 18.0750, lng: 82.6580 },
        { id: 'loc_pad_bus', name: 'RTC Bus Complex Area', name_te: 'ఆర్టీసీ బస్ కాంప్లెక్స్ ప్రాంతం', lat: 18.0860, lng: 82.6680 },
        { id: 'loc_pad_modapalli', name: 'Modapalli Colony', name_te: 'మోదపల్లి కాలనీ', lat: 18.0920, lng: 82.6600 }
      ]
    },
    {
      id: 'loc_araku',
      name: 'Araku Valley',
      name_te: 'అరకు లోయ',
      type: 'mandal',
      lat: 18.3333,
      lng: 82.8833,
      active: true,
      localities: [
        { id: 'loc_ark_padmapuram', name: 'Padmapuram Gardens Area', name_te: 'పద్మాపురం గార్డెన్స్ ప్రాంతం', lat: 18.3350, lng: 82.8810 },
        { id: 'loc_ark_station', name: 'Railway Station Road', name_te: 'రైల్వే స్టేషన్ రోడ్డు', lat: 18.3300, lng: 82.8870 },
        { id: 'loc_ark_tribal', name: 'Tribal Museum Colony', name_te: 'ట్రైబల్ మ్యూజియం కాలనీ', lat: 18.3360, lng: 82.8850 }
      ]
    },
    {
      id: 'loc_chintapalle',
      name: 'Chintapalle',
      name_te: 'చింతపల్లి',
      type: 'mandal',
      lat: 17.8719,
      lng: 82.3524,
      active: true,
      localities: [
        { id: 'loc_chp_market', name: 'Weekly Market Road', name_te: 'సంత వీధి', lat: 17.8730, lng: 82.3540 },
        { id: 'loc_chp_lamba', name: 'Lambasingi Junction', name_te: 'లంబసింగి జంక్షన్', lat: 17.8920, lng: 82.3850 },
        { id: 'loc_chp_kothuru', name: 'Kothuru Village', name_te: 'కొత్తూరు గ్రామం', lat: 17.8680, lng: 82.3480 }
      ]
    },
    {
      id: 'loc_ananthagiri',
      name: 'Ananthagiri',
      name_te: 'అనంతగిరి',
      type: 'mandal',
      lat: 18.2389,
      lng: 83.0089,
      active: true,
      localities: [
        { id: 'loc_ant_coffee', name: 'Coffee Estate Road', name_te: 'కాఫీ తోటల రోడ్డు', lat: 18.2410, lng: 83.0110 },
        { id: 'loc_ant_junction', name: 'Ananthagiri Ghat Junction', name_te: 'అనంతగిరి ఘాట్ జంక్షన్', lat: 18.2360, lng: 83.0050 }
      ]
    },
    {
      id: 'loc_dumbriguda',
      name: 'Dumbriguda',
      name_te: 'డుంబ్రిగుడ',
      type: 'mandal',
      lat: 18.2780,
      lng: 82.7820,
      active: true,
      localities: [
        { id: 'loc_dmb_panchayat', name: 'Panchayat Center', name_te: 'పంచాయతీ కేంద్రం', lat: 18.2790, lng: 82.7830 },
        { id: 'loc_dmb_kura', name: 'Kura Village', name_te: 'కురా గ్రామం', lat: 18.2750, lng: 82.7780 }
      ]
    },
    {
      id: 'loc_g_madugula',
      name: 'G. Madugula',
      name_te: 'జి. మాడుగుల',
      type: 'mandal',
      lat: 17.9820,
      lng: 82.5020,
      active: true,
      localities: [
        { id: 'loc_gmd_center', name: 'Madugula Main Bazaar', name_te: 'మాడుగుల మెయిన్ బజార్', lat: 17.9830, lng: 82.5030 }
      ]
    },
    {
      id: 'loc_gk_veedhi',
      name: 'G. K. Veedhi',
      name_te: 'గూడెం కొత్త వీధి',
      type: 'mandal',
      lat: 17.9250,
      lng: 82.1640,
      active: true,
      localities: [
        { id: 'loc_gkv_center', name: 'G.K. Veedhi Police Station Area', name_te: 'జి.కె. వీధి పోలీస్ స్టేషన్ ప్రాంతం', lat: 17.9260, lng: 82.1650 }
      ]
    },
    {
      id: 'loc_hukumpeta',
      name: 'Hukumpeta',
      name_te: 'హుకుంపేట',
      type: 'mandal',
      lat: 18.1560,
      lng: 82.7150,
      active: true,
      localities: [
        { id: 'loc_hkp_bazaar', name: 'Hukumpeta Weekly Market', name_te: 'హుకుంపేట వారపు సంత', lat: 18.1570, lng: 82.7160 }
      ]
    },
    {
      id: 'loc_koyyuru',
      name: 'Koyyuru',
      name_te: 'కొయ్యూరు',
      type: 'mandal',
      lat: 17.6540,
      lng: 82.2350,
      active: true,
      localities: [
        { id: 'loc_kyr_main', name: 'Koyyuru Junction', name_te: 'కొయ్యూరు జంక్షన్', lat: 17.6550, lng: 82.2360 }
      ]
    },
    {
      id: 'loc_munchingput',
      name: 'Munchingput',
      name_te: 'ముంచంగిపుట్టు',
      type: 'mandal',
      lat: 18.4200,
      lng: 82.5200,
      active: true,
      localities: [
        { id: 'loc_mnc_center', name: 'Munchingput Main Center', name_te: 'ముంచంగిపుట్టు మెయిన్ సెంటర్', lat: 18.4210, lng: 82.5210 }
      ]
    },
    {
      id: 'loc_pedabayalu',
      name: 'Pedabayalu',
      name_te: 'పెదబయలు',
      type: 'mandal',
      lat: 18.2800,
      lng: 82.5700,
      active: true,
      localities: [
        { id: 'loc_pdb_center', name: 'Pedabayalu Colony', name_te: 'పెదబయలు కాలనీ', lat: 18.2810, lng: 82.5710 }
      ]
    },
    {
      id: 'loc_rampachodavaram',
      name: 'Rampachodavaram',
      name_te: 'రంపచోడవరం',
      type: 'mandal',
      lat: 17.4470,
      lng: 81.7770,
      active: true,
      localities: [
        { id: 'loc_rpc_main', name: 'Rampachodavaram Town', name_te: 'రంపచోడవరం టౌన్', lat: 17.4480, lng: 81.7780 }
      ]
    },
    {
      id: 'loc_maredumilli',
      name: 'Maredumilli',
      name_te: 'మారేడుమిల్లి',
      type: 'mandal',
      lat: 17.6000,
      lng: 81.7100,
      active: true,
      localities: [
        { id: 'loc_mrd_eco', name: 'Eco-Tourism Center', name_te: 'ఎకో టూరిజం సెంటర్', lat: 17.6010, lng: 81.7110 }
      ]
    }
  ],

  // Problem Categories
  categories: [
    // Water Categories
    { id: 'no_water', type: 'water', name: 'No Water Supply', name_te: 'నీటి సరఫరా లేదు', icon: '🚰', desc: 'No tap or borewell water' },
    { id: 'irregular_water', type: 'water', name: 'Irregular Water Supply', name_te: 'సక్రమంగా నీరు రాకపోవడం', icon: '⏱️', desc: 'Erratic or low supply hours' },
    { id: 'water_leakage', type: 'water', name: 'Water Leakage', name_te: 'నీరు లీకేజీ', icon: '💧', desc: 'Pipeline or valve leaking water' },
    { id: 'pipeline_damage', type: 'water', name: 'Pipeline Damage', name_te: 'పైప్‌లైన్ డ్యామేజ్', icon: '🔧', desc: 'Broken main or distribution line' },
    { id: 'infra_damage', type: 'water', name: 'Water Infrastructure Damage', name_te: 'నీటి వసతుల నష్టం', icon: '🏗️', desc: 'Broken hand pump, motor, overhead tank' },
    { id: 'water_quality', type: 'water', name: 'Water Quality Concern', name_te: 'కలుషిత నీరు / నాణ్యత సమస్య', icon: '🧪', desc: 'Muddy, colored, or bad odor water' },
    { id: 'other_water', type: 'water', name: 'Other Water Problem', name_te: 'ఇతర నీటి సమస్య', icon: '🌊', desc: 'General drinking water problem' },

    // Drainage Categories
    { id: 'blocked_drain', type: 'drainage', name: 'Blocked Drain', name_te: 'డ్రైనేజీ పూడిక / మూసుకుపోవడం', icon: '🚧', desc: 'Silt, garbage, or plastics block drain' },
    { id: 'drain_overflow', type: 'drainage', name: 'Drainage Overflow', name_te: 'డ్రైనేజీ పొంగిపొర్లడం', icon: '⚠️', desc: 'Drain water spilling onto roads' },
    { id: 'stagnant_water', type: 'drainage', name: 'Stagnant Water', name_te: 'నిలిచిన మురుగునీరు', icon: '🦟', desc: 'Standing wastewater breeding insects' },
    { id: 'sewage_wastewater', type: 'drainage', name: 'Sewage / Wastewater', name_te: 'మురుగునీరు / వ్యర్థాలు', icon: '☣️', desc: 'Hazardous wastewater line leak' },
    { id: 'damaged_drain', type: 'drainage', name: 'Damaged Drain', name_te: 'డ్రైన్ కాలువ దెబ్బతినడం', icon: '🧱', desc: 'Broken concrete drain side wall' },
    { id: 'drain_flooding', type: 'drainage', name: 'Drainage Flooding', name_te: 'డ్రైనేజీ వరద / నీరు చేరడం', icon: '🌧️', desc: 'Roads submerged due to blocked drainage' },
    { id: 'other_drainage', type: 'drainage', name: 'Other Sanitation Problem', name_te: 'ఇతర పారిశుధ్య సమస్య', icon: '🧹', desc: 'General sanitation or wastewater issue' }
  ],

  // Organizations / Departments
  organizations: [
    { id: 'org_rwss', name: 'Rural Water Supply & Sanitation (RWSS)', type: 'Water Supply', contact: 'rwss-asr@civic.internal', active: true },
    { id: 'org_drain', name: 'Panchayat Sanitation & Drainage Wing', type: 'Sanitation', contact: 'drain-clean-asr@civic.internal', active: true },
    { id: 'org_pred', name: 'Panchayat Raj Engineering Division (PRED)', type: 'Infrastructure', contact: 'pred-asr@civic.internal', active: true },
    { id: 'org_mun', name: 'Tribal Welfare Infrastructure Cell', type: 'Civic Works', contact: 'twic-asr@civic.internal', active: true }
  ],

  // Initial Demo Complaints (Clearly identified with DEMO stamp for testing & realism)
  demoComplaints: [
    {
      id: 'c_001',
      complaint_id: 'ASR-WD-2026-000001',
      created_at: '2026-09-24T10:15:00Z',
      updated_at: '2026-09-28T14:30:00Z',
      mandal_id: 'loc_paderu',
      mandal_name: 'Paderu',
      locality_id: 'loc_pad_main',
      locality_name: 'Paderu Main Road',
      landmark: 'Near Old Bus Stand Colony, Pillar 14',
      lat: 18.0835,
      lng: 82.6642,
      category_id: 'water_leakage',
      category_name: 'Water Leakage',
      category_type: 'water',
      description: 'Major drinking water pipeline broken near junction. Clean water leaking constantly across the road for past 3 days.',
      citizen_name: 'K. Ramana',
      citizen_phone: '9848011223',
      citizen_severity: 'High',
      system_priority: 'High',
      status: 'In Progress',
      verification_level: 'Administrator Reviewed',
      assigned_org_id: 'org_rwss',
      assigned_org_name: 'Rural Water Supply & Sanitation (RWSS)',
      photo_url: '',
      ai_category: 'Water Leakage',
      ai_priority: 'High',
      public_notes: 'Pipeline inspection team visited on Sept 27. Replacement valves dispatched.',
      internal_notes: 'Crew scheduled with 3-inch PVC coupler.',
      timeline: [
        { status: 'Submitted', timestamp: '2026-09-24 10:15', note: 'Report submitted by citizen via portal.' },
        { status: 'Under Review', timestamp: '2026-09-25 09:30', note: 'Reviewed by District Admin desk.' },
        { status: 'Assigned', timestamp: '2026-09-26 11:00', note: 'Assigned to Rural Water Supply & Sanitation (RWSS).' },
        { status: 'In Progress', timestamp: '2026-09-27 14:00', note: 'Maintenance crew on site measuring pipe repair.' }
      ]
    },
    {
      id: 'c_002',
      complaint_id: 'ASR-WD-2026-000002',
      created_at: '2026-09-25T14:20:00Z',
      updated_at: '2026-09-28T16:00:00Z',
      mandal_id: 'loc_araku',
      mandal_name: 'Araku Valley',
      locality_id: 'loc_ark_station',
      locality_name: 'Railway Station Road',
      landmark: 'Opposite Community Hall',
      lat: 18.3300,
      lng: 82.8870,
      category_id: 'drain_overflow',
      category_name: 'Drainage Overflow',
      category_type: 'drainage',
      description: 'Stormwater drain is blocked with plastic waste and mud. Wastewater overflowing onto pedestrian pathway creating foul smell.',
      citizen_name: 'M. Sridevi',
      citizen_phone: '9440123456',
      citizen_severity: 'High',
      system_priority: 'High',
      status: 'Resolved',
      verification_level: 'Verified/Official',
      assigned_org_id: 'org_drain',
      assigned_org_name: 'Panchayat Sanitation & Drainage Wing',
      photo_url: '',
      ai_category: 'Drainage Overflow',
      ai_priority: 'High',
      public_notes: 'Drain cleared of plastic silt, flow restored by sanitation crew. Verified on-site.',
      internal_notes: 'De-silting completed with suction tanker.',
      timeline: [
        { status: 'Submitted', timestamp: '2026-09-25 14:20', note: 'Report submitted with photo evidence.' },
        { status: 'Under Review', timestamp: '2026-09-26 09:00', note: 'Admin verified locality.' },
        { status: 'Assigned', timestamp: '2026-09-26 10:30', note: 'Forwarded to Araku Sanitation Wing.' },
        { status: 'In Progress', timestamp: '2026-09-27 08:30', note: 'Sanitation workers initiated de-silting.' },
        { status: 'Resolved', timestamp: '2026-09-28 16:00', note: 'De-silting complete. Resolution officially recorded by admin.' }
      ]
    },
    {
      id: 'c_003',
      complaint_id: 'ASR-WD-2026-000003',
      created_at: '2026-09-27T08:45:00Z',
      updated_at: '2026-09-27T08:45:00Z',
      mandal_id: 'loc_chintapalle',
      mandal_name: 'Chintapalle',
      locality_id: 'loc_chp_lamba',
      locality_name: 'Lambasingi Junction',
      landmark: 'Near Government High School',
      lat: 17.8920,
      lng: 82.3850,
      category_id: 'no_water',
      category_name: 'No Water Supply',
      category_type: 'water',
      description: 'Overhead tank pump burnt out. No drinking water in school and surrounding 40 households since Tuesday.',
      citizen_name: 'P. Somaraju',
      citizen_phone: '9988776655',
      citizen_severity: 'Emergency',
      system_priority: 'Emergency',
      status: 'Submitted',
      verification_level: 'Citizen Reported',
      assigned_org_id: '',
      assigned_org_name: 'Unassigned',
      photo_url: '',
      ai_category: 'No Water Supply',
      ai_priority: 'Emergency',
      public_notes: 'Received into platform queue. Awaiting administrative review.',
      internal_notes: '',
      timeline: [
        { status: 'Submitted', timestamp: '2026-09-27 08:45', note: 'Emergency report logged by citizen.' }
      ]
    },
    {
      id: 'c_004',
      complaint_id: 'ASR-WD-2026-000004',
      created_at: '2026-09-27T16:10:00Z',
      updated_at: '2026-09-28T10:00:00Z',
      mandal_id: 'loc_ananthagiri',
      mandal_name: 'Ananthagiri',
      locality_id: 'loc_ant_coffee',
      locality_name: 'Coffee Estate Road',
      landmark: 'Near Stream Culvert',
      lat: 18.2410,
      lng: 83.0110,
      category_id: 'blocked_drain',
      category_name: 'Blocked Drain',
      category_type: 'drainage',
      description: 'Culvert slab collapsed causing roadside drainage to choke. Water backing up toward farm houses.',
      citizen_name: 'B. Appanna',
      citizen_phone: '9123456789',
      citizen_severity: 'Medium',
      system_priority: 'Medium',
      status: 'Under Review',
      verification_level: 'Citizen Reported',
      assigned_org_id: '',
      assigned_org_name: 'Under Review',
      photo_url: '',
      ai_category: 'Blocked Drain',
      ai_priority: 'Medium',
      public_notes: 'Admin team validating road culvert jurisdiction.',
      internal_notes: 'Checking if PRED or R&B division.',
      timeline: [
        { status: 'Submitted', timestamp: '2026-09-27 16:10', note: 'Report submitted by citizen.' },
        { status: 'Under Review', timestamp: '2026-09-28 10:00', note: 'Engineering division tagged for culvert inspection.' }
      ]
    },
    {
      id: 'c_005',
      complaint_id: 'ASR-WD-2026-000005',
      created_at: '2026-09-28T09:05:00Z',
      updated_at: '2026-09-28T11:30:00Z',
      mandal_id: 'loc_paderu',
      mandal_name: 'Paderu',
      locality_id: 'loc_pad_talari',
      locality_name: 'Talari Singi',
      landmark: 'Near Borewell Well Point',
      lat: 18.0750,
      lng: 82.6580,
      category_id: 'water_quality',
      category_name: 'Water Quality Concern',
      category_type: 'water',
      description: 'Tap water coming with reddish mud color and slight sulfur smell. Not suitable for drinking or cooking.',
      citizen_name: 'V. Lakshmi',
      citizen_phone: '9849123890',
      citizen_severity: 'High',
      system_priority: 'High',
      status: 'Assigned',
      verification_level: 'Administrator Reviewed',
      assigned_org_id: 'org_rwss',
      assigned_org_name: 'Rural Water Supply & Sanitation (RWSS)',
      photo_url: '',
      ai_category: 'Water Quality Concern',
      ai_priority: 'High',
      public_notes: 'Water quality lab technician instructed to collect water samples.',
      internal_notes: 'Sample kit #RWSS-302 assigned.',
      timeline: [
        { status: 'Submitted', timestamp: '2026-09-28 09:05', note: 'Report logged by resident.' },
        { status: 'Assigned', timestamp: '2026-09-28 11:30', note: 'Assigned to RWSS water testing wing.' }
      ]
    }
  ]
};
