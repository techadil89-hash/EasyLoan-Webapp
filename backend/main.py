"""
Production-Ready FastAPI Backend for Loan Approval Prediction (EasyLoan)
=======================================================================
Provides high-performance REST API endpoints for real-time credit decisioning
powered by a Scikit-Learn K-Nearest Neighbors (KNN) model serialized with Joblib.
"""

import os
import sys
from typing import Optional, Literal, List, Dict, Any
from contextlib import asynccontextmanager

import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

# --------------------------------------------------------------------------
# Model Loader & Global Cache
# --------------------------------------------------------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, "model", "knn_model.pkl")

model_pipeline = None
model_metadata = None


def load_model():
    """Load or auto-train the serialized KNN model pipeline."""
    global model_pipeline, model_metadata
    if not os.path.exists(MODEL_PATH):
        print(f"[INFO] Model file not found at {MODEL_PATH}. Initiating automatic training...")
        try:
            from train_model import train_and_export_model
            train_and_export_model()
        except Exception as e:
            print(f"[ERROR] Auto-training failed: {e}")
            raise RuntimeError(f"Could not initialize model: {e}")

    print(f"[INFO] Loading KNN model from: {MODEL_PATH}")
    bundle = joblib.load(MODEL_PATH)
    if isinstance(bundle, dict) and "pipeline" in bundle:
        model_pipeline = bundle["pipeline"]
        model_metadata = bundle.get("metadata", {})
    else:
        model_pipeline = bundle
        model_metadata = {}
    print("[SUCCESS] KNN Pipeline successfully loaded into memory.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown procedures."""
    load_model()
    yield
    print("[INFO] Shutting down EasyLoan API server.")


# --------------------------------------------------------------------------
# FastAPI Application Initialization
# --------------------------------------------------------------------------
app = FastAPI(
    title="EasyLoan Underwriting API",
    description="Production-grade REST API for real-time loan approval prediction powered by K-Nearest Neighbors (KNN).",
    version="1.0.0",
    lifespan=lifespan,
)

# --------------------------------------------------------------------------
# CORS Configuration
# --------------------------------------------------------------------------
cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
)
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip() and origin.strip() != "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Pydantic Request & Response Schemas
# --------------------------------------------------------------------------
class LoanApplicationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    FirstName: Optional[str] = Field(default=None, alias="firstName")
    LastName: Optional[str] = Field(default=None, alias="lastName")
    Gender: Optional[Literal["Male", "Female"]] = Field(default="Male", alias="gender")
    Married: Optional[Literal["Yes", "No"]] = Field(default="Yes", alias="married")
    Dependents: Optional[Literal["0", "1", "2", "3+"]] = Field(default="0", alias="dependents")
    Education: Optional[Literal["Graduate", "Not Graduate"]] = Field(default="Graduate", alias="education")
    Self_Employed: Optional[Literal["Yes", "No"]] = Field(default="No", alias="selfEmployed")
    ApplicantIncome: float = Field(..., ge=0, description="Monthly primary applicant income in $", alias="applicantIncome")
    CoapplicantIncome: Optional[float] = Field(default=0.0, ge=0, description="Monthly co-applicant income in $", alias="coapplicantIncome")
    LoanAmount: float = Field(..., gt=0, description="Loan requested in thousands ($)", alias="loanAmount")
    Loan_Amount_Term: Optional[float] = Field(default=360.0, gt=0, description="Loan term in months", alias="loanAmountTerm")
    Credit_History: float = Field(..., ge=0.0, le=1.0, description="Credit Bureau standing: 1.0 (Clean) or 0.0 (Adverse)", alias="creditHistory")
    Property_Area: Optional[Literal["Urban", "Semiurban", "Rural"]] = Field(default="Urban", alias="propertyArea")


class FactorItem(BaseModel):
    name: str
    impact: Literal["positive", "negative", "neutral"]
    description: str


class PredictionResponse(BaseModel):
    prediction: int = Field(description="1 for Approved, 0 for Rejected")
    status: str = Field(description="'Approved' or 'Rejected'")
    probability: float = Field(description="Approval probability consensus (0-100%)")
    confidence: int = Field(description="Algorithm confidence margin (0-100%)")
    risk_score: int = Field(description="Calculated risk rating (0-100)")
    applicant_name: Optional[str] = None
    factors: List[FactorItem]
    recommendations: List[str]


