'use client';

import React from 'react';
import { Users, CheckCircle, XCircle, Shield } from 'lucide-react';
import { KNNNeighbor } from '../lib/types';

interface NeighborsViewerProps {
  neighbors: KNNNeighbor[];
  k: number;
  isReady?: boolean;
}

export const NeighborsViewer: React.FC<NeighborsViewerProps> = ({ neighbors, k, isReady = true }) => {
  return (
    <div className="benchmark-table-wrap">
      <div className="card-header-bar">
        <div className="card-title-group">
          <div className="card-icon-bubble">
            <Users size={18} />
          </div>
          <div>
            <h3 className="card-heading">Top {k} Nearest Historical Cases</h3>
            <p className="card-subheading">
              Closest geometric profiles evaluated by the KNN distance algorithm
            </p>
          </div>
        </div>
        <div className="status-pill">
          <Shield size={13} style={{ color: 'var(--brand-blue)' }} />
          <span>Portfolio Comparison</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="benchmark-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Similarity Match</th>
              <th>Underwriting Verdict</th>
              <th>Household Income</th>
              <th>Loan Amount</th>
              <th>Credit Score</th>
              <th>Collateral Area</th>
              <th>Education</th>
            </tr>
          </thead>
          <tbody>
            {!isReady ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: 'center',
                    padding: '36px 18px',
                    color: 'var(--text-muted)',
                    fontSize: '0.88rem',
                  }}
                >
                  Awaiting applicant details. Enter financial parameters above to inspect nearest historical benchmark cases.
                </td>
              </tr>
            ) : (
              neighbors.map((n, idx) => {
                const isApp = n.approvalStatus === 'Y';
                const totalInc = (Number(n.record.ApplicantIncome) || 0) + (Number(n.record.CoapplicantIncome) || 0);

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      #{idx + 1}
                    </td>
                    <td>
                      <div className="match-bar-wrap">
                        <div className="match-track">
                          <div
                            className="match-fill"
                            style={{
                              width: `${n.similarityPercent}%`,
                              background: isApp ? 'var(--success-accent)' : 'var(--danger-accent)',
                            }}
                          />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600 }}>
                          {n.similarityPercent}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`table-tag ${isApp ? 'pass' : 'fail'}`}>
                        {isApp ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        <span>{isApp ? 'Approved' : 'Declined'}</span>
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>${totalInc.toLocaleString()}/mo</td>
                    <td style={{ fontWeight: 500 }}>${n.record.LoanAmount}k</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: n.record.Credit_History === 1 ? 'var(--success-text)' : 'var(--danger-text)',
                        }}
                      >
                        {n.record.Credit_History === 1 ? '1.0 (Clean)' : '0.0 (Adverse)'}
                      </span>
                    </td>
                    <td>{n.record.Property_Area}</td>
                    <td>{n.record.Education}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
