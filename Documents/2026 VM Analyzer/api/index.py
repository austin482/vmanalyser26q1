from flask import Flask, jsonify, request
import sys
import os

# Add the parent directory to sys.path so we can import the existing modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import run_analyzer

app = Flask(__name__)

import threading

@app.route('/api/analyze', methods=['GET', 'POST'])
@app.route('/api/lark/webhook', methods=['GET', 'POST'])
def trigger_analysis():
    """
    Endpoint to trigger the Lark VM Analyzer.
    Processes records in parallel within the allowed time window.
    """
    print("Triggering analyzer via API...")
    results = run_analyzer()
    return jsonify(results)

@app.route('/', methods=['GET'])
def health_check():
    return "Lark VM Analyzer API is running!"

if __name__ == '__main__':
    app.run(debug=True)
