"""
Training & Model Export Script for Loan Prediction KNN Classifier
==================================================================
This script loads the historical loan dataset, creates a preprocessing and
K-Nearest Neighbors (KNN) classification pipeline, evaluates model accuracy,
and exports the trained model as `backend/model/knn_model.pkl` using Joblib.
"""

import os
import json
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report


def train_and_export_model():
    # 1. Resolve paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, ".."))
    data_path = os.path.join(project_root, "src", "data", "trainingData.json")
    model_dir = os.path.join(current_dir, "model")
    model_export_path = os.path.join(model_dir, "knn_model.pkl")

    os.makedirs(model_dir, exist_ok=True)

    print(f"Loading training dataset from: {data_path}")
    with open(data_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    df = pd.DataFrame(raw_data)
    print(f"Dataset loaded: {df.shape[0]} records, {df.shape[1]} columns")

    # 2. Feature Definitions
    categorical_features = [
        "Gender",
        "Married",
        "Dependents",
        "Education",
        "Self_Employed",
        "Property_Area",
    ]
    numeric_features = [
        "ApplicantIncome",
        "CoapplicantIncome",
        "LoanAmount",
        "Loan_Amount_Term",
        "Credit_History",
    ]

    target_col = "Loan_Status"

    # Pre-clean / map target: 'Y' -> 1, 'N' -> 0
    df[target_col] = df[target_col].map({"Y": 1, "N": 0})
    df = df.dropna(subset=[target_col])

    X = df[categorical_features + numeric_features]
    y = df[target_col].astype(int)

    # 3. Build Preprocessing & Modeling Pipeline
    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
        ]
    )

    # Instantiate KNN Classifier with k=5 and inverse-distance weighting
    knn = KNeighborsClassifier(n_neighbors=5, weights="distance", metric="euclidean")

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", knn),
        ]
    )

    # 4. Train/Test Evaluation
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training K-Nearest Neighbors pipeline...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Validation Set Accuracy: {acc * 100:.2f}%\n")
    print("Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Rejected (0)", "Approved (1)"]))

    # Refit on full dataset for maximum production coverage
    print("Refitting pipeline on complete dataset (614 cases)...")
    pipeline.fit(X, y)

    # 5. Export Model with Joblib
    metadata = {
        "features": {
            "categorical": categorical_features,
            "numeric": numeric_features,
        },
        "target_mapping": {1: "Approved", 0: "Rejected"},
        "algorithm": "KNeighborsClassifier",
        "n_neighbors": 5,
        "metric": "euclidean",
        "weights": "distance",
    }

    model_bundle = {
        "pipeline": pipeline,
        "metadata": metadata,
    }

    joblib.dump(model_bundle, model_export_path)
    print(f"\n[SUCCESS] Model successfully serialized & saved to: {model_export_path}")
    print(f"File size: {os.path.getsize(model_export_path) / 1024:.2f} KB")


if __name__ == "__main__":
    train_and_export_model()
