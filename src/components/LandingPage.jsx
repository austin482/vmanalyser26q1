import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { importOKRFromLark, importVMFromLark } from '../services/larkService';

const LandingPage = () => {
    const navigate = useNavigate();

    // OKR Import State
    const [showOKRLarkModal, setShowOKRLarkModal] = useState(false);
    const [okrLarkUrl, setOkrLarkUrl] = useState('');
    const [isImportingOKR, setIsImportingOKR] = useState(false);

    // VM Import State
    const [showVMLarkModal, setShowVMLarkModal] = useState(false);
    const [vmLarkUrl, setVmLarkUrl] = useState('');
    const [isImportingVM, setIsImportingVM] = useState(false);

    // Lark Sync State
    const [showLarkSyncModal, setShowLarkSyncModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);

    // OKR Import Handler
    const handleOKRLarkImport = async () => {
        if (!okrLarkUrl.trim()) {
            alert('Please enter a Lark document URL');
            return;
        }

        setIsImportingOKR(true);
        try {
            const importedData = await importOKRFromLark(okrLarkUrl);

            // Save to localStorage
            const existingOKRs = JSON.parse(localStorage.getItem('austina_okrs') || '[]');
            const newOKR = {
                ...importedData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            };
            existingOKRs.push(newOKR);
            localStorage.setItem('austina_okrs', JSON.stringify(existingOKRs));

            setShowOKRLarkModal(false);
            setOkrLarkUrl('');
            alert('✅ Successfully imported OKR from Lark!');
            navigate('/okr-setup');
        } catch (error) {
            console.error('Lark import error:', error);
            alert(`❌ Import failed: ${error.message}\n\nPlease check:\n1. URL is correct\n2. Document is accessible\n3. App has permissions`);
        } finally {
            setIsImportingOKR(false);
        }
    };

    // VM Import Handler
    const handleVMLarkImport = async () => {
        if (!vmLarkUrl.trim()) {
            alert('Please enter a Lark document URL');
            return;
        }

        setIsImportingVM(true);
        try {
            const importedData = await importVMFromLark(vmLarkUrl);

            // Save to localStorage
            const existingVMs = JSON.parse(localStorage.getItem('austina_vms') || '[]');
            const newVM = {
                ...importedData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                status: 'pending_analysis',
                selectedOKR: '',
                supportingDoc: null
            };
            existingVMs.push(newVM);
            localStorage.setItem('austina_vms', JSON.stringify(existingVMs));

            setShowVMLarkModal(false);
            setVmLarkUrl('');
            alert('✅ Successfully imported VM from Lark!');
            navigate('/vm-list');
        } catch (error) {
            console.error('Lark import error:', error);
            alert(`❌ Import failed: ${error.message}\n\nPlease check:\n1. URL is correct\n2. Document is accessible\n3. App has permissions`);
        } finally {
            setIsImportingVM(false);
        }
    };

    // Lark Sync Handler
    const handleLarkSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);

        try {
            const response = await fetch('http://localhost:3001/api/lark/sync-vms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setSyncResult(data);
                alert(`✅ Success!\n\nAnalyzed: ${data.analyzed} VMs\nAverage Score: ${data.averageScore}\n\nCheck your Lark base for updated scores and suggestions!`);
            } else {
                throw new Error(data.error || 'Sync failed');
            }
        } catch (error) {
            console.error('Lark sync error:', error);
            alert(`❌ Sync failed: ${error.message}\n\nPlease check:\n1. Lark app permissions are set up\n2. Server is running\n3. At least one VM has Status="Pending"`);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Navigation */}
            <nav className="border-b border-stone-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                <span className="font-bold text-white text-xl">A</span>
                            </div>
                            <span className="font-bold text-2xl text-stone-900 tracking-tight">Austina</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                to="/okr"
                                className="px-4 py-2 text-stone-600 hover:text-amber-600 transition-colors font-medium"
                            >
                                🎯 OKR
                            </Link>
                            <Link
                                to="/vm"
                                className="px-4 py-2 text-stone-600 hover:text-amber-600 transition-colors"
                            >
                                📊 VM
                            </Link>
                            <button
                                onClick={() => setShowLarkSyncModal(true)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Sync Lark
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h1 className="text-6xl font-bold text-stone-900 mb-6">
                        Welcome to <span className="text-amber-600">Austina</span>
                    </h1>
                    <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
                        AI-powered Value Metric validation system that ensures your features align with strategic OKRs
                        before development begins.
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* OKR Card */}
                    <div className="bg-white rounded-2xl p-8 border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all group">
                        <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-200 transition-colors">
                            <span className="text-4xl">🎯</span>
                        </div>
                        <h2 className="text-2xl font-bold text-stone-900 mb-3">OKR Management</h2>
                        <p className="text-stone-600 mb-6 leading-relaxed">
                            Upload and manage your Objectives and Key Results. Define strategic goals and track progress.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/okr')}
                                className="flex items-center justify-center text-amber-600 font-medium hover:gap-3 gap-2 transition-all py-2"
                            >
                                Manage OKRs
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowOKRLarkModal(true);
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                Import from Lark
                            </button>
                        </div>
                    </div>

                    {/* VM Card */}
                    <div className="bg-white rounded-2xl p-8 border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all group">
                        <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                            <span className="text-4xl">📊</span>
                        </div>
                        <h2 className="text-2xl font-bold text-stone-900 mb-3">Value Metrics</h2>
                        <p className="text-stone-600 mb-6 leading-relaxed">
                            Create and validate Value Metrics with AI-powered strategic alignment analysis.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/vm')}
                                className="flex items-center justify-center text-amber-600 font-medium hover:gap-3 gap-2 transition-all py-2"
                            >
                                Manage VMs
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowVMLarkModal(true);
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                Import from Lark
                            </button>
                        </div>
                    </div>
                </div>

                {/* How it Works */}
                <div className="mt-20 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                                1
                            </div>
                            <h3 className="font-semibold text-stone-900 mb-2">Setup OKRs</h3>
                            <p className="text-stone-600 text-sm">Upload your quarterly OKRs and define strategic goals</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                                2
                            </div>
                            <h3 className="font-semibold text-stone-900 mb-2">Create Value Metrics</h3>
                            <p className="text-stone-600 text-sm">Define metrics for proposed features and link to OKRs</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                                3
                            </div>
                            <h3 className="font-semibold text-stone-900 mb-2">AI Analysis</h3>
                            <p className="text-stone-600 text-sm">Get strategic alignment scores and actionable insights</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* OKR Lark Import Modal */}
            {showOKRLarkModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 border border-stone-200 shadow-2xl">
                        <h2 className="text-2xl font-bold text-stone-900 mb-4">📄 Import OKR from Lark</h2>
                        <p className="text-stone-600 mb-6">Paste your Lark Wiki URL to automatically import BU and KR data</p>

                        <input
                            type="text"
                            value={okrLarkUrl}
                            onChange={(e) => setOkrLarkUrl(e.target.value)}
                            placeholder="https://xxx.larksuite.com/wiki/xxxxx"
                            className="w-full px-4 py-3 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-6"
                            disabled={isImportingOKR}
                        />

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowOKRLarkModal(false);
                                    setOkrLarkUrl('');
                                }}
                                className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                                disabled={isImportingOKR}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleOKRLarkImport}
                                disabled={isImportingOKR}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isImportingOKR ? '⏳ Importing...' : '✨ Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VM Lark Import Modal */}
            {showVMLarkModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 border border-stone-200 shadow-2xl">
                        <h2 className="text-2xl font-bold text-stone-900 mb-4">📄 Import VM from Lark</h2>
                        <p className="text-stone-600 mb-6">Paste your Lark document URL to automatically import VM data</p>

                        <input
                            type="text"
                            value={vmLarkUrl}
                            onChange={(e) => setVmLarkUrl(e.target.value)}
                            placeholder="https://xxx.larksuite.com/wiki/xxxxx"
                            className="w-full px-4 py-3 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-6"
                            disabled={isImportingVM}
                        />

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowVMLarkModal(false);
                                    setVmLarkUrl('');
                                }}
                                className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                                disabled={isImportingVM}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleVMLarkImport}
                                disabled={isImportingVM}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isImportingVM ? '⏳ Importing...' : '✨ Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lark Sync Modal */}
            {showLarkSyncModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 border border-stone-200 shadow-2xl">
                        <h2 className="text-2xl font-bold text-stone-900 mb-4">🔄 Sync VMs from Lark</h2>
                        <p className="text-stone-600 mb-6">
                            This will fetch all VMs with Status="Pending" from your Lark base,
                            analyze them with AI, and update the scores and suggestions.
                        </p>

                        {syncResult && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="font-semibold text-green-900 mb-2">✅ Sync Complete!</p>
                                <ul className="text-sm text-green-800 space-y-1">
                                    <li>• Analyzed: {syncResult.analyzed} VMs</li>
                                    <li>• Average Score: {syncResult.averageScore}</li>
                                    {syncResult.failed > 0 && <li>• Failed: {syncResult.failed}</li>}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowLarkSyncModal(false);
                                    setSyncResult(null);
                                }}
                                className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                                disabled={isSyncing}
                            >
                                {syncResult ? 'Close' : 'Cancel'}
                            </button>
                            {!syncResult && (
                                <button
                                    type="button"
                                    onClick={handleLarkSync}
                                    disabled={isSyncing}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSyncing ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Syncing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Start Sync
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
