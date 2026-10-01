/**
 * ASR Water & Drainage - Rainwater Module Automated Test Suite
 * Validates Scenarios 1 to 5 from Section 53 of the Master Upgrade Specification.
 */

const BASE_URL = 'http://localhost:3000/api/v1';

async function runTests() {
  console.log('======================================================');
  console.log('🧪 RUNNING ASR RAINWATER MODULE SPECIFICATION TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Helper fetch
  async function api(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    return res.json();
  }

  // 0. Authenticate Admin
  console.log('0. Admin Login for Verification Tests...');
  const loginRes = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@asr.civic', password: 'admin123' })
  });
  assert(loginRes.success && loginRes.data.token, 'Admin authenticated successfully');
  const adminToken = loginRes.data.token;
  const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

  // TEST 1: Opening Available
  console.log('\n--- TEST 1: Opening Available (Good Condition) ---');
  const test1Payload = {
    location_id: 2, // Paderu
    availability_status: 'available',
    condition_status: 'good',
    landmark: 'Opposite Community Library, Paderu',
    description: 'RCC drip opening installed properly along concrete road channel.',
    raise_problem: false
  };
  const res1 = await api('/rainwater', { method: 'POST', body: JSON.stringify(test1Payload) });
  assert(res1.success === true, 'Test 1 report created successfully');
  assert(res1.data.report_number.startsWith('ASR-RW-REP-'), 'Report number generated format ASR-RW-REP-XXXXXX');
  assert(res1.data.availability_status === 'available', 'Availability is available');
  assert(res1.data.condition_status === 'good', 'Condition is good');
  assert(res1.data.complaint_id === null, 'No complaint created for Good Available opening');
  const test1RepId = res1.data.report_id;

  // TEST 2: Opening Missing -> Linked Complaint -> Admin Verify -> Assign -> Track
  console.log('\n--- TEST 2: Opening Missing (Not Available) ---');
  const test2Payload = {
    location_id: 2, // Paderu
    availability_status: 'not_available',
    landmark: 'Weekly Market Junction, Paderu',
    description: 'No rainwater drainage opening available at this road corner.',
    citizen_severity: 'high',
    raise_problem: true
  };
  const res2 = await api('/rainwater', { method: 'POST', body: JSON.stringify(test2Payload) });
  assert(res2.success === true, 'Test 2 report created successfully');
  assert(res2.data.availability_status === 'not_available', 'Availability is not_available');
  assert(res2.data.complaint_number && res2.data.complaint_number.startsWith('ASR-RW-'), `Complaint generated with prefix ASR-RW- (${res2.data.complaint_number})`);
  const rwComplaintNo = res2.data.complaint_number;
  const test2RepId = res2.data.report_id;

  // Verify complaint is trackable via public tracking API
  console.log('   Tracking complaint via public tracking API...');
  const trackRes = await api(`/complaints/track?number=${rwComplaintNo}`);
  assert(trackRes.success === true, 'Complaint tracked successfully');
  assert(trackRes.data.complaint.complaint_number === rwComplaintNo, 'Complaint number matches');
  assert(trackRes.data.complaint.category_type === 'rainwater', 'Category type is rainwater');
  assert(trackRes.data.complaint.status === 'submitted', 'Initial status is submitted');

  // Admin verifies Test 2 report
  console.log('   Admin verifying report...');
  const verifyRes = await api(`/admin/rainwater/${test2RepId}/verify`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ verification_status: 'verified', verification_notes: 'Site inspection confirmed no drainage opening.' })
  });
  assert(verifyRes.success === true, 'Admin verified report');
  assert(verifyRes.data.verification_status === 'verified', 'Report status updated to verified');

  // Verify complaint workflow advanced
  const trackAfterVerify = await api(`/complaints/track?number=${rwComplaintNo}`);
  assert(trackAfterVerify.data.complaint.status === 'under_review', 'Complaint advanced to under_review after verification');

  // Admin assigns complaint to organization (PRED: Civil Works id: 3)
  console.log('   Admin assigning complaint to PRED organization...');
  const assignRes = await api(`/admin/rainwater/${test2RepId}/assign`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ organization_id: 3, notes: 'Assign to PRED for culvert drip construction.' })
  });
  assert(assignRes.success === true, 'Admin assigned rainwater complaint');

  const trackAfterAssign = await api(`/complaints/track?number=${rwComplaintNo}`);
  assert(trackAfterAssign.data.complaint.status === 'assigned', 'Complaint advanced to assigned');

  // TEST 3: Blocked Opening
  console.log('\n--- TEST 3: Blocked Opening ---');
  const test3Payload = {
    location_id: 2, // Paderu
    availability_status: 'available',
    condition_status: 'blocked',
    landmark: 'RTC Bus Stand Culvert, Paderu',
    description: 'Rainwater opening exists but is completely blocked by silt and plastics.',
    raise_problem: true
  };
  const res3 = await api('/rainwater', { method: 'POST', body: JSON.stringify(test3Payload) });
  assert(res3.success === true, 'Test 3 report created');
  assert(res3.data.condition_status === 'blocked', 'Condition is blocked');
  assert(res3.data.complaint_number && res3.data.complaint_number.startsWith('ASR-RW-'), `Complaint generated for blocked opening (${res3.data.complaint_number})`);
  
  const track3 = await api(`/complaints/track?number=${res3.data.complaint_number}`);
  assert(track3.data.complaint.title.includes('Blocked'), `Complaint title mentions blocked: "${track3.data.complaint.title}"`);

  // TEST 4: Damaged Opening
  console.log('\n--- TEST 4: Damaged Opening ---');
  const test4Payload = {
    location_id: 3, // Araku
    availability_status: 'available',
    condition_status: 'damaged',
    landmark: 'Railway Station Road, Araku',
    description: 'Concrete grating broken and collapsed into drain.',
    raise_problem: true
  };
  const res4 = await api('/rainwater', { method: 'POST', body: JSON.stringify(test4Payload) });
  assert(res4.success === true, 'Test 4 report created');
  assert(res4.data.condition_status === 'damaged', 'Condition is damaged');
  assert(res4.data.complaint_number && res4.data.complaint_number.startsWith('ASR-RW-'), `Complaint generated for damaged opening (${res4.data.complaint_number})`);

  const track4 = await api(`/complaints/track?number=${res4.data.complaint_number}`);
  assert(track4.data.complaint.title.includes('Damaged'), `Complaint title mentions damaged: "${track4.data.complaint.title}"`);

  // TEST 5: Not Sure Workflow
  console.log('\n--- TEST 5: Not Sure Workflow ---');
  const test5Payload = {
    location_id: 3, // Araku
    availability_status: 'unknown',
    landmark: 'Tribal Museum bylane, Araku',
    description: 'Citizen unsure if opening exists under soil accumulation.',
    raise_problem: false
  };
  const res5 = await api('/rainwater', { method: 'POST', body: JSON.stringify(test5Payload) });
  assert(res5.success === true, 'Test 5 report created');
  assert(res5.data.availability_status === 'unknown', 'Availability is unknown');
  assert(res5.data.verification_status === 'pending', 'Verification is pending');
  assert(res5.data.complaint_id === null, 'Did NOT automatically declare missing or create false complaint');

  // TEST 6: Admin Dashboard & Map Endpoints
  console.log('\n--- TEST 6: Admin Dashboard & Map Endpoints ---');
  const dashRes = await api('/admin/dashboard', { headers: adminHeaders });
  assert(dashRes.success === true, 'Admin dashboard API responded');
  assert(dashRes.data.stats.rainwater_issues > 0, `Dashboard counts rainwater issues (${dashRes.data.stats.rainwater_issues})`);
  assert(dashRes.data.stats.missing_rainwater_openings > 0, `Dashboard counts missing openings (${dashRes.data.stats.missing_rainwater_openings})`);
  assert(dashRes.data.stats.blocked_openings > 0, `Dashboard counts blocked openings (${dashRes.data.stats.blocked_openings})`);

  const mapRes = await api('/map/rainwater');
  assert(mapRes.success === true && Array.isArray(mapRes.data), 'Map rainwater endpoint returned array of pins');
  assert(mapRes.data.length >= 3, `Map contains ${mapRes.data.length} rainwater points`);

  // Analytics endpoint
  const analyticsRes = await api('/admin/rainwater/analytics', { headers: adminHeaders });
  assert(analyticsRes.success === true, 'Admin rainwater analytics API responded');
  assert(analyticsRes.data.total_reports >= 5, `Total reports recorded: ${analyticsRes.data.total_reports}`);

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
