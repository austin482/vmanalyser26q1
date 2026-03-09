import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const TrackerTable = () => {
    const { campaigns, updateCampaign, sources } = useApp();
    const [filterMember, setFilterMember] = useState('');

    // Filter for approved campaigns
    const myCampaigns = campaigns.filter(c =>
        c.status === 'APPROVED' &&
        (filterMember === '' || c.name === filterMember)
    );

    const handleResultChange = (id, field, value) => {
        updateCampaign(id, { [field]: parseFloat(value) });
    };

    const getStatus = (campaign) => {
        if (!campaign.volumeResult) return 'PENDING';
        // Logic: if min volume < ( volume target / 2) = Fail
        // Note: Min Volume IS (Volume Target / 2).
        // So if Result < Min Volume -> Fail.
        return campaign.volumeResult >= campaign.minVolume ? 'PASS' : 'FAIL';
    };

    return (
        <div className="space-y-4">
            {/* Filter */}
            <div className="flex justify-end">
                <select
                    value={filterMember}
                    onChange={(e) => setFilterMember(e.target.value)}
                    className="input-field w-64"
                >
                    <option value="">All Members</option>
                    {sources.humanCosts.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                </select>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Campaign Info</th>
                                <th className="px-6 py-4">Targets (CR / Vol)</th>
                                <th className="px-6 py-4">Budgets</th>
                                <th className="px-6 py-4 bg-blue-900/10">Results Input</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {myCampaigns.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                        No approved campaigns found.
                                    </td>
                                </tr>
                            )}
                            {myCampaigns.map((campaign) => {
                                const status = getStatus(campaign);
                                return (
                                    <tr key={campaign.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{campaign.description}</div>
                                            <div className="text-xs text-slate-400 mt-1">Start: {campaign.startTrack}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">Min Vol: {campaign.minVolume}</div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                <span className="text-slate-400">CR Base:</span>
                                                <span>{campaign.conversionRateBaseline}%</span>
                                                <span className="text-blue-400">CR Tgt:</span>
                                                <span className="text-blue-400 font-bold">{campaign.conversionRateTarget}%</span>
                                                <span className="text-slate-400">Vol Base:</span>
                                                <span>{campaign.volumeBaseline}</span>
                                                <span className="text-blue-400">Vol Tgt:</span>
                                                <span className="text-blue-400 font-bold">{campaign.volumeTarget}</span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-400">Prev:</span>
                                                    <span>${campaign.budgetPrevious}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-blue-400">Prop:</span>
                                                    <span className="text-blue-400 font-bold">${campaign.budgetProposed}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 bg-blue-900/5">
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Vol Result</label>
                                                    <input
                                                        type="number"
                                                        value={campaign.volumeResult || ''}
                                                        onChange={(e) => handleResultChange(campaign.id, 'volumeResult', e.target.value)}
                                                        className="input-field py-1 text-sm"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">CR Result (%)</label>
                                                    <input
                                                        type="number"
                                                        value={campaign.conversionRateResult || ''}
                                                        onChange={(e) => handleResultChange(campaign.id, 'conversionRateResult', e.target.value)}
                                                        className="input-field py-1 text-sm"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                {campaign.volumeResult > 0 ? (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-center ${status === 'PASS'
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                                        : 'bg-red-500/20 text-red-400 border border-red-500/50'
                                                        }`}>
                                                        {status}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-500 text-center italic">Waiting for results...</span>
                                                )}

                                                {/* PKR Placeholder */}
                                                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700/50">
                                                    PKR: <span className="text-slate-300">Calculating...</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TrackerTable;
