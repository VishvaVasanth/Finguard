# FinGuard: Risk-Tiered Financial AI Governance Platform (Python Edition)

A production-grade financial AI governance framework featuring a **6-Factor Deterministic Composite Risk Engine**, a **Task-Adaptive Dynamic Threshold Regressor (LightGBM)**, and a **4-Tier Policy Router**.

---

## 🏛️ System Architecture

FinGuard replaces static, one-size-fits-all risk filters with an end-to-end multi-tier pipeline:

```
[ Financial Query / Intent ]
              │
              ▼
[ Financial RAG & Discrepancy Engine ] ──► Extracts Citations & Flags Contradictions
              │
              ▼
[ 6-Factor Deterministic Risk Engine ] ──► Computes Composite Score R ∈ [0, 100]
              │
              ▼
[ Task-Adaptive Dynamic Regressor ]   ──► Predicts [tau_low, tau_med, tau_high]
              │
              ▼
[ 4-Tier Policy Router ]              ──► Routes to AUTO, VERIFY, APPROVE, or BLOCK
              │
              ▼
[ SHA-256 Tamper-Evident Audit Trail]  ──► Cryptographically Chained Compliance Log
```

---

## 🧮 Mathematical Formulation

### 1. 6-Factor Deterministic Composite Risk Engine
Given a task $T$ with feature vector $\mathbf{f} = [f_1, f_2, \dots, f_6]$ where $f_i \in [0, 5]$:

$$R_{\text{composite}} = \left( \frac{\sum_{i=1}^6 w_i \cdot f_i}{\sum_{i=1}^6 5 \cdot w_i} \right) \times 100$$

| Factor | Description | Weight ($w_i$) | Range |
|---|---|---|---|
| **$f_1$: Data Sensitivity** | SEC Non-Public / PII Exposure | 1.2 | $1.0 - 5.0$ |
| **$f_2$: Financial Magnitude** | Transaction or Contract Exposure | 1.8 | $1.0 - 5.0$ |
| **$f_3$: Action Irreversibility** | External API / Wire Transfer | 2.0 | $0.0 - 5.0$ |
| **$f_4$: Evidence Grounding Gap** | $(1.0 - \text{Coverage}) \times 5.0$ | 1.4 | $0.0 - 5.0$ |
| **$f_5$: Tool Privilege** | Execution Capability of Tool | 1.6 | $0.0 - 5.0$ |
| **$f_6$: Model Uncertainty** | Ambiguity / Extraction Variance | 1.0 | $1.0 - 5.0$ |
| **Total Normalizer** | $\sum w_i \times 5.0$ | **45.0** | **$0.0 - 100.0$** |

### 2. Task-Adaptive Dynamic Thresholds ($\vec{\tau}$)
Rather than fixed cutoffs ($24 / 49 / 74$), a supervised LightGBM model dynamically infers context-dependent thresholds:

$$\vec{\tau}(\mathbf{x}) = [\tau_{\text{low}}(\mathbf{x}), \tau_{\text{med}}(\mathbf{x}), \tau_{\text{high}}(\mathbf{x})]$$

Trained using an **Asymmetric Safety Loss Function** ($\alpha = 10.0, \beta = 1.0$) which penalizes predicting an overly lenient threshold ($10\times$ penalty for under-conservatism):

$$\mathcal{L}_{\text{asym}}(y, \hat{y}) = \begin{cases} \alpha ( \hat{y} - y )^2 & \text{if } \hat{y} > y \quad \text{(Safety Deficit)} \\ \beta ( \hat{y} - y )^2 & \text{if } \hat{y} \le y \quad \text{(Over-Conservatism)} \end{cases}$$

### 3. 4-Tier Policy Routing Rules
1. **`AUTO` (Autonomous Execution)**: $R_{\text{composite}} \le \tau_{\text{low}}$
2. **`VERIFY` (Discrepancy Resolution)**: $\tau_{\text{low}} < R_{\text{composite}} \le \tau_{\text{med}}$ (or cross-document contradiction detected)
3. **`APPROVE` (Human Signoff Queue)**: $\tau_{\text{med}} < R_{\text{composite}} \le \tau_{\text{high}}$
4. **`BLOCK` (Quarantined & Denied)**: $R_{\text{composite}} > \tau_{\text{high}}$ (or adversarial injection)

---

## 🚀 How to Run the Python Platform

### Option 1: Interactive Terminal CLI
```bash
# Launch interactive governance evaluation prompt
python3 cli.py --interactive

# Evaluate a specific query with role context
python3 cli.py --eval "What was Intel FY2023 R&D expenditure?" --role ANALYST

# Test emergency wire transfer
python3 cli.py --eval "Execute emergency wire transfer of $50,000 to Vendor B" --role TREASURY_OFFICER

# Run 35-task benchmark suite
python3 cli.py --benchmark

# View cryptographic SHA-256 audit logs
python3 cli.py --audit
```

### Option 2: Standalone Python Web App & REST API
```bash
# Starts the Python web server on port 8000 (pure Python, zero dependencies required)
python3 app.py 8000
```
Then open `http://localhost:8000` in your browser to interact with the visual dashboard and live evaluation controls.

### Option 3: Google Colab Model Training & Cross-Validation
1. Open [Google Colab](https://colab.research.google.com/).
2. Create a new notebook.
3. Paste the contents of `scripts/colab_run_lightgbm.py` into a single code cell.
4. Press **Run** (Shift + Enter).
   - Automatically installs LightGBM and scikit-learn.
   - Runs **5-Fold Cross-Validation** ($R^2 \approx 0.85$, RMSE $\approx 2.4$).
   - Fits the final regularized model and outputs feature importance rankings and operational comparison tables.

---

## 📁 Python Codebase Structure

```
├── app.py                     # Standalone Python Web Dashboard & REST API
├── cli.py                     # Interactive Command-Line Interface
├── main.py                    # Automated test scenarios and simulation runner
├── setup.py                   # Standard setuptools packaging
├── requirements.txt           # Python dependencies
├── scripts/
│   ├── colab_run_lightgbm.py  # Self-contained Google Colab training notebook
│   └── train_dynamic_threshold_lgbm.py
├── data/
│   ├── calibration_tasks_35.csv   # 35 benchmark calibration tasks
│   └── calibration_tasks_35.json
└── finguard/                  # Core Python Package
    ├── __init__.py
    ├── config.py              # Risk weights, static baseline thresholds
    ├── models.py              # Data models: TaskContext, RiskBreakdown, Decision
    ├── risk_engine.py         # 6-Factor deterministic composite risk engine
    ├── dynamic_thresholds.py  # Task-adaptive dynamic threshold regressor
    ├── router.py              # 4-Tier governance policy router
    ├── rag_engine.py          # Financial RAG & contradiction detector
    ├── financial_tools.py     # Tool execution privileges and irreversibility
    ├── audit_trail.py         # Cryptographic SHA-256 hash-chained audit logger
    ├── dataset.py             # 35 calibration tasks and SEC document store
    └── pipeline.py            # End-to-end pipeline orchestrator
```

---

## 🛡️ Key Safety & Compliance Guarantees

1. **Zero Unauthorized Execution Incidents**: All high-exposure actions (wire transfers, debt overrides) are routed to dual-signoff human review queues.
2. **Adversarial Resilience**: Detects prompt injections, jailbreak vectors, and system override attempts, enforcing instant quarantine.
3. **Auditability**: Every decision, score, dynamic threshold, and reasoning is logged into an immutable SHA-256 hash chain with cryptographic tamper detection.
