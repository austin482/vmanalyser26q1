import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const ManagerDashboard = () => {
    const { campaigns, updateCampaign, approveCampaign, rejectCampaign, getHumanCost } = useApp();
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [humanCostPrevious, setHumanCostPrevious] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const pendingCampaigns = campaigns.filter(c => c.status === 'PENDING');
    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

    const handleSelect = (campaign) => {
        setSelectedCampaignId(campaign.id);
        // Reset inputs
        setHumanCostPrevious('');
        setRejectionReason('');
    };

    const handleApprove = () => {
        if (!humanCostPrevious) {
            alert('Please enter Human Cost for previous campaign');
            return;
        }
        updateCampaign(selectedCampaignId, {
            humanCostPrevious: parseFloat(humanCostPrevious)
        });
        approveCampaign(selectedCampaignId);
        setSelectedCampaignId(null);
    };

    const handleReject = () => {
        if (!rejectionReason) {
            alert('Please enter a rejection reason');
            return;
        }
        rejectCampaign(selectedCampaignId, rejectionReason);
        setSelectedCampaignId(null);
    };

    // Calculations
    const calculateMetrics = (campaign) => {
        const hcPrev = parseFloat(humanCostPrevious) || 0;
        const hcCurr = campaign.humanCostCurrent || 0;

        const costPerVolBaseline = (hcPrev + campaign.budgetPrevious) > 0
            ? campaign.volumeBaseline / (hcPrev + campaign.budgetPrevious)
            : 0;

        const costPerVolTarget = (hcCurr + campaign.budgetProposed) > 0
            ? campaign.volumeTarget / (hcCurr + campaign.budgetProposed)
            : 0;

        const costPerMinTarget = (hcCurr + campaign.budgetProposed) > 0
            ? campaign.minVolume / (hcCurr + campaign.budgetProposed)
            : 0;

        return { costPerVolBaseline, costPerVolTarget, costPerMinTarget };
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Manager Dashboard</h2>
                <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded-full">{pendingCampaigns.length} Pending</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List */}
                <div className="lg:col-span-1 space-y-4">
                    {pendingCampaigns.length === 0 && (
                        <div className="text-slate-400 text-center py-8 glass-panel">No pending campaigns</div>
                    )}
                    {pendingCampaigns.map(campaign => (
                        <div
                            key={campaign.id}
                            onClick={() => handleSelect(campaign)}
                            className={`glass-panel p-4 cursor-pointer transition-all hover:border-blue-500/50 ${selectedCampaignId === campaign.id ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-white">{campaign.name}</h3>
                                <span className="text-xs text-slate-400">{campaign.submissionDate}</span>
                            </div>
                            <p className="text-sm text-slate-300 line-clamp-2">{campaign.description}</p>
                        </div>
                    ))}
                </div>

                {/* Detail View */}
                <div className="lg:col-span-2">
                    {selectedCampaign ? (
                        <div className="glass-panel p-8 animate-fade-in">
                            <h3 className="text-xl font-bold mb-6 border-b border-slate-700 pb-4">Review Campaign</h3>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div>
                                    <p className="text-sm text-slate-400">Member</p>
                                    <p className="font-medium">{selectedCampaign.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Start Date</p>
                                    <p className="font-medium">{selectedCampaign.startTrack}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-slate-400">Description</p>
                                    <p className="font-medium">{selectedCampaign.description}</p>
                                </div>

                                {/* Stats Grid */}
                                <div className="col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/50 p-4 rounded-xl">
                                    <div>
                                        <p className="text-xs text-slate-400">Vol Baseline</p>
                                        <p className="font-bold">{selectedCampaign.volumeBaseline}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Vol Target</p>
                                        <p className="font-bold text-blue-400">{selectedCampaign.volumeTarget}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">CR Baseline</p>
                                        <p className="font-bold">{selectedCampaign.conversionRateBaseline}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">CR Target</p>
                                        <p className="font-bold text-blue-400">{selectedCampaign.conversionRateTarget}%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Manager Inputs */}
                            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 mb-8">
                                <h4 className="font-bold text-lg mb-4 text-blue-200">Cost Analysis</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Human Cost (Current)</label>
                                        <input
                                            type="number"
                                            value={selectedCampaign.humanCostCurrent}
                                            readOnly
                                            className="input-field opacity-70"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Synced from Source</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Human Cost (Previous)</label>
                                        <input
                                            type="number"
                                            value={humanCostPrevious}
                                            onChange={(e) => setHumanCostPrevious(e.target.value)}
                                            placeholder="Enter cost..."
                                            className="input-field border-blue-500/30 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Calculated Metrics */}
                                <div className="mt-6 grid grid-cols-3 gap-4">
                                    <div className="bg-slate-900 p-3 rounded-lg">
                                        <p className="text-xs text-slate-400 mb-1">Cost/Vol Baseline</p>
                                        <p className="font-mono font-bold text-green-400">
                                            {calculateMetrics(selectedCampaign).costPerVolBaseline.toFixed(4)}
                                        </p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded-lg">
                                        <p className="text-xs text-slate-400 mb-1">Cost/Vol Target</p>
                                        <p className="font-mono font-bold text-blue-400">
                                            {calculateMetrics(selectedCampaign).costPerVolTarget.toFixed(4)}
                                        </p>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded-lg">
                                        <p className="text-xs text-slate-400 mb-1">Cost/Min Target</p>
                                        <p className="font-mono font-bold text-yellow-400">
                                            {calculateMetrics(selectedCampaign).costPerMinTarget.toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleApprove}
                                        className="flex-1 btn-primary bg-green-600 hover:bg-green-500 shadow-green-500/20"
                                    >
                                        Approve Campaign
                                    </button>
                                    <button
                                        onClick={() => setRejectionReason(' ')} // Trigger rejection mode
                                        className="flex-1 btn-secondary bg-red-900/20 text-red-200 hover:bg-red-900/40 border border-red-900/50"
                                    >
                                        Reject
                                    </button>
                                </div>

                                {rejectionReason !== '' && (
                                    <div className="animate-fade-in pt-4 border-t border-slate-700">
                                        <label className="block text-sm font-medium text-red-300 mb-2">Rejection Reason</label>
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="input-field border-red-900/50 focus:border-red-500"
                                                placeholder="Why is this rejected?"
                                            />
                                            <button
                                                onClick={handleReject}
                                                className="btn-primary bg-red-600 hover:bg-red-500"
                                            >
                                                Confirm Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center glass-panel text-slate-500">
                            Select a campaign to review
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
