'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  BrainCircuit,
  ShieldCheck,
  CheckCircle2,
  Zap,
  HelpCircle,
  BarChart3,
  Layers,
  Cpu,
  Sparkles,
  Server,
  Activity,
  AlertCircle,
  FileCode2,
} from 'lucide-react';
import { LoanApplicant, KNNConfig, Gender, Married, Dependents, Education, SelfEmployed, PropertyArea, CreditHistory, PredictionOutput } from '../lib/types';
import { predictLoanApproval, isApplicantReady } from '../lib/knn';
import { datasetMetadata, ARCHETYPE_PRESETS } from '../lib/dataset';
import { ApplicantForm } from '../components/ApplicantForm';
import { PredictionResult } from '../components/PredictionResult';
import { ModelControls } from '../components/ModelControls';
import { NeighborsViewer } from '../components/NeighborsViewer';
import PredictionForm from '../components/PredictionForm';
import { checkBackendHealth, predictLoan } from '../services/api';

// Initial state is completely unfilled
const INITIAL_EMPTY_APPLICANT: LoanApplicant = {
  FirstName: '',
  LastName: '',
  Gender: undefined,
  Married: undefined,
  Dependents: undefined,
  Education: undefined,
  Self_Employed: undefined,
  ApplicantIncome: '',
  CoapplicantIncome: '',
  LoanAmount: '',
  Loan_Amount_Term: '',
  Credit_History: undefined,
  Property_Area: undefined,
};

