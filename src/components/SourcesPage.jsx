import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const SourcesPage = () => {
    const { sources, updateSource, addSource, deleteSource } = useApp();
    const [activeTab, setActiveTab] = useState('humanCosts');

    const tabs = [
        { id: 'humanCosts', label: 'Human Costs' },
        { id: 'weeks', label: 'Week Config' },
        { id: 'pkrs', label: 'PKRs' },
        { id: 'platforms', label: 'Platforms' },
    ];

    const handleUpdate = (type, id, field, value) => {
        updateSource(type, id, { [field]: value });
    };

    const handleDelete = (type, id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            deleteSource(type, id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Manage Sources</h2>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="glass-panel p-6">
                {activeTab === 'humanCosts' && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg">Human Costs Configuration</h3>

                        {/* Add New Member Form */}
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <h4 className="text-sm font-bold text-slate-300 mb-3">Add New Member</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Member Name</label>
                                    <input
                                        type="text"
                                        id="newMemberName"
                                        placeholder="e.g. David"
                                        className="input-field py-1.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Cost ($)</label>
                                    <input
                                        type="number"
                                        id="newMemberCost"
                                        placeholder="0"
                                        className="input-field py-1.5"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const name = document.getElementById('newMemberName').value;
                                        const cost = document.getElementById('newMemberCost').value;
                                        if (name && cost) {
                                            addSource('humanCosts', { name, cost: parseFloat(cost) });
                                            document.getElementById('newMemberName').value = '';
                                            document.getElementById('newMemberCost').value = '';
                                        } else {
                                            alert('Please fill in all fields');
                                        }
                                    }}
                                    className="btn-primary py-1.5 text-sm"
                                >
                                    Add Member
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sources.humanCosts.map(item => (
                                <div key={item.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 relative group">
                                    <button
                                        onClick={() => handleDelete('humanCosts', item.id)}
                                        className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    <label className="text-xs text-slate-400">Cost per Campaign</label>
                                    <input
                                        type="number"
                                        value={item.cost}
                                        onChange={(e) => handleUpdate('humanCosts', item.id, 'cost', parseFloat(e.target.value))}
                                        className="input-field mt-1"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'weeks' && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg">Week Configuration</h3>

                        {/* Add New Week Form */}
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <h4 className="text-sm font-bold text-slate-300 mb-3">Add New Week</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Week Name</label>
                                    <input
                                        type="text"
                                        id="newWeekName"
                                        placeholder="e.g. Week 03"
                                        className="input-field py-1.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        id="newWeekStart"
                                        className="input-field py-1.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        id="newWeekEnd"
                                        className="input-field py-1.5"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const name = document.getElementById('newWeekName').value;
                                        const start = document.getElementById('newWeekStart').value;
                                        const end = document.getElementById('newWeekEnd').value;
                                        if (name && start && end) {
                                            addSource('weeks', { name, startDate: start, endDate: end });
                                            document.getElementById('newWeekName').value = '';
                                            document.getElementById('newWeekStart').value = '';
                                            document.getElementById('newWeekEnd').value = '';
                                        } else {
                                            alert('Please fill in all fields');
                                        }
                                    }}
                                    className="btn-primary py-1.5 text-sm"
                                >
                                    Add Week
                                </button>
                            </div>
                        </div>

                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-3">Week Name</th>
                                    <th className="px-4 py-3">Start Date</th>
                                    <th className="px-4 py-3">End Date</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {sources.weeks.map(item => (
                                    <tr key={item.id} className="group">
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleUpdate('weeks', item.id, 'name', e.target.value)}
                                                className="bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none w-full"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="date"
                                                value={item.startDate || item.date}
                                                onChange={(e) => handleUpdate('weeks', item.id, 'startDate', e.target.value)}
                                                className="bg-transparent border-none focus:ring-0 p-0 text-white"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="date"
                                                value={item.endDate || ''}
                                                onChange={(e) => handleUpdate('weeks', item.id, 'endDate', e.target.value)}
                                                className="bg-transparent border-none focus:ring-0 p-0 text-white"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete('weeks', item.id)}
                                                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'pkrs' && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg">Member PKRs</h3>

                        {/* Add New PKR Form */}
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <h4 className="text-sm font-bold text-slate-300 mb-3">Add New PKR</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Member Name</label>
                                    <select id="newPkrName" className="input-field py-1.5">
                                        <option value="">Select Member...</option>
                                        {sources.humanCosts.map(m => (
                                            <option key={m.id} value={m.name}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">PKR</label>
                                    <input
                                        type="text"
                                        id="newPkrValue"
                                        placeholder="e.g. Drive Sales"
                                        className="input-field py-1.5"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const name = document.getElementById('newPkrName').value;
                                        const pkr = document.getElementById('newPkrValue').value;
                                        if (name && pkr) {
                                            addSource('pkrs', { name, pkr });
                                            document.getElementById('newPkrName').value = '';
                                            document.getElementById('newPkrValue').value = '';
                                        } else {
                                            alert('Please fill in all fields');
                                        }
                                    }}
                                    className="btn-primary py-1.5 text-sm"
                                >
                                    Add PKR
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {sources.pkrs.map(item => (
                                <div key={item.id} className="flex items-center gap-4 bg-slate-900/30 p-3 rounded-lg group">
                                    <span className="w-24 font-medium text-slate-300">{item.name}</span>
                                    <input
                                        type="text"
                                        value={item.pkr}
                                        onChange={(e) => handleUpdate('pkrs', item.id, 'pkr', e.target.value)}
                                        className="input-field flex-1"
                                    />
                                    <button
                                        onClick={() => handleDelete('pkrs', item.id)}
                                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'platforms' && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg">Member Platforms</h3>

                        {/* Add New Platform Form */}
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <h4 className="text-sm font-bold text-slate-300 mb-3">Add New Platform</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Member Name</label>
                                    <select id="newPlatformName" className="input-field py-1.5">
                                        <option value="">Select Member...</option>
                                        {sources.humanCosts.map(m => (
                                            <option key={m.id} value={m.name}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Platform</label>
                                    <select id="newPlatformValue" className="input-field py-1.5">
                                        <option value="Maukerja">Maukerja</option>
                                        <option value="Ricebowl">Ricebowl</option>
                                        <option value="Maukerja / Ricebowl">Maukerja / Ricebowl</option>
                                        <option value="AJobThing">AJobThing</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => {
                                        const name = document.getElementById('newPlatformName').value;
                                        const platform = document.getElementById('newPlatformValue').value;
                                        if (name && platform) {
                                            addSource('platforms', { name, platform });
                                            document.getElementById('newPlatformName').value = '';
                                        } else {
                                            alert('Please fill in all fields');
                                        }
                                    }}
                                    className="btn-primary py-1.5 text-sm"
                                >
                                    Add Platform
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {sources.platforms.map(item => (
                                <div key={item.id} className="flex items-center gap-4 bg-slate-900/30 p-3 rounded-lg group">
                                    <span className="w-24 font-medium text-slate-300">{item.name}</span>
                                    <select
                                        value={item.platform}
                                        onChange={(e) => handleUpdate('platforms', item.id, 'platform', e.target.value)}
                                        className="input-field flex-1"
                                    >
                                        <option value="Maukerja">Maukerja</option>
                                        <option value="Ricebowl">Ricebowl</option>
                                        <option value="Maukerja / Ricebowl">Maukerja / Ricebowl</option>
                                        <option value="AJobThing">AJobThing</option>
                                    </select>
                                    <button
                                        onClick={() => handleDelete('platforms', item.id)}
                                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SourcesPage;
