import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyzeComprehensive, toTOML } from '../services/analyzer';
import { makeDecision, decisionToTOML } from '../services/decisionMaker';
import AnalysisModal from './AnalysisModal';
import ConfirmDialog from './ConfirmDialog';

const VMManagementPage = () => {
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'submit'
    const [vms, setVms] = useState([]);
    const [okrs, setOkrs] = useState([]);
    const [savedOKRs, setSavedOKRs] = useState([]);
    const [vmData, setVmData] = useState({
        bu: '',
        metricName: '',
        description: '',
        baselineRate: '',
        targetRate: '',
        minVolume: '',
        selectedOKR: '',
        okrRationale: '',
        supportingDoc: null
    });
    const [analyzing, setAnalyzing] = useState(null); // VM ID being analyzed
    const [editingVM, setEditingVM] = useState(null); // VM being edited
    const [showAnalysisModal, setShowAnalysisModal] = useState(null); // Analysis to display in modal
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, vmId: null, vmName: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const savedVMs = JSON.parse(localStorage.getItem('austina_vms') || '[]');
        const savedOKRs = JSON.parse(localStorage.getItem('austina_okrs') || '[]');
        setVms(savedVMs);
        setOkrs(savedOKRs);
        setSavedOKRs(savedOKRs);
    };

    const handleBaselineChange = (value) => {
        setVmData(prev => ({
            ...prev,
            baselineRate: value,
            targetRate: value ? (parseFloat(value) * 1.3).toFixed(1) : ''
        }));
    };

    const handleChange = (field, value) => {
        setVmData(prev => ({ ...prev, [field]: value }));
    };

    const handleBUChange = (value) => {
        setVmData(prev => ({
            ...prev,
            bu: value,
            selectedOKR: ''
        }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVmData(prev => ({ ...prev, supportingDoc: file }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!vmData.bu || !vmData.metricName || !vmData.baselineRate || !vmData.targetRate || !vmData.minVolume) {
            alert('Please fill in all required fields');
            return;
        }

        const existingVMs = JSON.parse(localStorage.getItem('austina_vms') || '[]');

        if (editingVM) {
            // Update existing VM
            const updatedVMs = existingVMs.map(vm =>
                vm.id === editingVM
                    ? { ...vm, ...vmData, updatedAt: new Date().toISOString() }
                    : vm
            );
            localStorage.setItem('austina_vms', JSON.stringify(updatedVMs));
            alert('Value Metric updated successfully!');
        } else {
            // Create new VM
            const newVM = {
                ...vmData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                status: 'pending_analysis'
            };
            existingVMs.push(newVM);
            localStorage.setItem('austina_vms', JSON.stringify(existingVMs));
            alert('Value Metric submitted successfully!');
        }

        setVmData({
            bu: '',
            metricName: '',
            description: '',
            baselineRate: '',
            targetRate: '',
            minVolume: '',
            selectedOKR: '',
            okrRationale: '',
            supportingDoc: null
        });

        setEditingVM(null);
        loadData();
        setActiveTab('list');
    };

    const getOKRDetails = (selectedOKR) => {
        if (!selectedOKR) return null;
        const [okrId, krId] = selectedOKR.split('-');
        const okr = okrs.find(o => o.id === okrId);
        if (!okr) return null;
        const kr = okr.keyResults.find(k => k.id === krId);
        return kr ? `${okr.quarter} - ${kr.krNumber ? kr.krNumber + ': ' : ''}${kr.category}` : null;
    };

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

    const handleAnalyze = async (vm) => {
        if (!vm.selectedOKR) {
            alert('Please link this VM to an OKR first');
            return;
        }

        setAnalyzing(vm.id);
        try {
            // Extract OKR ID from selectedOKR format: "okr-id-kr-id"
            // We need to find the last occurrence of "-kr-" or similar pattern
            // More robust: split and find where the KR part starts
            const parts = vm.selectedOKR.split('-');
            // Find the index where 'kr' appears (this marks the start of KR ID)
            const krIndex = parts.findIndex(part => part === 'kr' || part.startsWith('kr'));
            const okrId = krIndex > 0 ? parts.slice(0, krIndex).join('-') : parts[0];

            const okr = okrs.find(o => o.id === okrId);

            if (!okr) {
                alert('Related OKR not found');
                return;
            }

            // Step 1: Run Analyzer (comprehensive analysis)
            const analyzerReport = await analyzeComprehensive(vm, okr);

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
                // For backward compatibility with existing modal
                score: decision.decision.final_score,
                insights: [
                    // Show AI-generated insights from Analyzer (these are the smart, actionable ones)
                    ...analyzerReport.overall_insights
                ],
                suggestions: analyzerReport.red_flags
                    .filter(f => f !== "None identified")
                    .slice(0, 1), // Only show the first (main) suggestion
                timestamp: new Date().toISOString(),
                // Store full reports
                analyzerReport,
                decisionReport: decision,
                // Add TOML output
                tomlOutput: combinedTOML
            };

            const updatedVMs = vms.map(v =>
                v.id === vm.id
                    ? {
                        ...v,
                        status: 'analyzed',
                        strategicCompassAnalysis: combinedAnalysis,
                        decisionMakerAnalysis: decision
                    }
                    : v
            );
            localStorage.setItem('austina_vms', JSON.stringify(updatedVMs));
            setVms(updatedVMs);

            // Update the modal if it's currently open
            setShowAnalysisModal(combinedAnalysis);
        } catch (error) {
            console.error('Analysis error:', error);
            alert('Analysis failed. Please try again.');
        } finally {
            setAnalyzing(null);
        }
    };

    const handleEdit = (vm) => {
        setEditingVM(vm.id);
        setVmData({
            bu: vm.bu,
            metricName: vm.metricName,
            description: vm.description,
            baselineRate: vm.baselineRate,
            targetRate: vm.targetRate,
            minVolume: vm.minVolume,
            selectedOKR: vm.selectedOKR || '',
            okrRationale: vm.okrRationale || '',
            supportingDoc: null
        });
        setActiveTab('submit');
    };

    const handleDelete = (vm) => {
        setDeleteConfirm({
            isOpen: true,
            vmId: vm.id,
            vmName: vm.metricName
        });
    };

    const confirmDelete = () => {
        const updatedVMs = vms.filter(vm => vm.id !== deleteConfirm.vmId);
        localStorage.setItem('austina_vms', JSON.stringify(updatedVMs));
        setVms(updatedVMs);
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
                            <Link
                                to="/okr"
                                className="px-4 py-2 text-stone-600 hover:text-amber-600 transition-colors"
                            >
                                🎯 OKR
                            </Link>
                            <Link
                                to="/vm"
                                className="px-4 py-2 text-amber-600 font-medium"
                            >
                                📊 VM
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-stone-900 mb-2">Value Metrics Management</h1>
                    <p className="text-stone-600">Submit and track your Value Metric proposals</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'list'
                            ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-500 ring-offset-2'
                            : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                            }`}
                    >
                        📋 View VMs
                    </button>
                    <button
                        onClick={() => setActiveTab('submit')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'submit'
                            ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-500 ring-offset-2'
                            : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                            }`}
                    >
                        ➕ Submit New VM
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'list' ? (
                    // VM List Tab
                    vms.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center shadow-sm">
                            <div className="text-6xl mb-4">📊</div>
                            <h2 className="text-2xl font-semibold text-stone-900 mb-2">No Value Metrics Yet</h2>
                            <p className="text-stone-600 mb-6">Submit your first Value Metric to get started with AI validation</p>
                            <button
                                onClick={() => setActiveTab('submit')}
                                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-md"
                            >
                                ➕ Submit Value Metric
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {vms.map((vm) => (
                                <div key={vm.id} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Link
                                                    to={`/vm/${vm.id}`}
                                                    className="text-xl font-bold text-stone-900 hover:text-amber-600 transition-colors cursor-pointer"
                                                >
                                                    {vm.metricName}
                                                </Link>
                                                {getStatusBadge(vm.status)}
                                            </div>
                                            <p className="text-stone-600 text-sm mb-3">{vm.description}</p>
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-stone-500">BU:</span>
                                                    <span className="text-amber-700 font-medium">{vm.bu}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-stone-500">Baseline:</span>
                                                    <span className="text-stone-900 font-medium">{vm.baselineRate}%</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-stone-500">Target:</span>
                                                    <span className="text-green-600 font-medium">{vm.targetRate}%</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-stone-500">Min Volume:</span>
                                                    <span className="text-stone-900 font-medium">{vm.minVolume}</span>
                                                </div>
                                            </div>
                                            {vm.selectedOKR && (
                                                <div className="mt-2 text-sm bg-stone-50 inline-block px-3 py-1 rounded-lg border border-stone-100">
                                                    <span className="text-stone-500">Related OKR:</span>
                                                    <span className="text-amber-600 font-medium ml-2">{getOKRDetails(vm.selectedOKR)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            {vm.status === 'pending_analysis' && (
                                                <button
                                                    className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                                    onClick={() => handleAnalyze(vm)}
                                                    disabled={analyzing === vm.id || !vm.selectedOKR}
                                                >
                                                    {analyzing === vm.id ? '⏳ Analyzing...' : '🚀 Analyze'}
                                                </button>
                                            )}
                                            {vm.status === 'analyzed' && (
                                                <button
                                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all shadow-md"
                                                    onClick={() => {
                                                        if (vm.strategicCompassAnalysis) {
                                                            setShowAnalysisModal(vm.strategicCompassAnalysis);
                                                        } else {
                                                            alert('Analysis results not found.');
                                                        }
                                                    }}
                                                >
                                                    📊 View Results
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(vm)}
                                                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors border border-blue-100"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(vm)}
                                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-100"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-stone-400 mt-2">
                                        Submitted: {new Date(vm.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    // Submit New VM Tab
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
                        {/* Basic Information */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-semibold text-stone-900 mb-4">
                                {editingVM ? '✏️ Edit Value Metric' : '📋 Basic Information'}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Business Unit (BU) <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={vmData.bu}
                                        onChange={(e) => handleBUChange(e.target.value)}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        required
                                    >
                                        <option value="">Select your Business Unit</option>
                                        {[...new Set(savedOKRs.map(okr => okr.buName))].filter(Boolean).map((bu) => (
                                            <option key={bu} value={bu}>{bu}</option>
                                        ))}
                                        <option value="other">Other (please specify in description)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Metric Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={vmData.metricName}
                                        onChange={(e) => handleChange('metricName', e.target.value)}
                                        placeholder="e.g., Search Job by Public Transport"
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={vmData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        placeholder="Describe what this feature does and why it matters..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Conversion Metrics */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-semibold text-stone-900 mb-4">📊 Conversion Metrics</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Baseline Conversion Rate (%) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={vmData.baselineRate}
                                            onChange={(e) => handleBaselineChange(e.target.value)}
                                            placeholder="e.g., 5"
                                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            required
                                        />
                                        <span className="absolute right-4 top-3 text-stone-400">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Target Conversion Rate (%) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={vmData.targetRate}
                                            onChange={(e) => handleChange('targetRate', e.target.value)}
                                            placeholder="Auto-calculated (1.3x baseline)"
                                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            required
                                        />
                                        <span className="absolute right-4 top-3 text-stone-400">%</span>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-1">
                                        {vmData.baselineRate && vmData.targetRate ?
                                            `${((vmData.targetRate / vmData.baselineRate - 1) * 100).toFixed(0)}% improvement`
                                            : 'Default: 1.3x baseline'}
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Minimum Volume <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={vmData.minVolume}
                                        onChange={(e) => handleChange('minVolume', e.target.value)}
                                        placeholder="e.g., 2500"
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        required
                                    />
                                    <p className="text-xs text-stone-500 mt-1">Minimum sample size for statistical significance</p>
                                </div>
                            </div>
                        </div>

                        {/* Context for AI Agents */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-semibold text-stone-900 mb-4">🤖 Context for AI Agents</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Related OKR Key Result (Optional)
                                    </label>
                                    <select
                                        value={vmData.selectedOKR}
                                        onChange={(e) => handleChange('selectedOKR', e.target.value)}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        disabled={!vmData.bu}
                                    >
                                        <option value="">
                                            {!vmData.bu ? 'Select BU first' : 'Select a specific Key Result (or skip)'}
                                        </option>
                                        {savedOKRs
                                            .filter(okr => !vmData.bu || vmData.bu === 'other' || okr.buName === vmData.bu)
                                            .map((okr) => (
                                                <optgroup key={okr.id} label={`${okr.quarter} - ${okr.objective}`} className="text-stone-900 font-bold">
                                                    {okr.keyResults.map((kr) => (
                                                        <option key={`${okr.id}-${kr.id}`} value={`${okr.id}-${kr.id}`} className="text-stone-700 font-normal">
                                                            {kr.krNumber || kr.category} - {kr.category} ({kr.ratio || 'No ratio'})
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                    </select>
                                    {savedOKRs.length > 0 && vmData.bu && vmData.bu !== 'other' && (
                                        <p className="text-xs text-stone-500 mt-1">
                                            Showing Key Results for {vmData.bu} only
                                        </p>
                                    )}
                                </div>

                                {/* OKR Alignment Rationale - appears when OKR is selected */}
                                {vmData.selectedOKR && (
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">
                                            OKR Alignment Rationale <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={vmData.okrRationale}
                                            onChange={(e) => handleChange('okrRationale', e.target.value)}
                                            placeholder="Explain how this VM will help achieve the selected Key Result. Be specific about the expected impact on metrics..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            required
                                        />
                                        <p className="text-xs text-stone-500 mt-1">
                                            💡 This helps the Strategic Compass agent better understand your VM's alignment
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Supporting Document (Optional)
                                    </label>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-amber-300 bg-amber-50/30 rounded-lg cursor-pointer hover:bg-amber-50 transition-all">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg className="w-10 h-10 mb-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <p className="text-sm text-stone-600">
                                                {vmData.supportingDoc ? vmData.supportingDoc.name : 'Upload PRD, research, or context doc'}
                                            </p>
                                            <p className="text-xs text-stone-500">PDF, PNG, JPG</p>
                                        </div>
                                        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('list');
                                    setEditingVM(null);
                                    setVmData({
                                        bu: '',
                                        metricName: '',
                                        description: '',
                                        baselineRate: '',
                                        targetRate: '',
                                        minVolume: '',
                                        selectedOKR: '',
                                        okrRationale: '',
                                        supportingDoc: null
                                    });
                                }}
                                className="px-6 py-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-md"
                            >
                                {editingVM ? '💾 Update VM' : '🚀 Submit for Analysis'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Analysis Modal */}
            {showAnalysisModal && (
                <AnalysisModal
                    analysis={showAnalysisModal}
                    onClose={() => setShowAnalysisModal(null)}
                    onReanalyze={async () => {
                        console.log('🔄 Re-analyze clicked');
                        console.log('Current modal analysis:', showAnalysisModal);
                        console.log('All VMs:', vms);

                        // Find the VM by looking for the one with this analysis
                        const analyzedVM = vms.find(vm =>
                            vm.strategicCompassAnalysis === showAnalysisModal
                        );

                        console.log('Found VM:', analyzedVM);

                        if (analyzedVM) {
                            console.log('✅ VM found, re-analyzing...');
                            // Don't close modal - handleAnalyze will update it with new results
                            await handleAnalyze(analyzedVM);
                        } else {
                            console.error('❌ Could not find VM to re-analyze');
                            alert('Error: Could not find the VM to re-analyze. Please try clicking Analyze again from the VM list.');
                        }
                    }}
                    isReanalyzing={analyzing !== null}
                />
            )}

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, vmId: null, vmName: '' })}
                onConfirm={confirmDelete}
                title="Delete Value Metric"
                message={`Are you sure you want to delete "${deleteConfirm.vmName}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default VMManagementPage;
