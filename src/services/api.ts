import axios from 'axios';
import { LoanApplicant, PredictionOutput } from '../lib/types';
import { predictLoanApproval } from '../lib/knn';

let activeApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const getApiUrl = () => activeApiUrl;

export interface ApiHealthResponse {
  status: string;
  model_loaded?: boolean;
}

export interface BackendPredictionResponse {
  prediction: number;
  status: 'Approved' | 'Rejected';
  probability: number;
  confidence: number;
  risk_score: number;
  applicant_name?: string | null;
  factors: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
  recommendations: string[];
}

/**
 * Standard API call sending applicant features to FastAPI /predict
 */
export const predict = async (data: Record<string, any>): Promise<any> => {
  try {
    const response = await axios.post(`${activeApiUrl}/predict`, data, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (err) {
    const alternateUrl = activeApiUrl.includes('localhost')
      ? activeApiUrl.replace('localhost', '127.0.0.1')
      : activeApiUrl.replace('127.0.0.1', 'localhost');

    const fallbackResponse = await axios.post(`${alternateUrl}/predict`, data, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
    activeApiUrl = alternateUrl;
    return fallbackResponse.data;
  }
};

/**
 * Probes the backend server health.
 */
export async function checkBackendHealth(): Promise<{ online: boolean; details?: ApiHealthResponse }> {
  try {
    const response = await axios.get<ApiHealthResponse>(`${activeApiUrl}/health`, { timeout: 3000 });
    if (response.status === 200) {
      return { online: true, details: response.data };
    }
  } catch (error) {
    const alternateUrl = activeApiUrl.includes('localhost')
      ? activeApiUrl.replace('localhost', '127.0.0.1')
      : activeApiUrl.replace('127.0.0.1', 'localhost');

    try {
      const altResponse = await axios.get<ApiHealthResponse>(`${alternateUrl}/health`, { timeout: 3000 });
      if (altResponse.status === 200) {
        activeApiUrl = alternateUrl;
        return { online: true, details: altResponse.data };
      }
    } catch (err2) {
      // Both hosts unreachable
    }
  }
  return { online: false };
}

/**
 * Predicts loan approval by sending applicant data to the FastAPI backend.
 * Gracefully falls back to the client-side KNN engine if backend is offline.
 */
export async function predictLoan(
  applicant: LoanApplicant,
  options?: { fallbackToLocal?: boolean }
): Promise<{
  data: PredictionOutput;
  source: 'fastapi' | 'client-fallback';
  error?: string;
}> {
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

    const backendData = await predict(payload) as BackendPredictionResponse;

    const mappedOutput: PredictionOutput = {
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
    };

    return {
      data: mappedOutput,
      source: 'fastapi',
    };
  } catch (err: any) {
    const fallback = predictLoanApproval(applicant, { k: 5, metric: 'euclidean', weighted: true });
    return {
      data: fallback,
      source: 'client-fallback',
      error: err.message,
    };
  }
}

export default {
  predict,
  predictLoan,
  checkBackendHealth,
  API_BASE_URL: activeApiUrl,
};
