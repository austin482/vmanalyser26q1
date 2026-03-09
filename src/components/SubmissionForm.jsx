
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const SubmissionForm = () => {
    const { addCampaign, sources } = useApp();

    const [selectedMember, setSelectedMember] = useState('');
    const [formData, setFormData] = useState({
        startTrack: '',
        description: '',
        conversionRateBaseline: '',
        conversionRateTarget: '',
        budgetProposed: '',
        budgetPrevious: '',
        volumeBaseline: '',
        volumeTarget: '',
    });

    const [minVolume, setMinVolume] = useState(0);

    useEffect(() => {
        const target = parseFloat(formData.volumeTarget) || 0;
        setMinVolume(target / 2);
    }, [formData.volumeTarget]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedMember) {
            alert('Please select your name');
            return;
        }

        addCampaign({
            ...formData,
            name: selectedMember, // Use selected name
            conversionRateBaseline: parseFloat(formData.conversionRateBaseline),
            conversionRateTarget: parseFloat(formData.conversionRateTarget),
            budgetProposed: parseFloat(formData.budgetProposed),
            budgetPrevious: parseFloat(formData.budgetPrevious),
            volumeBaseline: parseFloat(formData.volumeBaseline),
            volumeTarget: parseFloat(formData.volumeTarget),
        });
        // Reset form
        setFormData({
            startTrack: '',
            description: '',
            conversionRateBaseline: '',
            conversionRateTarget: '',
            budgetProposed: '',
            budgetPrevious: '',
            volumeBaseline: '',
            volumeTarget: '',
        });
        setSelectedMember('');
        alert('Campaign submitted successfully!');
    };

    return (
        <div className="glass-panel p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Member Name</label>
                        <select
                            value={selectedMember}
                            onChange={(e) => setSelectedMember(e.target.value)}
                            required
                            className="input-field"
                        >
                            <option value="">Select your name...</option>
                            {sources.humanCosts.map(m => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Start Track */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Start Track</label>
                        <input
                            type="date"
                            name="startTrack"
                            value={formData.startTrack}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>

                    {/* Campaign Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Campaign Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows="3"
                            className="input-field resize-none"
                            placeholder="Describe your campaign strategy..."
                        />
                    </div>

                    {/* Conversion Rates */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Conversion Rate Baseline (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="conversionRateBaseline"
                            value={formData.conversionRateBaseline}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Conversion Rate Target (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="conversionRateTarget"
                            value={formData.conversionRateTarget}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>

                    {/* Budgets */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Previous Campaign Budget ($)</label>
                        <input
                            type="number"
                            name="budgetPrevious"
                            value={formData.budgetPrevious}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Propose Campaign Budget ($)</label>
                        <input
                            type="number"
                            name="budgetProposed"
                            value={formData.budgetProposed}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>

                    {/* Volumes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Volume Baseline</label>
                        <input
                            type="number"
                            name="volumeBaseline"
                            value={formData.volumeBaseline}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Volume Target</label>
                        <input
                            type="number"
                            name="volumeTarget"
                            value={formData.volumeTarget}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>

                    {/* Min Volume (Calculated) */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-blue-400 mb-2">Min Volume (Target / 2)</label>
                        <input
                            type="number"
                            value={minVolume}
                            readOnly
                            className="input-field bg-blue-900/20 border-blue-500/50 text-blue-200 font-bold"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button type="submit" className="btn-primary w-full md:w-auto">
                        Submit Proposal
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SubmissionForm;
