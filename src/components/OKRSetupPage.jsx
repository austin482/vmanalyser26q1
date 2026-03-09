import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { importOKRFromLark } from '../services/larkService';

const OKRSetupPage = () => {
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [showLarkModal, setShowLarkModal] = useState(false);
    const [larkUrl, setLarkUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [okrData, setOkrData] = useState({
        quarter: '',
        buName: '',
        owners: '',
        objective: '',
        keyResults: []
    });

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            setUploadedImage(event.target.result);
            setIsExtracting(true);

            // TODO: Call AI API to extract data from image
            // For now, simulate extraction with mock data
            setTimeout(() => {
                setOkrData({
                    quarter: 'Q4 W1',
                    buName: 'JS Product',
                    owners: 'Jayden, Chin Hui',
                    objective: 'Happy Jobseeker Using MKRB',
                    keyResults: [
                        {
                            id: '1',
                            category: 'Positive Result',
                            pic: 'Esther',
                            ratio: '50%',
                            target: 'W Oct: 15k points, W Nov: 20k points, W Dec: 25k points',
                            projection: '10k',
                            metrics: [
                                'Number of jobseeker profiles being unlocked, paid',
                                'Number of jobseeker profiles being bookmark, saved, shortlist, hired by employer'
                            ]
                        },
                        {
                            id: '2',
                            category: 'Usage',
                            pic: '',
                            ratio: '25%',
                            target: 'W Oct: 90k points, W Nov: 110k points, W Dec: 130k points',
                            projection: '65k',
                            metrics: [
                                'Number of new users created (Non Mandarin) on MKRB web',
                                'Number of new users created (Mandarin) on MKRB web',
                                'Number of profiles updated (Non AI assist) on MKRB web',
                                'Number of profiles updated (AI assist) on MKRB web',
                                'Number of new drop resumes (Non Mandarin) on MKRB web',
                                'Number of new drop resumes (Mandarin) on MKRB web',
                                'Number of users with profiles score > 90%',
                                'Number of public users converted to register users',
                                'Number of new portfolio',
                                'Number of new endorsement',
                                'Number of new part timer profiles',
                                'Number of new Singapore ready for work profiles'
                            ]
                        }
                    ]
                });
                setIsExtracting(false);
            }, 2000);
        };
        reader.readAsDataURL(file);
    };

    const handleBasicInfoChange = (field, value) => {
        setOkrData(prev => ({ ...prev, [field]: value }));
    };

    const handleKeyResultChange = (id, field, value) => {
        setOkrData(prev => ({
            ...prev,
            keyResults: prev.keyResults.map(kr =>
                kr.id === id ? { ...kr, [field]: value } : kr
            )
        }));
    };

    const handleMetricChange = (krId, metricIndex, value) => {
        setOkrData(prev => ({
            ...prev,
            keyResults: prev.keyResults.map(kr =>
                kr.id === krId
                    ? {
                        ...kr,
                        metrics: kr.metrics.map((m, i) => (i === metricIndex ? value : m))
                    }
                    : kr
            )
        }));
    };

    const addMetric = (krId) => {
        setOkrData(prev => ({
            ...prev,
            keyResults: prev.keyResults.map(kr =>
                kr.id === krId ? { ...kr, metrics: [...kr.metrics, ''] } : kr
            )
        }));
    };

    const removeMetric = (krId, metricIndex) => {
        setOkrData(prev => ({
            ...prev,
            keyResults: prev.keyResults.map(kr =>
                kr.id === krId
                    ? { ...kr, metrics: kr.metrics.filter((_, i) => i !== metricIndex) }
                    : kr
            )
        }));
    };

    const addKeyResult = () => {
        const newKR = {
            id: Date.now().toString(),
            category: '',
            pic: '',
            ratio: '',
            target: '',
            projection: '',
            metrics: ['']
        };
        setOkrData(prev => ({
            ...prev,
            keyResults: [...prev.keyResults, newKR]
        }));
    };

    const removeKeyResult = (id) => {
        setOkrData(prev => ({
            ...prev,
            keyResults: prev.keyResults.filter(kr => kr.id !== id)
        }));
    };

    const handleSave = () => {
        // Save to localStorage
        const existingOKRs = JSON.parse(localStorage.getItem('austina_okrs') || '[]');

        // Check for duplicates (same quarter + BU + objective)
        const isDuplicate = existingOKRs.some(okr =>
            okr.quarter === okrData.quarter &&
            okr.buName === okrData.buName &&
            okr.objective === okrData.objective
        );

        if (isDuplicate) {
            const confirmOverwrite = window.confirm(
                `An OKR with the same Quarter (${okrData.quarter}), BU (${okrData.buName}), and Objective already exists.\n\nDo you want to overwrite it?`
            );

            if (!confirmOverwrite) {
                return; // User cancelled
            }

            // Remove the old duplicate
            const filteredOKRs = existingOKRs.filter(okr =>
                !(okr.quarter === okrData.quarter &&
                    okr.buName === okrData.buName &&
                    okr.objective === okrData.objective)
            );
            filteredOKRs.push({ ...okrData, id: Date.now().toString() });
            localStorage.setItem('austina_okrs', JSON.stringify(filteredOKRs));
        } else {
            existingOKRs.push({ ...okrData, id: Date.now().toString() });
            localStorage.setItem('austina_okrs', JSON.stringify(existingOKRs));
        }

        alert('OKR saved successfully!');
        // Reset form
        setOkrData({
            quarter: '',
            buName: '',
            owners: '',
            objective: '',
            keyResults: []
        });
        setUploadedImage(null);
    };

    const handleLarkImport = async () => {
        if (!larkUrl.trim()) {
            alert('Please enter a Lark document URL');
            return;
        }

        setIsImporting(true);
        try {
            const importedData = await importOKRFromLark(larkUrl);

            setOkrData({
                quarter: importedData.quarter || '',
                buName: importedData.buName || '',
                owners: '',
                objective: importedData.objective || '',
                keyResults: importedData.keyResults || []
            });

            setShowLarkModal(false);
            setLarkUrl('');
            alert('✅ Successfully imported OKR from Lark!');
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
                                + New VM
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">OKR Data Setup</h1>
                            <p className="text-gray-300">Upload a screenshot of your OKR from Lark Base, then edit as needed</p>
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

                    {/* Upload Section */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
                        <h2 className="text-2xl font-semibold text-white mb-4">📸 Upload OKR Screenshot</h2>

                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-purple-400 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-12 h-12 mb-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="mb-2 text-sm text-gray-300">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-400">PNG, JPG or JPEG</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>

                        {uploadedImage && (
                            <div className="mt-4">
                                <img src={uploadedImage} alt="Uploaded OKR" className="max-w-full rounded-lg border border-white/20" />
                            </div>
                        )}

                        {isExtracting && (
                            <div className="mt-4 flex items-center justify-center gap-3 text-purple-300">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                                <span>Extracting data from image...</span>
                            </div>
                        )}
                    </div>

                    {/* Editable Form */}
                    {okrData.keyResults.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                            <h2 className="text-2xl font-semibold text-white mb-6">✏️ Edit Extracted Data</h2>

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Quarter</label>
                                    <input
                                        type="text"
                                        value={okrData.quarter}
                                        onChange={(e) => handleBasicInfoChange('quarter', e.target.value)}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">BU Name</label>
                                    <input
                                        type="text"
                                        value={okrData.buName}
                                        onChange={(e) => handleBasicInfoChange('buName', e.target.value)}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Owners</label>
                                    <input
                                        type="text"
                                        value={okrData.owners}
                                        onChange={(e) => handleBasicInfoChange('owners', e.target.value)}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Objective</label>
                                    <input
                                        type="text"
                                        value={okrData.objective}
                                        onChange={(e) => handleBasicInfoChange('objective', e.target.value)}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Key Results */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-white">Key Results</h3>
                                    <button
                                        onClick={addKeyResult}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                    >
                                        + Add Key Result
                                    </button>
                                </div>

                                {okrData.keyResults.map((kr) => (
                                    <div key={kr.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-purple-300">Key Result</h4>
                                            <button
                                                onClick={() => removeKeyResult(kr.id)}
                                                className="text-red-400 hover:text-red-300 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                                <input
                                                    type="text"
                                                    value={kr.category}
                                                    onChange={(e) => handleKeyResultChange(kr.id, 'category', e.target.value)}
                                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">PIC</label>
                                                <input
                                                    type="text"
                                                    value={kr.pic}
                                                    onChange={(e) => handleKeyResultChange(kr.id, 'pic', e.target.value)}
                                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Ratio</label>
                                                <input
                                                    type="text"
                                                    value={kr.ratio}
                                                    onChange={(e) => handleKeyResultChange(kr.id, 'ratio', e.target.value)}
                                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Projection</label>
                                                <input
                                                    type="text"
                                                    value={kr.projection}
                                                    onChange={(e) => handleKeyResultChange(kr.id, 'projection', e.target.value)}
                                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Target</label>
                                            <input
                                                type="text"
                                                value={kr.target}
                                                onChange={(e) => handleKeyResultChange(kr.id, 'target', e.target.value)}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>

                                        {/* Metrics */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-300">Metrics</label>
                                                <button
                                                    onClick={() => addMetric(kr.id)}
                                                    className="text-sm text-purple-400 hover:text-purple-300"
                                                >
                                                    + Add Metric
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {kr.metrics.map((metric, idx) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={metric}
                                                            onChange={(e) => handleMetricChange(kr.id, idx, e.target.value)}
                                                            className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            placeholder="Enter metric description"
                                                        />
                                                        <button
                                                            onClick={() => removeMetric(kr.id, idx)}
                                                            className="px-3 py-2 text-red-400 hover:text-red-300"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Save Button */}
                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                                >
                                    💾 Save OKR Data
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Lark Import Modal */}
                {showLarkModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-lg w-full mx-4 border border-white/20 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-4">📄 Import OKR from Lark</h2>
                            <p className="text-gray-300 mb-6">Paste your Lark Wiki URL to automatically import BU and KR data</p>

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

export default OKRSetupPage;
