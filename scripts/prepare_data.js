const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const trainSourcePath = 'C:\\Users\\ADOO\\.gemini\\antigravity-ide\\brain\\59a34120-3071-48e3-ba50-d8ba6ee820b7\\.system_generated\\steps\\19\\content.md';
const testSourcePath = path.join(projectRoot, 'Loan Prediction Dataset.csv');
const dataOutputDir = path.join(projectRoot, 'src', 'data');

if (!fs.existsSync(dataOutputDir)) {
  fs.mkdirSync(dataOutputDir, { recursive: true });
}

function parseCsv(content, hasHeader = true) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  // Find where header starts
  let headerIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Loan_ID')) {
      headerIndex = i;
      break;
    }
  }

  const headers = lines[headerIndex].split(',').map(h => h.trim());
  const records = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;
    const parts = rawLine.split(',').map(p => p.trim());
    if (parts.length < headers.length - 2) continue; // skip corrupted lines
    const record = {};
    headers.forEach((h, idx) => {
      record[h] = parts[idx] !== undefined ? parts[idx] : '';
    });
    records.push(record);
  }

  return { headers, records };
}

// Process Train Data
const trainRaw = fs.readFileSync(trainSourcePath, 'utf-8');
const { records: rawTrainRecords } = parseCsv(trainRaw);

// Process Test Data (Loan Prediction Dataset.csv)
const testRaw = fs.readFileSync(testSourcePath, 'utf-8');
const { records: rawTestRecords } = parseCsv(testRaw);

console.log(`Parsed ${rawTrainRecords.length} training records`);
console.log(`Parsed ${rawTestRecords.length} test records from Loan Prediction Dataset.csv`);

// Normalize & clean records
function cleanRecord(r, isTrain = true) {
  return {
    Loan_ID: r.Loan_ID || '',
    Gender: r.Gender || 'Male',
    Married: r.Married || 'Yes',
    Dependents: r.Dependents === '3+' ? '3+' : (r.Dependents || '0'),
    Education: r.Education || 'Graduate',
    Self_Employed: r.Self_Employed || 'No',
    ApplicantIncome: Number(r.ApplicantIncome) || 0,
    CoapplicantIncome: Number(r.CoapplicantIncome) || 0,
    LoanAmount: r.LoanAmount ? Number(r.LoanAmount) : 120, // median loan amount ~128
    Loan_Amount_Term: r.Loan_Amount_Term ? Number(r.Loan_Amount_Term) : 360,
    Credit_History: r.Credit_History !== '' ? Number(r.Credit_History) : 1,
    Property_Area: r.Property_Area || 'Urban',
    Loan_Status: isTrain ? (r.Loan_Status === 'Y' ? 'Y' : 'N') : undefined,
  };
}

const cleanTrain = rawTrainRecords.map(r => cleanRecord(r, true));
const cleanTest = rawTestRecords.map(r => cleanRecord(r, false));

// Calculate dataset statistics for normalization
const stats = {
  ApplicantIncome: { min: Infinity, max: -Infinity, sum: 0 },
  CoapplicantIncome: { min: Infinity, max: -Infinity, sum: 0 },
  LoanAmount: { min: Infinity, max: -Infinity, sum: 0 },
  Loan_Amount_Term: { min: Infinity, max: -Infinity, sum: 0 },
  TotalIncome: { min: Infinity, max: -Infinity, sum: 0 },
};

cleanTrain.forEach(r => {
  const totalInc = r.ApplicantIncome + r.CoapplicantIncome;
  ['ApplicantIncome', 'CoapplicantIncome', 'LoanAmount', 'Loan_Amount_Term'].forEach(col => {
    if (r[col] < stats[col].min) stats[col].min = r[col];
    if (r[col] > stats[col].max) stats[col].max = r[col];
    stats[col].sum += r[col];
  });
  if (totalInc < stats.TotalIncome.min) stats.TotalIncome.min = totalInc;
  if (totalInc > stats.TotalIncome.max) stats.TotalIncome.max = totalInc;
  stats.TotalIncome.sum += totalInc;
});

const count = cleanTrain.length;
const metadata = {
  totalTrainingSamples: count,
  totalTestSamples: cleanTest.length,
  stats: {
    ApplicantIncome: { min: stats.ApplicantIncome.min, max: stats.ApplicantIncome.max, avg: Math.round(stats.ApplicantIncome.sum / count) },
    CoapplicantIncome: { min: stats.CoapplicantIncome.min, max: stats.CoapplicantIncome.max, avg: Math.round(stats.CoapplicantIncome.sum / count) },
    LoanAmount: { min: stats.LoanAmount.min, max: stats.LoanAmount.max, avg: Math.round(stats.LoanAmount.sum / count) },
    Loan_Amount_Term: { min: stats.Loan_Amount_Term.min, max: stats.Loan_Amount_Term.max, avg: Math.round(stats.Loan_Amount_Term.sum / count) },
    TotalIncome: { min: stats.TotalIncome.min, max: stats.TotalIncome.max, avg: Math.round(stats.TotalIncome.sum / count) },
  },
  approvedCount: cleanTrain.filter(r => r.Loan_Status === 'Y').length,
  rejectedCount: cleanTrain.filter(r => r.Loan_Status === 'N').length,
};

fs.writeFileSync(path.join(dataOutputDir, 'trainingData.json'), JSON.stringify(cleanTrain, null, 2));
fs.writeFileSync(path.join(dataOutputDir, 'testDataset.json'), JSON.stringify(cleanTest, null, 2));
fs.writeFileSync(path.join(dataOutputDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

console.log('Successfully generated JSON datasets and metadata!');
console.log('Approval stats:', metadata.approvedCount, 'Approved,', metadata.rejectedCount, 'Rejected');
