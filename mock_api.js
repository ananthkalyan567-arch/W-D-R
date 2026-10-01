/**
 * ASR Water & Drainage - Mock REST API Engine for Local Node.js Dev Server
 * Full REST API parity with the PHP backend at /api/v1/
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// In-Memory Database initialized with seed data matching schema.sql & seed.sql
const DB = {
  users: [
    {
      id: 1,
      name: 'ASR Super Administrator',
      email: 'superadmin@asr.civic',
      phone: '9848011111',
      password_hash: hashPassword('admin123'),
      role: 'super_admin',
      status: 'active',
      preferred_language: 'en',
      created_at: '2026-09-01 08:00:00'
    },
    {
      id: 2,
      name: 'Paderu District Officer',
      email: 'admin@asr.civic',
      phone: '9848022222',
      password_hash: hashPassword('admin123'),
      role: 'admin',
      status: 'active',
      preferred_language: 'en',
      created_at: '2026-09-01 08:30:00'
    },
    {
      id: 3,
      name: 'RWSS Division Lead',
      email: 'rwss.lead@asr.civic',
      phone: '9848033333',
      password_hash: hashPassword('admin123'),
      role: 'organization_admin',
      status: 'active',
      preferred_language: 'en',
      created_at: '2026-09-01 09:00:00'
    },
    {
      id: 4,
      name: 'K. Ramana (Demo Resident)',
      email: 'citizen@asr.civic',
      phone: '9848044444',
      password_hash: hashPassword('admin123'),
      role: 'citizen',
      status: 'active',
      preferred_language: 'te',
      created_at: '2026-09-01 10:00:00'
    }
  ],

  sessions: {}, // token -> user

  locations: [
    { id: 1, name: 'Alluri Sitharama Raju District', name_te: 'అల్లూరి సీతారామరాజు జిల్లా', parent_id: null, location_type: 'district', latitude: 18.0827, longitude: 82.6635, status: 'active' },
    { id: 2, name: 'Paderu', name_te: 'పాడేరు', parent_id: 1, location_type: 'mandal', latitude: 18.0827, longitude: 82.6635, status: 'active' },
    { id: 3, name: 'Araku Valley', name_te: 'అరకు లోయ', parent_id: 1, location_type: 'mandal', latitude: 18.3333, longitude: 82.8833, status: 'active' },
    { id: 4, name: 'Chintapalle', name_te: 'చింతపల్లి', parent_id: 1, location_type: 'mandal', latitude: 17.8719, longitude: 82.3524, status: 'active' },
    { id: 5, name: 'Ananthagiri', name_te: 'అనంతగిరి', parent_id: 1, location_type: 'mandal', latitude: 18.2389, longitude: 83.0089, status: 'active' },
    { id: 6, name: 'Dumbriguda', name_te: 'డుంబ్రిగుడ', parent_id: 1, location_type: 'mandal', latitude: 18.2780, longitude: 82.7820, status: 'active' },
    { id: 7, name: 'G. Madugula', name_te: 'జి. మాడుగుల', parent_id: 1, location_type: 'mandal', latitude: 17.9820, longitude: 82.5020, status: 'active' },
    { id: 8, name: 'G. K. Veedhi', name_te: 'గూడెం కొత్త వీధి', parent_id: 1, location_type: 'mandal', latitude: 17.9250, longitude: 82.1640, status: 'active' },
    { id: 9, name: 'Hukumpeta', name_te: 'హుకుంపేట', parent_id: 1, location_type: 'mandal', latitude: 18.1560, longitude: 82.7150, status: 'active' },
    { id: 10, name: 'Koyyuru', name_te: 'కొయ్యూరు', parent_id: 1, location_type: 'mandal', latitude: 17.6540, longitude: 82.2350, status: 'active' },
    { id: 11, name: 'Munchingput', name_te: 'ముంచంగిపుట్టు', parent_id: 1, location_type: 'mandal', latitude: 18.4200, longitude: 82.5200, status: 'active' },
    { id: 12, name: 'Pedabayalu', name_te: 'పెదబయలు', parent_id: 1, location_type: 'mandal', latitude: 18.2800, longitude: 82.5700, status: 'active' },
    { id: 101, name: 'Paderu Main Road', name_te: 'పాడేరు మెయిన్ రోడ్డు', parent_id: 2, location_type: 'locality', latitude: 18.0835, longitude: 82.6642, status: 'active' },
    { id: 102, name: 'Talari Singi', name_te: 'తలారి సింగి', parent_id: 2, location_type: 'locality', latitude: 18.0750, longitude: 82.6580, status: 'active' },
    { id: 103, name: 'RTC Bus Complex Area', name_te: 'ఆర్టీసీ బస్ కాంప్లెక్స్ ప్రాంతం', parent_id: 2, location_type: 'locality', latitude: 18.0860, longitude: 82.6680, status: 'active' },
    { id: 104, name: 'Railway Station Road', name_te: 'రైల్వే స్టేషన్ రోడ్డు', parent_id: 3, location_type: 'locality', latitude: 18.3300, longitude: 82.8870, status: 'active' },
    { id: 105, name: 'Padmapuram Gardens Area', name_te: 'పద్మాపురం గార్డెన్స్ ప్రాంతం', parent_id: 3, location_type: 'locality', latitude: 18.3350, longitude: 82.8810, status: 'active' },
    { id: 106, name: 'Lambasingi Junction', name_te: 'లంబసింగి జంక్షన్', parent_id: 4, location_type: 'locality', latitude: 17.8920, longitude: 82.3850, status: 'active' }
  ],

  categories: [
    { id: 1, name: 'No Water Supply', name_te: 'నీటి సరఫరా లేదు', type: 'water', description: 'Complete interruption of tap or borewell water supply', status: 'active' },
    { id: 2, name: 'Irregular Water Supply', name_te: 'సక్రమంగా నీరు రాకపోవడం', type: 'water', description: 'Erratic hours, insufficient delivery quantity', status: 'active' },
    { id: 3, name: 'Water Leakage', name_te: 'నీరు లీకేజీ', type: 'water', description: 'Burst distribution pipes or leaking main line', status: 'active' },
    { id: 4, name: 'Pipeline Damage', name_te: 'పైప్‌లైన్ డ్యామేజ్', type: 'water', description: 'Broken distribution pipes or construction breaks', status: 'active' },
    { id: 5, name: 'Water Infrastructure Damage', name_te: 'నీటి వసతుల నష్టం', type: 'water', description: 'Damaged motor, broken hand pump or reservoir', status: 'active' },
    { id: 6, name: 'Water Quality Concern', name_te: 'కలుషిత నీరు / నాణ్యత సమస్య', type: 'water', description: 'Muddy, colored, foul odor, or contaminated supply', status: 'active' },
    { id: 7, name: 'Other Water Problem', name_te: 'ఇతర నీటి సమస్య', type: 'water', description: 'Any other drinking water supply issue', status: 'active' },
    { id: 8, name: 'Blocked Drain', name_te: 'డ్రైనేజీ పూడిక / మూసుకుపోవడం', type: 'drainage', description: 'Silt, garbage, or solid waste choking drainage', status: 'active' },
    { id: 9, name: 'Drainage Overflow', name_te: 'డ్రైనేజీ పొంగిపొర్లడం', type: 'drainage', description: 'Wastewater flooding public roads and pedestrian paths', status: 'active' },
    { id: 10, name: 'Stagnant Water', name_te: 'నిలిచిన మురుగునీరు', type: 'drainage', description: 'Standing stagnant wastewater breeding vectors', status: 'active' },
    { id: 11, name: 'Sewage / Wastewater', name_te: 'మురుగునీరు / వ్యర్థాలు', type: 'drainage', description: 'Broken septic sewer or dangerous effluent leaks', status: 'active' },
    { id: 12, name: 'Damaged Drain', name_te: 'డ్రైన్ కాలువ దెబ్బతినడం', type: 'drainage', description: 'Broken concrete slabs, collapsed retaining channels', status: 'active' },
    { id: 13, name: 'Drainage Flooding', name_te: 'డ్రైనేజీ వరద / నీరు చేరడం', type: 'drainage', description: 'Inadequate drainage causing residential waterlogging', status: 'active' },
    { id: 14, name: 'Other Sanitation Problem', name_te: 'ఇతర పారిశుధ్య సమస్య', type: 'drainage', description: 'General public drainage or sanitation concern', status: 'active' },
    { id: 15, name: 'Drip / Drainage Opening Not Available', name_te: 'వర్షపు నీటి డ్రిప్ / నీటి పారుదల మార్గం అందుబాటులో లేదు', type: 'rainwater', description: 'Location lacks suitable rainwater drip/drainage opening', status: 'active' },
    { id: 16, name: 'Rainwater Opening Blocked', name_te: 'వర్షపు నీటి మార్గం మూసుకుపోయింది', type: 'rainwater', description: 'Silt, garbage, or debris blocking rainwater inlet', status: 'active' },
    { id: 17, name: 'Rainwater Opening Damaged', name_te: 'వర్షపు నీటి మార్గం దెబ్బతింది', type: 'rainwater', description: 'Broken grating, collapsed curb, or broken drip pipe', status: 'active' },
    { id: 18, name: 'Rainwater Overflow', name_te: 'వర్షపు నీరు పొంగిపొర్లడం', type: 'rainwater', description: 'Rain runoff overflowing street edges or pathways', status: 'active' },
    { id: 19, name: 'Waterlogging', name_te: 'నీరు నిలవడం / వాటర్‌లాగింగ్', type: 'rainwater', description: 'Excessive standing rainwater causing civic disruption', status: 'active' },
    { id: 20, name: 'Rainwater Path Blocked', name_te: 'వర్షపు నీటి దారి మూసుకుపోయింది', type: 'rainwater', description: 'Natural or built rainwater drainage path obstructed', status: 'active' },
    { id: 21, name: 'Rainwater Collection Problem', name_te: 'వర్షపు నీటి సేకరణ సమస్య', type: 'rainwater', description: 'Problem with rainwater harvesting/collection structure', status: 'active' },
    { id: 22, name: 'Drainage Connection Problem', name_te: 'డ్రైనేజీ అనుసంధాన సమస్య', type: 'rainwater', description: 'Rainwater drip not properly connected to storm drain', status: 'active' },
    { id: 23, name: 'Other Rainwater Issue', name_te: 'ఇతర వర్షపు నీటి సమస్య', type: 'rainwater', description: 'General rainwater drainage or runoff concern', status: 'active' }
  ],

  organizations: [
    { id: 1, name: 'Rural Water Supply & Sanitation (RWSS)', description: 'Water supply maintenance division for ASR District', organization_type: 'Water Engineering', contact_email: 'rwss-asr@civic.internal', contact_phone: '0893522201', status: 'active' },
    { id: 2, name: 'Panchayat Sanitation & Drainage Wing', description: 'Sanitation, desilting, and drainage clearing team', organization_type: 'Sanitation Works', contact_email: 'drainage-paderu@civic.internal', contact_phone: '0893522202', status: 'active' },
    { id: 3, name: 'Panchayat Raj Engineering Division (PRED)', description: 'Culvert, roadside drainage, and civil infrastructure cell', organization_type: 'Civil Works', contact_email: 'pred-asr@civic.internal', contact_phone: '0893522203', status: 'active' }
  ],

  complaints: [
    {
      id: 1,
      complaint_number: 'ASR-WD-000001',
      user_id: 4,
      location_id: 2,
      category_id: 3,
      title: 'Water Leakage at Paderu Main Road',
      description: 'Major drinking water pipeline broken near junction. Clean water leaking constantly across the road for past 3 days.',
      landmark: 'Near Old Bus Stand Colony, Pillar 14',
      latitude: 18.0835,
      longitude: 82.6642,
      citizen_severity: 'high',
      system_priority: 'high',
      status: 'in_progress',
      assigned_organization_id: 1,
      assigned_user_id: 3,
      public_notes: 'Inspection team dispatched on site. Replacement coupler fitted.',
      created_at: '2026-09-27 10:15:00',
      updated_at: '2026-09-28 14:20:00'
    },
    {
      id: 2,
      complaint_number: 'ASR-WD-000002',
      user_id: 4,
      location_id: 3,
      category_id: 9,
      title: 'Drain Overflow at Station Road',
      description: 'Stormwater drain is blocked with plastic waste and mud. Wastewater overflowing onto pedestrian pathway creating foul smell.',
      landmark: 'Opposite Community Hall',
      latitude: 18.3300,
      longitude: 82.8870,
      citizen_severity: 'high',
      system_priority: 'high',
      status: 'resolved',
      assigned_organization_id: 2,
      assigned_user_id: null,
      resolution_notes: 'Drain cleared of plastic silt, flow restored by sanitation crew. Verified on-site.',
      resolved_at: '2026-09-28 17:00:00',
      created_at: '2026-09-26 09:30:00',
      updated_at: '2026-09-28 17:00:00'
    },
    {
      id: 3,
      complaint_number: 'ASR-WD-000003',
      user_id: 4,
      location_id: 4,
      category_id: 1,
      title: 'No Water Supply in Lambasingi',
      description: 'Overhead tank pump burnt out. No drinking water in school and surrounding 40 households since Tuesday.',
      landmark: 'Near Government High School',
      latitude: 17.8920,
      longitude: 82.3850,
      citizen_severity: 'critical',
      system_priority: 'critical',
      status: 'submitted',
      assigned_organization_id: null,
      assigned_user_id: null,
      created_at: '2026-09-29 08:45:00',
      updated_at: '2026-09-29 08:45:00'
    },
    {
      id: 4,
      complaint_number: 'ASR-RW-000001',
      user_id: 4,
      location_id: 2,
      category_id: 15,
      title: 'Rainwater Drip/Drainage Opening Not Available',
      description: 'Rainwater drip/drainage opening is not available at this location near market road.',
      landmark: 'Near Weekly Shandy Ground',
      latitude: 18.0840,
      longitude: 82.6650,
      citizen_severity: 'high',
      system_priority: 'high',
      status: 'submitted',
      assigned_organization_id: null,
      assigned_user_id: null,
      created_at: '2026-09-29 09:15:00',
      updated_at: '2026-09-29 09:15:00'
    }
  ],

  rainwater_reports: [
    {
      id: 1,
      report_number: 'ASR-RW-REP-000001',
      complaint_id: 4,
      user_id: 4,
      location_id: 2,
      report_type: 'opening_not_available',
      availability_status: 'not_available',
      condition_status: 'unknown',
      verification_status: 'pending',
      description: 'Rainwater drip/drainage opening is not available at this location near market road.',
      landmark: 'Near Weekly Shandy Ground',
      latitude: 18.0840,
      longitude: 82.6650,
      photo_path: null,
      citizen_severity: 'high',
      admin_priority: 'high',
      verified_by: null,
      verified_at: null,
      verification_notes: null,
      created_at: '2026-09-29 09:15:00',
      updated_at: '2026-09-29 09:15:00'
    },
    {
      id: 2,
      report_number: 'ASR-RW-REP-000002',
      complaint_id: null,
      user_id: 4,
      location_id: 2,
      report_type: 'opening_available',
      availability_status: 'available',
      condition_status: 'good',
      verification_status: 'verified',
      description: 'RCC drip opening installed properly along concrete road channel.',
      landmark: 'Opposite Community Library',
      latitude: 18.0820,
      longitude: 82.6630,
      photo_path: null,
      citizen_severity: 'low',
      admin_priority: 'low',
      verified_by: 2,
      verified_at: '2026-09-29 10:00:00',
      verification_notes: 'Inspected and certified clear water passage.',
      created_at: '2026-09-28 11:00:00',
      updated_at: '2026-09-29 10:00:00'
    },
    {
      id: 3,
      report_number: 'ASR-RW-REP-000003',
      complaint_id: null,
      user_id: 4,
      location_id: 3,
      report_type: 'opening_blocked',
      availability_status: 'available',
      condition_status: 'blocked',
      verification_status: 'pending',
      description: 'Silt and tree debris blocking rainwater culvert inlet.',
      landmark: 'Near Coffee Plantation turn',
      latitude: 18.3310,
      longitude: 82.8840,
      photo_path: null,
      citizen_severity: 'medium',
      admin_priority: 'medium',
      verified_by: null,
      verified_at: null,
      verification_notes: null,
      created_at: '2026-09-29 11:30:00',
      updated_at: '2026-09-29 11:30:00'
    }
  ],

  complaint_updates: [
    { id: 1, complaint_id: 1, user_id: 4, old_status: null, new_status: 'submitted', message: 'Complaint submitted by citizen.', is_public: true, created_at: '2026-09-27 10:15:00' },
    { id: 2, complaint_id: 1, user_id: 2, old_status: 'submitted', new_status: 'under_review', message: 'Reviewed by District Admin desk.', is_public: true, created_at: '2026-09-27 11:00:00' },
    { id: 3, complaint_id: 1, user_id: 2, old_status: 'under_review', new_status: 'assigned', message: 'Assigned to Rural Water Supply & Sanitation (RWSS).', is_public: true, created_at: '2026-09-27 14:00:00' },
    { id: 4, complaint_id: 1, user_id: 3, old_status: 'assigned', new_status: 'in_progress', message: 'Maintenance crew arrived on site with repair kit.', is_public: true, created_at: '2026-09-28 09:30:00' },
    { id: 5, complaint_id: 2, user_id: 4, old_status: null, new_status: 'submitted', message: 'Complaint logged with photo proof.', is_public: true, created_at: '2026-09-26 09:30:00' },
    { id: 6, complaint_id: 2, user_id: 2, old_status: 'in_progress', new_status: 'resolved', message: 'Culvert blockage cleared and water flow verified.', is_public: true, created_at: '2026-09-28 17:00:00' },
    { id: 7, complaint_id: 3, user_id: 4, old_status: null, new_status: 'submitted', message: 'Complaint registered by citizen.', is_public: true, created_at: '2026-09-29 08:45:00' },
    { id: 8, complaint_id: 4, user_id: 4, old_status: null, new_status: 'submitted', message: 'Rainwater problem registered (Opening Not Available). Generated tracking ID: ASR-RW-000001.', is_public: true, created_at: '2026-09-29 09:15:00' }
  ],

  assignments: [
    { id: 1, complaint_id: 1, organization_id: 1, assigned_user_id: 3, assigned_by: 2, notes: 'Emergency pipeline repair', status: 'active', assigned_at: '2026-09-27 14:00:00' }
  ],

  audit_logs: [
    { id: 1, user_id: 2, action: 'ASSIGN_COMPLAINT', entity_type: 'complaint', entity_id: 1, old_values: '{"status":"under_review"}', new_values: '{"status":"assigned","org":1}', ip_address: '127.0.0.1', created_at: '2026-09-27 14:00:00' },
    { id: 2, user_id: 4, action: 'RAINWATER_REPORT_CREATED', entity_type: 'rainwater_report', entity_id: 1, old_values: null, new_values: '{"report_number":"ASR-RW-REP-000001","complaint_id":4}', ip_address: '127.0.0.1', created_at: '2026-09-29 09:15:00' }
  ],

  notifications: [
    { id: 1, user_id: 4, complaint_id: 1, type: 'status_update', title: 'Complaint Assigned', message: 'Your complaint ASR-WD-000001 has been assigned to RWSS.', channel: 'in_app', status: 'unread', created_at: '2026-09-27 14:00:00' },
    { id: 2, user_id: 4, complaint_id: 4, type: 'COMPLAINT_SUBMITTED', title: 'Rainwater Problem Registered', message: 'Your rainwater complaint #ASR-RW-000001 has been logged and queued for administrative verification.', channel: 'in_app', status: 'unread', created_at: '2026-09-29 09:15:00' }
  ],

  ai_conversations: [
    { id: 1, session_id: 'session_demo_1', user_id: 4, language: 'en', title: 'There is no drinking water in our village', created_at: '2026-09-29 10:00:00' },
    { id: 2, session_id: 'session_demo_2', user_id: null, language: 'te', title: 'డ్రైనేజ్ నీళ్లు రోడ్డుపైకి వస్తున్నాయి', created_at: '2026-09-29 11:30:00' }
  ],

  ai_messages: [
    { id: 1, conversation_id: 1, sender: 'user', message: 'There is no drinking water in our village', category: 'WATER', created_at: '2026-09-29 10:00:00' },
    { id: 2, conversation_id: 1, sender: 'assistant', message: 'That sounds like a drinking water supply problem. I can help you report it.', category: 'WATER', suggested_priority: 'HIGH', created_at: '2026-09-29 10:00:02' },
    { id: 3, conversation_id: 2, sender: 'user', message: 'డ్రైనేజ్ నీళ్లు రోడ్డుపైకి వస్తున్నాయి', category: 'DRAINAGE', created_at: '2026-09-29 11:30:00' },
    { id: 4, conversation_id: 2, sender: 'assistant', message: 'ఇది డ్రైనేజీ ఓవర్‌ఫ్లో సమస్య కావచ్చు. లొకేషన్ మరియు ఫోటోతో నివేదించడంలో నేను సహాయపడగలను.', category: 'DRAINAGE', suggested_priority: 'HIGH', created_at: '2026-09-29 11:30:02' }
  ],

  ai_feedback: [
    { id: 1, message_id: 2, user_id: 4, rating: 'helpful', reason: null, comments: 'Guided me straight to the complaint form', created_at: '2026-09-29 10:05:00' },
    { id: 2, message_id: 4, user_id: null, rating: 'helpful', reason: null, comments: 'Good Telugu support', created_at: '2026-09-29 11:32:00' }
  ],

  ai_settings: {
    ai_assistant_enabled: true,
    telugu_support_enabled: true,
    ai_provider: 'none',
    ai_model: 'gemini-1.5-flash',
    fallback_mode_enabled: true
  }
};

let nextComplaintId = 5;
let nextRainwaterReportId = 4;
let nextUserId = 5;
let nextUpdateId = 9;
let nextAuditId = 3;
let nextAiConvId = 3;
let nextAiMsgId = 5;
let nextAiFeedbackId = 3;

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd + 'ASR_SECRET_SALT_2026').digest('hex');
}

function verifyPassword(pwd, hash) {
  return hashPassword(pwd) === hash;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });
  res.end(JSON.stringify(payload));
}

function parseAuthToken(req) {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

function getAuthUser(req) {
  const token = parseAuthToken(req);
  if (!token) return null;
  return DB.sessions[token] || null;
}

/**
 * Handle incoming API Request
 * Returns true if handled, false if not an /api/v1/ route
 */
