import { LoanApplicant } from './types';
import trainingDataRaw from '../data/trainingData.json';
import testDataRaw from '../data/testDataset.json';
import metadataRaw from '../data/metadata.json';

export const trainingDataset = trainingDataRaw as LoanApplicant[];
export const testDataset = testDataRaw as LoanApplicant[];
export const datasetMetadata = metadataRaw;

export interface ArchetypePreset {
  id: string;
  name: string;
  tagline: string;
  expected: 'Approved' | 'Rejected' | 'Borderline';
  data: LoanApplicant;
}

export const ARCHETYPE_PRESETS: ArchetypePreset[] = [
  {
    id: 'prime-borrower',
    name: 'Prime Professional',
    tagline: 'Dual income, Graduate, Clean credit history',
    expected: 'Approved',
    data: {
      FirstName: 'Alexander',
      LastName: 'Wright',
      Gender: 'Male',
      Married: 'Yes',
      Dependents: '1',
      Education: 'Graduate',
      Self_Employed: 'No',
      ApplicantIncome: 6500,
      CoapplicantIncome: 3200,
      LoanAmount: 140,
      Loan_Amount_Term: 360,
      Credit_History: 1,
      Property_Area: 'Urban',
    },
  },
  {
    id: 'young-homebuyer',
    name: 'Young Homebuyer',
    tagline: 'Single graduate, moderate income, Semiurban property',
    expected: 'Approved',
    data: {
      FirstName: 'Elena',
      LastName: 'Rostova',
      Gender: 'Female',
      Married: 'No',
      Dependents: '0',
      Education: 'Graduate',
      Self_Employed: 'No',
      ApplicantIncome: 4500,
      CoapplicantIncome: 0,
      LoanAmount: 105,
      Loan_Amount_Term: 360,
      Credit_History: 1,
      Property_Area: 'Semiurban',
    },
  },
  {
    id: 'self-employed-pro',
    name: 'Self-Employed Pro',
    tagline: 'High earner, 2 dependents, Semiurban area',
    expected: 'Approved',
    data: {
      FirstName: 'Marcus',
      LastName: 'Sterling',
      Gender: 'Male',
      Married: 'Yes',
      Dependents: '2',
      Education: 'Graduate',
      Self_Employed: 'Yes',
      ApplicantIncome: 9500,
      CoapplicantIncome: 2000,
      LoanAmount: 210,
      Loan_Amount_Term: 360,
      Credit_History: 1,
      Property_Area: 'Semiurban',
    },
  },
  {
    id: 'high-leverage',
    name: 'Over-Leveraged Request',
    tagline: 'Low household income requesting large loan amount',
    expected: 'Rejected',
    data: {
      FirstName: 'Arthur',
      LastName: 'Pendleton',
      Gender: 'Male',
      Married: 'Yes',
      Dependents: '3+',
      Education: 'Not Graduate',
      Self_Employed: 'No',
      ApplicantIncome: 2100,
      CoapplicantIncome: 0,
      LoanAmount: 260,
      Loan_Amount_Term: 360,
      Credit_History: 1,
      Property_Area: 'Rural',
    },
  },
  {
    id: 'credit-default',
    name: 'Credit History Deficit',
    tagline: 'High earner but with past delinquency (Credit 0.0)',
    expected: 'Rejected',
    data: {
      FirstName: 'Julian',
      LastName: 'Vance',
      Gender: 'Male',
      Married: 'No',
      Dependents: '0',
      Education: 'Graduate',
      Self_Employed: 'No',
      ApplicantIncome: 7500,
      CoapplicantIncome: 2000,
      LoanAmount: 120,
      Loan_Amount_Term: 360,
      Credit_History: 0,
      Property_Area: 'Urban',
    },
  },
];
