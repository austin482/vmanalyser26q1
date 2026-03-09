import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { importVMFromLark } from '../services/larkService';

const VMInputPage = () => {
    const [savedOKRs, setSavedOKRs] = useState([]);
    const [vmData, setVmData] = useState({
        metricName: '',
        description: '',
        selectedOKR: '',
        selectedBU: '',
        okrRationale: '',
        supportingDoc: null
    });
    const [showLarkModal, setShowLarkModal] = useState(false);
    const [larkUrl, setLarkUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Load saved OKRs from localStorage
    useEffect(() => {
        const okrs = JSON.parse(localStorage.getItem('austina_okrs') || '[]');
        setSavedOKRs(okrs);
    }, []);

    const handleChange = (field, value) => {
        setVmData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVmData(prev => ({ ...prev, supportingDoc: file }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation - BU is required, OKR is optional
        if (!vmData.metricName || !vmData.description || !vmData.selectedBU) {
            alert('Please fill in all required fields (Metric Name, Description, and Business Unit)');
            return;
        }

        // Get BU - always use selectedBU (which is required)
        const bu = vmData.selectedBU;

        // Save to localStorage
        const existingVMs = JSON.parse(localStorage.getItem('austina_vms') || '[]');
        const newVM = {
            ...vmData,
            bu: bu,  // Auto-detected from OKR
            baselineRate: '0',  // Placeholder values (not used in scoring)
            targetRate: '0',
            minVolume: '0',
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            status: 'pending_analysis'
        };
        existingVMs.push(newVM);
        localStorage.setItem('austina_vms', JSON.stringify(existingVMs));

        alert('Value Metric submitted! Ready for analysis.');

        // Reset form
        setVmData({
            metricName: '',
            description: '',
            selectedOKR: '',
            selectedBU: '',
            okrRationale: '',
            supportingDoc: null
        });
    };

    const handleLarkImport = async () => {
        if (!larkUrl.trim()) {
            alert('Please enter a Lark document URL');
            return;
        }

        setIsImporting(true);
        try {
            const importedData = await importVMFromLark(larkUrl);

            // Auto-fill form with imported data
            setVmData(prev => ({
                ...prev,
                metricName: importedData.metricName || prev.metricName,
                description: importedData.description || prev.description,
                okrRationale: importedData.okrRationale || prev.okrRationale
            }));

            setShowLarkModal(false);
            setLarkUrl('');
            alert('✅ Successfully imported from Lark!');
        } catch (error) {
            console.error('Lark import error:', error);
            alert(`❌ Import failed: ${error.message}\n\nPlease check:\n1. URL is correct\n2. Document is accessible\n3. App has permissions`);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Navigation */}
            <nav className="border-b border-white/10 backdrop-blur-lg bg-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <span className="font-bold text-white text-xl">A</span>
                            </div>
                            <span className="font-bold text-2xl text-white tracking-tight">Austina</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link
                                to="/okr-setup"
                                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                            >
                                🎯 OKR Setup
                            </Link>
                            <Link
                                to="/vm-list"
                                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                            >
                                📋 VM List
                            </Link>
                            <Link
                                to="/vm-input"
                                className="px-4 py-2 text-purple-300 hover:text-white transition-colors"
                            >
                                📝 New VM
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Submit Value Metric</h1>
                        <p className="text-gray-300">Define your feature's success metrics for AI validation</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowLarkModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Import from Lark
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    {/* Section 1: Basic Information */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">📋 Value Metric Details</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Metric Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={vmData.metricName}
                                    onChange={(e) => handleChange('metricName', e.target.value)}
                                    placeholder="e.g., Search Job by Public Transport"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Description <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={vmData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Describe what this feature does and why it matters..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: BU & OKR Alignment */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">🎯 Business Unit & OKR</h2>

                        <div className="space-y-4">
                            {/* Business Unit Selection - PRIMARY */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Business Unit <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={vmData.selectedBU}
                                    onChange={(e) => {
                                        handleChange('selectedBU', e.target.value);
                                        // Clear OKR if BU changes
                                        if (vmData.selectedOKR) {
                                            handleChange('selectedOKR', '');
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                >
                                    <option value="">Select a Business Unit</option>
                                    {[...new Set(savedOKRs.map(okr => okr.buName))].map((buName) => (
                                        <option key={buName} value={buName}>
                                            {buName}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">
                                    💡 VM will be analyzed against all KRs in this BU by default
                                </p>
                            </div>

                            {/* Optional: Specific Key Result */}
                            {vmData.selectedBU && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Specific Key Result <span className="text-gray-400">(Optional - for advanced targeting)</span>
                                    </label>
                                    <select
                                        value={vmData.selectedOKR}
                                        onChange={(e) => handleChange('selectedOKR', e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">None - analyze against all {vmData.selectedBU} KRs</option>
                                        {savedOKRs
                                            .filter(okr => okr.buName === vmData.selectedBU)
                                            .map((okr) => (
                                                <optgroup key={okr.id} label={`${okr.quarter} - ${okr.objective}`}>
                                                    {okr.keyResults.map((kr) => (
                                                        <option key={`${okr.id}-${kr.id}`} value={`${okr.id}-${kr.id}`}>
                                                            {kr.category} ({kr.ratio})
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        ℹ️ Only select if you want to target a specific KR
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    OKR Rationale <span className="text-gray-400">(Optional but recommended)</span>
                                </label>
                                <textarea
                                    value={vmData.okrRationale}
                                    onChange={(e) => handleChange('okrRationale', e.target.value)}
                                    placeholder="Explain HOW this metric impacts the selected Key Result... (100+ characters recommended for better AI analysis)"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {vmData.okrRationale.length} characters
                                    {vmData.okrRationale.length >= 100 && ' ✓ Good length'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Supporting Document (Optional)
                                </label>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-400/50 rounded-lg cursor-pointer hover:bg-white/5 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-10 h-10 mb-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-sm text-gray-300">
                                            {vmData.supportingDoc ? vmData.supportingDoc.name : 'Upload PRD, research, or context doc'}
                                        </p>
                                        <p className="text-xs text-gray-400">PDF, PNG, JPG</p>
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
                            onClick={() => window.history.back()}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
                        >
                            🚀 Submit for Analysis
                        </button>
                    </div>
                </form>

                {/* Lark Import Modal */}
                {showLarkModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-lg w-full mx-4 border border-white/20 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-4">📄 Import from Lark</h2>
                            <p className="text-gray-300 mb-6">Paste your Lark document URL to automatically import VM data</p>

                            <input
                                type="text"
                                value={larkUrl}
                                onChange={(e) => setLarkUrl(e.target.value)}
                                placeholder="https://xxx.larksuite.com/wiki/xxxxx"
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                                disabled={isImporting}
                            />

                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowLarkModal(false);
                                        setLarkUrl('');
                                    }}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                                    disabled={isImporting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLarkImport}
                                    disabled={isImporting}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isImporting ? '⏳ Importing...' : '✨ Import'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VMInputPage;