export default function HomePage() {
  const [applicant, setApplicant] = useState<LoanApplicant>(INITIAL_EMPTY_APPLICANT);
  const [knnConfig, setKnnConfig] = useState<KNNConfig>({
    k: 5,
    metric: 'euclidean',
    weighted: true,
  });
  const [showMethodology, setShowMethodology] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'suite' | 'direct-form'>('suite');

  // Backend connection status
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiBanner, setApiBanner] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Custom prediction result returned from FastAPI backend
  const [backendPrediction, setBackendPrediction] = useState<PredictionOutput | null>(null);

  const probeBackend = async () => {
    setBackendStatus('checking');
    try {
      const res = await checkBackendHealth();
      setBackendStatus(res.online ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  // Check FastAPI backend health on mount and periodically
  useEffect(() => {
    probeBackend();
    const interval = setInterval(probeBackend, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Check if applicant has sufficient data for underwriting evaluation
  const isReady = useMemo(() => {
    return isApplicantReady(applicant);
  }, [applicant]);

  // Real-time prediction recalculation via KNN or backend result
  const localPrediction = useMemo(() => {
    return predictLoanApproval(applicant, knnConfig);
  }, [applicant, knnConfig]);

  // Current active prediction to display in the result card
  const activePrediction = backendPrediction || localPrediction;

  const handleReset = () => {
    setApplicant(INITIAL_EMPTY_APPLICANT);
    setBackendPrediction(null);
    setApiBanner(null);
  };

  const handleRandomize = () => {
    const firstNames = ['James', 'Sophia', 'Alexander', 'Olivia', 'Daniel', 'Emma', 'Lucas', 'Mia', 'Marcus', 'Elena', 'Ethan', 'Chloe'];
    const lastNames = ['Bennett', 'Sterling', 'Chen', 'Vance', 'Rodriguez', 'Patel', 'Wright', 'Hawthorne', 'Montgomery', 'Sinclair'];
    const genders: Gender[] = ['Male', 'Female'];
    const marriedVals: Married[] = ['Yes', 'No'];
    const deps: Dependents[] = ['0', '1', '2', '3+'];
    const edus: Education[] = ['Graduate', 'Not Graduate'];
    const selfEmps: SelfEmployed[] = ['No', 'Yes'];
    const areas: PropertyArea[] = ['Urban', 'Semiurban', 'Rural'];
    const credits: CreditHistory[] = [1, 1, 1, 0];

    const randAppInc = Math.floor(Math.random() * 80 + 20) * 100;
    const randCoappInc = Math.random() > 0.4 ? Math.floor(Math.random() * 40 + 10) * 100 : 0;
    const randLoan = Math.floor(Math.random() * 220 + 50);
    const terms = [180, 240, 360, 360, 360];

    setApplicant({
      FirstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      LastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      Gender: genders[Math.floor(Math.random() * genders.length)],
      Married: marriedVals[Math.floor(Math.random() * marriedVals.length)],
      Dependents: deps[Math.floor(Math.random() * deps.length)],
      Education: edus[Math.floor(Math.random() * edus.length)],
      Self_Employed: selfEmps[Math.floor(Math.random() * selfEmps.length)],
      ApplicantIncome: randAppInc,
      CoapplicantIncome: randCoappInc,
      LoanAmount: randLoan,
      Loan_Amount_Term: terms[Math.floor(Math.random() * terms.length)],
      Credit_History: credits[Math.floor(Math.random() * credits.length)],
      Property_Area: areas[Math.floor(Math.random() * areas.length)],
    });
    setBackendPrediction(null);
  };

  const handleEvaluateLoan = async () => {
    if (!isReady) {
      setApiBanner({
        type: 'warning',
        title: 'Form Incomplete',
        message: 'Please provide at least Applicant Income, Loan Amount, and Credit History before evaluating.',
      });
      return;
    }

    setIsSubmitting(true);
    setApiBanner(null);

    try {
      const res = await predictLoan(applicant);
      setBackendPrediction(res.data);

      if (res.source === 'fastapi') {
        setApiBanner({
          type: 'success',
          title: 'FastAPI KNN Model Prediction Complete',
          message: `Verdict: ${res.data.status} (${res.data.status === 'Approved' ? 'prediction: 1' : 'prediction: 0'}) • Probability: ${res.data.probability}% • Inferred from trained Scikit-Learn pipeline (backend/model/knn_model.pkl).`,
        });
      } else {
        setApiBanner({
          type: 'warning',
          title: 'In-Memory Fallback Active',
          message: 'FastAPI backend was not reachable at http://localhost:8000. Decision evaluated using browser in-memory KNN fallback.',
        });
      }
    } catch (err: any) {
      setApiBanner({
        type: 'error',
        title: 'Evaluation Error',
        message: err.message || 'An error occurred during model evaluation.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="app-nav">
        <div className="brand-wrap">
          <div className="brand-icon">
            <BrainCircuit size={24} />
          </div>
          <div>
            <div className="brand-title">EasyLoan</div>
            <div className="brand-tagline">Intelligent Credit Decisioning</div>
          </div>
          <div className="framework-badge" title="Running on Next.js 14 App Router & React 18">
            <span className="nextjs-logo">▲</span>
            <span>Next.js 14 (App Router)</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="nav-tabs" role="tablist">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'suite' ? 'active' : ''}`}
            onClick={() => setActiveTab('suite')}
          >
            <Layers size={14} />
            <span>Underwriting Suite</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'direct-form' ? 'active' : ''}`}
            onClick={() => setActiveTab('direct-form')}
            id="tab-direct-form"
          >
            <Server size={14} />
            <span>FastAPI REST Form</span>
          </button>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="status-pill"
            onClick={probeBackend}
            style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-default)' }}
            title="Click to check FastAPI backend health"
            id="status-health-btn"
          >
            <span
              className={`status-indicator ${
                backendStatus === 'online'
                  ? ''
                  : backendStatus === 'checking'
                  ? 'warning'
                  : 'offline'
              }`}
            />
            <span>
              {backendStatus === 'online'
                ? 'FastAPI: Online (Port 8000)'
                : backendStatus === 'checking'
                ? 'Connecting to API...'
                : 'API Offline (Click to Retry)'}
            </span>
          </button>

          <button
            type="button"
            className="btn-pill-ghost"
            onClick={() => setShowMethodology(!showMethodology)}
            id="methodology-toggle-btn"
          >
            <HelpCircle size={14} />
            <span>Underwriting Logic</span>
          </button>
        </div>
      </header>

      {/* Hero Headline */}
      <section className="hero-header">
        <div className="hero-pill">
          <Sparkles size={12} />
          <span>Real-Time Machine Learning Underwriting</span>
        </div>
        <h1 className="hero-title">Loan Approval Intelligence</h1>
        <p className="hero-desc">
          Instant borrower eligibility evaluation powered by a Scikit-Learn K-Nearest Neighbors (KNN)
          classification model running on a high-speed FastAPI backend.
        </p>
      </section>

      {/* API Notification Banner */}
      {apiBanner && (
        <div className={`api-banner ${apiBanner.type === 'success' ? 'success-banner' : 'error-banner'}`}>
          {apiBanner.type === 'success' ? (
            <CheckCircle2 size={18} className="banner-icon" />
          ) : (
            <AlertCircle size={18} className="banner-icon" />
          )}
          <div className="banner-content">
            <strong>{apiBanner.title}</strong>
            <p>{apiBanner.message}</p>
          </div>
          <button
            type="button"
            className="banner-close"
            onClick={() => setApiBanner(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Methodology Banner (Collapsible) */}
      {showMethodology && (
        <div
          className="sleek-card"
          style={{
            marginBottom: '28px',
            padding: '24px 28px',
            borderLeft: '4px solid #38bdf8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Layers size={18} style={{ color: '#38bdf8' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              KNN Underwriting Architecture
            </h3>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            The classification engine processes applicant variables mapped onto an institutional coordinate space.
            Distance calculation is performed dynamically across continuous normalized vectors and encoded discrete attributes.
            Trained with Scikit-Learn `ColumnTransformer`, `StandardScaler`, `OneHotEncoder`, and `KNeighborsClassifier(n_neighbors=5, weights=&apos;distance&apos;)`.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.05em' }}>
                STANDARDIZED FEATURE SCALING
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Continuous financial variables are z-score standardized to prevent scale distortion in distance space.
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: '#ffffff', fontWeight: 700, letterSpacing: '0.05em' }}>
                CREDIT HISTORY IMPORTANCE
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Credit Bureau status provides primary discriminative weight in applicant neighborhood clustering.
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.05em' }}>
                FASTAPI SERIALIZED INFERENCE
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Zero-delay in-memory predictions delivered via FastAPI REST endpoint /predict serialized with Joblib.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: Institutional Underwriting Suite */}
      {activeTab === 'suite' ? (
        <>
          {/* Modern KPI Strip */}
          <section className="kpi-strip" aria-label="System Metrics">
            <div className="kpi-cell">
              <span className="kpi-label">Benchmark Portfolio</span>
              <span className="kpi-value">{datasetMetadata.totalTrainingSamples} Cases</span>
              <span className="kpi-subtext">Scikit-Learn KNN Training Base</span>
            </div>

            <div className="kpi-cell">
              <span className="kpi-label">Backend Engine</span>
              <span className="kpi-value">FastAPI + Joblib</span>
              <span className="kpi-subtext">REST API on Port 8000</span>
            </div>

            <div className="kpi-cell">
              <span className="kpi-label">Approval Baseline</span>
              <span className="kpi-value">68.7%</span>
              <span className="kpi-subtext">Historical Portfolio Rate</span>
            </div>

            <div className="kpi-cell">
              <span className="kpi-label">Decision Latency</span>
              <span className="kpi-value">&lt; 3 ms</span>
              <span className="kpi-subtext">In-Memory Model Pipeline</span>
            </div>
          </section>

          {/* Model Controls Bar */}
          <ModelControls
            config={knnConfig}
            onChange={setKnnConfig}
            totalTrainingSamples={datasetMetadata.totalTrainingSamples}
          />

          {/* Main Grid */}
          <main className="app-grid">
            <section aria-label="Applicant Profile Input Form">
              <ApplicantForm
                applicant={applicant}
                onChange={(upd) => {
                  setApplicant(upd);
                  if (backendPrediction) setBackendPrediction(null);
                }}
                onSubmit={handleEvaluateLoan}
                onReset={handleReset}
                onRandomize={handleRandomize}
                isSubmitting={isSubmitting}
              />
            </section>

            <section aria-label="Underwriting Decision and Analytics">
              <PredictionResult
                result={activePrediction}
                applicant={applicant}
                isReady={isReady}
                onQuickLoad={() => setApplicant({ ...ARCHETYPE_PRESETS[0].data })}
              />
            </section>
          </main>

          {/* Nearest Neighbors Benchmark Verification Table */}
          <section aria-label="Historical Benchmark Cases">
            <NeighborsViewer
              neighbors={activePrediction.neighbors}
              k={knnConfig.k}
              isReady={isReady}
            />
          </section>
        </>
      ) : (
        /* VIEW 2: Dedicated PredictionForm.jsx Spec (Direct Axios FastAPI Form) */
        <section aria-label="Dedicated FastAPI Prediction Form">
          <PredictionForm onPredictionComplete={(res: any) => setBackendPrediction(res)} />
        </section>
      )}

      {/* Minimal Clean Footer */}
      <footer className="app-footer-clean">
        <div>
          <strong>EasyLoan</strong> — K-Nearest Neighbors Credit Underwriting System
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>FastAPI REST Backend</span>
          <span>•</span>
          <span>Scikit-Learn KNN Model</span>
          <span>•</span>
          <span>Next.js 14 &amp; Axios</span>
        </div>
      </footer>
    </div>
  );
}
