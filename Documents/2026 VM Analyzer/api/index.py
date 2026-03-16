from flask import Flask, jsonify, request
import sys
import os

# Add the parent directory to sys.path so we can import the existing modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import run_analyzer

app = Flask(__name__)

@app.route('/api/analyze', methods=['GET', 'POST'])
@app.route('/api/lark/webhook', methods=['GET', 'POST'])
def trigger_analysis():
    """
    Endpoint to trigger the Lark VM Analyzer.
    Can be called by a Lark Bitable Button/Automation.
    """
    # Simple security check (optional but recommended)
    # You can add a secret token in the URL or headers
    # if request.args.get('token') != os.getenv('TRIGGER_TOKEN'):
    #     return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    print("Triggering analyzer via API...")
    results = run_analyzer()
    return jsonify(results)

@app.route('/', methods=['GET'])
def health_check():
    return "Lark VM Analyzer API is running!"

if __name__ == '__main__':
    app.run(debug=True)
