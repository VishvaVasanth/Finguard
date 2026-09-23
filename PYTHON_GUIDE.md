# FinGuard: Enterprise Financial AI Governance (Python Implementation)

This directory contains the Python implementation of the **FinGuard Governance & Risk Engine** with **Task-Adaptive Dynamic Thresholds (LightGBM)**.

---

## 1. Project Structure

```
├── risk_engine.py                    # 6-Factor Deterministic Composite Risk Engine & 4-Tier Router
├── dynamic_thresholds.py             # ML Multi-Target Regressor for predicting dynamic thresholds
├── main.py                           # Main Python runner testing statutory, conflict & wire transfer tasks
├── api_server.py                     # Standalone Python HTTP REST API Server
├── requirements.txt                  # Python dependencies (LightGBM, scikit-learn, pandas, numpy)
├── data/
│   ├── calibration_tasks_35.csv     # 35 benchmark calibration tasks with 10 context features
│   └── calibration_tasks_35.json    # Complete JSON dataset with expected actions and evidence
└── scripts/
    └── train_dynamic_threshold_lgbm.py # Full ML training script with metrics and feature importances
```

---

## 2. How to Run in Python

### A. Run the Governance Engine & Test Scenarios
```bash
python3 main.py
```
Outputs risk scores, static baseline thresholds, dynamic ML thresholds, and governance routing (`AUTO`, `VERIFY`, `APPROVE`, `BLOCK`) across enterprise scenarios.

### B. Train the LightGBM Dynamic Threshold Model
```bash
python3 scripts/train_dynamic_threshold_lgbm.py
```
Outputs:
- Model performance metrics ($R^2$, RMSE, MAE, Asymmetric Safety Loss).
- Feature importance ranking (Gain %).
- Static vs. Dynamic operational comparison table.

### C. Run the Python HTTP REST API Server
```bash
python3 api_server.py
```
Serves on `http://localhost:8000`:
- `GET /api/health`: Health status.
- `POST /api/governance/evaluate`: Evaluates task payload and returns risk score + dynamic thresholds.

---

## 3. Google Colab Setup
To run in Google Colab:
1. Upload `data/calibration_tasks_35.csv` to your Colab session.
2. Run `!pip install lightgbm scikit-learn pandas numpy`.
3. Run `python3 scripts/train_dynamic_threshold_lgbm.py` or paste the script directly into a notebook cell.
