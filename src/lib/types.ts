export type Gender = 'Male' | 'Female';
export type Married = 'Yes' | 'No';
export type Dependents = '0' | '1' | '2' | '3+';
export type Education = 'Graduate' | 'Not Graduate';
export type SelfEmployed = 'Yes' | 'No';
export type CreditHistory = 0 | 1;
export type PropertyArea = 'Urban' | 'Semiurban' | 'Rural';
export type LoanStatus = 'Y' | 'N';

export interface LoanApplicant {
  Loan_ID?: string;
  FirstName?: string;
  LastName?: string;
  Gender?: Gender;
  Married?: Married;
  Dependents?: Dependents;
  Education?: Education;
  Self_Employed?: SelfEmployed;
  ApplicantIncome?: number | '';
  CoapplicantIncome?: number | '';
  LoanAmount?: number | ''; // in thousands ($)
  Loan_Amount_Term?: number | ''; // in months
  Credit_History?: CreditHistory;
  Property_Area?: PropertyArea;
  Loan_Status?: LoanStatus;
}

export interface KNNConfig {
  k: number;
  metric: 'euclidean' | 'manhattan';
  weighted: boolean;
}

export interface KNNNeighbor {
  record: LoanApplicant;
  distance: number;
  similarityPercent: number;
  approvalStatus: LoanStatus;
}

export interface FactorImpact {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface PredictionOutput {
  status: 'Approved' | 'Rejected';
  probability: number; // 0 to 100
  confidence: number; // margin of certainty
  riskScore: number; // 0 (safest) to 100 (highest risk)
  approvedNeighborsCount: number;
  rejectedNeighborsCount: number;
  totalNeighbors: number;
  neighbors: KNNNeighbor[];
  factors: FactorImpact[];
  recommendations: string[];
}
