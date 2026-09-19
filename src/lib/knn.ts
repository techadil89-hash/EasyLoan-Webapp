import { LoanApplicant, KNNConfig, PredictionOutput, KNNNeighbor, FactorImpact } from './types';
import trainingDataRaw from '../data/trainingData.json';
import metadataRaw from '../data/metadata.json';

const trainingData = trainingDataRaw as LoanApplicant[];

// Feature vector normalization constants
const STATS = {
  minAppIncome: metadataRaw.stats.ApplicantIncome.min || 150,
  maxAppIncome: metadataRaw.stats.ApplicantIncome.max || 81000,
  minCoappIncome: metadataRaw.stats.CoapplicantIncome.min || 0,
  maxCoappIncome: metadataRaw.stats.CoapplicantIncome.max || 41667,
  minLoanAmount: metadataRaw.stats.LoanAmount.min || 9,
  maxLoanAmount: metadataRaw.stats.LoanAmount.max || 700,
  minTerm: metadataRaw.stats.Loan_Amount_Term.min || 12,
  maxTerm: metadataRaw.stats.Loan_Amount_Term.max || 480,
  minTotalIncome: metadataRaw.stats.TotalIncome.min || 1442,
  maxTotalIncome: metadataRaw.stats.TotalIncome.max || 81000,
};

// Scale a numeric value between 0 and 1
function scale(val: number, min: number, max: number): number {
  if (max === min) return 0;
  const clamped = Math.max(min, Math.min(max, val));
  return (clamped - min) / (max - min);
}

// Transform an applicant into a normalized weighted numeric vector
export function applicantToVector(a: LoanApplicant): number[] {
  const genderVal = a.Gender === 'Male' ? 0.5 : 0;
  const marriedVal = a.Married === 'Yes' ? 0.6 : 0;
  
  let dependentsVal = 0;
  if (a.Dependents === '1') dependentsVal = 0.33;
  else if (a.Dependents === '2') dependentsVal = 0.66;
  else if (a.Dependents === '3+') dependentsVal = 1.0;

  const educationVal = a.Education === 'Graduate' ? 0.6 : 0;
  const selfEmployedVal = a.Self_Employed === 'Yes' ? 0.4 : 0;

  // Credit history is the strongest predictor in the Loan dataset (weight multiplier: 3.5)
  const creditVal = (a.Credit_History === 1 ? 1.0 : 0.0) * 3.5;

  // Property area encoding
  const semiUrbanVal = a.Property_Area === 'Semiurban' ? 0.7 : 0;
  const urbanVal = a.Property_Area === 'Urban' ? 0.4 : 0;

  // Safe numeric fallbacks for unfilled form state
  const appInc = typeof a.ApplicantIncome === 'number' ? a.ApplicantIncome : Number(a.ApplicantIncome) || 0;
  const coappInc = typeof a.CoapplicantIncome === 'number' ? a.CoapplicantIncome : Number(a.CoapplicantIncome) || 0;
  const totalIncome = appInc + coappInc;
  const loanAmt = typeof a.LoanAmount === 'number' ? a.LoanAmount : Number(a.LoanAmount) || 120;
  const termMonths = typeof a.Loan_Amount_Term === 'number' ? a.Loan_Amount_Term : Number(a.Loan_Amount_Term) || 360;

  const normTotalIncome = scale(totalIncome, STATS.minTotalIncome, STATS.maxTotalIncome) * 1.5;
  const normLoanAmount = scale(loanAmt, STATS.minLoanAmount, STATS.maxLoanAmount) * 1.5;
  const normTerm = scale(termMonths, STATS.minTerm, STATS.maxTerm) * 0.5;

  // Loan to Total Income Ratio (expressed as Loan in thousands / Total Income monthly)
  const loanToIncome = totalIncome > 0 ? (loanAmt * 1000) / totalIncome : 50;
  const normLoanToIncome = Math.min(1.0, loanToIncome / 40) * 1.8;

  // Estimated Monthly Payment (EMI approximation)
  const months = termMonths;
  const approxEmi = months > 0 ? (loanAmt * 1000) / months : 500;
  const emiToIncomeRatio = totalIncome > 0 ? approxEmi / totalIncome : 0.5;
  const normEmiRatio = Math.min(1.0, emiToIncomeRatio / 0.5) * 1.2;

  return [
    creditVal,
    normTotalIncome,
    normLoanAmount,
    normLoanToIncome,
    normEmiRatio,
    semiUrbanVal,
    urbanVal,
    educationVal,
    marriedVal,
    dependentsVal,
    normTerm,
    selfEmployedVal,
    genderVal,
  ];
}

