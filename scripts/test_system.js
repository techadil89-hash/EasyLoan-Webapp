/**
 * Comprehensive Automated System Test for EasyLoan
 * ==================================================
 * Tests:
 * 1. FastAPI Health Check (/health)
 * 2. CORS Preflight Handshake (Access-Control-Allow-Origin)
 * 3. Prime Borrower Application (/predict -> Approved: 1)
 * 4. Adverse Borrower Application (/predict -> Rejected: 0)
 * 5. Input Validation Error Handling (Pydantic HTTP 422)
 * 6. Next.js Frontend Server Response (HTTP 200 & DOM structure)
 */

const axios = require('axios');

const API_BASE = 'http://127.0.0.1:8000';
const FRONTEND_BASE = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('   EasyLoan Automated Full-Stack Verification Test   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // TEST 1: Backend Health Check
  try {
    process.stdout.write('Test 1: Backend /health check ... ');
    const res = await axios.get(`${API_BASE}/health`, { timeout: 4000 });
    if (res.status === 200 && res.data.status === 'online' && res.data.model_loaded === true) {
      console.log('✅ PASSED (online, model_loaded: true)');
      passed++;
    } else {
      console.log('❌ FAILED (Unexpected payload:', res.data, ')');
      failed++;
    }
  } catch (err) {
    console.log('❌ FAILED (Error connecting to /health:', err.message, ')');
    failed++;
  }

  // TEST 2: CORS Preflight Handshake
  try {
    process.stdout.write('Test 2: CORS Preflight Handshake ... ');
    const res = await axios({
      method: 'OPTIONS',
      url: `${API_BASE}/predict`,
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
      },
      timeout: 4000,
    });
    const allowOrigin = res.headers['access-control-allow-origin'];
    if (allowOrigin === 'http://localhost:3000' || allowOrigin === '*') {
      console.log(`✅ PASSED (Access-Control-Allow-Origin: ${allowOrigin})`);
      passed++;
    } else {
      console.log('❌ FAILED (Origin not allowed:', allowOrigin, ')');
      failed++;
    }
  } catch (err) {
    console.log('❌ FAILED (OPTIONS request failed:', err.message, ')');
    failed++;
  }

  // TEST 3: Prime Applicant Evaluation (PredictionForm.jsx Sample: Prime)
  try {
    process.stdout.write('Test 3: Prime Applicant Prediction ... ');
    const primePayload = {
      firstName: 'Marcus',
      lastName: 'Sinclair',
      gender: 'Male',
      married: 'Yes',
      dependents: '1',
      education: 'Graduate',
      selfEmployed: 'No',
      applicantIncome: 7500,
      coapplicantIncome: 2200,
      loanAmount: 180,
      loanAmountTerm: 360,
      creditHistory: 1,
      propertyArea: 'Urban',
    };

    const res = await axios.post(`${API_BASE}/predict`, primePayload, { timeout: 5000 });
    if (res.status === 200 && res.data.prediction === 1 && res.data.status === 'Approved') {
      console.log(`✅ PASSED (Verdict: ${res.data.status}, prediction: ${res.data.prediction}, prob: ${res.data.probability}%, risk: ${res.data.risk_score})`);
      passed++;
    } else {
      console.log('❌ FAILED (Expected Approved/1, got:', res.data, ')');
      failed++;
    }
  } catch (err) {
    console.log('❌ FAILED (/predict failed:', err.response?.data || err.message, ')');
    failed++;
  }

  // TEST 4: Adverse Applicant Evaluation (PredictionForm.jsx Sample: Adverse)
  try {
    process.stdout.write('Test 4: Adverse Applicant Prediction ... ');
    const adversePayload = {
      firstName: 'Devon',
      lastName: 'Carter',
      gender: 'Male',
      married: 'No',
      dependents: '0',
      education: 'Not Graduate',
      selfEmployed: 'Yes',
      applicantIncome: 2100,
      coapplicantIncome: 0,
      loanAmount: 240,
      loanAmountTerm: 360,
      creditHistory: 0,
      propertyArea: 'Rural',
    };

    const res = await axios.post(`${API_BASE}/predict`, adversePayload, { timeout: 5000 });
    if (res.status === 200 && res.data.prediction === 0 && res.data.status === 'Rejected') {
      console.log(`✅ PASSED (Verdict: ${res.data.status}, prediction: ${res.data.prediction}, prob: ${res.data.probability}%, risk: ${res.data.risk_score})`);
      passed++;
    } else {
      console.log('❌ FAILED (Expected Rejected/0, got:', res.data, ')');
      failed++;
    }
  } catch (err) {
    console.log('❌ FAILED (/predict failed:', err.response?.data || err.message, ')');
    failed++;
  }

  // TEST 5: Pydantic Validation on Invalid Inputs
  try {
    process.stdout.write('Test 5: Pydantic Validation Error Handling ... ');
    const invalidPayload = {
      applicantIncome: -500, // Invalid: must be >= 0
      loanAmount: 0,        // Invalid: must be > 0
      creditHistory: 5,     // Invalid: must be between 0 and 1
    };

    try {
      await axios.post(`${API_BASE}/predict`, invalidPayload, { timeout: 4000 });
      console.log('❌ FAILED (Server should have rejected invalid payload with 422)');
      failed++;
    } catch (valErr) {
      if (valErr.response?.status === 422) {
        console.log('✅ PASSED (Correctly caught HTTP 422 Unprocessable Entity)');
        passed++;
      } else {
        console.log('❌ FAILED (Unexpected error status:', valErr.response?.status, ')');
        failed++;
      }
    }
  } catch (err) {
    console.log('❌ FAILED (Test 5 error:', err.message, ')');
    failed++;
  }

  // TEST 6: Next.js Frontend Server Response
  try {
    process.stdout.write('Test 6: Next.js Frontend Server (port 3000) ... ');
    const res = await axios.get(FRONTEND_BASE, { timeout: 5000 });
    const body = res.data;

    const hasTitle = body.includes('EasyLoan');
    const hasNextBadge = body.includes('Next.js 14');
    const hasForm = body.includes('form') || body.includes('input');

    if (res.status === 200 && hasTitle && hasNextBadge) {
      console.log('✅ PASSED (HTTP 200, EasyLoan title & Next.js 14 components present)');
      passed++;
    } else {
      console.log('❌ FAILED (Missing page components. Status:', res.status, ')');
      failed++;
    }
  } catch (err) {
    console.log('❌ FAILED (Next.js server connection error:', err.message, ')');
    failed++;
  }

  console.log('\n====================================================');
  console.log(`   Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('\n🚀 ALL SYSTEMS AND API ENDPOINTS ARE FULLY OPERATIONAL!\n');
  } else {
    process.exitCode = 1;
  }
}

runTests();
