# EasyLoan Backend — FastAPI & Scikit-Learn KNN Underwriting Service

Production-ready REST API backend for loan approval prediction, built using **FastAPI**, **Pydantic v2**, and **Scikit-Learn**.

---

## 📁 Directory Structure

```text
backend/
│
├── main.py              # FastAPI application & /predict endpoint
├── train_model.py       # Scikit-learn training & joblib export pipeline
├── requirements.txt     # Python dependencies
├── README.md            # Documentation & deployment guide
├── model/
│   └── knn_model.pkl    # Serialized KNN pipeline (Joblib)
└── venv/                # Python virtual environment (ignored in git)
```

---

## ⚡ Quick Start

### 1. Create Virtual Environment & Install Dependencies

```bash
# Windows
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Train & Export KNN Model (`joblib`)

Run the automated training script to generate `model/knn_model.pkl`:

```bash
python train_model.py
```

*Output:*
```text
Loading training dataset...
Dataset loaded: 614 records, 12 columns
Training K-Nearest Neighbors pipeline...
Validation Set Accuracy: 82.11%
[SUCCESS] Model successfully serialized & saved to: backend/model/knn_model.pkl
```

### 3. Run FastAPI Development Server

```bash
# Start server on http://localhost:8000
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🔌 API Endpoints

### 1. Health Probe
- **Endpoint**: `GET /health`
- **Response**:
```json
{
  "status": "online",
  "model_loaded": true
}
```

### 2. Predict Loan Approval
- **Endpoint**: `POST /predict`
- **Headers**: `Content-Type: application/json`
- **Sample Request**:
```json
{
  "firstName": "Alexander",
  "lastName": "Wright",
  "gender": "Male",
  "married": "Yes",
  "dependents": "1",
  "education": "Graduate",
  "selfEmployed": "No",
  "applicantIncome": 5400,
  "coapplicantIncome": 1800,
  "loanAmount": 130,
  "loanAmountTerm": 360,
  "creditHistory": 1.0,
  "propertyArea": "Semiurban"
}
```

- **Sample Response (Approved)**:
```json
{
  "prediction": 1,
  "status": "Approved",
  "probability": 85.0,
  "confidence": 70,
  "risk_score": 15,
  "applicant_name": "Alexander Wright",
  "factors": [
    {
      "name": "Credit Bureau Standing",
      "impact": "positive",
      "description": "Clear institutional repayment history with no active defaults."
    },
    {
      "name": "Healthy Loan-to-Income Ratio",
      "impact": "positive",
      "description": "Requested $130k loan against $7,200/mo household earnings."
    }
  ],
  "recommendations": [
    "Application meets institutional benchmarks. Avoid taking on new debt lines prior to final disbursement."
  ]
}
```

- **Sample Response (Rejected)**:
```json
{
  "prediction": 0,
  "status": "Rejected",
  "probability": 20.0,
  "confidence": 60,
  "risk_score": 80,
  "applicant_name": "Julian Vance",
  "factors": [
    {
      "name": "Adverse Credit Record",
      "impact": "negative",
      "description": "Historical delinquencies or defaults significantly elevate risk profile."
    }
  ],
  "recommendations": [
    "Rehabilitate adverse credit marks or provide evidence of debt settlement before reapplying."
  ]
}
```

---

## 🚀 Production Deployment

### Option A: Render.com
1. Create a new **Web Service** and connect your repository.
2. Select **Python 3** environment.
3. Set **Root Directory**: `backend`
4. Set **Build Command**: `pip install -r requirements.txt && python train_model.py`
5. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add Environment Variable:
   - `CORS_ORIGINS`: `https://your-frontend-domain.vercel.app`

### Option B: Railway.app
1. Create a new service and select **Deploy from GitHub repo**.
2. Set Root Directory to `/backend`.
3. Railway automatically detects `requirements.txt`.
4. Set Start Command: `python train_model.py && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}`
5. Set `CORS_ORIGINS` to allow your Vercel frontend domain.
