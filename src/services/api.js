import axios from 'axios';
import { predictLoanApproval } from '../lib/knn';

// External Production Base URL: Reads from environment variable or uses relative /api for cloud
export const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : '');

let activeApiUrl = DEFAULT_API_URL;

export const getApiUrl = () => activeApiUrl;

/**
 * Sends applicant features to the external prediction endpoint (/predict).
 *
 * @param {Object} data - Applicant features dictionary.
 * @returns {Promise<Object>} Backend prediction payload.
 */
export const predict = async (data) => {
  const targetUrl = activeApiUrl ? `${activeApiUrl}/predict` : '/api/predict';

  try {
    const response = await axios.post(targetUrl, data, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (err) {
    // If validation error (HTTP 422), propagate directly
    if (err.response && err.response.status === 422) {
      throw err;
    }

    // Fallback to internal cloud serverless route if external fails
    if (targetUrl !== '/api/predict' && typeof window !== 'undefined') {
      try {
        const fallbackRes = await axios.post('/api/predict', data, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        });
        activeApiUrl = '';
        return fallbackRes.data;
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }

    throw err;
  }
};

/**
 * Checks external cloud API health status.
 * @returns {Promise<{ online: boolean, details?: any }>}
 */
export const checkBackendHealth = async () => {
  const targetUrl = activeApiUrl ? `${activeApiUrl}/health` : '/api/health';

  try {
    const response = await axios.get(targetUrl, { timeout: 4000 });
    if (response.status === 200) {
      return { online: true, details: response.data };
    }
  } catch (error) {
    if (targetUrl !== '/api/health' && typeof window !== 'undefined') {
      try {
        const fallbackRes = await axios.get('/api/health', { timeout: 3000 });
        if (fallbackRes.status === 200) {
          activeApiUrl = '';
          return { online: true, details: fallbackRes.data };
        }
      } catch (e) {
        // unreachable
      }
    }
  }
  return { online: false };
};

/**
 * High-level loan prediction utility with automatic fallback.
 *
 * @param {Object} applicant
 * @returns {Promise<{ data: any, source: 'cloud-api' | 'client-fallback', error?: string }>}
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
      source: 'cloud-api',
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
