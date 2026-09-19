import { NextRequest, NextResponse } from 'next/server';
import { predictLoanApproval } from '../../../lib/knn';
import { LoanApplicant } from '../../../lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const applicant: LoanApplicant = {
      FirstName: body.firstName || body.FirstName || '',
      LastName: body.lastName || body.LastName || '',
      Gender: body.gender || body.Gender || 'Male',
      Married: body.married || body.Married || 'Yes',
      Dependents: body.dependents || body.Dependents || '0',
      Education: body.education || body.Education || 'Graduate',
      Self_Employed: body.selfEmployed || body.Self_Employed || 'No',
      ApplicantIncome: Number(body.applicantIncome ?? body.ApplicantIncome) || 0,
      CoapplicantIncome: Number(body.coapplicantIncome ?? body.CoapplicantIncome) || 0,
      LoanAmount: Number(body.loanAmount ?? body.LoanAmount) || 120,
      Loan_Amount_Term: Number(body.loanAmountTerm ?? body.Loan_Amount_Term) || 360,
      Credit_History: (body.creditHistory ?? body.Credit_History) !== undefined
        ? Number(body.creditHistory ?? body.Credit_History) as 1 | 0
        : 1,
      Property_Area: body.propertyArea || body.Property_Area || 'Urban',
    };

    const result = predictLoanApproval(applicant, {
      k: 5,
      metric: 'euclidean',
      weighted: true,
    });

    const isApproved = result.status === 'Approved';
    const predictionInt = isApproved ? 1 : 0;
    const fullName = `${applicant.FirstName || ''} ${applicant.LastName || ''}`.trim() || null;

    return NextResponse.json({
      prediction: predictionInt,
      status: result.status,
      probability: result.probability,
      confidence: result.confidence,
      risk_score: result.riskScore,
      applicant_name: fullName,
      factors: result.factors,
      recommendations: result.recommendations,
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Error executing loan prediction' },
      { status: 500 }
    );
  }
}
