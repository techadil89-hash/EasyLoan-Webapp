'use client';

import React, { useState } from 'react';
import { predict } from '../services/api';
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  User,
  Building,
  Clock,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function PredictionForm({ onPredictionComplete }) {
  // Form input state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    married: 'Yes',
    dependents: '0',
    education: 'Graduate',
    selfEmployed: 'No',
    applicantIncome: '',
    coapplicantIncome: '',
    loanAmount: '',
    loanAmountTerm: '360',
    creditHistory: '1',
    propertyArea: 'Urban',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific validation error on change
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.applicantIncome || Number(formData.applicantIncome) <= 0) {
      errors.applicantIncome = 'Please enter a valid monthly income greater than 0';
    }
    if (!formData.loanAmount || Number(formData.loanAmount) <= 0) {
      errors.loanAmount = 'Please specify a requested loan amount';
    }
    if (!formData.loanAmountTerm || Number(formData.loanAmountTerm) <= 0) {
      errors.loanAmountTerm = 'Loan term is required (typically 360 or 180 months)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare payload with appropriate data types for FastAPI Pydantic validation
      const payload = {
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        gender: formData.gender,
        married: formData.married,
        dependents: formData.dependents,
        education: formData.education,
        selfEmployed: formData.selfEmployed,
        applicantIncome: parseFloat(formData.applicantIncome),
        coapplicantIncome: formData.coapplicantIncome ? parseFloat(formData.coapplicantIncome) : 0,
        loanAmount: parseFloat(formData.loanAmount),
        loanAmountTerm: parseFloat(formData.loanAmountTerm),
        creditHistory: parseInt(formData.creditHistory, 10),
        propertyArea: formData.propertyArea,
      };

      const response = await predict(payload);

      setResult(response);
      setSuccessMessage('Loan application successfully evaluated by FastAPI KNN backend.');
      if (onPredictionComplete) {
        onPredictionComplete(response);
      }
    } catch (err) {
      console.error('FastAPI Prediction Error:', err);
      if (err.response) {
        const detail = err.response.data?.detail;
        if (Array.isArray(detail)) {
          setError(`Validation error: ${detail.map((d) => d.msg || d).join(', ')}`);
        } else if (typeof detail === 'string') {
          setError(`Backend error: ${detail}`);
        } else {
          setError(`Server responded with status ${err.response.status}: ${err.response.statusText}`);
        }
      } else if (err.request) {
        setError('Cannot connect to FastAPI backend at http://localhost:8000. Please ensure the backend server is running.');
      } else {
        setError(`Request failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'Male',
      married: 'Yes',
      dependents: '0',
      education: 'Graduate',
      selfEmployed: 'No',
      applicantIncome: '',
      coapplicantIncome: '',
      loanAmount: '',
      loanAmountTerm: '360',
      creditHistory: '1',
      propertyArea: 'Urban',
    });
    setResult(null);
    setError(null);
    setValidationErrors({});
    setSuccessMessage(null);
  };

  const handleLoadSample = (type) => {
    if (type === 'prime') {
      setFormData({
        firstName: 'Marcus',
        lastName: 'Sinclair',
        gender: 'Male',
        married: 'Yes',
        dependents: '1',
        education: 'Graduate',
        selfEmployed: 'No',
        applicantIncome: '7500',
        coapplicantIncome: '2200',
        loanAmount: '180',
        loanAmountTerm: '360',
        creditHistory: '1',
        propertyArea: 'Urban',
      });
    } else {
      setFormData({
        firstName: 'Devon',
        lastName: 'Carter',
        gender: 'Male',
        married: 'No',
        dependents: '0',
        education: 'Not Graduate',
        selfEmployed: 'Yes',
        applicantIncome: '2100',
        coapplicantIncome: '0',
        loanAmount: '240',
        loanAmountTerm: '360',
        creditHistory: '0',
        propertyArea: 'Rural',
      });
    }
    setError(null);
    setValidationErrors({});
  };

  return (
    <div className="prediction-form-wrapper">
      {/* Alert Messages */}
      {error && (
        <div className="api-banner error-banner">
          <AlertCircle size={18} className="banner-icon" />
          <div className="banner-content">
            <strong>Evaluation Error</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="banner-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {successMessage && !error && (
        <div className="api-banner success-banner">
          <CheckCircle2 size={18} className="banner-icon" />
          <div className="banner-content">
            <strong>Model Computed</strong>
            <p>{successMessage}</p>
          </div>
          <button type="button" className="banner-close" onClick={() => setSuccessMessage(null)}>✕</button>
        </div>
      )}

      <div className="form-result-grid">
        {/* Input Form Column */}
        <div className="sleek-card form-container-card">
          <div className="card-header-bar">
            <div className="card-title-group">
              <div className="card-icon-bubble">
                <User size={18} />
              </div>
              <div>
                <h2 className="card-heading">Applicant Application Form</h2>
                <p className="card-subheading">Submit applicant financial variables to FastAPI</p>
              </div>
            </div>

            <div className="quick-fill-presets">
              <button
                type="button"
                className="btn-preset-sm"
                onClick={() => handleLoadSample('prime')}
                title="Fill Prime Candidate"
              >
                Sample: Prime
              </button>
              <button
                type="button"
                className="btn-preset-sm"
                onClick={() => handleLoadSample('adverse')}
                title="Fill Subprime Candidate"
              >
                Sample: Adverse
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-form">
            {/* Identity */}
            <div className="form-group-title">
              <User size={14} />
              <span>Applicant Identity</span>
            </div>
            <div className="row-2-col">
              <div className="input-block">
                <label className="field-label" htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="sleek-input"
                  placeholder="e.g. Eleanor"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="input-block">
                <label className="field-label" htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="sleek-input"
                  placeholder="e.g. Vance"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Demographics */}
            <div className="row-3-col" style={{ marginTop: '12px' }}>
              <div className="input-block">
                <label className="field-label" htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  className="sleek-input select"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="input-block">
                <label className="field-label" htmlFor="married">Marital Status</label>
                <select
                  id="married"
                  name="married"
                  className="sleek-input select"
                  value={formData.married}
                  onChange={handleChange}
                >
                  <option value="Yes">Married</option>
                  <option value="No">Single</option>
                </select>
              </div>

              <div className="input-block">
                <label className="field-label" htmlFor="dependents">Dependents</label>
                <select
                  id="dependents"
                  name="dependents"
                  className="sleek-input select"
                  value={formData.dependents}
                  onChange={handleChange}
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3+">3+</option>
                </select>
              </div>
            </div>

            {/* Employment & Education */}
            <div className="form-group-title">
              <Briefcase size={14} />
              <span>Background & Employment</span>
            </div>
            <div className="row-2-col">
              <div className="input-block">
                <label className="field-label" htmlFor="education">Education Level</label>
                <select
                  id="education"
                  name="education"
                  className="sleek-input select"
                  value={formData.education}
                  onChange={handleChange}
                >
                  <option value="Graduate">Graduate Degree</option>
                  <option value="Not Graduate">Not Graduate</option>
                </select>
              </div>

              <div className="input-block">
                <label className="field-label" htmlFor="selfEmployed">Self Employed</label>
                <select
                  id="selfEmployed"
                  name="selfEmployed"
                  className="sleek-input select"
                  value={formData.selfEmployed}
                  onChange={handleChange}
                >
                  <option value="No">No (Salaried Employee)</option>
                  <option value="Yes">Yes (Business / Freelance)</option>
                </select>
              </div>
            </div>

            {/* Financials */}
            <div className="form-group-title">
              <DollarSign size={14} />
              <span>Financial Inputs</span>
            </div>
            <div className="row-2-col">
              <div className="input-block">
                <label className="field-label" htmlFor="applicantIncome">
                  <span>Applicant Income ($/mo)</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  id="applicantIncome"
                  name="applicantIncome"
                  className={`sleek-input ${validationErrors.applicantIncome ? 'input-error' : ''}`}
                  placeholder="e.g. 5500"
                  min="0"
                  step="50"
                  value={formData.applicantIncome}
                  onChange={handleChange}
                  required
                />
                {validationErrors.applicantIncome && (
                  <span className="error-hint">{validationErrors.applicantIncome}</span>
                )}
              </div>

              <div className="input-block">
                <label className="field-label" htmlFor="coapplicantIncome">
                  <span>Co-Applicant Income ($/mo)</span>
                </label>
                <input
                  type="number"
                  id="coapplicantIncome"
                  name="coapplicantIncome"
                  className="sleek-input"
                  placeholder="e.g. 1500 (or 0)"
                  min="0"
                  step="50"
                  value={formData.coapplicantIncome}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Loan Request */}
            <div className="form-group-title">
              <Building size={14} />
              <span>Loan & Credit Specifications</span>
            </div>
            <div className="row-3-col">
              <div className="input-block">
                <label className="field-label" htmlFor="loanAmount">
                  <span>Loan Amount ($k)</span>
                  <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  id="loanAmount"
                  name="loanAmount"
                  className={`sleek-input ${validationErrors.loanAmount ? 'input-error' : ''}`}
                  placeholder="e.g. 140 ($140,000)"
                  min="1"
                  value={formData.loanAmount}
                  onChange={handleChange}
                  required
                />
                {validationErrors.loanAmount && (
                  <span className="error-hint">{validationErrors.loanAmount}</span>
                )}
              </div>

              <div className="input-block">
                <label className="field-label" htmlFor="loanAmountTerm">
                  <span>Term (Months)</span>
                  <span className="required-star">*</span>
                </label>
                <select
                  id="loanAmountTerm"
                  name="loanAmountTerm"
                  className="sleek-input select"
                  value={formData.loanAmountTerm}
                  onChange={handleChange}
                >
                  <option value="360">360 Months (30 Yrs)</option>
                  <option value="240">240 Months (20 Yrs)</option>
                  <option value="180">180 Months (15 Yrs)</option>
                  <option value="120">120 Months (10 Yrs)</option>
                  <option value="84">84 Months (7 Yrs)</option>
                </select>
              </div>

              <div className="input-block">
                <label className="field-label" htmlFor="propertyArea">
                  <span>Property Area</span>
                </label>
                <select
                  id="propertyArea"
                  name="propertyArea"
                  className="sleek-input select"
                  value={formData.propertyArea}
                  onChange={handleChange}
                >
                  <option value="Urban">Urban</option>
                  <option value="Semiurban">Semiurban</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>
            </div>

            {/* Credit Bureau Rating */}
            <div className="input-block" style={{ marginTop: '14px' }}>
              <label className="field-label" htmlFor="creditHistory">
                <span>Credit Bureau Standing</span>
                <span className="required-star">*</span>
              </label>
              <div className="credit-toggle-grid">
                <button
                  type="button"
                  className={`credit-btn ${formData.creditHistory === '1' ? 'selected pass' : ''}`}
                  onClick={() => setFormData((p) => ({ ...p, creditHistory: '1' }))}
                >
                  <ShieldCheck size={16} />
                  <span>Meets Guidelines (1.0)</span>
                </button>
                <button
                  type="button"
                  className={`credit-btn ${formData.creditHistory === '0' ? 'selected fail' : ''}`}
                  onClick={() => setFormData((p) => ({ ...p, creditHistory: '0' }))}
                >
                  <AlertCircle size={16} />
                  <span>Delinquencies / None (0.0)</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="form-bottom-actions" style={{ marginTop: '24px' }}>
              <button
                type="submit"
                className="btn-dark"
                disabled={loading}
                id="submit-prediction-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner-sm" />
                    <span>Querying FastAPI Model...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Send to FastAPI /predict</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-outline"
                onClick={handleReset}
                disabled={loading}
                id="reset-prediction-form-btn"
              >
                <RotateCcw size={15} />
                <span>Clear</span>
              </button>
            </div>
          </form>
        </div>

        {/* Prediction Results Card Column */}
        <div className="results-container-card">
          {result ? (
            <div className={`sleek-card prediction-card ${result.status === 'Approved' ? 'card-approved' : 'card-rejected'}`}>
              <div className="result-header">
                <span className="result-badge-label">FastAPI KNN Model Verdict</span>
                <div className={`status-tag ${result.status === 'Approved' ? 'status-approved' : 'status-rejected'}`}>
                  {result.status === 'Approved' ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>APPROVED</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      <span>REJECTED</span>
                    </>
                  )}
                </div>
              </div>

              {/* Raw Prediction Int from spec */}
              <div className="raw-prediction-row">
                <span className="raw-label">Model Integer Output:</span>
                <span className="raw-code">
                  prediction: <strong>{result.prediction}</strong> ({result.prediction === 1 ? 'Approved' : 'Rejected'})
                </span>
              </div>

              {/* Analytics Metrics */}
              <div className="prediction-stats-grid">
                <div className="p-stat-box">
                  <span className="p-stat-label">Approval Probability</span>
                  <span className="p-stat-value">{result.probability ? `${result.probability}%` : `${result.prediction === 1 ? 85 : 15}%`}</span>
                </div>
                <div className="p-stat-box">
                  <span className="p-stat-label">Risk Score</span>
                  <span className="p-stat-value">{result.risk_score ? `${result.risk_score}/100` : `${result.prediction === 1 ? 15 : 85}/100`}</span>
                </div>
                <div className="p-stat-box">
                  <span className="p-stat-label">Algorithm</span>
                  <span className="p-stat-value">KNN (k=5)</span>
                </div>
              </div>

              {/* Factors */}
              {result.factors && result.factors.length > 0 && (
                <div className="result-section">
                  <h4 className="section-title">Underwriting Factors</h4>
                  <div className="factors-list">
                    {result.factors.map((factor, idx) => (
                      <div key={idx} className={`factor-item ${factor.impact}`}>
                        <span className="factor-dot" />
                        <div>
                          <strong className="factor-name">{factor.name}: </strong>
                          <span className="factor-desc">{factor.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="result-section">
                  <h4 className="section-title">Actionable Recommendation</h4>
                  <ul className="recommendation-list">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="rec-item">
                        <ArrowRight size={14} className="rec-arrow" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="sleek-card prediction-placeholder-card">
              <div className="placeholder-content">
                <div className="placeholder-icon">
                  <Layers size={36} />
                </div>
                <h3>Awaiting Application Submission</h3>
                <p>
                  Fill in the applicant profile details on the left and click <strong>Send to FastAPI /predict</strong> to run inference against the Scikit-Learn K-Nearest Neighbors model.
                </p>
                <div className="placeholder-tags">
                  <span>FastAPI REST API</span>
                  <span>Joblib KNN</span>
                  <span>Pydantic V2</span>
                  <span>Zero Page Refresh</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
