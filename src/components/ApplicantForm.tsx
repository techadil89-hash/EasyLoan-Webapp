'use client';

import React from 'react';
import {
  User,
  Users,
  Briefcase,
  GraduationCap,
  DollarSign,
  Calendar,
  Home,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Shuffle,
} from 'lucide-react';
import { LoanApplicant, Gender, Married, Dependents, Education, SelfEmployed, CreditHistory, PropertyArea } from '../lib/types';
import { ARCHETYPE_PRESETS } from '../lib/dataset';

interface ApplicantFormProps {
  applicant: LoanApplicant;
  onChange: (updated: LoanApplicant) => void;
  onSubmit: () => void;
  onReset: () => void;
  onRandomize: () => void;
  isSubmitting?: boolean;
}

export const ApplicantForm: React.FC<ApplicantFormProps> = ({
  applicant,
  onChange,
  onSubmit,
  onReset,
  onRandomize,
  isSubmitting = false,
}) => {
  const handleFieldChange = <K extends keyof LoanApplicant>(field: K, value: LoanApplicant[K]) => {
    onChange({
      ...applicant,
      [field]: value,
    });
  };

  return (
    <div className="sleek-card">
      <div className="card-header-bar">
        <div className="card-title-group">
          <div className="card-icon-bubble">
            <User size={20} />
          </div>
          <div>
            <h2 className="card-heading">Applicant Profile</h2>
            <p className="card-subheading">Enter borrower information to evaluate credit eligibility</p>
          </div>
        </div>
      </div>

      <div className="card-content">
        {/* Sample Profile Presets */}
        <div className="presets-tray">
          <div className="tray-title">
            <span>Or Quick-Fill With Sample Profiles</span>
            <Sparkles size={13} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div className="presets-flex">
            {ARCHETYPE_PRESETS.map((preset) => {
              const isActive =
                applicant.FirstName === preset.data.FirstName &&
                applicant.LastName === preset.data.LastName &&
                applicant.ApplicantIncome === preset.data.ApplicantIncome;

              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`preset-chip ${isActive ? 'active' : ''}`}
                  onClick={() => onChange({ ...preset.data })}
                  id={`preset-${preset.id}-btn`}
                  title={preset.tagline}
                >
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {/* Section 0: Legal Identity */}
          <div className="form-group-title">
            <User size={16} />
            <span>Applicant Identity</span>
          </div>

          <div className="row-2-col" style={{ marginBottom: '16px' }}>
            <div className="input-block">
              <label className="field-label" htmlFor="first-name-input">
                <span>First Name</span>
                <span className="field-hint">Legal Given Name</span>
              </label>
              <div className="field-wrapper">
                <User className="field-prefix-icon" size={16} />
                <input
                  id="first-name-input"
                  type="text"
                  className="clean-input has-prefix"
                  placeholder="e.g. Alexander"
                  value={applicant.FirstName || ''}
                  onChange={(e) => handleFieldChange('FirstName', e.target.value)}
                />
              </div>
            </div>

            <div className="input-block">
              <label className="field-label" htmlFor="last-name-input">
                <span>Last Name</span>
                <span className="field-hint">Surname / Family</span>
              </label>
              <div className="field-wrapper">
                <User className="field-prefix-icon" size={16} />
                <input
                  id="last-name-input"
                  type="text"
                  className="clean-input has-prefix"
                  placeholder="e.g. Wright"
                  value={applicant.LastName || ''}
                  onChange={(e) => handleFieldChange('LastName', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 1: Demographics */}
          <div className="form-group-title">
            <Users size={16} />
            <span>Demographic Data</span>
          </div>

          <div className="row-3-col">
            <div className="input-block">
              <label className="field-label" htmlFor="gender-select">Gender</label>
              <select
                id="gender-select"
                className="clean-select"
                value={applicant.Gender || ''}
                onChange={(e) => handleFieldChange('Gender', (e.target.value || undefined) as Gender)}
              >
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="input-block">
              <label className="field-label" htmlFor="married-select">Marital Status</label>
              <select
                id="married-select"
                className="clean-select"
                value={applicant.Married || ''}
                onChange={(e) => handleFieldChange('Married', (e.target.value || undefined) as Married)}
              >
                <option value="">-- Select Marital Status --</option>
                <option value="Yes">Married</option>
                <option value="No">Single / Unmarried</option>
              </select>
            </div>

            <div className="input-block">
              <label className="field-label" htmlFor="dependents-select">Dependents</label>
              <select
                id="dependents-select"
                className="clean-select"
                value={applicant.Dependents || ''}
                onChange={(e) => handleFieldChange('Dependents', (e.target.value || undefined) as Dependents)}
              >
                <option value="">-- Select Dependents --</option>
                <option value="0">0 Dependents</option>
                <option value="1">1 Dependent</option>
                <option value="2">2 Dependents</option>
                <option value="3+">3+ Dependents</option>
              </select>
            </div>
          </div>

          <div className="row-2-col" style={{ marginTop: '14px' }}>
            <div className="input-block">
              <label className="field-label" htmlFor="education-select">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <GraduationCap size={14} /> Education Level
                </span>
              </label>
              <select
                id="education-select"
                className="clean-select"
                value={applicant.Education || ''}
                onChange={(e) => handleFieldChange('Education', (e.target.value || undefined) as Education)}
              >
                <option value="">-- Select Education Level --</option>
                <option value="Graduate">University Graduate</option>
                <option value="Not Graduate">Non-Graduate</option>
              </select>
            </div>

            <div className="input-block">
              <label className="field-label" htmlFor="self-employed-select">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Briefcase size={14} /> Employment Structure
                </span>
              </label>
              <select
                id="self-employed-select"
                className="clean-select"
                value={applicant.Self_Employed || ''}
                onChange={(e) => handleFieldChange('Self_Employed', (e.target.value || undefined) as SelfEmployed)}
              >
                <option value="">-- Select Employment --</option>
                <option value="No">Salaried Employee</option>
                <option value="Yes">Self-Employed / Business Owner</option>
              </select>
            </div>
          </div>

          {/* Section 2: Income & Obligations */}
          <div className="form-group-title">
            <DollarSign size={16} />
            <span>Income & Financial Capability</span>
          </div>

          <div className="row-2-col">
            <div className="input-block">
              <label className="field-label" htmlFor="applicant-income-input">
                <span>Primary Applicant Income</span>
                <span className="field-hint">Monthly ($)</span>
              </label>
              <div className="field-wrapper">
                <DollarSign className="field-prefix-icon" size={16} />
                <input
                  id="applicant-income-input"
                  type="number"
                  min={0}
                  step={100}
                  className="clean-input has-prefix has-suffix"
                  placeholder="e.g. 5,400"
                  value={applicant.ApplicantIncome ?? ''}
                  onChange={(e) =>
                    handleFieldChange(
                      'ApplicantIncome',
                      e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                    )
                  }
                />
                <span className="field-suffix">/mo</span>
              </div>
            </div>

            <div className="input-block">
              <label className="field-label" htmlFor="coapplicant-income-input">
                <span>Co-Applicant Income</span>
                <span className="field-hint">Secondary ($)</span>
              </label>
              <div className="field-wrapper">
                <DollarSign className="field-prefix-icon" size={16} />
                <input
                  id="coapplicant-income-input"
                  type="number"
                  min={0}
                  step={100}
                  className="clean-input has-prefix has-suffix"
                  placeholder="e.g. 1,800 (optional)"
                  value={applicant.CoapplicantIncome ?? ''}
                  onChange={(e) =>
                    handleFieldChange(
                      'CoapplicantIncome',
                      e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                    )
                  }
                />
                <span className="field-suffix">/mo</span>
              </div>
            </div>
          </div>

          {/* Section 3: Loan Amount & Credit */}
          <div className="form-group-title">
            <Home size={16} />
            <span>Loan Facility & Underwriting</span>
          </div>

          <div className="row-3-col">
            <div className="input-block">
              <label className="field-label" htmlFor="loan-amount-input">
                <span>Loan Requested</span>
                <span className="field-hint">Thousands ($)</span>
              </label>
              <div className="field-wrapper">
                <DollarSign className="field-prefix-icon" size={16} />
                <input
                  id="loan-amount-input"
                  type="number"
                  min={1}
                  max={999}
                  step={1}
                  className="clean-input has-prefix has-suffix"
                  placeholder="e.g. 130"
                  value={applicant.LoanAmount ?? ''}
                  onChange={(e) =>
                    handleFieldChange(
                      'LoanAmount',
                      e.target.value === '' ? '' : Math.max(1, Number(e.target.value))
                    )
                  }
                />
                <span className="field-suffix">,000 $</span>
              </div>
            </div>

            <div className="input-block">
              <label className="field-label" htmlFor="term-select">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> Amortization Term
                </span>
              </label>
              <select
                id="term-select"
                className="clean-select"
                value={applicant.Loan_Amount_Term ?? ''}
                onChange={(e) =>
                  handleFieldChange(
                    'Loan_Amount_Term',
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
              >
                <option value="">-- Select Term --</option>
                <option value={120}>120 mo (10 Yrs)</option>
                <option value={180}>180 mo (15 Yrs)</option>
                <option value={240}>240 mo (20 Yrs)</option>
                <option value={300}>300 mo (25 Yrs)</option>
                <option value={360}>360 mo (30 Yrs)</option>
                <option value={480}>480 mo (40 Yrs)</option>
              </select>
            </div>

            <div className="input-block">
              <label className="field-label" htmlFor="property-area-select">Collateral Area</label>
              <select
                id="property-area-select"
                className="clean-select"
                value={applicant.Property_Area || ''}
                onChange={(e) =>
                  handleFieldChange('Property_Area', (e.target.value || undefined) as PropertyArea)
                }
              >
                <option value="">-- Select Area --</option>
                <option value="Urban">Urban</option>
                <option value="Semiurban">Semiurban</option>
                <option value="Rural">Rural</option>
              </select>
            </div>
          </div>

          {/* Credit Bureau Record */}
          <div style={{ marginTop: '16px' }}>
            <label className="field-label">
              <span>Credit Bureau Record</span>
              <span className="field-hint">Institutional Grade</span>
            </label>
            <div
              className={`credit-card-panel ${
                applicant.Credit_History === 1
                  ? 'pass'
                  : applicant.Credit_History === 0
                  ? 'fail'
                  : ''
              }`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {applicant.Credit_History === 1 ? (
                  <ShieldCheck size={26} style={{ color: 'var(--success-accent)' }} />
                ) : applicant.Credit_History === 0 ? (
                  <ShieldAlert size={26} style={{ color: 'var(--danger-accent)' }} />
                ) : (
                  <HelpCircle size={26} style={{ color: 'var(--text-muted)' }} />
                )}
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {applicant.Credit_History === 1
                      ? 'Institutional Standard (Score: 1.0)'
                      : applicant.Credit_History === 0
                      ? 'Past Delinquencies / Defaults (Score: 0.0)'
                      : 'Unselected Credit Bureau Record'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {applicant.Credit_History === 1
                      ? 'Clean credit history meeting institutional repayment standards.'
                      : applicant.Credit_History === 0
                      ? 'Past delinquencies, defaults, or high risk score on file.'
                      : 'Please select whether borrower has clean repayment history (1.0) or past defaults (0.0).'}
                  </div>
                </div>
              </div>

              <div className="ios-tabs">
                <button
                  type="button"
                  className={`ios-tab-btn ${applicant.Credit_History === 1 ? 'active' : ''}`}
                  onClick={() => handleFieldChange('Credit_History', 1 as CreditHistory)}
                  id="credit-pass-btn"
                >
                  Score: 1.0
                </button>
                <button
                  type="button"
                  className={`ios-tab-btn ${applicant.Credit_History === 0 ? 'active' : ''}`}
                  onClick={() => handleFieldChange('Credit_History', 0 as CreditHistory)}
                  id="credit-fail-btn"
                >
                  Score: 0.0
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-bottom-actions">
            <button
              type="submit"
              className="btn-dark"
              id="run-prediction-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-sm" />
                  <span>Evaluating via FastAPI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Evaluate Loan Eligibility</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={onRandomize}
              disabled={isSubmitting}
              id="randomize-applicant-btn"
              title="Generate sample applicant"
            >
              <Shuffle size={15} />
              <span>Randomize</span>
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={onReset}
              id="reset-form-btn"
              title="Clear all fields"
            >
              <RotateCcw size={15} />
              <span>Clear Form</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
