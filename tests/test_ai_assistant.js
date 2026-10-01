/**
 * ASR Water & Drainage - AI Assistant Automated Verification Suite
 * Tests all 12 core acceptance questions, safety alerts, rainwater logic, Telugu NLP, and tracking
 */

const http = require('http');

function postJson(urlPath, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJson(urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: 'GET',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log("🧪 RUNNING ASR WATER ASSISTANT (JALA MITRA) VERIFICATION SUITE");
  console.log("==================================================================\n");

  const testCases = [
    {
      id: 1,
      name: "1. There is no drinking water.",
      message: "There is no drinking water in our village.",
      expectCategory: "WATER",
      expectActionType: "CONFIRM_REPORT"
    },
    {
      id: 2,
      name: "2. Drainage is blocked.",
      message: "Drainage is blocked near the market road.",
      expectCategory: "DRAINAGE",
      expectActionType: "CONFIRM_REPORT"
    },
    {
      id: 3,
      name: "3. Rainwater is collecting on the road.",
      message: "Rainwater is collecting on the road near Chintapalle.",
      expectCategory: "WATERLOGGING",
      expectActionType: "CONFIRM_REPORT"
    },
    {
      id: 4,
      name: "4. There is no rainwater opening.",
      message: "There is no rainwater opening available on this street.",
      expectCategory: "RAINWATER_OPENING",
      expectActionType: "RAINWATER_REPORT"
    },
    {
      id: 5,
      name: "5. The rainwater opening is blocked.",
      message: "Yes, available, but the rainwater opening is blocked with silt.",
      expectCategory: "RAINWATER_OPENING"
    },
    {
      id: 6,
      name: "6. I am not sure whether an opening exists.",
      message: "I am not sure whether a rainwater opening is available here.",
      expectCategory: "RAINWATER_OPENING",
      expectTextContains: "needs verification"
    },
    {
      id: 7,
      name: "7. How do I report a problem?",
      message: "How do I report a problem?",
      expectCategory: "KNOWLEDGE",
      expectActionType: "NAVIGATE"
    },
    {
      id: 8,
      name: "8. Track my complaint.",
      message: "Track my complaint",
      expectCategory: "TRACKING"
    },
    {
      id: 9,
      name: "9. మా ఊరిలో నీళ్లు రావడం లేదు (Telugu Water)",
      message: "మా ఊరిలో నీళ్లు రావడం లేదు.",
      expectCategory: "WATER",
      expectTextContains: "తాగునీరు"
    },
    {
      id: 10,
      name: "10. డ్రైనేజ్ బ్లాక్ అయింది (Telugu Drainage)",
      message: "డ్రైనేజ్ నీళ్లు రోడ్డుపైకి వస్తున్నాయి బ్లాక్ అయింది.",
      expectCategory: "DRAINAGE",
      expectTextContains: "డ్రైనేజీ"
    },
    {
      id: 11,
      name: "11. వర్షపు నీరు రోడ్డుపై నిలిచిపోయింది (Telugu Waterlogging)",
      message: "వర్షపు నీరు రోడ్డుపై నిలిచిపోయింది.",
      expectCategory: "WATERLOGGING",
      expectTextContains: "వాటర్‌లాగింగ్"
    },
    {
      id: 12,
      name: "12. నా కంప్లైంట్ స్టేటస్ చెప్పండి (Telugu Tracking)",
      message: "నా కంప్లైంట్ స్టేటస్ చెప్పండి.",
      expectCategory: "TRACKING",
      expectTextContains: "ఫిర్యాదు సంఖ్య"
    },
    {
      id: 13,
      name: "13. Safety Hazard: Water touching electrical wire",
      message: "Water is touching an electrical wire near the transformer!",
      expectCategory: "OTHER",
      expectPriority: "URGENT",
      expectTextContains: "CRITICAL SAFETY WARNING"
    },
    {
      id: 14,
      name: "14. Specific Tracking: ASR-WD-000001",
      message: "What happened to ASR-WD-000001?",
      expectCategory: "TRACKING",
      expectTextContains: "ASR-WD-000001"
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    try {
      const res = await postJson('/api/v1/ai/chat', {
        message: tc.message,
        language: 'en',
        conversation_id: 'test_session_' + tc.id
      });

      if (res.status !== 200 || !res.data || !res.data.success) {
        console.error(`❌ [${tc.name}] Failed with status ${res.status}:`, res.data || res.body);
        failed++;
        continue;
      }

      const d = res.data;
      let ok = true;
      let reason = '';

      if (tc.expectCategory && d.category !== tc.expectCategory) {
        ok = false;
        reason += `Expected category ${tc.expectCategory}, got ${d.category}. `;
      }

      if (tc.expectPriority && d.suggested_priority !== tc.expectPriority) {
        ok = false;
        reason += `Expected priority ${tc.expectPriority}, got ${d.suggested_priority}. `;
      }

      if (tc.expectTextContains && !d.reply.toLowerCase().includes(tc.expectTextContains.toLowerCase())) {
        ok = false;
        reason += `Reply did not contain "${tc.expectTextContains}". `;
      }

      if (tc.expectActionType && (!d.actions || !d.actions.some(a => a.type === tc.expectActionType))) {
        ok = false;
        reason += `Expected action type ${tc.expectActionType}. `;
      }

      if (ok) {
        console.log(`✅ [${tc.name}] Passed! Category: ${d.category}, Priority: ${d.suggested_priority || 'N/A'}`);
        passed++;
      } else {
        console.error(`❌ [${tc.name}] Failed: ${reason}`);
        console.log(`   Reply was: ${d.reply.substring(0, 100)}...`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ [${tc.name}] Exception:`, err.message);
      failed++;
    }
  }

  // Test Feedback API
  try {
    const fbRes = await postJson('/api/v1/ai/feedback', {
      rating: 'helpful',
      message_id: 1,
      comments: 'Great assistance!'
    });
    if (fbRes.status === 200 && fbRes.data.success) {
      console.log(`✅ [15. Feedback API] Passed!`);
      passed++;
    } else {
      console.error(`❌ [15. Feedback API] Failed with status ${fbRes.status}`);
      failed++;
    }
  } catch (e) {
    console.error(`❌ [15. Feedback API] Error:`, e.message);
    failed++;
  }

  // Test Admin Login & Admin AI Analytics API
  try {
    const loginRes = await postJson('/api/v1/auth/login', {
      email: 'admin@asr.civic',
      password: 'admin123'
    });

    if (loginRes.status === 200 && loginRes.data.data && loginRes.data.data.token) {
      const token = loginRes.data.data.token;
      const analyticsRes = await getJson('/api/v1/admin/ai/analytics', {
        'Authorization': `Bearer ${token}`
      });

      if (analyticsRes.status === 200 && analyticsRes.data.success && analyticsRes.data.data) {
        console.log(`✅ [16. Admin AI Analytics API] Passed! Total convs: ${analyticsRes.data.data.total_conversations}`);
        passed++;
      } else {
        console.error(`❌ [16. Admin AI Analytics API] Failed status ${analyticsRes.status}`);
        failed++;
      }
    } else {
      console.error(`❌ [16. Admin Login] Failed to authenticate admin`);
      failed++;
    }
  } catch (e) {
    console.error(`❌ [16. Admin AI Analytics API] Error:`, e.message);
    failed++;
  }

  console.log(`\n==================================================================`);
  console.log(`🏁 TEST SUITE COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log(`==================================================================\n`);

  if (failed === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite();
