/**
 * ASR Water & Drainage - End-to-End REST API Integration Test Suite
 * 
 * Verifies all 16 steps of the mandatory civic workflow, role authorization,
 * validation, privacy sanitization, and administrative state transitions.
 * 
 * Run with: node tests/e2e_backend_test.js
 */

const BASE_URL = 'http://localhost:3000/api/v1';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    testsFailed++;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof String)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType.includes('text/csv')) {
    data = await response.text();
  } else {
    data = await response.text();
  }

  return { status: response.status, headers: response.headers, data };
}

async function runWorkflow() {
  console.log('================================================================');
  console.log('🚀 ASR WATER & DRAINAGE: COMPREHENSIVE END-TO-END WORKFLOW TEST');
  console.log('================================================================\n');

  let citizenToken = '';
  let adminToken = '';
  let paderuLocationId = null;
  let waterCategoryId = null;
  let createdComplaintNumber = '';
  let createdComplaintId = null;

  // --------------------------------------------------------------------------
  // STEP 1: Citizen registers
  // --------------------------------------------------------------------------
  console.log('👉 STEP 1: Citizen Registration');
  const uniqueEmail = `test.citizen.${Date.now()}@asr.civic`;
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Ramu Kondaveti',
      email: uniqueEmail,
      phone: '9848123456',
      password: 'CitizenSecurePass2026!',
      preferred_language: 'te'
    }
  });

  assert(regRes.status === 201, `Registration returns HTTP 201 Created (got ${regRes.status})`);
  assert(regRes.data.success === true, 'Response success flag is true');
  assert(regRes.data.data.user.email === uniqueEmail, 'User profile registered with provided email');
  assert(regRes.data.data.user.role === 'citizen', 'Role correctly assigned as citizen');
  assert(!regRes.data.data.user.password_hash, 'Security: password_hash never exposed in response');

  // --------------------------------------------------------------------------
  // STEP 2: Citizen logs in
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 2: Citizen Authentication & Login');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: uniqueEmail,
      password: 'CitizenSecurePass2026!'
    }
  });

  assert(loginRes.status === 200, `Login returns HTTP 200 OK (got ${loginRes.status})`);
  assert(!!loginRes.data.data?.token, 'Authentication returns secure session token');
  citizenToken = loginRes.data.data.token;

  // Test /auth/me
  const meRes = await request('/auth/me', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${citizenToken}` }
  });
  assert(meRes.status === 200, 'Authenticated profile verified via /auth/me');

  // --------------------------------------------------------------------------
  // STEP 3: Citizen selects: Paderu
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 3: Hierarchical Location Lookup (Paderu)');
  const locRes = await request('/locations', { method: 'GET' });
  assert(locRes.status === 200, 'Locations endpoint returns HTTP 200');
  const paderu = locRes.data.data.find(l => l.name.toLowerCase().includes('paderu'));
  assert(!!paderu, 'Paderu mandal found in locations hierarchy');
  paderuLocationId = paderu.id;
  console.log(`   Found Location: ${paderu.name} (ID: ${paderuLocationId}, Telugu: ${paderu.name_te})`);

  // --------------------------------------------------------------------------
  // STEP 4: Citizen selects: Water Category
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 4: Category Lookup (Drinking Water)');
  const catRes = await request('/categories?type=water', { method: 'GET' });
  assert(catRes.status === 200, 'Categories endpoint returns HTTP 200');
  const waterCategory = catRes.data.data.find(c => c.type === 'water');
  assert(!!waterCategory, 'Water categories available');
  waterCategoryId = waterCategory.id;
  console.log(`   Found Category: ${waterCategory.name} (ID: ${waterCategoryId}, Type: ${waterCategory.type})`);

  // --------------------------------------------------------------------------
  // STEP 5 & 6: Citizen submits complaint & Backend generates ASR-WD-XXXXXX
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 5 & 6: Citizen Submits Problem & Backend Generates ID');
  const complaintPayload = {
    location_id: paderuLocationId,
    category_id: waterCategoryId,
    title: 'No drinking water supply in the area',
    description: 'No drinking water supply in the area for the past 48 hours. Public borewell motor failed.',
    landmark: 'Near Paderu Market Complex',
    latitude: 18.0833,
    longitude: 82.6667,
    citizen_severity: 'high'
  };

  const createRes = await request('/complaints', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${citizenToken}` },
    body: complaintPayload
  });

  assert(createRes.status === 201, `Complaint creation returns HTTP 201 Created (got ${createRes.status})`);
  const createdComplaint = createRes.data.data.complaint;
  createdComplaintId = createdComplaint.id;
  createdComplaintNumber = createdComplaint.complaint_number;

  assert(createdComplaint.status === 'submitted', 'Initial complaint status is "submitted"');
  assert(/^ASR-WD-\d{6}$/.test(createdComplaintNumber), `Generated complaint number format verified: ${createdComplaintNumber}`);

  // --------------------------------------------------------------------------
  // STEP 7: Admin logs in
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 7: Administrator Login');
  const adminLoginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@asr.civic',
      password: 'admin123'
    }
  });

  assert(adminLoginRes.status === 200, `Admin login returns HTTP 200 OK (got ${adminLoginRes.status})`);
  assert(adminLoginRes.data.data.user.role === 'admin', 'User has admin role privileges');
  adminToken = adminLoginRes.data.data.token;

  // --------------------------------------------------------------------------
  // STEP 8: Admin dashboard displays new complaint
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 8: Admin Dashboard Statistics Verification');
  const dashRes = await request('/admin/dashboard', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  assert(dashRes.status === 200, 'Admin dashboard returns HTTP 200 OK');
  assert(dashRes.data.data.stats.total_complaints > 0, `Dashboard reports total complaints: ${dashRes.data.data.stats.total_complaints}`);
  assert(dashRes.data.data.stats.new_complaints > 0, `Dashboard reports new/submitted complaints: ${dashRes.data.data.stats.new_complaints}`);
  const hasInRecent = dashRes.data.data.recent_complaints.some(c => c.complaint_number === createdComplaintNumber);
  assert(hasInRecent, `New complaint ${createdComplaintNumber} appears in Admin Recent Complaints list`);

  // --------------------------------------------------------------------------
  // STEP 9: Admin reviews complaint
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 9: Admin Reviews Complaint Details');
  const trackRes = await request(`/complaints/track?number=${createdComplaintNumber}`, {
    method: 'GET'
  });
  assert(trackRes.status === 200, 'Complaint details retrieved');
  assert(trackRes.data.data.complaint.title === 'No drinking water supply in the area', 'Complaint title verified');

  // --------------------------------------------------------------------------
  // STEP 10 & 11: Admin assigns to authorized organization & status becomes 'assigned'/'in_progress'
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 10 & 11: Admin Assigns Complaint to RWSS & Updates Status');
  const assignRes = await request(`/admin/complaints/${createdComplaintId}/assign`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: {
      organization_id: 1, // Rural Water Supply & Sanitation (RWSS)
      assigned_user_id: 3,
      notes: 'Emergency pump replacement crew assigned to Paderu sector.'
    }
  });

  assert(assignRes.status === 200, `Assignment returns HTTP 200 OK (got ${assignRes.status})`);
  assert(assignRes.data.data.complaint.assigned_organization_id === 1, 'Assigned organization ID recorded');
  assert(assignRes.data.data.complaint.status === 'assigned', 'Status transitioned to "assigned"');

  // Transition to in_progress
  const inProgressRes = await request(`/admin/complaints/${createdComplaintId}/status`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: {
      status: 'in_progress',
      message: 'Field technician team dispatched with replacement 5HP pump.',
      is_public: true
    }
  });

  assert(inProgressRes.status === 200, 'Status update returns HTTP 200 OK');
  assert(inProgressRes.data.data.complaint.status === 'in_progress', 'Status transitioned to "in_progress"');

  // --------------------------------------------------------------------------
  // STEP 12: Organization adds work update
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 12: Organization Updates Field Work Progress');
  const orgUpdateRes = await request(`/admin/complaints/${createdComplaintId}/status`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: {
      status: 'in_progress',
      message: 'Pump installation complete; flushing pipes and checking water pressure.',
      is_public: true
    }
  });
  assert(orgUpdateRes.status === 200, 'Field progress update recorded');

  // --------------------------------------------------------------------------
  // STEP 13: Admin marks complaint as Resolved
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 13: Admin Marks Complaint as Resolved');
  const resolveRes = await request(`/admin/complaints/${createdComplaintId}/resolve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: {
      resolution_notes: 'New 5HP borewell motor installed, water supply restored to full pressure. Verified on site.'
    }
  });

  assert(resolveRes.status === 200, 'Resolution returns HTTP 200 OK');
  assert(resolveRes.data.data.complaint.status === 'resolved', 'Complaint status is "resolved"');
  assert(!!resolveRes.data.data.complaint.resolved_at, 'resolved_at timestamp populated');

  // --------------------------------------------------------------------------
  // STEP 14: Citizen sees the updated public timeline
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 14: Citizen Public Timeline & Privacy Verification');
  const publicTrackRes = await request(`/complaints/track?number=${createdComplaintNumber}`, {
    method: 'GET'
  });

  assert(publicTrackRes.status === 200, 'Public tracking lookup succeeded');
  const publicData = publicTrackRes.data.data;
  assert(publicData.complaint.status === 'resolved', 'Public tracking shows "resolved" status');
  assert(publicData.timeline.length >= 4, `Timeline contains ${publicData.timeline.length} sequential event milestones`);

  // Privacy Check: Ensure no phone or email exposed publicly
  assert(!publicData.complaint.phone, 'Privacy Check: Citizen phone number NOT exposed');
  assert(!publicData.complaint.email, 'Privacy Check: Citizen email address NOT exposed');
  assert(!publicData.complaint.password_hash, 'Privacy Check: Password hash NOT exposed');

  // --------------------------------------------------------------------------
  // STEP 15: Dashboard analytics update automatically
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 15: Analytics & Real-Time Aggregation Verification');
  const postDashRes = await request('/admin/dashboard', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(postDashRes.data.data.stats.resolved >= 1, `Dashboard resolved count reflects update: ${postDashRes.data.data.stats.resolved}`);

  // --------------------------------------------------------------------------
  // STEP 16: Audit log records administrative actions
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 16: Audit Trail Verification');
  const auditRes = await request('/admin/audit-logs', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(auditRes.status === 200, 'Audit logs retrieved successfully');
  const hasResolveLog = auditRes.data.data.some(log => log.entity_id === createdComplaintId && log.action === 'RESOLVE_COMPLAINT');
  assert(hasResolveLog, `Audit log contains record of RESOLVE_COMPLAINT for complaint #${createdComplaintId}`);

  // --------------------------------------------------------------------------
  // STEP 17: Security & Privilege Escalation Prevention
  // --------------------------------------------------------------------------
  console.log('\n👉 STEP 17: Role-Based Authorization & Security Protection');
  // Citizen attempting to access admin dashboard should be denied (403)
  const forbiddenRes = await request('/admin/dashboard', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${citizenToken}` }
  });
  assert(forbiddenRes.status === 403, `Citizen denied access to admin dashboard (got HTTP ${forbiddenRes.status})`);

  // Unauthenticated request to admin complaints should be rejected (401 or 403)
  const unauthRes = await request('/admin/complaints/1/assign', {
    method: 'POST',
    body: { organization_id: 1 }
  });
  assert(unauthRes.status === 403 || unauthRes.status === 401, `Unauthenticated assignment rejected (got HTTP ${unauthRes.status})`);

  // CSV Report Export Verification
  console.log('\n👉 STEP 18: CSV Report Generation');
  const csvRes = await request('/admin/reports/csv', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(csvRes.status === 200, 'CSV report generated with HTTP 200');
  assert(csvRes.data.includes('Complaint Number') && csvRes.data.includes(createdComplaintNumber), 'CSV data contains headers and complaint record');

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runWorkflow().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
