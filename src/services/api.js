import axios from 'axios';
import { predictLoanApproval } from '../lib/knn';

// Determine initial API base URL
export const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

let activeApiUrl = DEFAULT_API_URL;

export const getApiUrl = () => activeApiUrl;

/**
 * Standard API call sending applicant features to /predict.
 * Tries the primary API URL (FastAPI/Render) and automatically falls back
 * to the built-in Vercel /api/predict serverless route if unavailable.
 *
 * @param {Object} data - Applicant features dictionary.
 * @returns {Promise<Object>} Backend prediction payload.
 */
export const predict = async (data) => {
  // 1. Try currently active API URL
  try {
    const response = await axios.post(`${activeApiUrl}/predict`, data, {
      timeout: 12000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (err) {
    // If validation error (HTTP 422), do not fallback to other routes
    if (err.response && err.response.status === 422) {
      throw err;
    }

    // 2. If running locally, try alternate IPv4/IPv6 localhost
    if (activeApiUrl.includes('localhost') || activeApiUrl.includes('127.0.0.1')) {
      const alternateUrl = activeApiUrl.includes('localhost')
        ? activeApiUrl.replace('localhost', '127.0.0.1')
        : activeApiUrl.replace('127.0.0.1', 'localhost');

      try {
        const fallbackResponse = await axios.post(`${alternateUrl}/predict`, data, {
          timeout: 8000,
          headers: { 'Content-Type': 'application/json' },
        });
        activeApiUrl = alternateUrl;
        return fallbackResponse.data;
      } catch (innerErr) {
        // continue to Next.js API fallback
      }
    }

    // 3. Fallback to built-in Next.js /api/predict (works 100% on Vercel without external server)
    if (typeof window !== 'undefined' && activeApiUrl !== '/api') {
      try {
        const vercelApiResponse = await axios.post('/api/predict', data, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        });
        activeApiUrl = '/api';
        return vercelApiResponse.data;
      } catch (vercelErr) {
        throw vercelErr;
      }
    }

    throw err;
  }
};

/**
 * Probes server health (/health).
 * Tries external FastAPI and seamlessly falls back to /api/health on Vercel.
 * @returns {Promise<{ online: boolean, details?: any }>}
 */
export const checkBackendHealth = async () => {
  // 1. Try active URL
  try {
    const response = await axios.get(`${activeApiUrl}/health`, { timeout: 3500 });
    if (response.status === 200) {
      return { online: true, details: response.data };
    }
  } catch (error) {
    // 2. Try loopback alternate if local
    if (activeApiUrl.includes('localhost') || activeApiUrl.includes('127.0.0.1')) {
      const alternateUrl = activeApiUrl.includes('localhost')
        ? activeApiUrl.replace('localhost', '127.0.0.1')
        : activeApiUrl.replace('127.0.0.1', 'localhost');

      try {
        const altResponse = await axios.get(`${alternateUrl}/health`, { timeout: 2500 });
        if (altResponse.status === 200) {
          activeApiUrl = alternateUrl;
          return { online: true, details: altResponse.data };
        }
      } catch (err2) {
        // continue to /api
      }
    }

    // 3. Try /api/health (Vercel Built-In Route)
    if (typeof window !== 'undefined' && activeApiUrl !== '/api') {
      try {
        const nextApiResponse = await axios.get('/api/health', { timeout: 3000 });
        if (nextApiResponse.status === 200) {
          activeApiUrl = '/api';
          return { online: true, details: nextApiResponse.data };
        }
      } catch (e) {
        // unreachable
      }
    }
  }
  return { online: false };
};

/**
 * High-level loan prediction utility for the UI with automatic fallback.
 * Formats applicant object, calls prediction API, and falls back to local KNN if needed.
 *
 * @param {Object} applicant
 * @returns {Promise<{ data: any, source: 'fastapi' | 'client-fallback', error?: string }>}
 */
export const predictLoan = async (applicant) => {
  try {
    const payload = {
      firstName: applicant.FirstName || null,
      lastName: applicant.LastName || null,
      gender: applicant.Gender || 'Male',
      married: applicant.Married || 'Yes',
      dependents: applicant.Dependents || '0',
      education: applicant.Education || 'Graduate',
      selfEmployed: applicant.Self_Employed || 'No',
      applicantIncome: Number(applicant.ApplicantIncome) || 0,
      coapplicantIncome: Number(applicant.CoapplicantIncome) || 0,
      loanAmount: Number(applicant.LoanAmount) || 120,
      loanAmountTerm: Number(applicant.Loan_Amount_Term) || 360,
      creditHistory: applicant.Credit_History !== undefined ? Number(applicant.Credit_History) : 1.0,
      propertyArea: applicant.Property_Area || 'Urban',
    };

    const backendData = await predict(payload);

    return {
      data: {
        status: backendData.status,
        probability: Math.round(backendData.probability),
        confidence: backendData.confidence,
        riskScore: backendData.risk_score,
        approvedNeighborsCount: backendData.prediction === 1 ? 4 : 1,
        rejectedNeighborsCount: backendData.prediction === 0 ? 4 : 1,
        totalNeighbors: 5,
        neighbors: predictLoanApproval(applicant, { k: 5, metric: 'euclidean', weighted: true }).neighbors,
        factors: backendData.factors,
        recommendations: backendData.recommendations,
      },
      source: 'fastapi',
    };
  } catch (err) {
    const local = predictLoanApproval(applicant, { k: 5, metric: 'euclidean', weighted: true });
    return {
      data: local,
      source: 'client-fallback',
      error: err.message,
    };
  }
};

export default {
  predict,
  predictLoan,
  checkBackendHealth,
  API_URL: activeApiUrl,
};
