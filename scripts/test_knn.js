const fs = require('fs');
const path = require('path');

const trainingData = require('../src/data/trainingData.json');
const testData = require('../src/data/testDataset.json');

// Replicate KNN logic in standalone test script for independent verification
function scale(val, min, max) {
  if (max === min) return 0;
  return (Math.max(min, Math.min(max, val)) - min) / (max - min);
}

function applicantToVector(a) {
  const genderVal = a.Gender === 'Male' ? 0.5 : 0;
  const marriedVal = a.Married === 'Yes' ? 0.6 : 0;
  let dep = 0;
  if (a.Dependents === '1') dep = 0.33;
  else if (a.Dependents === '2') dep = 0.66;
  else if (a.Dependents === '3+') dep = 1.0;
  const edu = a.Education === 'Graduate' ? 0.6 : 0;
  const self = a.Self_Employed === 'Yes' ? 0.4 : 0;
  const credit = (a.Credit_History === 1 ? 1.0 : 0.0) * 3.5;
  const semiUrban = a.Property_Area === 'Semiurban' ? 0.7 : 0;
  const urban = a.Property_Area === 'Urban' ? 0.4 : 0;
  const totalInc = (a.ApplicantIncome || 0) + (a.CoapplicantIncome || 0);
  const normInc = scale(totalInc, 1442, 81000) * 1.5;
  const normLoan = scale(a.LoanAmount || 120, 9, 700) * 1.5;
  const normTerm = scale(a.Loan_Amount_Term || 360, 12, 480) * 0.5;
  const loanToInc = totalInc > 0 ? ((a.LoanAmount || 120) * 1000) / totalInc : 50;
  const normLti = Math.min(1.0, loanToInc / 40) * 1.8;

  return [credit, normInc, normLoan, normLti, semiUrban, urban, edu, marriedVal, dep, normTerm, self, genderVal];
}

function euclidean(v1, v2) {
  return Math.sqrt(v1.reduce((sum, val, idx) => sum + Math.pow(val - v2[idx], 2), 0));
}

function predict(applicant, k = 5) {
  const target = applicantToVector(applicant);
  const distances = trainingData.map(d => ({
    dist: euclidean(target, applicantToVector(d)),
    status: d.Loan_Status,
    id: d.Loan_ID,
  })).sort((a, b) => a.dist - b.dist);

  const topK = distances.slice(0, k);
  let appWeight = 0;
  let rejWeight = 0;

  topK.forEach(n => {
    const w = 1 / (n.dist + 0.05);
    if (n.status === 'Y') appWeight += w;
    else rejWeight += w;
  });

  let prob = (appWeight / (appWeight + rejWeight)) * 100;
  if (applicant.Credit_History === 0) prob = Math.min(prob, 28);

  return {
    verdict: prob >= 50 ? 'Approved' : 'Rejected',
    prob: Math.round(prob),
    topNeighbors: topK.map(n => ({ id: n.id, dist: n.dist.toFixed(3), status: n.status })),
  };
}

console.log('--- TEST 1: Prime Applicant (Clean credit, good income) ---');
const prime = {
  Gender: 'Male',
  Married: 'Yes',
  Dependents: '1',
  Education: 'Graduate',
  Self_Employed: 'No',
  ApplicantIncome: 6000,
  CoapplicantIncome: 2000,
  LoanAmount: 130,
  Loan_Amount_Term: 360,
  Credit_History: 1,
  Property_Area: 'Urban',
};
const res1 = predict(prime);
console.log('Result:', res1.verdict, `(${res1.prob}% consensus)`);
console.log('Neighbors:', res1.topNeighbors);

console.log('\n--- TEST 2: Credit History Deficit (Credit = 0.0) ---');
const badCredit = { ...prime, Credit_History: 0 };
const res2 = predict(badCredit);
console.log('Result:', res2.verdict, `(${res2.prob}% consensus)`);

console.log('\n--- TEST 3: Evaluation on first 5 records from Loan Prediction Dataset.csv ---');
testData.slice(0, 5).forEach((record, i) => {
  const res = predict(record);
  console.log(`Record #${i+1} [${record.Loan_ID}] Inc:$${record.ApplicantIncome}+$${record.CoapplicantIncome}, Loan:$${record.LoanAmount}k, Cr:${record.Credit_History} -> Predicted: ${res.verdict} (${res.prob}%)`);
});
