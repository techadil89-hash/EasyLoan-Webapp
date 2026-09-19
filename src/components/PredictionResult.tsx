'use client';

import React, { useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ClipboardList,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PredictionOutput, LoanApplicant } from '../lib/types';

interface PredictionResultProps {
  result: PredictionOutput;
  applicant: LoanApplicant;
  isReady: boolean;
  onQuickLoad?: () => void;
}

export const PredictionResult: React.FC<PredictionResultProps> = ({
  result,
  applicant,
  isReady,
  onQuickLoad,
}) => {
  const isApproved = result?.status === 'Approved';
  const applicantName = `${applicant?.FirstName || ''} ${applicant?.LastName || ''}`.trim();

  useEffect(() => {
    if (isReady && isApproved && typeof window !== 'undefined') {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.65 },
        colors: ['#0f172a', '#10b981', '#2563eb'],
      });
    }
  }, [isReady, isApproved, result.probability]);

  // Circumference for 54 radius circle: 2 * PI * 54 = 339.29
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isReady
    ? circumference - (result.probability / 100) * circumference
    : circumference;

  return (
    <div className="sleek-card">
      <div className="card-header-bar">
        <div className="card-title-group">
          <div
            className="card-icon-bubble"
            style={{
              background: !isReady
                ? 'rgba(255, 255, 255, 0.05)'
                : isApproved
                ? 'var(--success-bg)'
                : 'var(--danger-bg)',
              color: !isReady
                ? 'var(--text-muted)'
                : isApproved
                ? 'var(--success-text)'
                : 'var(--danger-text)',
            }}
          >
            {!isReady ? (
              <ClipboardList size={20} />
            ) : isApproved ? (
              <CheckCircle2 size={20} />
            ) : (
              <XCircle size={20} />
            )}
          </div>
          <div>
            <h2 className="card-heading">
              {!isReady
                ? 'Underwriting Evaluation'
                : applicantName
                ? `Decision: ${applicantName}`
                : 'Decision Analytics'}
            </h2>
            <p className="card-subheading">
              {!isReady
                ? 'Awaiting applicant information'
                : 'K-Nearest Neighbors real-time underwriting'}
            </p>
          </div>
        </div>
      </div>

      <div className="card-content">
        {!isReady ? (
          /* Empty / Unfilled State */
          <div
            className="decision-hero-card"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'var(--border-default)',
              padding: '36px 24px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <ClipboardList size={30} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              Form Unfilled
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 22px', lineHeight: 1.5 }}>
              Please enter applicant income, requested loan amount, and credit standing on the left to evaluate underwriting consensus.
            </p>

            {/* Checklist of required inputs */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                maxWidth: '360px',
                margin: '0 auto',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Required Fields Checklist
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: applicant.ApplicantIncome ? 'var(--success-text)' : 'var(--text-muted)' }}>
                  {applicant.ApplicantIncome ? <CheckCircle2 size={14} /> : <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid var(--border-default)' }} />}
                  <span>Primary Monthly Income {applicant.ApplicantIncome ? `($${Number(applicant.ApplicantIncome).toLocaleString()})` : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: applicant.LoanAmount ? 'var(--success-text)' : 'var(--text-muted)' }}>
                  {applicant.LoanAmount ? <CheckCircle2 size={14} /> : <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid var(--border-default)' }} />}
                  <span>Loan Amount Requested {applicant.LoanAmount ? `($${applicant.LoanAmount}k)` : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: applicant.Credit_History !== undefined ? 'var(--success-text)' : 'var(--text-muted)' }}>
                  {applicant.Credit_History !== undefined ? <CheckCircle2 size={14} /> : <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid var(--border-default)' }} />}
                  <span>Credit Bureau Status {applicant.Credit_History !== undefined ? `(Score: ${applicant.Credit_History}.0)` : ''}</span>
                </div>
              </div>
            </div>

            {onQuickLoad && (
              <button
                type="button"
                className="btn-outline"
                onClick={onQuickLoad}
                style={{ marginTop: '22px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Or Load Sample Profile (1-Click)</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        ) : (
          /* Evaluated State */
          <>
            <div
              className={`decision-hero-card ${isApproved ? 'approved-mode' : 'rejected-mode'}`}
              id="decision-hero"
            >
              <div className="verdict-tag">
                {isApproved ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                <span>{isApproved ? 'Loan Approved' : 'Application Declined'}</span>
              </div>

              {/* SVG Circular Score Meter */}
              <div className="dial-container">
                <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto' }}>
                  <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke={isApproved ? '#10b981' : '#f43f5e'}
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="dial-score-text">{result.probability}%</span>
                    <span className="dial-score-label">Consensus</span>
                  </div>
                </div>
              </div>

              <p className="verdict-summary">
                {isApproved
                  ? `Application satisfies institutional underwriting parameters with ${result.approvedNeighborsCount} of ${result.totalNeighbors} agreeing nearest cases.`
                  : `Application falls below institutional tolerance thresholds due to credit history deficits or elevated debt leverage.`}
              </p>

              {/* 3 Minimalist Metric Tiles */}
              <div className="mini-tiles-row">
                <div className="mini-tile">
                  <span className="mini-tile-val" style={{ color: isApproved ? 'var(--success-text)' : 'var(--danger-text)' }}>
                    {result.probability}%
                  </span>
                  <span className="mini-tile-lbl">Approval Prob.</span>
                </div>

                <div className="mini-tile">
                  <span className="mini-tile-val" style={{ color: result.riskScore > 50 ? 'var(--danger-text)' : 'var(--success-text)' }}>
                    {result.riskScore}/100
                  </span>
                  <span className="mini-tile-lbl">Risk Index</span>
                </div>

                <div className="mini-tile">
                  <span className="mini-tile-val" style={{ color: '#38bdf8' }}>
                    {result.confidence}%
                  </span>
                  <span className="mini-tile-lbl">Certainty</span>
                </div>
              </div>
            </div>

            {/* Explainability Factors */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} style={{ color: '#38bdf8' }} />
                <span>Key Underwriting Factors</span>
              </div>

              <div className="factors-stack">
                {result.factors.map((factor, idx) => (
                  <div key={idx} className="factor-item">
                    <div className={`factor-dot ${factor.impact}`}>
                      {factor.impact === 'positive' && <CheckCircle2 size={14} />}
                      {factor.impact === 'negative' && <XCircle size={14} />}
                      {factor.impact === 'neutral' && <HelpCircle size={14} />}
                    </div>
                    <div>
                      <div className="factor-title">{factor.name}</div>
                      <div className="factor-text">{factor.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guidance Box */}
            {result.recommendations.length > 0 && (
              <div className="advice-card">
                <div className="advice-title">
                  <Info size={14} />
                  <span>Underwriting Assessment</span>
                </div>
                <ul className="advice-items">
                  {result.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
