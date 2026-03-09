import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const VMListPage = () => {
    const [vms, setVms] = useState([]);
    const [okrs, setOkrs] = useState([]);

    useEffect(() => {
        // Load VMs and OKRs from localStorage
        const savedVMs = JSON.parse(localStorage.getItem('austina_vms') || '[]');
        const savedOKRs = JSON.parse(localStorage.getItem('austina_okrs') || '[]');
        setVms(savedVMs);
        setOkrs(savedOKRs);
    }, []);

    const getOKRDetails = (selectedOKR) => {
        if (!selectedOKR) return null;
        const [okrId, krId] = selectedOKR.split('-');
        const okr = okrs.find(o => o.id === okrId);
        if (!okr) return null;
        const kr = okr.keyResults.find(k => k.id === krId);
        return kr ? `${okr.quarter} - ${kr.category}` : null;
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending_analysis: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
            analyzing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            analyzed: 'bg-green-500/20 text-green-300 border-green-500/30'
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

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this Value Metric?')) {
            const updatedVMs = vms.filter(vm => vm.id !== id);
            localStorage.setItem('austina_vms', JSON.stringify(updatedVMs));
            setVms(updatedVMs);
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
                                className="px-4 py-2 text-purple-300 hover:text-white transition-colors"
                            >
                                📋 VM List
                            </Link>
                            <Link
                                to="/vm-input"
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                            >
                                + New VM
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Value Metrics Dashboard</h1>
                    <p className="text-gray-300">View and manage all submitted Value Metrics</p>
                </div>

                {vms.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <h2 className="text-2xl font-semibold text-white mb-2">No Value Metrics Yet</h2>
                        <p className="text-gray-300 mb-6">Submit your first Value Metric to get started with AI validation</p>
                        <Link
                            to="/vm-input"
                            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                        >
                            + Submit Value Metric
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {vms.map((vm) => (
                            <div key={vm.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold text-white">{vm.metricName}</h3>
                                            {getStatusBadge(vm.status)}
                                        </div>
                                        <p className="text-gray-300 text-sm mb-3">{vm.description}</p>
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">BU:</span>
                                                <span className="text-purple-300 font-medium">{vm.bu}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Baseline:</span>
                                                <span className="text-white font-medium">{vm.baselineRate}%</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Target:</span>
                                                <span className="text-green-300 font-medium">{vm.targetRate}%</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Min Volume:</span>
                                                <span className="text-white font-medium">{vm.minVolume}</span>
                                            </div>
                                        </div>
                                        {vm.selectedOKR && (
                                            <div className="mt-2 text-sm">
                                                <span className="text-gray-400">Related OKR:</span>
                                                <span className="text-blue-300 ml-2">{getOKRDetails(vm.selectedOKR)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        {vm.status === 'pending_analysis' && (
                                            <button
                                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                                                onClick={() => alert('Agent analysis coming soon!')}
                                            >
                                                🚀 Analyze
                                            </button>
                                        )}
                                        {vm.status === 'analyzed' && (
                                            <button
                                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                                                onClick={() => alert('View results page coming soon!')}
                                            >
                                                📊 View Results
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(vm.id)}
                                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    Submitted: {new Date(vm.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VMListPage;
