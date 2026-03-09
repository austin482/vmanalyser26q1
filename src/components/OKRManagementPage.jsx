import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TOML from 'toml';

const OKRManagementPage = () => {
    const [activeTab, setActiveTab] = useState('view'); // 'view' or 'upload'
    const [savedOKRs, setSavedOKRs] = useState([]);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [okrData, setOkrData] = useState({
        quarter: '',
        buName: '',
        owners: '',
        objective: '',
        keyResults: []
    });

    useEffect(() => {
        loadOKRs();
    }, []);

    const loadOKRs = () => {
        const okrs = JSON.parse(localStorage.getItem('austina_okrs') || '[]');

        // Migration: Add IDs to OKRs that don't have them
        const okrsWithIds = okrs.map(okr => {
            if (!okr.id) {
                return { ...okr, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
            }
            return okr;
        });

        // Save back if we added any IDs
        if (okrsWithIds.some((okr, i) => okr.id !== okrs[i]?.id)) {
            localStorage.setItem('austina_okrs', JSON.stringify(okrsWithIds));
        }

        setSavedOKRs(okrsWithIds);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const imageData = event.target.result;

            // Show image immediately
            setUploadedImage(imageData);
            setIsExtracting(true);

            try {
                // Use OpenRouter API with GPT-4 Vision for accurate OCR
                const base64Image = imageData.split(',')[1];
                console.log('📸 Starting OCR extraction with OpenRouter...');

                // Create timeout promise (20 seconds for vision models)
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout after 20 seconds')), 20000)
                );

                const fetchPromise = fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer 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',
                        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://austina.app',
                        'X-Title': 'Austina OKR Extractor'
                    },
                    body: JSON.stringify({
                        model: 'openai/gpt-4o',
                        messages: [{
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `Extract OKR data from this image. Return ONLY valid TOML format:

quarter = "Q4 W1"
buName = "My Talent Pool"
owners = "Afin, Chin Hui"
objective = "Main objective text"

[[keyResults]]
id = "1"
category = "Positive Result"
pic = "Nikki"
ratio = "50%"
target = "W Oct: 500 points, W Nov: 2,000 points, W Dec: 5,000 points"
projection = ""
metrics = ["Metric 1", "Metric 2"]

IMPORTANT:
- Extract ALL Key Results from the image
- For each KR, use [[keyResults]] for array of tables
- Extract ALL metrics listed (bullet points) as array
- Keep metric text EXACTLY as shown
- If a field is not visible, use empty string ""
- Return ONLY the TOML format, no markdown, no code blocks`
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${file.type};base64,${base64Image}`
                                    }
                                }
                            ]
                        }],
                        temperature: 0.1,
                        max_tokens: 2000
                    })
                });

                const response = await Promise.race([fetchPromise, timeoutPromise]);
                console.log('📡 Response status:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ API Error:', errorText);
                    throw new Error(`OpenRouter API error: ${response.status}`);
                }

                const data = await response.json();
                console.log('📄 Raw response:', data);

                const extractedText = data.choices[0].message.content;
                console.log('📝 Extracted text:', extractedText);

                // Extract TOML from response (remove markdown code blocks if present)
                let tomlText = extractedText.trim();

                // Remove markdown code blocks if present
                if (tomlText.startsWith('```toml')) {
                    tomlText = tomlText.replace(/```toml\n?/, '').replace(/```$/, '').trim();
                } else if (tomlText.startsWith('```')) {
                    tomlText = tomlText.replace(/```\n?/, '').replace(/```$/, '').trim();
                }

                console.log('📝 Cleaned TOML text:', tomlText);

                const extractedData = TOML.parse(tomlText);
                console.log('✅ Parsed data:', extractedData);

                setOkrData(extractedData);
                setIsExtracting(false);

            } catch (error) {
                console.error('❌ OCR extraction failed:', error.message);
                console.log('⚠️ Falling back to manual entry mode');

                // Check if it's a quota error
                const isQuotaError = error.message.includes('quota') || error.message.includes('429');
                const errorMsg = isQuotaError
                    ? 'API quota exceeded. Please fill in the form manually using the image as reference.'
                    : `OCR extraction failed: ${error.message}\n\nPlease fill in the form manually using the image as reference.`;

                // Fallback: Initialize with empty structure for manual entry
                setOkrData({
                    quarter: '',
                    buName: '',
                    owners: '',
                    objective: '',
                    keyResults: [
                        {
                            id: '1',
                            category: '',
                            pic: '',
                            ratio: '',
                            target: '',
                            projection: '',
                            metrics: ['']
                        }
                    ]
                });
                setIsExtracting(false);
                alert(errorMsg);
            }
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
                    ? { ...kr, metrics: kr.metrics.map((m, i) => (i === metricIndex ? value : m)) }
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
        const existingOKRs = JSON.parse(localStorage.getItem('austina_okrs') || '[]');

        const isDuplicate = existingOKRs.some(okr =>
            okr.quarter === okrData.quarter &&
            okr.buName === okrData.buName &&
            okr.objective === okrData.objective
        );

        if (isDuplicate) {
            const confirmOverwrite = window.confirm(
                `An OKR with the same Quarter (${okrData.quarter}), BU (${okrData.buName}), and Objective already exists.\n\nDo you want to overwrite it?`
            );

            if (!confirmOverwrite) return;

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
        setOkrData({
            quarter: '',
            buName: '',
            owners: '',
            objective: '',
            keyResults: []
        });
        setUploadedImage(null);
        loadOKRs();
        setActiveTab('view');
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this OKR?')) {
            const updatedOKRs = savedOKRs.filter(okr => okr.id !== id);
            localStorage.setItem('austina_okrs', JSON.stringify(updatedOKRs));
            setSavedOKRs(updatedOKRs);
        }
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
                                className="px-4 py-2 text-amber-600 font-medium"
                            >
                                🎯 OKR
                            </Link>
                            <Link
                                to="/vm"
                                className="px-4 py-2 text-stone-600 hover:text-amber-600 transition-colors"
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
                    <h1 className="text-4xl font-bold text-stone-900 mb-2">OKR Management</h1>
                    <p className="text-stone-600">View and manage your Objectives and Key Results</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('view')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'view'
                            ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-500 ring-offset-2'
                            : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                            }`}
                    >
                        📋 View OKRs
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'upload'
                            ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-500 ring-offset-2'
                            : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                            }`}
                    >
                        📸 Upload New OKR
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'view' ? (
                    // View OKRs Tab
                    savedOKRs.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center shadow-sm">
                            <div className="text-6xl mb-4">🎯</div>
                            <h2 className="text-2xl font-semibold text-stone-900 mb-2">No OKRs Yet</h2>
                            <p className="text-stone-600 mb-6">Upload your first OKR to get started</p>
                            <button
                                onClick={() => setActiveTab('upload')}
                                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-md"
                            >
                                📸 Upload OKR
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {savedOKRs.map((okr) => (
                                <div key={okr.id} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200">
                                                    {okr.quarter}
                                                </span>
                                                <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm font-medium border border-stone-200">
                                                    {okr.buName}
                                                </span>
                                            </div>
                                            <Link
                                                to={`/okr/${okr.id}`}
                                                className="text-xl font-bold text-stone-900 hover:text-amber-600 transition-colors cursor-pointer mb-3 block"
                                            >
                                                {okr.objective}
                                            </Link>
                                            <div className="space-y-2">
                                                {okr.keyResults.map((kr) => (
                                                    <div key={kr.id} className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-amber-700 font-medium">{kr.category}</span>
                                                            <span className="text-stone-500 text-sm">({kr.ratio})</span>
                                                        </div>
                                                        <div className="text-sm text-stone-600">
                                                            Target: {kr.target}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDelete(okr.id);
                                            }}
                                            type="button"
                                            className="ml-4 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-100"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    // Upload New OKR Tab (reusing existing upload form logic)
                    <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
                        <h2 className="text-2xl font-semibold text-stone-900 mb-4">📸 Upload OKR Screenshot</h2>

                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-amber-300 bg-amber-50/30 rounded-xl cursor-pointer hover:bg-amber-50 transition-all mb-6">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-12 h-12 mb-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="mb-2 text-sm text-stone-600">
                                    <span className="font-semibold text-amber-600">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-stone-500">PNG, JPG or JPEG</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>

                        {uploadedImage && (
                            <div className="mb-4">
                                <img src={uploadedImage} alt="Uploaded OKR" className="max-w-full rounded-lg border border-stone-200 shadow-sm" />
                            </div>
                        )}

                        {isExtracting && (
                            <div className="mb-4 flex items-center justify-center gap-3 text-amber-600">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                                <span>Extracting data from image...</span>
                            </div>
                        )}

                        {okrData.keyResults.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold text-stone-900 mb-4">✏️ Edit Extracted Data</h3>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">Quarter</label>
                                        <input
                                            type="text"
                                            value={okrData.quarter}
                                            onChange={(e) => handleBasicInfoChange('quarter', e.target.value)}
                                            className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">BU Name</label>
                                        <input
                                            type="text"
                                            value={okrData.buName}
                                            onChange={(e) => handleBasicInfoChange('buName', e.target.value)}
                                            className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">Owners</label>
                                        <input
                                            type="text"
                                            value={okrData.owners}
                                            onChange={(e) => handleBasicInfoChange('owners', e.target.value)}
                                            className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">Objective</label>
                                        <input
                                            type="text"
                                            value={okrData.objective}
                                            onChange={(e) => handleBasicInfoChange('objective', e.target.value)}
                                            className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={() => {
                                            setOkrData({ quarter: '', buName: '', owners: '', objective: '', keyResults: [] });
                                            setUploadedImage(null);
                                        }}
                                        className="px-6 py-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-md"
                                    >
                                        💾 Save OKR
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OKRManagementPage;
