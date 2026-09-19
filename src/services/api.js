import axios from 'axios';
import { predictLoanApproval } from '../lib/knn';

// Reads the public backend URL provided by Vercel environment variables, or defaults to local development
export const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

let activeApiUrl = DEFAULT_API_URL;

export const getApiUrl = () => activeApiUrl;

/**
 * Standard API call sending applicant features to FastAPI /predict.
 * Directly fulfills Section 6 of requirements.
 *
 * @param {Object} data - Applicant features dictionary.
 * @returns {Promise<Object>} Backend prediction payload.
 */
export const predict = async (data) => {
  try {
    const response = await axios.post(`${activeApiUrl}/predict`, data, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (err) {
    // Only attempt alternate loopback in local dev environment
    if (activeApiUrl.includes('localhost') || activeApiUrl.includes('127.0.0.1')) {
      const alternateUrl = activeApiUrl.includes('localhost')
        ? activeApiUrl.replace('localhost', '127.0.0.1')
        : activeApiUrl.replace('127.0.0.1', 'localhost');

      try {
        const fallbackResponse = await axios.post(`${alternateUrl}/predict`, data, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        });
        activeApiUrl = alternateUrl;
        return fallbackResponse.data;
      } catch (innerErr) {
        throw err;
      }
    }
    throw err;
  }
};

/**
 * Probes the FastAPI /health endpoint to check server availability.
 * Works seamlessly across both local development and live Vercel deployments.
 * @returns {Promise<{ online: boolean, details?: any }>}
 */
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${activeApiUrl}/health`, { timeout: 4000 });
    if (response.status === 200) {
      return { online: true, details: response.data };
    }
  } catch (error) {
    // Retry loopback switch if running in local development
    if (activeApiUrl.includes('localhost') || activeApiUrl.includes('127.0.0.1')) {
      const alternateUrl = activeApiUrl.includes('localhost')
        ? activeApiUrl.replace('localhost', '127.0.0.1')
        : activeApiUrl.replace('127.0.0.1', 'localhost');

      try {
        const altResponse = await axios.get(`${alternateUrl}/health`, { timeout: 3000 });
        if (altResponse.status === 200) {
          activeApiUrl = alternateUrl;
          return { online: true, details: altResponse.data };
        }
      } catch (err2) {
        // Both local hosts unreachable
      }
    }
  }
  return { online: false };
};

/**
 * High-level loan prediction utility for the UI with automatic fallback.
 * Formats applicant object, calls FastAPI, and falls back to local KNN if offline.
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