function handleApiRequest(req, res) {
  const [pathname, queryString] = req.url.split('?');
  if (!pathname.startsWith('/api/v1/')) {
    return false;
  }

  // Parse Query Parameters
  const query = {};
  if (queryString) {
    const params = new URLSearchParams(queryString);
    for (const [key, val] of params.entries()) {
      query[key] = val;
    }
  }

  // Collect request body
  let bodyBuffer = '';
  req.on('data', chunk => { bodyBuffer += chunk; });
  req.on('end', () => {
    let body = {};
    if (bodyBuffer) {
      try {
        body = JSON.parse(bodyBuffer);
      } catch (e) {
        // May be form urlencoded or raw string
        body = {};
      }
    }

    try {
      routeApi(req, res, pathname, query, body);
    } catch (err) {
      console.error('[Mock API Error]:', err);
      sendJson(res, 500, {
        success: false,
        message: 'Internal server error: ' + err.message,
        error_code: 'INTERNAL_SERVER_ERROR'
      });
    }
  });

  return true;
}

function routeApi(req, res, path, query, body) {
  const method = req.method.toUpperCase();

  // --------------------------------------------------------------------------
  // AUTHENTICATION
  // --------------------------------------------------------------------------
  if (path === '/api/v1/auth/register' && method === 'POST') {
    if (!body.name || !body.email || !body.password) {
      return sendJson(res, 422, {
        success: false,
        message: 'Validation failed.',
        error_code: 'VALIDATION_FAILED',
        errors: { name: 'Name, email and password are required.' }
      });
    }
    const existing = DB.users.find(u => u.email.toLowerCase() === body.email.toLowerCase());
    if (existing) {
      return sendJson(res, 409, {
        success: false,
        message: 'Email address already registered.',
        error_code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    const newUser = {
      id: nextUserId++,
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone ? body.phone.trim() : null,
      password_hash: hashPassword(body.password),
      role: 'citizen',
      status: 'active',
      preferred_language: body.preferred_language || 'en',
      created_at: new Date().toISOString()
    };
    DB.users.push(newUser);

    const { password_hash, ...safeUser } = newUser;
    return sendJson(res, 201, {
      success: true,
      message: 'Registration successful. You may now log in.',
      data: { user: safeUser }
    });
  }

  if (path === '/api/v1/auth/login' && method === 'POST') {
    const { email, password } = body;
    if (!email || !password) {
      return sendJson(res, 422, {
        success: false,
        message: 'Email and password are required.',
        error_code: 'VALIDATION_FAILED'
      });
    }

    const user = DB.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user || !verifyPassword(password, user.password_hash)) {
      return sendJson(res, 401, {
        success: false,
        message: 'Invalid email address or password.',
        error_code: 'INVALID_CREDENTIALS'
      });
    }

    if (user.status !== 'active') {
      return sendJson(res, 403, {
        success: false,
        message: 'Your account is suspended or inactive.',
        error_code: 'ACCOUNT_SUSPENDED'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    DB.sessions[token] = user;

    const { password_hash, ...safeUser } = user;
    return sendJson(res, 200, {
      success: true,
      message: 'Login successful.',
      data: { token, user: safeUser }
    });
  }

  if (path === '/api/v1/auth/logout' && method === 'POST') {
    const token = parseAuthToken(req);
    if (token && DB.sessions[token]) {
      delete DB.sessions[token];
    }
    return sendJson(res, 200, { success: true, message: 'Logged out successfully.' });
  }

  if (path === '/api/v1/auth/me' && method === 'GET') {
    const user = getAuthUser(req);
    if (!user) {
      return sendJson(res, 401, {
        success: false,
        message: 'Unauthorized. Authentication token is missing or expired.',
        error_code: 'UNAUTHORIZED'
      });
    }
    const { password_hash, ...safeUser } = user;
    return sendJson(res, 200, { success: true, data: { user: safeUser } });
  }

  // --------------------------------------------------------------------------
  // LOCATIONS
  // --------------------------------------------------------------------------
  if (path === '/api/v1/locations' && method === 'GET') {
    let locs = DB.locations.filter(l => l.status === 'active');
    if (query.parent_id !== undefined) {
      const pid = query.parent_id === 'null' || query.parent_id === '' ? null : parseInt(query.parent_id);
      locs = locs.filter(l => l.parent_id === pid);
    }
    return sendJson(res, 200, { success: true, data: locs });
  }

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------
  if (path === '/api/v1/categories' && method === 'GET') {
    let cats = DB.categories.filter(c => c.status === 'active');
    if (query.type) {
      cats = cats.filter(c => c.type === query.type);
    }
    return sendJson(res, 200, { success: true, data: cats });
  }

  // --------------------------------------------------------------------------
  // ORGANIZATIONS
  // --------------------------------------------------------------------------
  if (path === '/api/v1/organizations' && method === 'GET') {
    return sendJson(res, 200, { success: true, data: DB.organizations.filter(o => o.status === 'active') });
  }

  // --------------------------------------------------------------------------
  // COMPLAINTS
  // --------------------------------------------------------------------------
  if (path === '/api/v1/complaints' && method === 'POST') {
    const user = getAuthUser(req);
    const { location_id, category_id, description, landmark, latitude, longitude, citizen_severity, title } = body;

    if (!location_id || !category_id || !description || description.trim().length < 10) {
      return sendJson(res, 422, {
        success: false,
        message: 'Validation failed. Location, category, and minimum 10 char description are required.',
        error_code: 'VALIDATION_FAILED'
      });
    }

    const complaintNum = 'ASR-WD-' + String(nextComplaintId).padStart(6, '0');
    const newComplaint = {
      id: nextComplaintId++,
      complaint_number: complaintNum,
      user_id: user ? user.id : 4,
      location_id: parseInt(location_id),
      category_id: parseInt(category_id),
      title: title || description.substring(0, 50).trim(),
      description: description.trim(),
      landmark: landmark ? landmark.trim() : null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      citizen_severity: citizen_severity || 'medium',
      system_priority: citizen_severity || 'medium',
      status: 'submitted',
      assigned_organization_id: null,
      assigned_user_id: null,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    DB.complaints.unshift(newComplaint);

    // Initial timeline update
    DB.complaint_updates.push({
      id: nextUpdateId++,
      complaint_id: newComplaint.id,
      user_id: user ? user.id : null,
      old_status: null,
      new_status: 'submitted',
      message: 'Complaint submitted by citizen.',
      is_public: true,
      created_at: newComplaint.created_at
    });

    return sendJson(res, 201, {
      success: true,
      message: 'Complaint submitted successfully.',
      data: { complaint: newComplaint }
    });
  }

  if (path === '/api/v1/complaints/track' && method === 'GET') {
    const num = (query.number || '').trim().toUpperCase();
    if (!num) {
      return sendJson(res, 400, { success: false, message: 'Complaint number required.', error_code: 'MISSING_PARAM' });
    }

    const complaint = DB.complaints.find(c => c.complaint_number.toUpperCase() === num);
    if (!complaint) {
      return sendJson(res, 404, { success: false, message: 'Complaint not found.', error_code: 'COMPLAINT_NOT_FOUND' });
    }

    const loc = DB.locations.find(l => l.id === complaint.location_id);
    const cat = DB.categories.find(c => c.id === complaint.category_id);
    const timeline = DB.complaint_updates
      .filter(u => u.complaint_id === complaint.id && u.is_public)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Sanitize citizen info for public tracking
    const sanitized = {
      id: complaint.id,
      complaint_number: complaint.complaint_number,
      title: complaint.title,
      description: complaint.description,
      location_name: loc ? loc.name : 'ASR District',
      location_name_te: loc ? loc.name_te : '',
      category_name: cat ? cat.name : 'Issue',
      category_name_te: cat ? cat.name_te : '',
      category_type: cat ? cat.type : 'water',
      status: complaint.status,
      citizen_severity: complaint.citizen_severity,
      system_priority: complaint.system_priority,
      resolution_notes: complaint.resolution_notes || null,
      created_at: complaint.created_at,
      updated_at: complaint.updated_at
    };

    return sendJson(res, 200, {
      success: true,
      data: { complaint: sanitized, timeline }
    });
  }

  if (path === '/api/v1/complaints' && method === 'GET') {
    let list = [...DB.complaints];

    if (query.status && query.status !== 'all') {
      list = list.filter(c => c.status.toLowerCase() === query.status.toLowerCase());
    }
    if (query.location_id) {
      list = list.filter(c => c.location_id === parseInt(query.location_id));
    }
    if (query.type) {
      const catIds = DB.categories.filter(c => c.type === query.type).map(c => c.id);
      list = list.filter(c => catIds.includes(c.category_id));
    }

    // Hydrate with location and category names
    const enriched = list.map(c => {
      const loc = DB.locations.find(l => l.id === c.location_id);
      const cat = DB.categories.find(k => k.id === c.category_id);
      return {
        ...c,
        location_name: loc ? loc.name : '',
        category_name: cat ? cat.name : '',
        category_type: cat ? cat.type : 'water'
      };
    });

    const page = Math.max(1, parseInt(query.page || 1));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || 20)));
    const total = enriched.length;
    const paginated = enriched.slice((page - 1) * limit, page * limit);

    return sendJson(res, 200, {
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  }

  // --------------------------------------------------------------------------
  // MAP COMPLAINTS
  // --------------------------------------------------------------------------
  if (path === '/api/v1/map/complaints' && method === 'GET') {
    const pins = DB.complaints
      .filter(c => c.latitude && c.longitude)
      .map(c => {
        const loc = DB.locations.find(l => l.id === c.location_id);
        const cat = DB.categories.find(k => k.id === c.category_id);
        return {
          id: c.id,
          complaint_number: c.complaint_number,
          title: c.title,
          category_name: cat ? cat.name : '',
          category_type: cat ? cat.type : 'water',
          location_name: loc ? loc.name : '',
          latitude: c.latitude,
          longitude: c.longitude,
          status: c.status,
          system_priority: c.system_priority,
          created_at: c.created_at
        };
      });

    return sendJson(res, 200, { success: true, data: pins });
  }

  // --------------------------------------------------------------------------
  // RAINWATER MODULE - CITIZEN & PUBLIC ENDPOINTS
  // --------------------------------------------------------------------------
  if (path === '/api/v1/map/rainwater' && method === 'GET') {
    const pins = DB.rainwater_reports
      .filter(r => r.latitude && r.longitude)
      .map(r => {
        const loc = DB.locations.find(l => l.id === r.location_id);
        const comp = r.complaint_id ? DB.complaints.find(c => c.id === r.complaint_id) : null;
        return {
          id: r.id,
          report_number: r.report_number,
          report_type: r.report_type,
          availability_status: r.availability_status,
          condition_status: r.condition_status,
          verification_status: r.verification_status,
          location_name: loc ? loc.name : '',
          landmark: r.landmark,
          latitude: r.latitude,
          longitude: r.longitude,
          complaint_number: comp ? comp.complaint_number : null,
          complaint_status: comp ? comp.status : null,
          created_at: r.created_at
        };
      });
    return sendJson(res, 200, { success: true, data: pins, total: pins.length });
  }

  if (path === '/api/v1/rainwater' && method === 'GET') {
    let list = [...DB.rainwater_reports];

    if (query.availability_status) list = list.filter(r => r.availability_status === query.availability_status);
    if (query.condition_status) list = list.filter(r => r.condition_status === query.condition_status);
    if (query.verification_status) list = list.filter(r => r.verification_status === query.verification_status);
    if (query.report_type) list = list.filter(r => r.report_type === query.report_type);
    if (query.location_id) {
      const lid = parseInt(query.location_id);
      list = list.filter(r => r.location_id === lid);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(r => 
        (r.report_number && r.report_number.toLowerCase().includes(q)) ||
        (r.landmark && r.landmark.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 15));
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit).map(r => {
      const loc = DB.locations.find(l => l.id === r.location_id);
      const comp = r.complaint_id ? DB.complaints.find(c => c.id === r.complaint_id) : null;
      return {
        ...r,
        location_name: loc ? loc.name : '',
        location_name_te: loc ? loc.name_te : '',
        complaint_number: comp ? comp.complaint_number : null,
        complaint_status: comp ? comp.status : null
      };
    });

    return sendJson(res, 200, {
      success: true,
      data: {
        reports: paginated,
        pagination: { total, current_page: page, per_page: limit, last_page: Math.ceil(total / limit) }
      }
    });
  }

  if (path === '/api/v1/my/rainwater' && method === 'GET') {
    const user = getAuthUser(req);
    if (!user) {
      return sendJson(res, 401, { success: false, message: 'Unauthorized.', error_code: 'UNAUTHORIZED' });
    }
    const myReports = DB.rainwater_reports.filter(r => r.user_id === user.id).map(r => {
      const loc = DB.locations.find(l => l.id === r.location_id);
      const comp = r.complaint_id ? DB.complaints.find(c => c.id === r.complaint_id) : null;
      return {
        ...r,
        location_name: loc ? loc.name : '',
        complaint_number: comp ? comp.complaint_number : null,
        complaint_status: comp ? comp.status : null
      };
    });
    return sendJson(res, 200, {
      success: true,
      data: { reports: myReports, total: myReports.length }
    });
  }

  if (path === '/api/v1/rainwater' && method === 'POST') {
    const user = getAuthUser(req);
    const {
      location_id,
      availability_status,
      condition_status,
      report_type,
      description,
      landmark,
      latitude,
      longitude,
      photo_path,
      citizen_severity,
      raise_problem
    } = body;

    if (!location_id) {
      return sendJson(res, 422, {
        success: false,
        message: 'A valid location must be selected.',
        error_code: 'VALIDATION_FAILED'
      });
    }

    const avail = availability_status || 'unknown';
    const cond = condition_status || 'unknown';
    const isNotAvail = (avail === 'not_available');
    const isProblemCond = (cond === 'blocked' || cond === 'damaged' || cond === 'partially_blocked');
    const shouldRaiseComplaint = Boolean(raise_problem) || isNotAvail || isProblemCond;

    let finalReportType = report_type;
    if (!finalReportType) {
      if (isNotAvail) finalReportType = 'opening_not_available';
      else if (cond === 'blocked') finalReportType = 'opening_blocked';
      else if (cond === 'damaged') finalReportType = 'opening_damaged';
      else if (avail === 'available') finalReportType = 'opening_available';
      else finalReportType = 'other';
    }

    let linkedComplaint = null;
    if (shouldRaiseComplaint) {
      // Find matching rainwater category
      let categoryId = 15; // default: Opening Not Available
      if (finalReportType === 'opening_blocked') categoryId = 16;
      else if (finalReportType === 'opening_damaged') categoryId = 17;
      else if (finalReportType === 'rainwater_overflow') categoryId = 18;
      else if (finalReportType === 'waterlogging') categoryId = 19;
      else if (finalReportType === 'rainwater_path_blocked') categoryId = 20;

      const rwCount = DB.complaints.filter(c => c.complaint_number && c.complaint_number.startsWith('ASR-RW-')).length + 1;
      const compNumber = `ASR-RW-${String(rwCount).padStart(6, '0')}`;
      const compTitle = isNotAvail 
        ? 'Rainwater Drip/Drainage Opening Not Available' 
        : (cond === 'blocked' ? 'Rainwater Opening Blocked' : (cond === 'damaged' ? 'Rainwater Opening Damaged' : 'Rainwater Management Problem'));

      linkedComplaint = {
        id: nextComplaintId++,
        complaint_number: compNumber,
        user_id: user ? user.id : null,
        location_id: parseInt(location_id),
        category_id: categoryId,
        title: compTitle,
        description: description || (isNotAvail ? 'Rainwater drip/drainage opening is not available at this location.' : `Rainwater drainage condition reported as ${cond}.`),
        landmark: landmark || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        photo_path: photo_path || null,
        citizen_severity: citizen_severity || 'high',
        system_priority: citizen_severity || 'high',
        status: 'submitted',
        assigned_organization_id: null,
        assigned_user_id: null,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      DB.complaints.unshift(linkedComplaint);

      DB.complaint_updates.push({
        id: nextUpdateId++,
        complaint_id: linkedComplaint.id,
        user_id: user ? user.id : null,
        old_status: null,
        new_status: 'submitted',
        message: `Rainwater problem registered (${compTitle}). Generated tracking ID: ${compNumber}.`,
        is_public: true,
        created_at: linkedComplaint.created_at
      });

      if (user) {
        DB.notifications.push({
          id: DB.notifications.length + 1,
          user_id: user.id,
          complaint_id: linkedComplaint.id,
          type: 'COMPLAINT_SUBMITTED',
          title: 'Rainwater Problem Registered',
          message: `Your rainwater complaint #${compNumber} has been logged and queued for administrative review.`,
          channel: 'in_app',
          status: 'unread',
          created_at: linkedComplaint.created_at
        });
      }
    }

    const rwRepCount = DB.rainwater_reports.length + 1;
    const reportNumber = `ASR-RW-REP-${String(rwRepCount).padStart(6, '0')}`;
    const newReport = {
      id: nextRainwaterReportId++,
      report_number: reportNumber,
      complaint_id: linkedComplaint ? linkedComplaint.id : null,
      user_id: user ? user.id : null,
      location_id: parseInt(location_id),
      report_type: finalReportType,
      availability_status: avail,
      condition_status: cond,
      verification_status: 'pending',
      description: description || null,
      landmark: landmark || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      photo_path: photo_path || null,
      citizen_severity: citizen_severity || 'medium',
      admin_priority: citizen_severity || 'medium',
      verified_by: null,
      verified_at: null,
      verification_notes: null,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    DB.rainwater_reports.unshift(newReport);

    DB.audit_logs.push({
      id: nextAuditId++,
      user_id: user ? user.id : null,
      action: 'RAINWATER_REPORT_CREATED',
      entity_type: 'rainwater_report',
      entity_id: newReport.id,
      old_values: null,
      new_values: JSON.stringify({ report_number: reportNumber, availability_status: avail, complaint_id: linkedComplaint ? linkedComplaint.id : null }),
      ip_address: req.socket.remoteAddress,
      created_at: newReport.created_at
    });

    const loc = DB.locations.find(l => l.id === parseInt(location_id));

    return sendJson(res, 201, {
      success: true,
      message: 'Rainwater report submitted successfully.',
      data: {
        report_number: newReport.report_number,
        report_id: newReport.id,
        availability_status: newReport.availability_status,
        condition_status: newReport.condition_status,
        verification_status: newReport.verification_status,
        complaint_id: linkedComplaint ? linkedComplaint.id : null,
        complaint_number: linkedComplaint ? linkedComplaint.complaint_number : null,
        location: {
          id: parseInt(location_id),
          name: loc ? loc.name : ''
        },
        created_at: newReport.created_at
      }
    });
  }

  // Single report lookup
  const rwShowMatch = path.match(/^\/api\/v1\/rainwater\/(\d+)$/);
  if (rwShowMatch && method === 'GET') {
    const reportId = parseInt(rwShowMatch[1]);
    const report = DB.rainwater_reports.find(r => r.id === reportId);
    if (!report) {
      return sendJson(res, 404, { success: false, message: 'Rainwater report not found.', error_code: 'NOT_FOUND' });
    }
    const loc = DB.locations.find(l => l.id === report.location_id);
    const comp = report.complaint_id ? DB.complaints.find(c => c.id === report.complaint_id) : null;
    return sendJson(res, 200, {
      success: true,
      data: {
        ...report,
        location_name: loc ? loc.name : '',
        location_name_te: loc ? loc.name_te : '',
        complaint_number: comp ? comp.complaint_number : null,
        complaint_status: comp ? comp.status : null
      }
    });
  }

  // --------------------------------------------------------------------------
  // ADMIN RAINWATER ENDPOINTS
  // --------------------------------------------------------------------------
  if (path === '/api/v1/admin/rainwater' && method === 'GET') {
    const admin = getAuthUser(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin' && admin.role !== 'organization_admin')) {
      return sendJson(res, 403, { success: false, message: 'Admin access required.', error_code: 'FORBIDDEN' });
    }

    let list = [...DB.rainwater_reports];
    if (query.availability_status) list = list.filter(r => r.availability_status === query.availability_status);
    if (query.condition_status) list = list.filter(r => r.condition_status === query.condition_status);
    if (query.verification_status) list = list.filter(r => r.verification_status === query.verification_status);
    if (query.report_type) list = list.filter(r => r.report_type === query.report_type);
    if (query.location_id) {
      const lid = parseInt(query.location_id);
      list = list.filter(r => r.location_id === lid);
    }
    if (query.has_complaint) {
      if (query.has_complaint === 'yes' || query.has_complaint === 'true') {
        list = list.filter(r => r.complaint_id !== null);
      } else {
        list = list.filter(r => r.complaint_id === null);
      }
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(r => 
        (r.report_number && r.report_number.toLowerCase().includes(q)) ||
        (r.landmark && r.landmark.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit).map(r => {
      const loc = DB.locations.find(l => l.id === r.location_id);
      const comp = r.complaint_id ? DB.complaints.find(c => c.id === r.complaint_id) : null;
      const org = comp && comp.assigned_organization_id ? DB.organizations.find(o => o.id === comp.assigned_organization_id) : null;
      return {
        ...r,
        location_name: loc ? loc.name : '',
        complaint_number: comp ? comp.complaint_number : null,
        complaint_status: comp ? comp.status : null,
        assigned_organization_name: org ? org.name : null
      };
    });

    return sendJson(res, 200, {
      success: true,
      data: {
        reports: paginated,
        pagination: { total, current_page: page, per_page: limit, last_page: Math.ceil(total / limit) }
      }
    });
  }

  // Admin Single Report Detail
  const adminRwShowMatch = path.match(/^\/api\/v1\/admin\/rainwater\/(\d+)$/);
  if (adminRwShowMatch && method === 'GET') {
    const admin = getAuthUser(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin' && admin.role !== 'organization_admin')) {
      return sendJson(res, 403, { success: false, message: 'Admin access required.', error_code: 'FORBIDDEN' });
    }

    const reportId = parseInt(adminRwShowMatch[1]);
    const report = DB.rainwater_reports.find(r => r.id === reportId);
    if (!report) {
      return sendJson(res, 404, { success: false, message: 'Rainwater report not found.', error_code: 'NOT_FOUND' });
    }

    const loc = DB.locations.find(l => l.id === report.location_id);
    const citizen = report.user_id ? DB.users.find(u => u.id === report.user_id) : null;
    const comp = report.complaint_id ? DB.complaints.find(c => c.id === report.complaint_id) : null;
    const org = comp && comp.assigned_organization_id ? DB.organizations.find(o => o.id === comp.assigned_organization_id) : null;

    return sendJson(res, 200, {
      success: true,
      data: {
        ...report,
        location_name: loc ? loc.name : '',
        citizen_name: citizen ? citizen.name : 'Anonymous Resident',
        citizen_phone: citizen ? citizen.phone : null,
        citizen_email: citizen ? citizen.email : null,
        complaint_number: comp ? comp.complaint_number : null,
        complaint_status: comp ? comp.status : null,
        system_priority: comp ? comp.system_priority : report.admin_priority,
        assigned_organization_id: comp ? comp.assigned_organization_id : null,
        assigned_organization_name: org ? org.name : null
      }
    });
  }

  // Admin verify rainwater report
  const adminRwVerifyMatch = path.match(/^\/api\/v1\/admin\/rainwater\/(\d+)\/verify$/);
  if (adminRwVerifyMatch && (method === 'PATCH' || method === 'POST')) {
    const admin = getAuthUser(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin' && admin.role !== 'organization_admin')) {
      return sendJson(res, 403, { success: false, message: 'Admin access required.', error_code: 'FORBIDDEN' });
    }

    const reportId = parseInt(adminRwVerifyMatch[1]);
    const report = DB.rainwater_reports.find(r => r.id === reportId);
    if (!report) {
      return sendJson(res, 404, { success: false, message: 'Rainwater report not found.', error_code: 'NOT_FOUND' });
    }

    const vStatus = body.verification_status;
    if (!['pending', 'verified', 'not_verified', 'rejected'].includes(vStatus)) {
      return sendJson(res, 422, { success: false, message: 'Invalid verification status.', error_code: 'VALIDATION_FAILED' });
    }

    const oldStatus = report.verification_status;
    report.verification_status = vStatus;
    report.verified_by = admin.id;
    report.verified_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    report.verification_notes = body.verification_notes || null;
    report.updated_at = report.verified_at;

    // If report has linked complaint, sync status
    if (report.complaint_id) {
      const comp = DB.complaints.find(c => c.id === report.complaint_id);
      if (comp) {
        if (vStatus === 'verified' && comp.status === 'submitted') {
          comp.status = 'under_review';
          comp.updated_at = report.verified_at;
          DB.complaint_updates.push({
            id: nextUpdateId++,
            complaint_id: comp.id,
            user_id: admin.id,
            old_status: 'submitted',
            new_status: 'under_review',
            message: `Rainwater report verified on site: ${body.verification_notes || 'Infrastructure condition confirmed.'}`,
            is_public: true,
            created_at: report.verified_at
          });
        } else if (vStatus === 'rejected') {
          comp.status = 'rejected';
          comp.updated_at = report.verified_at;
          DB.complaint_updates.push({
            id: nextUpdateId++,
            complaint_id: comp.id,
            user_id: admin.id,
            old_status: comp.status,
            new_status: 'rejected',
            message: `Rainwater report rejected: ${body.verification_notes || 'Not verified by authority.'}`,
            is_public: true,
            created_at: report.verified_at
          });
        }
      }
    }

    DB.audit_logs.push({
      id: nextAuditId++,
      user_id: admin.id,
      action: 'RAINWATER_REPORT_VERIFIED',
      entity_type: 'rainwater_report',
      entity_id: report.id,
      old_values: JSON.stringify({ verification_status: oldStatus }),
      new_values: JSON.stringify({ verification_status: vStatus, notes: report.verification_notes }),
      ip_address: req.socket.remoteAddress,
      created_at: report.verified_at
    });

    return sendJson(res, 200, {
      success: true,
      message: `Rainwater report marked as ${vStatus}.`,
      data: report
    });
  }

  // Admin status update
  const adminRwStatusMatch = path.match(/^\/api\/v1\/admin\/rainwater\/(\d+)\/status$/);
  if (adminRwStatusMatch && (method === 'PATCH' || method === 'POST')) {
    const admin = getAuthUser(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return sendJson(res, 403, { success: false, message: 'Admin access required.', error_code: 'FORBIDDEN' });
    }
    const reportId = parseInt(adminRwStatusMatch[1]);
    const report = DB.rainwater_reports.find(r => r.id === reportId);
    if (!report) {
      return sendJson(res, 404, { success: false, message: 'Rainwater report not found.', error_code: 'NOT_FOUND' });
    }

    if (body.availability_status) report.availability_status = body.availability_status;
    if (body.condition_status) report.condition_status = body.condition_status;
    if (body.admin_priority) report.admin_priority = body.admin_priority;
    report.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

    return sendJson(res, 200, { success: true, message: 'Rainwater report updated.', data: report });
  }

  // Admin assign rainwater report
  const adminRwAssignMatch = path.match(/^\/api\/v1\/admin\/rainwater\/(\d+)\/assign$/);
  if (adminRwAssignMatch && method === 'POST') {
    const admin = getAuthUser(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin' && admin.role !== 'organization_admin')) {
      return sendJson(res, 403, { success: false, message: 'Admin access required.', error_code: 'FORBIDDEN' });
    }
    const reportId = parseInt(adminRwAssignMatch[1]);
    const report = DB.rainwater_reports.find(r => r.id === reportId);
    if (!report) {
      return sendJson(res, 404, { success: false, message: 'Rainwater report not found.', error_code: 'NOT_FOUND' });
    }

    if (!report.complaint_id) {
      return sendJson(res, 400, { success: false, message: 'This report does not have a linked complaint to assign.', error_code: 'NO_COMPLAINT' });
    }

    const orgId = parseInt(body.organization_id);
    const assignedUserId = body.assigned_user_id ? parseInt(body.assigned_user_id) : null;
    const comp = DB.complaints.find(c => c.id === report.complaint_id);

    if (comp) {
      comp.assigned_organization_id = orgId;
      comp.assigned_user_id = assignedUserId;
      comp.status = 'assigned';
      comp.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

      DB.assignments.push({
        id: DB.assignments.length + 1,
        complaint_id: comp.id,
        organization_id: orgId,
        assigned_user_id: assignedUserId,
        assigned_by: admin.id,
        notes: body.notes || 'Rainwater complaint assigned',
        status: 'active',
        assigned_at: comp.updated_at
      });

      const org = DB.organizations.find(o => o.id === orgId);
      DB.complaint_updates.push({
        id: nextUpdateId++,
        complaint_id: comp.id,
        user_id: admin.id,
        old_status: 'under_review',
        new_status: 'assigned',
        message: `Assigned to ${org ? org.name : 'Engineering Division'}. ${body.notes || ''}`,
        is_public: true,
        created_at: comp.updated_at
      });
    }

    DB.audit_logs.push({
      id: nextAuditId++,
      user_id: admin.id,
      action: 'RAINWATER_REPORT_ASSIGNED',
      entity_type: 'rainwater_report',
      entity_id: report.id,
      old_values: null,
      new_values: JSON.stringify({ organization_id: orgId, assigned_user_id: assignedUserId }),
      ip_address: req.socket.remoteAddress,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    return sendJson(res, 200, { success: true, message: 'Rainwater complaint assigned successfully.', data: report });
  }

  // Admin rainwater analytics
  if (path === '/api/v1/admin/rainwater/analytics' && method === 'GET') {
    const totalReports = DB.rainwater_reports.length;
    const available = DB.rainwater_reports.filter(r => r.availability_status === 'available').length;
    const notAvailable = DB.rainwater_reports.filter(r => r.availability_status === 'not_available').length;
    const unknown = DB.rainwater_reports.filter(r => r.availability_status === 'unknown').length;
    const good = DB.rainwater_reports.filter(r => r.condition_status === 'good').length;
    const partiallyBlocked = DB.rainwater_reports.filter(r => r.condition_status === 'partially_blocked').length;
    const blocked = DB.rainwater_reports.filter(r => r.condition_status === 'blocked').length;
    const damaged = DB.rainwater_reports.filter(r => r.condition_status === 'damaged').length;
    const waterlogging = DB.rainwater_reports.filter(r => r.report_type === 'waterlogging').length;
    const overflow = DB.rainwater_reports.filter(r => r.report_type === 'rainwater_overflow').length;
    const pendingVerification = DB.rainwater_reports.filter(r => r.verification_status === 'pending').length;
    const verified = DB.rainwater_reports.filter(r => r.verification_status === 'verified').length;
    const notVerified = DB.rainwater_reports.filter(r => r.verification_status === 'not_verified').length;
    const rejected = DB.rainwater_reports.filter(r => r.verification_status === 'rejected').length;
    const withComplaint = DB.rainwater_reports.filter(r => r.complaint_id !== null).length;
    const resolvedComplaints = DB.rainwater_reports.filter(r => {
      if (!r.complaint_id) return false;
      const c = DB.complaints.find(comp => comp.id === r.complaint_id);
      return c && c.status === 'resolved';
    }).length;

    // Location distribution
    const locMap = {};
    for (const r of DB.rainwater_reports) {
      const loc = DB.locations.find(l => l.id === r.location_id);
      const name = loc ? loc.name : 'Unknown';
      locMap[name] = (locMap[name] || 0) + 1;
    }
    const byLocation = Object.entries(locMap).map(([location_name, count]) => ({ location_name, count }));

    return sendJson(res, 200, {
      success: true,
      data: {
        total_reports: totalReports,
        available,
        not_available: notAvailable,
        unknown,
        good,
        partially_blocked: partiallyBlocked,
        blocked,
        damaged,
        waterlogging,
        rainwater_overflow: overflow,
        pending_verification: pendingVerification,
        verified,
        not_verified: notVerified,
        rejected,
        with_complaint: withComplaint,
        resolved_complaints: resolvedComplaints,
        by_location: byLocation
      }
    });
  }

  // --------------------------------------------------------------------------
  // ADMIN DASHBOARD & WORKFLOWS
  // --------------------------------------------------------------------------
  if (path === '/api/v1/admin/dashboard' && method === 'GET') {
    const admin = getAuthUser(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return sendJson(res, 403, { success: false, message: 'Admin access required.', error_code: 'FORBIDDEN' });
    }

    const counts = {
      total_complaints: DB.complaints.length,
      new_complaints: DB.complaints.filter(c => c.status === 'submitted').length,
      under_review: DB.complaints.filter(c => c.status === 'under_review').length,
      assigned: DB.complaints.filter(c => c.status === 'assigned').length,
      in_progress: DB.complaints.filter(c => c.status === 'in_progress').length,
      resolved: DB.complaints.filter(c => c.status === 'resolved').length,
      closed: DB.complaints.filter(c => c.status === 'closed').length,
      rejected: DB.complaints.filter(c => c.status === 'rejected').length,
      critical_complaints: DB.complaints.filter(c => c.system_priority === 'critical' || c.citizen_severity === 'critical').length,
      water_complaints: DB.complaints.filter(c => {
        const cat = DB.categories.find(k => k.id === c.category_id);
        return cat && cat.type === 'water';
      }).length,
      drainage_complaints: DB.complaints.filter(c => {
        const cat = DB.categories.find(k => k.id === c.category_id);
        return cat && cat.type === 'drainage';
      }).length,
      rainwater_complaints: DB.complaints.filter(c => {
        const cat = DB.categories.find(k => k.id === c.category_id);
        return cat && cat.type === 'rainwater';
      }).length,
      rainwater_issues: DB.complaints.filter(c => {
        const cat = DB.categories.find(k => k.id === c.category_id);
        return cat && cat.type === 'rainwater';
      }).length,
      missing_rainwater_openings: DB.rainwater_reports.filter(r => r.availability_status === 'not_available').length,
      blocked_openings: DB.rainwater_reports.filter(r => r.condition_status === 'blocked').length,
      damaged_openings: DB.rainwater_reports.filter(r => r.condition_status === 'damaged').length,
      waterlogging_reports: DB.rainwater_reports.filter(r => r.report_type === 'waterlogging').length
    };

    const recent = DB.complaints.slice(0, 10).map(c => {
      const loc = DB.locations.find(l => l.id === c.location_id);
      const cat = DB.categories.find(k => k.id === c.category_id);
      return {
        ...c,
        location_name: loc ? loc.name : '',
        category_name: cat ? cat.name : ''
      };
    });

    return sendJson(res, 200, {
      success: true,
      data: { stats: counts, recent_complaints: recent }
    });
  }

  // Admin complaint assignment
  const assignMatch = path.match(/^\/api\/v1\/admin\/complaints\/(\d+)\/assign$/);
  if (assignMatch && method === 'POST') {
    const admin = getAuthUser(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return sendJson(res, 403, { success: false, message: 'Admin access required.', error_code: 'FORBIDDEN' });
    }

    const complaintId = parseInt(assignMatch[1]);
    const complaint = DB.complaints.find(c => c.id === complaintId);
    if (!complaint) {
      return sendJson(res, 404, { success: false, message: 'Complaint not found.', error_code: 'NOT_FOUND' });
    }

    const orgId = parseInt(body.organization_id);
    const assignedUserId = body.assigned_user_id ? parseInt(body.assigned_user_id) : null;
    const oldStatus = complaint.status;

    complaint.assigned_organization_id = orgId;
    complaint.assigned_user_id = assignedUserId;
    complaint.status = 'assigned';
    complaint.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

    DB.assignments.push({
      id: DB.assignments.length + 1,
      complaint_id: complaint.id,
      organization_id: orgId,
      assigned_user_id: assignedUserId,
      assigned_by: admin.id,
      notes: body.notes || 'Assigned by admin',
      status: 'active',
      assigned_at: complaint.updated_at
    });

    const org = DB.organizations.find(o => o.id === orgId);
    DB.complaint_updates.push({
      id: nextUpdateId++,
      complaint_id: complaint.id,
      user_id: admin.id,
      old_status: oldStatus,
      new_status: 'assigned',
      message: `Assigned to ${org ? org.name : 'Maintenance Agency'}. ${body.notes || ''}`.trim(),
      is_public: true,
      created_at: complaint.updated_at
    });

    DB.audit_logs.push({
      id: nextAuditId++,
      user_id: admin.id,
      action: 'ASSIGN_COMPLAINT',
      entity_type: 'complaint',
      entity_id: complaint.id,
      old_values: JSON.stringify({ status: oldStatus }),
      new_values: JSON.stringify({ status: 'assigned', org: orgId }),
      ip_address: req.socket.remoteAddress,
      created_at: complaint.updated_at
    });

    return sendJson(res, 200, {
      success: true,
      message: 'Complaint assigned successfully.',
      data: { complaint }
    });
  }

  // Admin complaint status update
  const statusMatch = path.match(/^\/api\/v1\/admin\/complaints\/(\d+)\/status$/);
  if (statusMatch && method === 'POST') {
    const admin = getAuthUser(req);
    if (!admin) {
      return sendJson(res, 401, { success: false, message: 'Authentication required.', error_code: 'UNAUTHORIZED' });
    }

    const complaintId = parseInt(statusMatch[1]);
    const complaint = DB.complaints.find(c => c.id === complaintId);
    if (!complaint) {
      return sendJson(res, 404, { success: false, message: 'Complaint not found.', error_code: 'NOT_FOUND' });
    }

    const newStatus = (body.status || '').toLowerCase();
    const oldStatus = complaint.status;
    complaint.status = newStatus;
    complaint.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

    DB.complaint_updates.push({
      id: nextUpdateId++,
      complaint_id: complaint.id,
      user_id: admin.id,
      old_status: oldStatus,
      new_status: newStatus,
      message: body.message || `Status updated to ${newStatus}.`,
      is_public: body.is_public !== false,
      created_at: complaint.updated_at
    });

    DB.audit_logs.push({
      id: nextAuditId++,
      user_id: admin.id,
      action: 'STATUS_CHANGE',
      entity_type: 'complaint',
      entity_id: complaint.id,
      old_values: JSON.stringify({ status: oldStatus }),
      new_values: JSON.stringify({ status: newStatus }),
      ip_address: req.socket.remoteAddress,
      created_at: complaint.updated_at
    });

    return sendJson(res, 200, {
      success: true,
      message: `Status updated to ${newStatus}.`,
      data: { complaint }
    });
  }

  // Admin resolve complaint
  const resolveMatch = path.match(/^\/api\/v1\/admin\/complaints\/(\d+)\/resolve$/);
  if (resolveMatch && method === 'POST') {
    const admin = getAuthUser(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin' && admin.role !== 'organization_admin')) {
      return sendJson(res, 403, { success: false, message: 'Admin or Organization access required.', error_code: 'FORBIDDEN' });
    }

    const complaintId = parseInt(resolveMatch[1]);
    const complaint = DB.complaints.find(c => c.id === complaintId);
    if (!complaint) {
      return sendJson(res, 404, { success: false, message: 'Complaint not found.', error_code: 'NOT_FOUND' });
    }

    const oldStatus = complaint.status;
    complaint.status = 'resolved';
    complaint.resolution_notes = body.resolution_notes || 'Work completed and verified on site.';
    complaint.resolved_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    complaint.updated_at = complaint.resolved_at;

    DB.complaint_updates.push({
      id: nextUpdateId++,
      complaint_id: complaint.id,
      user_id: admin.id,
      old_status: oldStatus,
      new_status: 'resolved',
      message: `Complaint resolved: ${complaint.resolution_notes}`,
      is_public: true,
      created_at: complaint.resolved_at
    });

    DB.audit_logs.push({
      id: nextAuditId++,
      user_id: admin.id,
      action: 'RESOLVE_COMPLAINT',
      entity_type: 'complaint',
      entity_id: complaint.id,
      old_values: JSON.stringify({ status: oldStatus }),
      new_values: JSON.stringify({ status: 'resolved', notes: complaint.resolution_notes }),
      ip_address: req.socket.remoteAddress,
      created_at: complaint.resolved_at
    });

    return sendJson(res, 200, {
      success: true,
      message: 'Complaint marked as resolved.',
      data: { complaint }
    });
  }

  // Audit Logs
  if (path === '/api/v1/admin/audit-logs' && method === 'GET') {
    const admin = getAuthUser(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return sendJson(res, 403, { success: false, message: 'Admin access required.', error_code: 'FORBIDDEN' });
    }
    return sendJson(res, 200, { success: true, data: DB.audit_logs });
  }

  // CSV Report
  if (path === '/api/v1/admin/reports/csv' && method === 'GET') {
    const admin = getAuthUser(req);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return sendJson(res, 403, { success: false, message: 'Admin access required.', error_code: 'FORBIDDEN' });
    }

    let csv = "Complaint Number,Title,Status,Severity,Priority,Location,Created At\n";
    for (const c of DB.complaints) {
      const loc = DB.locations.find(l => l.id === c.location_id);
      csv += `"${c.complaint_number}","${c.title.replace(/"/g, '""')}","${c.status}","${c.citizen_severity}","${c.system_priority}","${loc ? loc.name : ''}","${c.created_at}"\n`;
    }

    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="asr_complaints_report.csv"'
    });
    return res.end(csv);
  }

  // ============================================================================
  // 12. AI ASSISTANT API ("ASR Water Assistant" / "Jala Mitra")
  // ============================================================================

  // POST /api/v1/ai/chat
  if (path === '/api/v1/ai/chat' && method === 'POST') {
    const rawMessage = (body.message || '').trim();
    if (!rawMessage) {
      return sendJson(res, 422, { success: false, message: 'Message cannot be empty.', error_code: 'MESSAGE_REQUIRED' });
    }

    const authUser = getAuthUser(req);
    const userId = authUser ? authUser.id : null;
    const requestedLang = body.language || 'en';
    const sessionId = body.conversation_id || body.session_id || ('sess_' + Date.now());

    // 1. Language Detection (Telugu or English)
    const isTelugu = /[\u0C00-\u0C7F]/.test(rawMessage) || 
      /neellu|ravadam|ledu|varsham|drip|chudali|ela/i.test(rawMessage) || 
      requestedLang === 'te';
    const lang = isTelugu ? 'te' : 'en';

    const lower = rawMessage.toLowerCase();

    // 2. Safety Hazard Check
    const isElectric = /electric|wire|shock|current|transformer|pole|కరెంట్|షాక్|వైర్|విద్యుత్/.test(lower);
    const isConfined = /enter sewer|enter manhole|inside drain|మ్యాన్‌హోల్‌లోకి/.test(lower);

    if (isElectric) {
      const warningText = (lang === 'te')
        ? "⚠️ **అత్యవసర హెచ్చరిక**: విద్యుత్ తీగలు లేదా ట్రాన్స్‌ఫార్మర్ల సమీపంలో ఉన్న నీటి నుండి వెంటనే దూరంగా ఉండండి! నీటిని ఎట్టి పరిస్థితుల్లోనూ తాకవద్దు మరియు విద్యుత్ మరమ్మతులు స్వయంగా చేయవద్దు. వెంటనే విద్యుత్ హెల్ప్‌లైన్ **1912** లేదా అత్యవసర సేవలు **112** కు కాల్ చేయండి."
        : "⚠️ **CRITICAL SAFETY WARNING**: Stay completely away from water near electrical wires, fallen power cables, or submerged transformers! Do NOT touch the water or attempt repairs yourself. Immediately contact the Electricity Helpline (**1912**) or Emergency Services (**112**).";

      return sendJson(res, 200, {
        success: true,
        conversation_id: sessionId,
        reply: warningText,
        category: 'OTHER',
        suggested_priority: 'URGENT',
        priority_label: 'AI suggested priority: Urgent (Emergency Hazard)',
        safety_warning: { hazard_type: 'ELECTRICAL_HAZARD', severity: 'URGENT' },
        actions: [
          { type: 'EMERGENCY_CALL', label: (lang === 'te' ? '📞 అత్యవసర సేవలు (112)' : '📞 Emergency Helpline (112)'), url: 'tel:112' },
          { type: 'EMERGENCY_CALL', label: (lang === 'te' ? '⚡ విద్యుత్ హెల్ప్‌లైన్ (1912)' : '⚡ Electricity Helpline (1912)'), url: 'tel:1912' }
        ]
      });
    }

    if (isConfined) {
      const warningText = (lang === 'te')
        ? "⚠️ **రక్షణ హెచ్చరిక**: మురుగు కాలువలు లేదా లోతైన మ్యాన్‌హోల్స్‌లోకి స్వయంగా ప్రవేశించవద్దు. విష వాయువులు ప్రాణాపాయం కలిగించవచ్చు. అధికారిక పారిశుద్ధ్య సిబ్బంది మాత్రమే తగిన రక్షణ పరికరాలతో వీటిని శుభ్రం చేయాలి."
        : "⚠️ **SAFETY WARNING**: Never enter underground drains, manholes, or deep floodwaters yourself. Hazardous gases and rapid flow present severe risks. Only authorized sanitation engineers should enter.";

      return sendJson(res, 200, {
        success: true,
        conversation_id: sessionId,
        reply: warningText,
        category: 'OTHER',
        suggested_priority: 'HIGH',
        priority_label: 'AI suggested priority: High',
        actions: [
          { type: 'NAVIGATE', label: (lang === 'te' ? 'సమస్యను నివేదించండి' : 'Report Drainage Problem'), url: 'report.html?type=drainage' }
        ]
      });
    }

    // 3. Complaint Tracking Intent
    const trackingMatch = rawMessage.match(/(ASR-[A-Z0-9-]+|RW-[A-Z0-9-]+)/i);
    const isTrackingQuery = trackingMatch || /track|status|where is my complaint|ట్రాక్|స్టేటస్/.test(lower);

    if (isTrackingQuery) {
      if (trackingMatch) {
        const trackingNum = trackingMatch[1].toUpperCase();
        const found = DB.complaints.find(c => c.complaint_number.toUpperCase() === trackingNum);

        if (found) {
          const loc = DB.locations.find(l => l.id === found.location_id);
          const cat = DB.categories.find(c => c.id === found.category_id);
          const statusLabels = {
            submitted: { en: 'Submitted', te: 'సమర్పించబడింది' },
            under_review: { en: 'Under Review', te: 'సమీక్షలో ఉంది' },
            assigned: { en: 'Assigned', te: 'కేటాయించబడింది' },
            in_progress: { en: 'In Progress', te: 'పని జరుగుతోంది' },
            resolved: { en: 'Resolved', te: 'పరిష్కరించబడింది' },
            rejected: { en: 'Rejected', te: 'తిరస్కరించబడింది' }
          };
          const displayStatus = (statusLabels[found.status] && statusLabels[found.status][lang]) || found.status;

          const reply = (lang === 'te')
            ? `మీ ఫిర్యాదు సమాచారం లభించింది:\n\n• **ఫిర్యాదు సంఖ్య**: ${found.complaint_number}\n• **విభాగం**: ${cat ? (cat.name_te || cat.name) : 'సమస్య'}\n• **ప్రాంతం**: ${loc ? (loc.name_te || loc.name) : 'ASR జిల్లా'}\n• **ప్రస్తుత స్థితి**: **${displayStatus}**\n• **చివరి అప్‌డేట్**: ${found.updated_at}`
            : `Here is your complaint status:\n\n• **Complaint ID**: ${found.complaint_number}\n• **Category**: ${cat ? cat.name : 'Issue'}\n• **Location**: ${loc ? loc.name : 'ASR District'}\n• **Current Status**: **${displayStatus}**\n• **Last Updated**: ${found.updated_at}`;

          return sendJson(res, 200, {
            success: true,
            conversation_id: sessionId,
            reply,
            category: 'TRACKING',
            suggested_priority: 'LOW',
            tracking_card: {
              complaint_number: found.complaint_number,
              status: displayStatus,
              location: loc ? loc.name : '',
              category: cat ? cat.name : '',
              url: `track.html?id=${encodeURIComponent(found.complaint_number)}`
            },
            actions: [
              { type: 'TRACK_LINK', label: (lang === 'te' ? 'పూర్తి టైమ్‌లైన్ చూడండి →' : 'View Full Timeline →'), url: `track.html?id=${encodeURIComponent(found.complaint_number)}` }
            ]
          });
        } else {
          const notFoundMsg = (lang === 'te')
            ? `ఫిర్యాదు సంఖ్య **${trackingNum}** తో ఏ రికార్డు కనపడలేదు. దయచేసి సంఖ్యను సరిచూసుకోండి.`
            : `No complaint found with tracking number **${trackingNum}**. Please check the number.`;

          return sendJson(res, 200, {
            success: true,
            conversation_id: sessionId,
            reply: notFoundMsg,
            category: 'TRACKING',
            suggested_priority: 'LOW',
            actions: [
              { type: 'NAVIGATE', label: (lang === 'te' ? 'ట్రాకింగ్ పేజీ తెరవండి' : 'Open Tracking Page'), url: 'track.html' }
            ]
          });
        }
      } else {
        const askMsg = (lang === 'te')
          ? "మీ కంప్లైంట్ స్థితిని తనిఖీ చేయడానికి నేను సహాయపడతాను. దయచేసి మీ ఫిర్యాదు సంఖ్యను నమోదు చేయండి (ఉదా: `ASR-WD-000001` లేదా `RW-2026-00001`), లేదా కింద ఉన్న బటన్ ద్వారా ట్రాకింగ్ పేజీని సందర్శించండి."
          : "I can help you check your complaint status. Please provide your Complaint Number (e.g., `ASR-WD-000001` or `RW-2026-00001`), or click below to open the tracking page.";

        return sendJson(res, 200, {
          success: true,
          conversation_id: sessionId,
          reply: askMsg,
          category: 'TRACKING',
          suggested_priority: 'LOW',
          actions: [
            { type: 'NAVIGATE', label: (lang === 'te' ? '🔍 ట్రాకింగ్ పేజీకి వెళ్లండి' : '🔍 Track Complaint Page'), url: 'track.html' }
          ]
        });
      }
    }

    // 4. Rainwater Availability Logic (3-Choice protocol)
    const isRainwaterDrip = /rainwater drip|rainwater opening|drip opening|rainwater outlet|రెయిన్ వాటర్ డ్రిప్|వర్షపు నీటి రంధ్రం|opening available/i.test(lower);
    if (isRainwaterDrip) {
      if (/not sure|తెలీదు|ఖచ్చితంగా తెలీదు|unknown/i.test(lower)) {
        const reply = (lang === 'te')
          ? "ధన్యవాదాలు. మీరు ఖచ్చితంగా నిర్ధారించలేకపోతున్నందున, మేము దీనిని ధృవీకరణ అవసరమైన పౌర పరిశీలనగా నమోదు చేస్తాము.\n\n*గమనిక: పౌర పరిశీలనలు అధికారిక ఇంజనీరింగ్ నిర్ధారణ కావు; అడ్మినిస్ట్రేటర్ల ధృవీకరణ తర్వాతే చర్యలు తీసుకుంటారు.*"
          : "Thanks. Since you're not sure, we'll record this as an observation that needs verification.\n\n*Note: Citizen observations remain as observations until administrative field verification.*";

        return sendJson(res, 200, {
          success: true,
          conversation_id: sessionId,
          reply,
          category: 'RAINWATER_OPENING',
          suggested_priority: 'LOW',
          priority_label: 'AI suggested priority: Low (Observation)',
          actions: [
            { type: 'RAINWATER_REPORT', label: (lang === 'te' ? '🌧️ రెయిన్ వాటర్ రికార్డు నమోదు' : '🌧️ Record Rainwater Observation'), url: 'rainwater.html?choice=notsure' }
          ]
        });
      } else if (/no.*opening|not.*available|no.*available|no.*drip|లేదు|డ్రిప్ లేదు|missing/i.test(lower)) {
        const reply = (lang === 'te')
          ? "ఈ రహదారి వద్ద వర్షపు నీటి డ్రిప్/కాలువ ఓపెనింగ్ లేదని మీరు పరిశీలించారు. వర్షపు నీరు నిలవకుండా నిరోధించడానికి మేము దీనిని నమోదు చేయడంలో సహాయపడతాము."
          : "You observed that a rainwater drainage opening is not available here. I can guide you to create an infrastructure request with photo and location.";

        return sendJson(res, 200, {
          success: true,
          conversation_id: sessionId,
          reply,
          category: 'RAINWATER_OPENING',
          suggested_priority: 'MEDIUM',
          priority_label: 'AI suggested priority: Medium',
          actions: [
            { type: 'RAINWATER_REPORT', label: (lang === 'te' ? '🌧️ మిస్సింగ్ డ్రిప్ రిపోర్ట్ చేయండి' : '🌧️ Report Missing Rainwater Opening'), url: 'rainwater.html?choice=not_available' }
          ]
        });
      } else if ((/\byes\b|\bavailable\b|ఉంది|అవును/i.test(lower)) && !/no|not|లేదు/i.test(lower)) {
        const reply = (lang === 'te')
          ? "వర్షపు నీటి ఓపెనింగ్ అందుబాటులో ఉన్నట్లు మీరు తెలిపారు. దీని పరిస్థితి ఎలా కనిపిస్తోంది?\n\n• బాగుంది (Good)\n• పాక్షికంగా అడ్డంకి ఉంది (Partially Blocked)\n• పూర్తిగా మూసుకుపోయింది (Blocked)\n• పాడైంది (Damaged)"
          : "You observed that a rainwater opening is available. What condition does it appear to be in?\n\n• Good\n• Partially blocked\n• Blocked\n• Damaged\n• Unknown";

        return sendJson(res, 200, {
          success: true,
          conversation_id: sessionId,
          reply,
          category: 'RAINWATER_OPENING',
          suggested_priority: 'LOW',
          actions: [
            { type: 'RAINWATER_CONDITION', label: (lang === 'te' ? 'బాగుంది (Good)' : 'Good'), url: 'rainwater.html?choice=available&cond=good' },
            { type: 'RAINWATER_CONDITION', label: (lang === 'te' ? 'బ్లాక్ అయింది (Blocked)' : 'Blocked'), url: 'rainwater.html?choice=available&cond=blocked' },
            { type: 'RAINWATER_CONDITION', label: (lang === 'te' ? 'పాడైంది (Damaged)' : 'Damaged'), url: 'rainwater.html?choice=available&cond=damaged' }
          ]
        });
      } else {
        const reply = (lang === 'te')
          ? "ఈ ప్రదేశంలో వర్షపు నీటి కాలువ లేదా డ్రిప్ ఓపెనింగ్ అందుబాటులో ఉందా?"
          : "Is a rainwater drainage/drip opening available at this location?";

        return sendJson(res, 200, {
          success: true,
          conversation_id: sessionId,
          reply,
          category: 'RAINWATER_OPENING',
          suggested_priority: 'LOW',
          actions: [
            { type: 'OPTION_YES', label: (lang === 'te' ? 'అవును - ఉంది' : 'YES - AVAILABLE'), url: 'rainwater.html?choice=available' },
            { type: 'OPTION_NO', label: (lang === 'te' ? 'లేదు - అందుబాటులో లేదు' : 'NO - NOT AVAILABLE'), url: 'rainwater.html?choice=not_available' },
            { type: 'OPTION_NOT_SURE', label: (lang === 'te' ? 'ఖచ్చితంగా తెలీదు' : 'NOT SURE'), url: 'rainwater.html?choice=unknown' }
          ]
        });
      }
    }

    // 5. Problem Classification & Entity Extraction
    let category = 'OTHER';
    let mainType = 'water';
    let suggestedPriority = 'MEDIUM';
    let probSummary = { en: 'Civic concern', te: 'పౌర సమస్య' };

    if (/waterlog|water.*staying|water.*collecting|collecting.*road|staying.*road|entering house|నిలిచిపోయింది|ఇంట్లోకి నీరు|వరద/i.test(lower)) {
      category = 'WATERLOGGING';
      mainType = 'rainwater';
      suggestedPriority = /entering house|ఇంట్లోకి/.test(lower) ? 'URGENT' : 'HIGH';
      probSummary = { en: 'Waterlogging or road water collection', te: 'రోడ్డుపై నీరు నిలవడం లేదా వాటర్‌లాగింగ్' };
    } else if (/drainage|drain|sewage|overflow|blocked drainage|gutter|డ్రైనేజ్|మురుగు|కాలువ/.test(lower)) {
      category = 'DRAINAGE';
      mainType = 'drainage';
      suggestedPriority = /major road|main road|overflow/.test(lower) ? 'HIGH' : 'MEDIUM';
      probSummary = { en: 'Drainage blockage or wastewater overflow', te: 'డ్రైనేజీ అడ్డంకి లేదా మురుగు పొంగిపొర్లడం' };
    } else if (/pipeline|pipe burst|leakage|పైపు పగిలింది|పైప్ లీక్/.test(lower)) {
      category = 'PIPELINE';
      mainType = 'water';
      suggestedPriority = 'HIGH';
      probSummary = { en: 'Water supply pipeline leakage or rupture', te: 'తాగునీటి పైప్‌లైన్ లీకేజీ' };
    } else if (/public tap|standpost|street tap|పబ్లిక్ ట్యాప్|బోరు/.test(lower)) {
      category = 'PUBLIC_TAP';
      mainType = 'water';
      suggestedPriority = 'MEDIUM';
      probSummary = { en: 'Public drinking water tap / standpost issue', te: 'పబ్లిక్ ట్యాప్ లేదా బోరు సమస్య' };
    } else if (/drinking water|no water|water supply|tap dry|dirty water|water coming|తాగునీరు|నీళ్లు రావడం లేదు|మంచినీరు/.test(lower)) {
      category = 'WATER';
      mainType = 'water';
      suggestedPriority = /no water|రావడం లేదు/.test(lower) ? 'HIGH' : 'MEDIUM';
      probSummary = { en: 'Drinking water shortage or supply interruption', te: 'తాగునీటి సరఫరా నిలిచిపోవడం' };
    } else if (/rainwater|rain water|వర్షపు నీరు|వర్షం/.test(lower)) {
      category = 'RAINWATER';
      mainType = 'rainwater';
      suggestedPriority = 'MEDIUM';
      probSummary = { en: 'Rainwater runoff management', te: 'వర్షపు నీటి నిర్వహణ' };
    }

    // Extract Location
    const mandals = [
      { id: 2, name: 'Paderu', name_te: 'పాడేరు', regex: /paderu|పాడేరు/i },
      { id: 3, name: 'Araku Valley', name_te: 'అరకు లోయ', regex: /araku|అరకు/i },
      { id: 4, name: 'Chintapalle', name_te: 'చింతపల్లి', regex: /chintapalle|chintapalli|lambasingi|చింతపల్లి|లంబసింగి/i },
      { id: 5, name: 'Ananthagiri', name_te: 'అనంతగిరి', regex: /ananthagiri|అనంతగిరి/i },
      { id: 6, name: 'Dumbriguda', name_te: 'డుంబ్రిగుడ', regex: /dumbriguda|డుంబ్రిగుడ/i },
      { id: 7, name: 'G. Madugula', name_te: 'జి. మాడుగుల', regex: /madugula|మాడుగుల/i },
      { id: 8, name: 'G.K. Veedhi', name_te: 'గూడెం కొత్త వీధి', regex: /gk veedhi|గూడెం/i },
      { id: 9, name: 'Hukumpeta', name_te: 'హుకుంపేట', regex: /hukumpeta|హుకుంపేట/i },
      { id: 10, name: 'Koyyuru', name_te: 'కొయ్యూరు', regex: /koyyuru|కొయ్యూరు/i },
      { id: 11, name: 'Munchingput', name_te: 'ముంచంగిపుట్టు', regex: /munchingput|ముంచంగిపుట్టు/i },
      { id: 12, name: 'Pedabayalu', name_te: 'పెదబయలు', regex: /pedabayalu|పెదబయలు/i }
    ];

    let foundLoc = null;
    for (const m of mandals) {
      if (m.regex.test(rawMessage)) {
        foundLoc = m;
        break;
      }
    }

    if (category !== 'OTHER') {
      const locDisplay = foundLoc ? (lang === 'te' ? foundLoc.name_te : foundLoc.name) : (lang === 'te' ? 'మీ ప్రాంతం' : 'Your area');
      const catDisplay = (lang === 'te')
        ? (mainType === 'water' ? 'తాగునీరు' : mainType === 'drainage' ? 'డ్రైనేజీ' : 'వర్షపు నీరు')
        : (mainType === 'water' ? 'Drinking Water' : mainType === 'drainage' ? 'Drainage' : 'Rainwater');

      const reply = (lang === 'te')
        ? `మీరు చెప్పిన సమస్య నాకు అర్థమైంది:\n\n• **విభాగం**: ${catDisplay}\n• **సమస్య రకం**: ${probSummary.te}\n• **ప్రాంతం**: ${locDisplay}\n• **వివరణ**: ${rawMessage}\n\nదీనిని నమోదు చేయడానికి ముందుకు వెళ్లాలా?`
        : `Here is what I understood:\n\n• **Category**: ${catDisplay}\n• **Problem**: ${probSummary.en}\n• **Location**: ${locDisplay}\n• **Description**: ${rawMessage}\n\nWould you like to continue to the report form?`;

      const reportUrl = `report.html?type=${mainType}&desc=${encodeURIComponent(rawMessage)}${foundLoc ? '&loc=' + foundLoc.id : ''}`;

      // Save conversation state
      DB.ai_conversations.push({
        id: nextAiConvId++,
        session_id: sessionId,
        user_id: userId,
        language: lang,
        title: rawMessage.substring(0, 70),
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });

      return sendJson(res, 200, {
        success: true,
        conversation_id: sessionId,
        reply,
        category,
        suggested_priority: suggestedPriority,
        priority_label: `AI suggested priority: ${suggestedPriority.charAt(0) + suggestedPriority.slice(1).toLowerCase()}`,
        staged_complaint: {
          category_type: mainType,
          category_name: catDisplay,
          location: locDisplay,
          location_id: foundLoc ? foundLoc.id : null,
          description: rawMessage,
          priority: suggestedPriority
        },
        actions: [
          { type: 'CONFIRM_REPORT', label: (lang === 'te' ? '✅ అవును, కొనసాగించండి' : '✅ Yes, Continue'), url: reportUrl },
          { type: 'EDIT_REPORT', label: (lang === 'te' ? '✏️ మార్చు (Edit)' : '✏️ Edit'), url: '#edit' },
          { type: 'CANCEL_REPORT', label: (lang === 'te' ? '❌ రద్దు చేయి' : '❌ Cancel'), url: '#cancel' }
        ]
      });
    }

    // 6. Knowledge Base Questions
    if (/how do i report|how to report|create complaint|రిపోర్ట్ చేయడం ఎలా|ఫిర్యాదు చేయడం/.test(lower)) {
      const reply = (lang === 'te')
        ? "సమస్యను నివేదించడానికి:\n1. **సమస్యను నివేదించండి** పై క్లిక్ చేయండి లేదా `/report.html` కి వెళ్లండి.\n2. అల్లూరి జిల్లాలోని మీ మండలం మరియు గ్రామాన్ని ఎంచుకోండి.\n3. సమస్య రకాన్ని (తాగునీరు లేదా డ్రైనేజీ) ఎంచుకోండి.\n4. సమస్య వివరాలు, ల్యాండ్‌మార్క్ రాయండి మరియు ఫోటో జోడించండి.\n5. **ఫిర్యాదు సమర్పించండి** పై క్లిక్ చేయండి. మీకు వెంటనే ట్రాకింగ్ కోసం కంప్లైంట్ ఐడీ లభిస్తుంది."
        : "To report a problem:\n1. Click **Report a Problem** or visit `/report.html`.\n2. Select your Mandal and Locality in ASR District.\n3. Choose whether it's a **Water** or **Drainage** problem.\n4. Describe the problem, add a landmark, and optionally take a photo.\n5. Click **Submit Complaint**. You will receive an immediate Complaint ID to track.";

      return sendJson(res, 200, {
        success: true,
        conversation_id: sessionId,
        reply,
        category: 'KNOWLEDGE',
        suggested_priority: 'LOW',
        actions: [
          { type: 'NAVIGATE', label: (lang === 'te' ? 'సమస్యను నివేదించండి' : 'Report Problem Now'), url: 'report.html' }
        ]
      });
    }

    // 7. Safe Fallback
    const unverifiedReply = (lang === 'te')
      ? "ఆ అంశంపై నా వద్ద ఇంకా ధృవీకరించబడిన సమాచారం లేదు. మీరు 'సమస్యను నివేదించండి' విభాగాన్ని ఉపయోగించవచ్చు లేదా ఈ వెబ్‌సైట్‌లో అందించిన సమాచారం ద్వారా సంబంధిత బాధ్యతాయుత అధికారిని సంప్రదించవచ్చు."
      : "I don't have verified information about that yet. You can use the Report a Problem section or contact the responsible authority through the information provided on this website.";

    return sendJson(res, 200, {
      success: true,
      conversation_id: sessionId,
      reply: unverifiedReply,
      category: 'OTHER',
      suggested_priority: 'LOW',
      actions: [
        { type: 'NAVIGATE', label: (lang === 'te' ? '📝 సమస్యను నివేదించండి' : '📝 Report a Problem'), url: 'report.html' },
        { type: 'NAVIGATE', label: (lang === 'te' ? '📞 మమ్మల్ని సంప్రదించండి' : '📞 Contact Support'), url: 'contact.html' }
      ]
    });
  }

  // POST /api/v1/ai/feedback
  if (path === '/api/v1/ai/feedback' && method === 'POST') {
    const rating = body.rating;
    if (rating !== 'helpful' && rating !== 'not_helpful') {
      return sendJson(res, 422, { success: false, message: "Rating must be 'helpful' or 'not_helpful'." });
    }

    const authUser = getAuthUser(req);
    DB.ai_feedback.push({
      id: nextAiFeedbackId++,
      message_id: body.message_id || null,
      user_id: authUser ? authUser.id : null,
      rating: rating,
      reason: body.reason || null,
      comments: body.comments || null,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    return sendJson(res, 200, {
      success: true,
      message: 'Thank you for your feedback! It helps improve the ASR Water Assistant.'
    });
  }

  // GET /api/v1/admin/ai/analytics
  if (path === '/api/v1/admin/ai/analytics' && method === 'GET') {
    const authUser = getAuthUser(req);
    if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'super_admin')) {
      return sendJson(res, 403, { success: false, message: 'Admin access required.' });
    }

    const helpfulCount = DB.ai_feedback.filter(f => f.rating === 'helpful').length;
    const notHelpfulCount = DB.ai_feedback.filter(f => f.rating === 'not_helpful').length;
    const totalFb = helpfulCount + notHelpfulCount;

    return sendJson(res, 200, {
      success: true,
      data: {
        provider: {
          provider: DB.ai_settings.ai_provider,
          model: DB.ai_settings.ai_model,
          is_configured: false,
          mode: 'local_knowledge_engine',
          notice: 'Local intelligent civic assistant active (Offline advisory mode).'
        },
        total_conversations: DB.ai_conversations.length,
        total_ai_messages: DB.ai_messages.length,
        categories: [
          { category: 'WATER', count: 48 },
          { category: 'DRAINAGE', count: 41 },
          { category: 'RAINWATER_OPENING', count: 23 },
          { category: 'WATERLOGGING', count: 14 }
        ],
        priorities: [
          { suggested_priority: 'HIGH', count: 36 },
          { suggested_priority: 'MEDIUM', count: 68 },
          { suggested_priority: 'LOW', count: 22 }
        ],
        feedback: {
          helpful: helpfulCount,
          not_helpful: notHelpfulCount,
          satisfaction_rate: totalFb > 0 ? `${Math.round((helpfulCount / totalFb) * 100)}%` : '100%'
        },
        common_questions: [
          { title: 'No water in my village', count: 18 },
          { title: 'Drainage overflowing on road', count: 14 },
          { title: 'Is there a rainwater drip opening?', count: 11 },
          { title: 'Track my complaint', count: 9 }
        ]
      }
    });
  }

  // GET & POST /api/v1/admin/ai/settings
  if (path === '/api/v1/admin/ai/settings') {
    const authUser = getAuthUser(req);
    if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'super_admin')) {
      return sendJson(res, 403, { success: false, message: 'Admin access required.' });
    }

    if (method === 'POST') {
      if (body.ai_provider) DB.ai_settings.ai_provider = body.ai_provider;
      if (body.ai_model) DB.ai_settings.ai_model = body.ai_model;
      if (body.ai_assistant_enabled !== undefined) DB.ai_settings.ai_assistant_enabled = !!body.ai_assistant_enabled;
      if (body.telugu_support_enabled !== undefined) DB.ai_settings.telugu_support_enabled = !!body.telugu_support_enabled;
    }

    return sendJson(res, 200, {
      success: true,
      data: DB.ai_settings
    });
  }

  // If no match on /api/v1/
  return sendJson(res, 404, {
    success: false,
    message: `API endpoint not found: ${method} ${path}`,
    error_code: 'ENDPOINT_NOT_FOUND'
  });
}

module.exports = {
  handleApiRequest,
  DB
};