# --------------------------------------------------------------------------
# Helper Logic: Explainability & Recommendations
# --------------------------------------------------------------------------
def generate_decision_insights(req: LoanApplicationRequest, is_approved: bool, prob: float):
    total_income = req.ApplicantIncome + (req.CoapplicantIncome or 0.0)
    loan_k = req.LoanAmount
    lti_ratio = (loan_k * 1000) / total_income if total_income > 0 else 50.0

    factors: List[FactorItem] = []

    # 1. Credit Standing
    if req.Credit_History == 1.0:
        factors.append(FactorItem(
            name="Credit Bureau Standing",
            impact="positive",
            description="Clear institutional repayment history with no active defaults."
        ))
    else:
        factors.append(FactorItem(
            name="Adverse Credit Record",
            impact="negative",
            description="Historical delinquencies or defaults significantly elevate risk profile."
        ))

    # 2. Leverage / Debt-to-Income
    if lti_ratio < 22:
        factors.append(FactorItem(
            name="Healthy Loan-to-Income Ratio",
            impact="positive",
            description=f"Requested ${loan_k:,.0f}k loan against ${total_income:,.0f}/mo household earnings."
        ))
    elif lti_ratio > 35:
        factors.append(FactorItem(
            name="High Leverage Exposure",
            impact="negative",
            description=f"Requested ${loan_k:,.0f}k loan creates high debt service relative to monthly income."
        ))
    else:
        factors.append(FactorItem(
            name="Moderate Debt Leverage",
            impact="neutral",
            description="Loan-to-income balance sits within standard tolerance corridors."
        ))

    # 3. Co-Applicant
    if req.CoapplicantIncome and req.CoapplicantIncome > 0:
        factors.append(FactorItem(
            name="Secondary Income Buffer",
            impact="positive",
            description=f"Co-borrower adds ${req.CoapplicantIncome:,.0f}/mo towards debt coverage capacity."
        ))

    # 4. Property Area
    if req.Property_Area == "Semiurban":
        factors.append(FactorItem(
            name="Collateral Geography",
            impact="positive",
            description="Semiurban properties exhibit higher statistical portfolio approval stability."
        ))

    # Recommendations
    recommendations: List[str] = []
    if req.Credit_History == 0.0:
        recommendations.append("Rehabilitate adverse credit marks or provide evidence of debt settlement before reapplying.")
    if lti_ratio > 30:
        target_loan = round((total_income * 24) / 1000)
        recommendations.append(f"Consider reducing the requested loan to ~${target_loan}k or extending tenure to 360 months to lower monthly obligations.")
    if (not req.CoapplicantIncome or req.CoapplicantIncome == 0) and not is_approved:
        recommendations.append("Adding an employed co-borrower or guarantor will improve debt service coverage.")
    if is_approved:
        recommendations.append("Application meets institutional benchmarks. Avoid taking on new debt lines prior to final disbursement.")

    return factors, recommendations


# --------------------------------------------------------------------------
# API Endpoints
# --------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    """Root status check endpoint."""
    return {
        "service": "EasyLoan Underwriting API",
        "status": "healthy",
        "engine": "K-Nearest Neighbors (KNN)",
        "docs_url": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Service health probe."""
    return {
        "status": "online",
        "model_loaded": model_pipeline is not None,
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_loan_approval(application: LoanApplicationRequest):
    """
    Evaluate loan approval eligibility using the trained KNN classification pipeline.
    """
    global model_pipeline
    if model_pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model pipeline not initialized. Please check server logs.",
        )

    try:
        # Build pandas DataFrame for scikit-learn Pipeline
        input_data = {
            "Gender": [application.Gender or "Male"],
            "Married": [application.Married or "Yes"],
            "Dependents": [str(application.Dependents or "0")],
            "Education": [application.Education or "Graduate"],
            "Self_Employed": [application.Self_Employed or "No"],
            "ApplicantIncome": [float(application.ApplicantIncome)],
            "CoapplicantIncome": [float(application.CoapplicantIncome or 0.0)],
            "LoanAmount": [float(application.LoanAmount)],
            "Loan_Amount_Term": [float(application.Loan_Amount_Term or 360.0)],
            "Credit_History": [float(application.Credit_History)],
            "Property_Area": [application.Property_Area or "Urban"],
        }
        df_input = pd.DataFrame(input_data)

        # Scikit-learn Pipeline Prediction
        raw_prediction = int(model_pipeline.predict(df_input)[0])

        # Probabilities
        if hasattr(model_pipeline, "predict_proba"):
            probs = model_pipeline.predict_proba(df_input)[0]
            # Class 1 is 'Approved', Class 0 is 'Rejected'
            prob_approved = float(probs[1]) * 100.0
        else:
            prob_approved = 80.0 if raw_prediction == 1 else 20.0

        # Institutional Financial Adjustment: Credit_History = 0 strongly penalizes approval
        if application.Credit_History == 0.0:
            prob_approved = min(prob_approved, 25.0)
            raw_prediction = 0

        is_approved = raw_prediction == 1
        confidence = int(abs(prob_approved - 50.0) * 2)
        risk_score = max(5, min(95, int(100.0 - prob_approved)))

        # Format full applicant name if provided
        full_name = f"{application.FirstName or ''} {application.LastName or ''}".strip() or None

        # Generate Explainability Factors & Guidance
        factors, recommendations = generate_decision_insights(application, is_approved, prob_approved)

        return PredictionResponse(
            prediction=raw_prediction,
            status="Approved" if is_approved else "Rejected",
            probability=round(prob_approved, 1),
            confidence=confidence,
            risk_score=risk_score,
            applicant_name=full_name,
            factors=factors,
            recommendations=recommendations,
        )

    except Exception as e:
        print(f"[ERROR] Prediction failed: {e}", file=sys.stderr)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
