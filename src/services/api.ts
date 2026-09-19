import axios from 'axios';
import { LoanApplicant, PredictionOutput } from '../lib/types';
import { predictLoanApproval } from '../lib/knn';

export const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : '');

let activeApiUrl = DEFAULT_API_URL;

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

export const predict = async (data: Record<string, any>): Promise<any> => {
  const targetUrl = activeApiUrl ? `${activeApiUrl}/predict` : '/api/predict';

  try {
    const response = await axios.post(targetUrl, data, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.status === 422) {
      throw err;
    }

    if (targetUrl !== '/api/predict' && typeof window !== 'undefined') {
      const fallbackRes = await axios.post('/api/predict', data, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });
      activeApiUrl = '';
      return fallbackRes.data;
    }

    throw err;
  }
};

export async function checkBackendHealth(): Promise<{ online: boolean; details?: ApiHealthResponse }> {
  const targetUrl = activeApiUrl ? `${activeApiUrl}/health` : '/api/health';

  try {
    const response = await axios.get<ApiHealthResponse>(targetUrl, { timeout: 4000 });
    if (response.status === 200) {
      return { online: true, details: response.data };
    }
  } catch (error) {
    if (targetUrl !== '/api/health' && typeof window !== 'undefined') {
      try {
        const fallbackRes = await axios.get<ApiHealthResponse>('/api/health', { timeout: 3000 });
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
}

export async function predictLoan(
  applicant: LoanApplicant,
  options?: { fallbackToLocal?: boolean }
): Promise<{
  data: PredictionOutput;
  source: 'cloud-api' | 'client-fallback';
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
      source: 'cloud-api',
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