// Distance functions
function euclideanDistance(v1: number[], v2: number[]): number {
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    const diff = v1[i] - v2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function manhattanDistance(v1: number[], v2: number[]): number {
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    sum += Math.abs(v1[i] - v2[i]);
  }
  return sum;
}

// Main KNN Predictor
export function predictLoanApproval(
  applicant: LoanApplicant,
  config: KNNConfig = { k: 5, metric: 'euclidean', weighted: true }
): PredictionOutput {
  const targetVec = applicantToVector(applicant);
  const distanceFn = config.metric === 'manhattan' ? manhattanDistance : euclideanDistance;

  // Compute distance to all training samples
  const scoredNeighbors = trainingData.map((item) => {
    const itemVec = applicantToVector(item);
    const dist = distanceFn(targetVec, itemVec);
    return {
      record: item,
      distance: dist,
      approvalStatus: (item.Loan_Status || 'N') as 'Y' | 'N',
    };
  });

  // Sort by distance ascending
  scoredNeighbors.sort((a, b) => a.distance - b.distance);

  const k = Math.min(Math.max(1, config.k), trainingData.length);
  const topK = scoredNeighbors.slice(0, k);

  // Compute similarity percentages (normalized relative to max distance observed in topK or top 10)
  const maxRefDist = Math.max(...topK.map((n) => n.distance), 0.001);
  const neighbors: KNNNeighbor[] = topK.map((n) => {
    // Distance to similarity percentage conversion
    const sim = Math.max(15, Math.min(99, Math.round(100 / (1 + n.distance * 0.8))));
    return {
      record: n.record,
      distance: Number(n.distance.toFixed(4)),
      similarityPercent: sim,
      approvalStatus: n.approvalStatus,
    };
  });

  let approvedWeight = 0;
  let rejectedWeight = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  for (const n of topK) {
    if (n.approvalStatus === 'Y') {
      approvedCount++;
      const w = config.weighted ? 1 / (n.distance + 0.05) : 1;
      approvedWeight += w;
    } else {
      rejectedCount++;
      const w = config.weighted ? 1 / (n.distance + 0.05) : 1;
      rejectedWeight += w;
    }
  }

  const totalWeight = approvedWeight + rejectedWeight;
  let probApproved = totalWeight > 0 ? (approvedWeight / totalWeight) * 100 : 50;

  // Special financial logic check: Credit history = 0 has severe risk penalty
  if (applicant.Credit_History === 0) {
    probApproved = Math.min(probApproved, 28);
  }

  const isApproved = probApproved >= 50;
  const confidence = Math.round(Math.abs(probApproved - 50) * 2); // 0 to 100% confidence
  const riskScore = Math.max(5, Math.min(95, Math.round(100 - probApproved)));

  // Generate explainability factor impacts
  const factors: FactorImpact[] = [];
  const appIncFactor = Number(applicant.ApplicantIncome) || 0;
  const coappIncFactor = Number(applicant.CoapplicantIncome) || 0;
  const totalInc = appIncFactor + coappIncFactor;
  const loanAmt = Number(applicant.LoanAmount) || 120;
  const loanToIncomeRatio = totalInc > 0 ? (loanAmt * 1000) / totalInc : 50;

  // 1. Credit History Factor
  if (applicant.Credit_History === 1) {
    factors.push({
      name: 'Credit History Record',
      impact: 'positive',
      description: 'Clean credit history meets institutional lending standards.',
    });
  } else {
    factors.push({
      name: 'Credit History Deficit',
      impact: 'negative',
      description: 'Absence of clean credit history severely lowers approval likelihood.',
    });
  }

  // 2. Debt / Income Ratio Factor
  if (loanToIncomeRatio < 20) {
    factors.push({
      name: 'Loan-to-Income Ratio',
      impact: 'positive',
      description: `Comfortable leverage: Requested $${loanAmt}k against $${totalInc.toLocaleString()} monthly household income.`,
    });
  } else if (loanToIncomeRatio > 35) {
    factors.push({
      name: 'High Leverage Request',
      impact: 'negative',
      description: `Requested loan $${loanAmt}k is high relative to monthly income ($${totalInc.toLocaleString()}).`,
    });
  } else {
    factors.push({
      name: 'Moderate Leverage',
      impact: 'neutral',
      description: `Loan-to-income balance is within acceptable tolerance boundaries.`,
    });
  }

  // 3. Coapplicant Support
  if (applicant.CoapplicantIncome > 0) {
    factors.push({
      name: 'Co-applicant Income Buffer',
      impact: 'positive',
      description: `Co-applicant adds $${applicant.CoapplicantIncome.toLocaleString()}/mo, strengthening debt repayment capacity.`,
    });
  } else {
    factors.push({
      name: 'Single Earner Application',
      impact: 'neutral',
      description: 'Single borrower without secondary income safety net.',
    });
  }

  // 4. Property Area Factor
  if (applicant.Property_Area === 'Semiurban') {
    factors.push({
      name: 'Property Geography',
      impact: 'positive',
      description: 'Semiurban properties exhibit higher historical approval resilience in portfolio.',
    });
  } else if (applicant.Property_Area === 'Rural') {
    factors.push({
      name: 'Rural Location',
      impact: 'neutral',
      description: 'Rural collateral is subject to standard agricultural/regional valuation appraisals.',
    });
  }

  // 5. Education
  if (applicant.Education === 'Graduate') {
    factors.push({
      name: 'Higher Education Qualification',
      impact: 'positive',
      description: 'Graduate status correlates with stable long-term career earning trajectories.',
    });
  }

  // Actionable recommendations
  const recommendations: string[] = [];
  if (applicant.Credit_History === 0) {
    recommendations.push(
      'Rectify past delinquencies or provide documentation of credit rehabilitation to achieve clean Credit History (1.0).'
    );
  }
  if (loanToIncomeRatio > 30) {
    const suggestedLoan = Math.round((totalInc * 24) / 1000);
    recommendations.push(
      `Consider reducing loan request to ~$${suggestedLoan}k or extending tenure to 360 months to lower monthly repayment strain.`
    );
  }
  if (applicant.CoapplicantIncome === 0 && !isApproved) {
    recommendations.push(
      'Add a co-borrower or guarantor with verifiable income ($1,500+) to improve debt coverage ratio.'
    );
  }
  if (isApproved) {
    recommendations.push(
      'Applicant profile meets institutional lending benchmarks. Maintain current credit lines until disbursement.'
    );
  }

  return {
    status: isApproved ? 'Approved' : 'Rejected',
    probability: Math.round(probApproved),
    confidence,
    riskScore,
    approvedNeighborsCount: approvedCount,
    rejectedNeighborsCount: rejectedCount,
    totalNeighbors: k,
    neighbors,
    factors,
    recommendations,
  };
}

export function isApplicantReady(a: LoanApplicant): boolean {
  const hasIncome = typeof a.ApplicantIncome === 'number' && a.ApplicantIncome > 0;
  const hasLoan = typeof a.LoanAmount === 'number' && a.LoanAmount > 0;
  const hasCredit = a.Credit_History !== undefined;
  return Boolean(hasIncome && hasLoan && hasCredit);
}
