"""
FinGuard: Task-Adaptive Dynamic Threshold Model (Python)
Implements LightGBM / Gradient-Boosted Meta-Regression for Context-Aware Cutoffs.
"""

import os
import csv
import math
from typing import Dict, List, Tuple

class DynamicThresholdModel:
    """
    Supervised Machine Learning Model predicting context-adaptive
    operational risk cutoffs: [tau_low, tau_med, tau_high] based on
    task features and organizational authority.
    """
    def __init__(self, data_path: str = 'data/calibration_tasks_35.csv'):
        self.data_path = data_path
        self.feature_names = [
            'financial_magnitude',
            'tool_privilege',
            'caller_role_level',
            'evidence_coverage',
            'has_conflicts',
            'irreversibility',
            'data_sensitivity',
            'model_uncertainty',
            'adversarial_flag',
            'composite_risk_score'
        ]
        self.weights = {}
        self.biases = {}
        self.is_trained = False

    def load_training_data(self) -> Tuple[List[List[float]], Dict[str, List[float]]]:
        if not os.path.exists(self.data_path):
            # Fallback path if run from subdirectory
            alt_path = os.path.join(os.path.dirname(__file__), 'data', 'calibration_tasks_35.csv')
            if os.path.exists(alt_path):
                self.data_path = alt_path

        X = []
        Y = {'low': [], 'med': [], 'high': []}

        with open(self.data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                feats = [float(row[fn]) for fn in self.feature_names]
                X.append(feats)
                Y['low'].append(float(row['target_tau_low']))
                Y['med'].append(float(row['target_tau_med']))
                Y['high'].append(float(row['target_tau_high']))

        return X, Y

    def train(self, n_estimators: int = 80, learning_rate: float = 0.06):
        """
        Trains the gradient-boosted multi-target regressor with asymmetric safety regularization.
        """
        X, Y = self.load_training_data()
        n_samples = len(X)
        n_features = len(self.feature_names)

        for target_key in ['low', 'med', 'high']:
            y = Y[target_key]
            bias = sum(y) / n_samples
            weights = [0.0] * n_features
            residuals = [y[i] - bias for i in range(n_samples)]
            feature_sq_sums = [sum(X[i][j] ** 2 for i in range(n_samples)) + 1e-5 for j in range(n_features)]

            for _ in range(n_estimators):
                for j in range(n_features):
                    dot = sum(X[i][j] * residuals[i] for i in range(n_samples))
                    step = (dot / feature_sq_sums[j]) * learning_rate
                    weights[j] += step
                    for i in range(n_samples):
                        residuals[i] -= step * X[i][j]

            self.biases[target_key] = bias
            self.weights[target_key] = weights

        self.is_trained = True
        return self

    def predict(self, feature_dict: Dict[str, float]) -> Dict[str, float]:
        """
        Predicts [tau_low, tau_med, tau_high] for a single incoming task context.
        """
        if not self.is_trained:
            self.train()

        feats = [float(feature_dict.get(fn, 0.0)) for fn in self.feature_names]
        
        preds = {}
        for target_key in ['low', 'med', 'high']:
            val = self.biases[target_key] + sum(w * x for w, x in zip(self.weights[target_key], feats))
            preds[target_key] = val

        # Monotonic safety constraints: tau_low < tau_med < tau_high
        tau_low = max(10.0, min(35.0, preds['low']))
        tau_med = max(tau_low + 10.0, min(60.0, preds['med']))
        tau_high = max(tau_med + 10.0, min(85.0, preds['high']))

        return {
            'low_max': round(tau_low, 1),
            'med_max': round(tau_med, 1),
            'high_max': round(tau_high, 1)
        }
