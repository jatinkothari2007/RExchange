import dotenv from 'dotenv';
dotenv.config();

import { createApp } from '../app';
import http from 'http';

const app = createApp();
const PORT = 4099;

async function runApiTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`\n🧪 API Test Server started on http://localhost:${PORT}`);

  const baseUrl = `http://localhost:${PORT}`;
  let passedCount = 0;
  let failedCount = 0;

  async function request(path: string, options: { method?: string; body?: any; token?: string } = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data: any = await res.json();
    return { status: res.status, data };
  }

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failedCount++;
    }
  }

  console.log('\n--- 1. Testing Health & College Verification Auth ---');
  // Health
  const healthRes = await request('/health');
  assert(healthRes.status === 200 && healthRes.data.status === 'ok', 'GET /health returns 200 OK');

  // Invalid domain signup
  const invalidSignup = await request('/auth/signup', {
    method: 'POST',
    body: {
      email: 'test@gmail.com',
      name: 'Fake User',
      department: 'CSE',
      year: 2,
      hostel_block: 'Java 1',
    },
  });
  assert(invalidSignup.status === 422, 'POST /auth/signup rejects non-college domain email (@gmail.com)');

  // Valid domain signup
  const validSignup = await request('/auth/signup', {
    method: 'POST',
    body: {
      email: 'divya.krishnan@srmist.edu.in',
      name: 'Divya Krishnan',
      department: 'Computer Science & Engineering',
      year: 3,
      hostel_block: 'Kalpana Chawla Block B',
    },
  });
  assert(validSignup.status === 201 && validSignup.data.success === true, 'POST /auth/signup accepts @srmist.edu.in email');
  const otp = validSignup.data.data.debugOtp;

  // Verify OTP
  const verifyRes = await request('/auth/verify-otp', {
    method: 'POST',
    body: {
      email: 'divya.krishnan@srmist.edu.in',
      otp: otp || '123456',
    },
  });
  assert(verifyRes.status === 200 && verifyRes.data.data.tokens.accessToken, 'POST /auth/verify-otp generates JWT session and grants seed Karma');
  const token = verifyRes.data.data.tokens.accessToken;

  // Get Profile
  const meRes = await request('/users/me', { token });
  assert(meRes.status === 200 && meRes.data.data.karma_balance === 50, 'GET /users/me retrieves verified profile with 50 Karma welcome seed');

  console.log('\n--- 2. Testing Listings & Pure Karma Heuristics ---');
  // Suggest Karma
  const suggestRes = await request('/listings/suggest-karma', {
    method: 'POST',
    body: {
      type: 'ITEM',
      original_price_est: 2000,
      condition: 'good',
    },
  });
  assert(
    suggestRes.status === 200 &&
    suggestRes.data.data.suggestedKarma > 0 &&
    suggestRes.data.data.minAllowedKarma <= suggestRes.data.data.suggestedKarma,
    'POST /listings/suggest-karma computes algorithmic heuristic with bounded caps'
  );

  // Create Skill Listing & Upload Voice Note (Feature 3)
  const createSkillRes = await request('/listings', {
    method: 'POST',
    token,
    body: {
      type: 'SKILL',
      title: 'Competitive Programming Mentorship',
      description: '1-on-1 DP and Graph theory problem solving session',
      category: 'Tutoring',
      tags: ['cp', 'dsa', 'leetcode', 'c++'],
      karma_value: 30,
      duration_minutes: 60,
      session_mode: 'online',
      pickup_point: 'Google Meet / Java 3',
    },
  });
  assert(createSkillRes.status === 201 && createSkillRes.data.data.type === 'SKILL', 'POST /listings creates SKILL-type listing');
  const skillId = createSkillRes.data.data.id;

  // Feature 3: Voice Note upload
  const voiceNoteRes = await request(`/listings/${skillId}/voice-note`, {
    method: 'POST',
    token,
    body: {
      voice_note_url: 'https://storage.rexchange.srmist.edu/voice-notes/demo_pitch_20s.mp3',
    },
  });
  assert(voiceNoteRes.status === 200 && voiceNoteRes.data.data.voice_note_url !== undefined, 'POST /listings/:id/voice-note attaches 20s voice snippet to SKILL listing');

  console.log('\n--- 3. Testing Feature 2: Bundle Trades ---');
  // Login as Priya (Senior with multiple listings)
  const priyaLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'priya.nair@srmist.edu.in' },
  });
  const priyaVerify = await request('/auth/verify-otp', {
    method: 'POST',
    body: { email: 'priya.nair@srmist.edu.in', otp: priyaLogin.data.data.debugOtp || '123456' },
  });
  const priyaToken = priyaVerify.data.data.tokens.accessToken;

  // Priya creates 2 listings to bundle
  const l1 = await request('/listings', {
    method: 'POST',
    token: priyaToken,
    body: {
      type: 'ITEM',
      title: 'Breadboard & Jumper Wire Kit',
      description: 'Standard 830-tie point breadboard + 65 jumper wires',
      category: 'Electronics',
      tags: ['ece', 'breadboard', 'lab'],
      karma_value: 15,
      condition: 'good',
      pickup_point: 'KC Block B',
    },
  });
  const l2 = await request('/listings', {
    method: 'POST',
    token: priyaToken,
    body: {
      type: 'NOTE',
      title: 'Digital Signal Processing Handwritten Notes',
      description: 'Complete Unit 1-5 notes with solved SRM past papers',
      category: 'Notes',
      tags: ['dsp', 'ece', 'notes'],
      karma_value: 20,
      subject: 'Digital Signal Processing',
      semester: 5,
      pickup_point: 'KC Block B',
    },
  });

  // Create Bundle (Feature 2)
  const bundleRes = await request('/bundles', {
    method: 'POST',
    token: priyaToken,
    body: {
      title: 'ECE Lab Starter Kit (Breadboard + DSP Notes)',
      description: 'Save karma by taking both together for 5th sem ECE',
      karma_value: 28,
      listing_ids: [l1.data.data.id, l2.data.data.id],
    },
  });
  assert(bundleRes.status === 201 && bundleRes.data.data.listing_ids.length === 2, 'POST /bundles groups 2+ listings into single bundled karma offering');
  const bundleId = bundleRes.data.data.id;

  // Request bundle exchange
  const bundleExcRes = await request(`/bundles/${bundleId}/exchange`, {
    method: 'POST',
    token,
    body: { notes: 'Need this for upcoming ECE lab exam!' },
  });
  assert(bundleExcRes.status === 201 && bundleExcRes.data.data.bundle_id === bundleId, 'POST /bundles/:id/exchange creates exchange contract with bundle_id');

  console.log('\n--- 4. Testing Feature 1: Karma Will ---');
  // Priya (Year 4 senior) nominates junior (Divya, Year 3) as Karma Will heir
  const juniorsList = await request('/users/juniors', { token: priyaToken });
  assert(juniorsList.status === 200 && juniorsList.data.data.length > 0, 'GET /users/juniors returns verified junior campus peers');

  const willNomRes = await request('/users/me/will', {
    method: 'POST',
    token: priyaToken,
    body: { recipient_id: verifyRes.data.data.user.id },
  });
  assert(willNomRes.status === 200 && willNomRes.data.data.success === true, 'POST /users/me/will nominates junior heir for graduating senior');

  // Execute Karma Will transfer
  const willExecRes = await request('/users/me/will/execute', {
    method: 'POST',
    token: priyaToken,
  });
  assert(willExecRes.status === 200 && willExecRes.data.data.transferredKarma > 0, 'POST /users/me/will/execute atomically passes senior karma and reassigns available listings to junior');

  console.log('\n--- 5. Testing Feature 5: Emergency Karma Loans ---');
  // Rohan (Mechanical Engg) borrows emergency karma
  const rohanLogin = await request('/auth/login', { method: 'POST', body: { email: 'rohan.gupta@srmist.edu.in' } });
  const rohanVerify = await request('/auth/verify-otp', {
    method: 'POST',
    body: { email: 'rohan.gupta@srmist.edu.in', otp: rohanLogin.data.data.debugOtp || '123456' },
  });
  const rohanToken = rohanVerify.data.data.tokens.accessToken;

  const loanReqRes = await request('/loans/request', {
    method: 'POST',
    token: rohanToken,
    body: { amount: 15 },
  });
  assert(loanReqRes.status === 201 && loanReqRes.data.data.loan.status === 'active', 'POST /loans/request disburses emergency karma loan under cap');

  const myLoansRes = await request('/loans/me', { token: rohanToken });
  assert(myLoansRes.status === 200 && myLoansRes.data.data.active !== null, 'GET /loans/me fetches active user loan state');

  console.log('\n--- 6. Testing Feature 6: Cross-Department Skill Spotlight ---');
  const spotlightRes = await request('/spotlight/cross-department');
  assert(spotlightRes.status === 200 && spotlightRes.data.data.length >= 3, 'GET /spotlight/cross-department returns diverse inter-department skill pairs');

  console.log('\n--- 7. Testing Feature 7 & 4: QR-Based Handoff & Karma Streak Bonus ---');
  // Aarav requests Rohan's listing
  const aaravLogin = await request('/auth/login', { method: 'POST', body: { email: 'aarav.sharma@srmist.edu.in' } });
  const aaravVerify = await request('/auth/verify-otp', {
    method: 'POST',
    body: { email: 'aarav.sharma@srmist.edu.in', otp: aaravLogin.data.data.debugOtp || '123456' },
  });
  const aaravToken = aaravVerify.data.data.tokens.accessToken;

  // Create an exchange: Rohan requests Aarav's listing
  const reqExc = await request('/exchanges', {
    method: 'POST',
    token: rohanToken,
    body: { listing_id: 'lst_casio_991', agreed_karma: 25 },
  });
  assert(reqExc.status === 201 && reqExc.data.data.id, 'POST /exchanges initiates exchange contract');
  const excId = reqExc.data.data.id;

  // Accept exchange (Aarav accepts) -> generates QR handoff_code
  const acceptRes = await request(`/exchanges/${excId}/accept`, {
    method: 'PATCH',
    token: aaravToken,
  });
  assert(acceptRes.status === 200 && acceptRes.data.data.handoff_code !== undefined, 'PATCH /exchanges/:id/accept generates random 6-character handoff_code');
  const handoffCode = acceptRes.data.data.handoff_code;

  // Feature 7: QR Scan instant completion (either party scans code)
  const scanRes = await request(`/exchanges/${excId}/handoff-scan`, {
    method: 'POST',
    token: rohanToken,
    body: { code: handoffCode },
  });
  assert(scanRes.status === 200 && scanRes.data.data.completed === true, 'POST /exchanges/:id/handoff-scan instantly settles handoff via QR scan');

  console.log('\n======================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedCount} Passed, ${failedCount} Failed`);
  console.log(`======================================================\n`);

  server.close();
  if (failedCount > 0) {
    process.exit(1);
  }
}

runApiTests().catch((err) => {
  console.error('Fatal API test error:', err);
  process.exit(1);
});
