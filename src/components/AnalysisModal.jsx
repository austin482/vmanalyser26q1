import React from 'react';

const AnalysisModal = ({ analysis, onClose, onReanalyze, isReanalyzing }) => {
    if (!analysis) return null;

    return (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-600 p-6 rounded-t-2xl flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">📊 Analysis Results</h2>
                        <p className="text-amber-100 text-sm">
                            {analysis.analyzerReport?.agent === "Analyzer (AI-Powered)" ? '✨ AI-Powered by Google Gemini' : '⚠️ Mock Analysis'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Score */}
                <div className="p-8 border-b border-stone-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-stone-600 text-xl font-semibold">Score</span>
                        <div className="flex items-center gap-3">
                            <div className="text-6xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                                {analysis.score}
                            </div>
                            <span className="text-stone-400 text-3xl">/ 100</span>
                        </div>
                    </div>

                    {/* Score Bar */}
                    <div className="w-full bg-stone-100 rounded-full h-4 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${analysis.score >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                analysis.score >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                    'bg-gradient-to-r from-red-500 to-pink-500'
                                }`}
                            style={{ width: `${analysis.score}%` }}
                        />
                    </div>
                </div>

                {/* Key Insights */}
                <div className="p-8 border-b border-stone-100">
                    <h3 className="text-xl font-bold text-stone-800 mb-4">💡 Key Insights</h3>
                    {analysis.insights && analysis.insights.length > 0 ? (
                        <ul className="space-y-3">
                            {analysis.insights.map((insight, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="text-amber-500 font-bold text-lg mt-0.5">•</span>
                                    <span className="text-stone-700 text-base leading-relaxed">{insight}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-stone-500 italic">No insights available</p>
                    )}
                </div>

                {/* Improvements */}
                <div className="p-8">
                    <h3 className="text-xl font-bold text-stone-800 mb-4">🔧 Improvements</h3>
                    {analysis.suggestions && analysis.suggestions.length > 0 ? (
                        <ul className="space-y-3">
                            {analysis.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="text-amber-500 font-bold text-lg mt-0.5">•</span>
                                    <span className="text-stone-700 text-base leading-relaxed">{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-stone-500 italic">No improvements needed</p>
                    )}
                </div>

                {/* TOML Output - Hidden per user request */}
                {/* {analysis.tomlOutput && (
                    <div className="p-8 border-t border-stone-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-stone-800">📄 TOML Output</h3>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(analysis.tomlOutput);
                                    alert('TOML copied to clipboard!');
                                }}
                                className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors text-sm font-medium"
                            >
                                📋 Copy TOML
                            </button>
                        </div>
                        <pre className="bg-stone-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-stone-700">
                            {analysis.tomlOutput}
                        </pre>
                    </div>
                )} */}

                {/* Footer */}
                <div className="p-6 bg-stone-50 rounded-b-2xl flex items-center justify-between border-t border-stone-200">
                    <p className="text-stone-500 text-sm">
                        Last analyzed: {new Date(analysis.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        })}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onReanalyze}
                            disabled={isReanalyzing}
                            className="px-6 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isReanalyzing ? '⏳ Re-analyzing...' : '🔄 Re-analyze'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all shadow-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisModal;
