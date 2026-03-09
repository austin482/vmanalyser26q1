import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AnalysisModal from './AnalysisModal';
import { analyzeComprehensive, toTOML } from '../services/analyzer';
import { makeDecision, decisionToTOML } from '../services/decisionMaker';

const VMDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vm, setVm] = useState(null);
    const [okr, setOkr] = useState(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        loadVMDetails();
    }, [id]);

    const loadVMDetails = () => {
        const vms = JSON.parse(localStorage.getItem('austina_vms') || '[]');
        const foundVM = vms.find(v => v.id === id);

        if (!foundVM) {
            navigate('/vm');
            return;
        }

        setVm(foundVM);

        // Load related OKR if specific one is selected
        if (foundVM.selectedOKR) {
            const okrs = JSON.parse(localStorage.getItem('austina_okrs') || '[]');
            const [okrId] = foundVM.selectedOKR.split('-');
            const foundOKR = okrs.find(o => o.id === okrId);
            setOkr(foundOKR);
        } else {
            // No specific OKR - will analyze against all BU KRs
            setOkr(null);
        }
    };

    const handleAnalyze = async () => {
        if (!vm) return;

        setAnalyzing(true);
        try {
            let analyzerReport;

            // If specific OKR selected, analyze against that OKR
            if (vm.selectedOKR && okr) {
                analyzerReport = await analyzeComprehensive(vm, okr);
            } else {
                // No specific OKR - analyze against all KRs in the BU
                analyzerReport = await analyzeComprehensive(vm, vm.bu);
            }

            // Step 2: Run Decision Maker (final verdict)
            const decision = makeDecision(analyzerReport, vm);

            // Step 3: Generate TOML output
            const analyzerTOML = toTOML(analyzerReport);
            const decisionTOML = decisionToTOML(decision);
            const combinedTOML = `# VM Analysis Report
# Generated: ${new Date().toISOString()}
# VM: ${vm.metricName}

${analyzerTOML}

# ============================================
# DECISION MAKER OUTPUT
# ============================================

${decisionTOML}`;

            // Prepare combined analysis for UI
            const combinedAnalysis = {
                score: decision.decision.final_score,
                insights: [
                    ...analyzerReport.overall_insights
                ],
                suggestions: analyzerReport.red_flags
                    .filter(f => f !== "None identified")
                    .slice(0, 1), // Only show the first (main) suggestion
                timestamp: new Date().toISOString(),
                analyzerReport,
                decisionReport: decision,
                tomlOutput: combinedTOML
            };

            // Update VM with analysis
            const vms = JSON.parse(localStorage.getItem('austina_vms') || '[]');
            const updatedVMs = vms.map(v =>
                v.id === vm.id
                    ? { ...v, status: 'analyzed', strategicCompassAnalysis: combinedAnalysis, decisionMakerAnalysis: decision }
                    : v
            );
            localStorage.setItem('austina_vms', JSON.stringify(updatedVMs));

            setVm({ ...vm, status: 'analyzed', strategicCompassAnalysis: combinedAnalysis });
            setShowAnalysisModal(combinedAnalysis);
        } catch (error) {
            console.error('Analysis error:', error);
            alert('Analysis failed. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    if (!vm) {
        return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="text-white">Loading...</div>
        </div>;
    }

    const getStatusBadge = (status) => {
        const styles = {
            pending_analysis: 'bg-amber-100 text-amber-800 border-amber-200',
            analyzing: 'bg-blue-100 text-blue-800 border-blue-200',
            analyzed: 'bg-green-100 text-green-800 border-green-200'
        };
        const labels = {
            pending_analysis: 'Pending Analysis',
            analyzing: 'Analyzing...',
            analyzed: 'Analyzed'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Navigation */}
            <nav className="border-b border-stone-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                <span className="font-bold text-white text-xl">A</span>
                            </div>
                            <span className="font-bold text-2xl text-stone-900 tracking-tight">Austina</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link to="/okr" className="px-4 py-2 text-stone-600 hover:text-amber-600 transition-colors">
                                🎯 OKR
                            </Link>
                            <Link to="/vm" className="px-4 py-2 text-amber-600 font-medium">
                                📊 VM
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Back Button */}
                <Link
                    to="/vm"
                    className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors mb-6 font-medium"
                >
                    ← Back to VM List
                </Link>

                {/* VM Header */}
                <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-stone-900">{vm.metricName}</h1>
                                {getStatusBadge(vm.status)}
                            </div>
                            <p className="text-stone-600 text-lg">{vm.description}</p>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-100">
                        <div>
                            <div className="text-stone-500 text-sm mb-1">Business Unit</div>
                            <div className="text-stone-900 font-medium">{vm.bu}</div>
                        </div>
                        <div>
                            <div className="text-stone-500 text-sm mb-1">Baseline Rate</div>
                            <div className="text-stone-900 font-medium">{vm.baselineRate}%</div>
                        </div>
                        <div>
                            <div className="text-stone-500 text-sm mb-1">Target Rate</div>
                            <div className="text-green-600 font-medium">{vm.targetRate}%</div>
                        </div>
                        <div>
                            <div className="text-stone-500 text-sm mb-1">Min Volume</div>
                            <div className="text-stone-900 font-medium">{vm.minVolume}</div>
                        </div>
                    </div>

                    {vm.createdAt && (
                        <div className="text-xs text-stone-400 mt-4">
                            Submitted: {new Date(vm.createdAt).toLocaleString()}
                        </div>
                    )}
                </div>

                {/* OKR Alignment */}
                {okr ? (
                    <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm mb-6">
                        <h2 className="text-2xl font-semibold text-stone-900 mb-4">🎯 Related OKR</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200">
                                    {okr.quarter}
                                </span>
                                <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm font-medium border border-stone-200">
                                    {okr.buName}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-stone-900">{okr.objective}</h3>

                            {vm.okrRationale && (
                                <div className="mt-4 p-4 bg-stone-50 rounded-lg border border-stone-100">
                                    <div className="text-sm font-medium text-stone-500 mb-2">Alignment Rationale:</div>
                                    <div className="text-stone-700">{vm.okrRationale}</div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : vm.bu && (
                    <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm mb-6">
                        <h2 className="text-2xl font-semibold text-stone-900 mb-4">🎯 BU-Wide Analysis</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200">
                                    {vm.bu}
                                </span>
                            </div>
                            <p className="text-stone-600">
                                This VM will be analyzed against all Key Results in the <strong>{vm.bu}</strong> business unit.
                            </p>

                            {vm.okrRationale && (
                                <div className="mt-4 p-4 bg-stone-50 rounded-lg border border-stone-100">
                                    <div className="text-sm font-medium text-stone-500 mb-2">Context:</div>
                                    <div className="text-stone-700">{vm.okrRationale}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Analysis Results */}
                {vm.strategicCompassAnalysis ? (
                    <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-stone-900">📊 Strategic Compass Analysis</h2>
                            <button
                                onClick={() => setShowAnalysisModal(vm.strategicCompassAnalysis)}
                                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors border border-stone-200"
                            >
                                View Full Analysis
                            </button>
                        </div>

                        {/* Score */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-stone-600">Alignment Score</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-4xl font-bold text-stone-900">
                                        {vm.strategicCompassAnalysis.score}
                                    </span>
                                    <span className="text-stone-400 text-xl">/ 100</span>
                                </div>
                            </div>
                            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${vm.strategicCompassAnalysis.score >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                        vm.strategicCompassAnalysis.score >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                            'bg-gradient-to-r from-red-500 to-pink-500'
                                        }`}
                                    style={{ width: `${vm.strategicCompassAnalysis.score}%` }}
                                />
                            </div>
                        </div>

                        {/* Quick Insights */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-stone-900 mb-3">💡 Key Insights</h3>
                                <ul className="space-y-2">
                                    {vm.strategicCompassAnalysis.insights.slice(0, 3).map((insight, idx) => (
                                        <li key={idx} className="text-stone-600 text-sm flex items-start gap-2">
                                            <span className="text-amber-500">•</span>
                                            <span>{insight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-stone-900 mb-3">🔧 Top Suggestions</h3>
                                <ul className="space-y-2">
                                    {vm.strategicCompassAnalysis.suggestions.slice(0, 3).map((suggestion, idx) => (
                                        <li key={idx} className="text-stone-600 text-sm flex items-start gap-2">
                                            <span className="text-stone-400">•</span>
                                            <span>{suggestion}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Re-analyze Button */}
                        <div className="mt-6 pt-6 border-t border-stone-100 flex justify-end">
                            <button
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className="px-6 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {analyzing ? '⏳ Re-analyzing...' : '🔄 Re-analyze'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center shadow-sm">
                        <div className="text-6xl mb-4">🚀</div>
                        <h2 className="text-2xl font-semibold text-stone-900 mb-2">Ready for Analysis</h2>
                        <p className="text-stone-600 mb-6">Run the Strategic Compass agent to evaluate this VM's alignment with your OKRs</p>
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing || (!vm.selectedOKR && !vm.bu)}
                            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            {analyzing ? '⏳ Analyzing...' : '🚀 Analyze Now'}
                        </button>
                        {!vm.selectedOKR && !vm.bu && (
                            <p className="text-red-500 text-sm mt-4">⚠️ Please link this VM to an OKR or BU first</p>
                        )}
                    </div>
                )}
            </div>

            {/* Analysis Modal */}
            {showAnalysisModal && (
                <AnalysisModal
                    analysis={showAnalysisModal}
                    onClose={() => setShowAnalysisModal(null)}
                    onReanalyze={handleAnalyze}
                    isReanalyzing={analyzing}
                />
            )}
        </div>
    );
};

export default VMDetailPage;
