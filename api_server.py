#!/usr/bin/env python3
"""
FinGuard: Standalone Python HTTP API Server
Zero external dependencies required (uses built-in http.server).
Serves governance evaluation, dynamic thresholds, and calibration endpoints.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
from risk_engine import FinGuardRiskEngine, RiskAttributes
from dynamic_thresholds import DynamicThresholdModel

engine = FinGuardRiskEngine()
model = DynamicThresholdModel()
model.train()

class FinGuardHTTPHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            resp = {
                'status': 'ok',
                'service': 'FinGuard Financial AI Governance (Python Backend)',
                'version': '2.4.0',
                'model_trained': model.is_trained
            }
            self.wfile.write(json.dumps(resp).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/api/governance/evaluate':
            content_len = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_len)
            data = json.loads(body.decode('utf-8')) if body else {}

            # Extract risk attributes
            attrs = RiskAttributes(
                data_sensitivity=float(data.get('data_sensitivity', 2.0)),
                financial_impact=float(data.get('financial_impact', 2.0)),
                irreversibility=float(data.get('irreversibility', 1.0)),
                evidence_coverage=float(data.get('evidence_coverage', 0.85)),
                tool_privilege=float(data.get('tool_privilege', 1.0)),
                model_uncertainty=float(data.get('model_uncertainty', 1.0))
            )

            # Compute risk
            risk_score, breakdown = engine.calculate_composite_risk(attrs)

            # Predict dynamic thresholds via ML model
            feature_dict = {
                'financial_magnitude': attrs.financial_impact,
                'tool_privilege': attrs.tool_privilege,
                'caller_role_level': float(data.get('caller_role_level', 2.0)),
                'evidence_coverage': attrs.evidence_coverage,
                'has_conflicts': 1.0 if data.get('has_conflicts') else 0.0,
                'irreversibility': attrs.irreversibility,
                'data_sensitivity': attrs.data_sensitivity,
                'model_uncertainty': attrs.model_uncertainty,
                'adversarial_flag': 1.0 if data.get('adversarial_flag') else 0.0,
                'composite_risk_score': risk_score
            }
            dynamic_thresholds = model.predict(feature_dict)

            # Route decision
            decision = engine.route_decision(
                risk_score=risk_score,
                has_conflict=bool(data.get('has_conflicts')),
                is_adversarial=bool(data.get('adversarial_flag')),
                custom_thresholds=dynamic_thresholds
            )

            response = {
                'success': True,
                'risk_score': decision.composite_risk_score,
                'action': decision.action,
                'thresholds_applied': decision.thresholds_applied,
                'factor_breakdown': breakdown,
                'requires_human_signoff': decision.requires_human_signoff,
                'quarantine_triggered': decision.quarantine_triggered,
                'explanation': decision.explanation
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run_server(port=8000):
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, FinGuardHTTPHandler)
    print(f"[FinGuard Python] Serving API on http://0.0.0.0:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[FinGuard Python] Server shutting down.")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
