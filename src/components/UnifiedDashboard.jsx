import React, { useState, useEffect } from 'react';
import { importOKRFromLark, importVMFromLark } from '../services/larkService';
import { fetchOKRs, saveOKR, deleteOKR as deleteOKRAPI, fetchVMs, saveVM, deleteVM as deleteVMAPI } from '../services/apiService';
import AnalysisModal from './AnalysisModal';
import ConfirmDialog from './ConfirmDialog';
import { analyzeComprehensive, toTOML } from '../services/analyzer';
import { makeDecision, decisionToTOML } from '../services/decisionMaker';

const UnifiedDashboard = () => {
    // Tab state
    const [activeTab, setActiveTab] = useState('okr'); // 'okr' or 'vm'

    // OKR state
    const [okrs, setOkrs] = useState([]);
    const [expandedOKR, setExpandedOKR] = useState(null);
    const [showOKRForm, setShowOKRForm] = useState(false);
    const [showOKRLarkModal, setShowOKRLarkModal] = useState(false);
    const [okrLarkUrl, setOkrLarkUrl] = useState('');
    const [isImportingOKR, setIsImportingOKR] = useState(false);

    // VM state
    const [vms, setVms] = useState([]);
    const [expandedVM, setExpandedVM] = useState(null);
    const [showVMForm, setShowVMForm] = useState(false);
    const [editingVM, setEditingVM] = useState(null); // VM being edited
    const [showVMLarkModal, setShowVMLarkModal] = useState(false);
    const [vmLarkUrl, setVmLarkUrl] = useState('');
    const [isImportingVM, setIsImportingVM] = useState(false);
    const [showAnalysisModal, setShowAnalysisModal] = useState(null); // Stores the analysis object to display
    const [analyzedVMId, setAnalyzedVMId] = useState(null); // Track which VM is being shown in modal
    const [analyzing, setAnalyzing] = useState(null); // VM ID being analyzed

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'okr'|'vm', id: string }

    // OKR form data
    const [okrData, setOkrData] = useState({
        quarter: '',
        buName: '',
        owners: '',
        objective: '',
        keyResults: []
    });

    // VM form data
    const [vmData, setVmData] = useState({
        metricName: '',
        description: '',
        selectedBU: '',
        selectedOKR: '',
        okrRationale: '',
        supportingDoc: null
    });

    // Loading state
    const [loading, setLoading] = useState(true);

    // Load data from database (with localStorage migration)
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                // Fetch from database
                const [dbOKRs, dbVMs] = await Promise.all([
                    fetchOKRs(),
                    fetchVMs()
                ]);

                // Check if we need to migrate from localStorage
                const localOKRs = JSON.parse(localStorage.getItem('austina_okrs') || '[]');
                const localVMs = JSON.parse(localStorage.getItem('austina_vms') || '[]');

                if (dbOKRs.length === 0 && localOKRs.length > 0) {
                    // Migrate OKRs from localStorage to database
                    console.log('📦 Migrating OKRs from localStorage to database...');
                    await Promise.all(localOKRs.map(okr => saveOKR(okr)));
                    localStorage.removeItem('austina_okrs');
                    console.log('✅ OKRs migrated');
                    // Reload from database
                    const migratedOKRs = await fetchOKRs();
                    setOkrs(migratedOKRs);
                } else {
                    setOkrs(dbOKRs);
                }

                if (dbVMs.length === 0 && localVMs.length > 0) {
                    // Migrate VMs from localStorage to database
                    console.log('📦 Migrating VMs from localStorage to database...');
                    await Promise.all(localVMs.map(vm => saveVM(vm)));
                    localStorage.removeItem('austina_vms');
                    console.log('✅ VMs migrated');
                    // Reload from database
                    const migratedVMs = await fetchVMs();
                    setVms(migratedVMs);
                } else {
                    setVms(dbVMs);
                }

            } catch (error) {
                console.error('Failed to load data:', error);
                alert('⚠️ Failed to load data from database. Using localStorage as fallback.');
                // Fallback to localStorage
                const savedOKRs = JSON.parse(localStorage.getItem('austina_okrs') || '[]');
                const savedVMs = JSON.parse(localStorage.getItem('austina_vms') || '[]');
                setOkrs(savedOKRs);
                setVms(savedVMs);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    // OKR Handlers
    const handleOKRLarkImport = async () => {
        if (!okrLarkUrl.trim()) {
            alert('Please enter a Lark document URL');
            return;
        }

        setIsImportingOKR(true);
        try {
            const importedOKRs = await importOKRFromLark(okrLarkUrl); // Now returns array

            // Track which BUs were replaced vs added
            let replacedCount = 0;
            let addedCount = 0;

            // Start with existing OKRs
            let updatedOKRs = [...okrs];

            // For each imported OKR, replace if BU exists, otherwise add
            importedOKRs.forEach((importedOKR) => {
                const existingIndex = updatedOKRs.findIndex(okr => okr.buName === importedOKR.buName);

                const newOKR = {
                    ...importedOKR,
                    id: existingIndex >= 0 ? updatedOKRs[existingIndex].id : `${Date.now()}-${Math.random()}`,
                    createdAt: existingIndex >= 0 ? updatedOKRs[existingIndex].createdAt : new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (existingIndex >= 0) {
                    // Replace existing OKR for this BU
                    updatedOKRs[existingIndex] = newOKR;
                    replacedCount++;
                    console.log(`✅ Replaced OKR for BU: ${importedOKR.buName}`);
                } else {
                    // Add new OKR
                    updatedOKRs.push(newOKR);
                    addedCount++;
                    console.log(`✅ Added new OKR for BU: ${importedOKR.buName}`);
                }
            });

            setOkrs(updatedOKRs);
            localStorage.setItem('austina_okrs', JSON.stringify(updatedOKRs));

            setShowOKRLarkModal(false);
            setOkrLarkUrl('');

            // Show detailed success message
            let message = '✅ Successfully imported OKRs!\n\n';
            if (replacedCount > 0) {
                message += `📝 Replaced ${replacedCount} existing BU OKR(s)\n`;
            }
            if (addedCount > 0) {
                message += `➕ Added ${addedCount} new BU OKR(s)`;
            }
            alert(message);
        } catch (error) {
            console.error('Lark import error:', error);
            alert(`❌ Import failed: ${error.message}\n\nPlease check:\n1. URL is correct\n2. Document is accessible\n3. App has permissions\n4. Document has "BU Name:" headers for each BU`);
        } finally {
            setIsImportingOKR(false);
        }
    };

    const handleSaveOKR = async () => {
        if (!okrData.quarter || !okrData.buName || !okrData.objective) {
            alert('Please fill in all required fields (Quarter, BU Name, and Objective)');
            return;
        }

        if (!okrData.keyResults || okrData.keyResults.length === 0) {
            alert('Please add at least one Key Result');
            return;
        }

        // Validate each key result has required fields
        const invalidKR = okrData.keyResults.find(kr => !kr.category || !kr.ratio);
        if (invalidKR) {
            alert('Please fill in Category and Ratio for all Key Results');
            return;
        }

        const newOKR = {
            ...okrData,
            keyResults: okrData.keyResults || [], // Initialize empty array if not provided
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };

        // Save to database
        await saveOKR(newOKR);

        // Reload from database
        const refreshedOKRs = await fetchOKRs();
        setOkrs(refreshedOKRs);

        // Reset form
        setOkrData({
            quarter: '',
            buName: '',
            owners: '',
            objective: '',
            keyResults: []
        });
        setShowOKRForm(false);
        alert('✅ OKR saved successfully!');
    };

    const handleDeleteOKR = async (id) => {
        try {
            await deleteOKRAPI(id);
            const refreshedOKRs = await fetchOKRs();
            setOkrs(refreshedOKRs);
            alert('✅ OKR deleted successfully!');
        } catch (error) {
            console.error('Failed to delete OKR:', error);
            alert('❌ Failed to delete OKR');
        }
    };

    // VM Handlers
    const handleVMLarkImport = async () => {
        if (!vmLarkUrl.trim()) {
            alert('Please enter a Lark document URL');
            return;
        }

        setIsImportingVM(true);
        try {
            const importedData = await importVMFromLark(vmLarkUrl);

            // Create new VM with imported data
            const newVM = {
                ...importedData,
                id: Date.now().toString(),
                bu: importedData.selectedBU,  // Set BU from selectedBU
                createdAt: new Date().toISOString(),
                status: 'pending',
                supportingDoc: null
            };

            // Save to database
            await saveVM(newVM);

            // Reload from database
            const refreshedVMs = await fetchVMs();
            setVms(refreshedVMs);

            setShowVMLarkModal(false);
            setVmLarkUrl('');
            alert('✅ Successfully imported VM from Lark!');
        } catch (error) {
            console.error('Lark import error:', error);
            alert(`❌ Import failed: ${error.message}\n\nPlease check:\n1. URL is correct\n2. Document is accessible\n3. App has permissions\n4. Document contains required fields (Metric Name, Description, Business Unit)`);
        } finally {
            setIsImportingVM(false);
        }
    };

    const handleSaveVM = async () => {
        // Validation - BU is required, OKR is optional
        if (!vmData.metricName || !vmData.description || !vmData.selectedBU) {
            alert('Please fill in all required fields (Metric Name, Description, and Business Unit)');
            return;
        }

        // BU is always from selectedBU (which is required)
        const bu = vmData.selectedBU;

        let updatedVMs;
        if (editingVM) {
            // Update existing VM
            updatedVMs = vms.map(vm =>
                vm.id === editingVM.id
                    ? {
                        ...vm,
                        ...vmData,
                        bu: bu,
                        updatedAt: new Date().toISOString()
                    }
                    : vm
            );
        } else {
            // Create new VM
            const newVM = {
                id: Date.now().toString(),
                ...vmData,
                bu: bu,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            updatedVMs = [...vms, newVM];
        }

        // Save to database (works for both create and update)
        if (editingVM) {
            await saveVM(updatedVMs.find(vm => vm.id === editingVM.id));
        } else {
            await saveVM(updatedVMs[updatedVMs.length - 1]);
        }

        // Reload from database
        const refreshedVMs = await fetchVMs();
        setVms(refreshedVMs);

        // Reset form
        setVmData({
            metricName: '',
            description: '',
            selectedBU: '',
            selectedOKR: '',
            okrRationale: '',
            supportingDoc: null
        });
        setShowVMForm(false);
        setEditingVM(null);
        alert('✅ Value Metric saved successfully!');
    };

    const handleEditVM = (vm) => {
        setEditingVM(vm);
        setVmData({
            metricName: vm.metricName,
            description: vm.description,
            selectedOKR: vm.selectedOKR,
            okrRationale: vm.okrRationale || ''
        });
        setShowVMForm(true);
    };

    const handleDeleteVM = (id) => {
        setDeleteTarget({ type: 'vm', id });
        setShowDeleteConfirm(true);
    };

    // Confirm delete action
    const confirmDelete = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === 'okr') {
            const updatedOKRs = okrs.filter(okr => okr.id !== deleteTarget.id);
            setOkrs(updatedOKRs);
            localStorage.setItem('austina_okrs', JSON.stringify(updatedOKRs));
            setExpandedOKR(null);
        } else if (deleteTarget.type === 'vm') {
            const updatedVMs = vms.filter(vm => vm.id !== deleteTarget.id);
            setVms(updatedVMs);
            localStorage.setItem('austina_vms', JSON.stringify(updatedVMs));
            setExpandedVM(null);
        }

        setShowDeleteConfirm(false);
        setDeleteTarget(null);
    };

    const handleAnalyze = async (vm) => {
        console.log('handleAnalyze called with VM:', vm);

        // If VM already has analysis, convert objects to strings and show it
        if (vm.strategicCompassAnalysis) {
            const analysis = { ...vm.strategicCompassAnalysis };
            // Convert insight objects to strings for backward compatibility
            if (analysis.insights) {
                analysis.insights = analysis.insights.map(insight =>
                    typeof insight === 'object' && insight.text && insight.detail
                        ? `${insight.text} ${insight.detail}`
                        : typeof insight === 'object' && insight.title && insight.description
                            ? `${insight.title}: ${insight.description}`
                            : String(insight)
                );
            }
            // Convert improvement objects to strings
            if (analysis.improvements) {
                analysis.improvements = analysis.improvements.map(imp =>
                    typeof imp === 'object' && imp.title && imp.description
                        ? `${imp.title}: ${imp.description}`
                        : String(imp)
                );
            }
            setShowAnalysisModal(analysis);
            setAnalyzedVMId(vm.id);
            return;
        }

        // Check if VM is linked to an OKR
        if (!vm.selectedOKR) {
            alert('Please link this VM to an OKR Key Result first by editing it.');
            return;
        }

        setAnalyzing(vm.id);
        try {
            // Parse the OKR ID from selectedOKR format: "okr-id-kr-id"
            const parts = vm.selectedOKR.split('-');
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
                score: decision.decision.final_score,
                // Convert insight objects to strings for AnalysisModal
                insights: analyzerReport.overall_insights.map(insight =>
                    typeof insight === 'object' && insight.text && insight.detail
                        ? `${insight.text} ${insight.detail}`
                        : String(insight)
                ),
                suggestions: analyzerReport.red_flags
                    .filter(f => f !== "None identified")
                    .slice(0, 1),
                timestamp: new Date().toISOString(),
                analyzerReport,
                decisionReport: decision,
                tomlOutput: combinedTOML
            };

            // Update VM with analysis results
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

            // Show the analysis modal
            setShowAnalysisModal(combinedAnalysis);
            setAnalyzedVMId(vm.id);
        } catch (error) {
            console.error('Analysis error:', error);
            alert('Analysis failed. Please try again.');
        } finally {
            setAnalyzing(null);
        }
    };

    const handleAnalysisComplete = (vmId, analysis) => {
        const updatedVMs = vms.map(vm =>
            vm.id === vmId ? { ...vm, analysis, status: 'analyzed' } : vm
        );
        setVms(updatedVMs);
        localStorage.setItem('austina_vms', JSON.stringify(updatedVMs));
        setShowAnalysisModal(false);
    };

    // Group OKRs by BU
    const okrsByBU = okrs.reduce((acc, okr) => {
        if (!acc[okr.buName]) {
            acc[okr.buName] = [];
        }
        acc[okr.buName].push(okr);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Header */}
            <nav className="border-b border-stone-200 bg-white sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                <span className="font-bold text-white text-xl">A</span>
                            </div>
                            <span className="font-bold text-2xl text-stone-900 tracking-tight">Austina</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-stone-200 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('okr')}
                            className={`px-4 py-4 font-semibold border-b-2 transition-colors ${activeTab === 'okr'
                                ? 'border-amber-600 text-amber-600'
                                : 'border-transparent text-stone-600 hover:text-stone-900'
                                }`}
                        >
                            🎯 OKR Management
                        </button>
                        <button
                            onClick={() => setActiveTab('vm')}
                            className={`px-4 py-4 font-semibold border-b-2 transition-colors ${activeTab === 'vm'
                                ? 'border-amber-600 text-amber-600'
                                : 'border-transparent text-stone-600 hover:text-stone-900'
                                }`}
                        >
                            📊 Value Metrics
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'okr' && (
                    <div>
                        {/* OKR Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-stone-900">OKR Management</h1>
                                <p className="text-stone-600 mt-1">Manage your Objectives and Key Results</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowOKRLarkModal(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-lg transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                    </svg>
                                    Import from Lark
                                </button>
                                <button
                                    onClick={() => setShowOKRForm(!showOKRForm)}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    {showOKRForm ? '✕ Cancel' : '+ Create New OKR'}
                                </button>
                            </div>
                        </div>

                        {/* OKR Form (inline) */}
                        {showOKRForm && (
                            <div className="bg-white rounded-xl p-6 border border-stone-200 mb-6 shadow-sm">
                                <h2 className="text-xl font-bold text-stone-900 mb-4">Create New OKR</h2>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-2">Quarter *</label>
                                            <input
                                                type="text"
                                                value={okrData.quarter}
                                                onChange={(e) => setOkrData({ ...okrData, quarter: e.target.value })}
                                                placeholder="e.g., 2026 Q1"
                                                className="w-full px-4 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-2">BU Name *</label>
                                            <input
                                                type="text"
                                                value={okrData.buName}
                                                onChange={(e) => setOkrData({ ...okrData, buName: e.target.value })}
                                                placeholder="e.g., JS Product"
                                                className="w-full px-4 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">Owners</label>
                                        <input
                                            type="text"
                                            value={okrData.owners}
                                            onChange={(e) => setOkrData({ ...okrData, owners: e.target.value })}
                                            placeholder="e.g., John, Jane"
                                            className="w-full px-4 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">Objective *</label>
                                        <input
                                            type="text"
                                            value={okrData.objective}
                                            onChange={(e) => setOkrData({ ...okrData, objective: e.target.value })}
                                            placeholder="e.g., Increase user engagement"
                                            className="w-full px-4 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>


                                    {/* Key Results Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm font-medium text-stone-700">Key Results *</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newKR = {
                                                        id: Date.now().toString(),
                                                        category: '',
                                                        ratio: '',
                                                        target: '',
                                                        metrics: []
                                                    };
                                                    setOkrData({ ...okrData, keyResults: [...(okrData.keyResults || []), newKR] });
                                                }}
                                                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                                            >
                                                + Add Key Result
                                            </button>
                                        </div>

                                        {okrData.keyResults && okrData.keyResults.length > 0 ? (
                                            <div className="space-y-3">
                                                {okrData.keyResults.map((kr, index) => (
                                                    <div key={kr.id} className="bg-stone-50 rounded-lg p-4 space-y-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-medium text-stone-700">Key Result #{index + 1}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updated = okrData.keyResults.filter((_, i) => i !== index);
                                                                    setOkrData({ ...okrData, keyResults: updated });
                                                                }}
                                                                className="text-red-600 hover:text-red-700 text-sm"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-medium text-stone-600 mb-1">Category *</label>
                                                                <input
                                                                    type="text"
                                                                    value={kr.category}
                                                                    onChange={(e) => {
                                                                        const updated = [...okrData.keyResults];
                                                                        updated[index].category = e.target.value;
                                                                        setOkrData({ ...okrData, keyResults: updated });
                                                                    }}
                                                                    placeholder="e.g., User Acquisition"
                                                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-stone-600 mb-1">Ratio/Weight *</label>
                                                                <input
                                                                    type="text"
                                                                    value={kr.ratio}
                                                                    onChange={(e) => {
                                                                        const updated = [...okrData.keyResults];
                                                                        updated[index].ratio = e.target.value;
                                                                        setOkrData({ ...okrData, keyResults: updated });
                                                                    }}
                                                                    placeholder="e.g., 40%"
                                                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-medium text-stone-600 mb-1">Target (Optional)</label>
                                                            <input
                                                                type="text"
                                                                value={kr.target || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...okrData.keyResults];
                                                                    updated[index].target = e.target.value;
                                                                    setOkrData({ ...okrData, keyResults: updated });
                                                                }}
                                                                placeholder="e.g., Increase by 25%"
                                                                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                                <p className="text-sm text-amber-800">
                                                    Click "+ Add Key Result" to add at least one key result to your OKR.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setShowOKRForm(false)}
                                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveOKR}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                                    >
                                        Save OKR
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* OKR List grouped by BU */}
                        <div className="space-y-6">
                            {Object.keys(okrsByBU).length === 0 ? (
                                <div className="bg-white rounded-xl p-12 border border-stone-200 text-center">
                                    <div className="text-6xl mb-4">🎯</div>
                                    <h3 className="text-xl font-semibold text-stone-900 mb-2">No OKRs Yet</h3>
                                    <p className="text-stone-600 mb-4">Create your first OKR or import from Lark</p>
                                </div>
                            ) : (
                                Object.entries(okrsByBU).map(([buName, buOKRs]) => (
                                    <div key={buName} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                                        {/* BU Name as Large Clickable Title */}
                                        <button
                                            onClick={() => setExpandedOKR(expandedOKR === buName ? null : buName)}
                                            className="w-full px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors text-left"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-stone-900">{buName}</h2>
                                                    <p className="text-sm text-stone-600 mt-1">
                                                        {buOKRs.length} OKR{buOKRs.length !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                                <svg
                                                    className={`w-6 h-6 text-stone-600 transition-transform ${expandedOKR === buName ? 'rotate-180' : ''
                                                        }`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>

                                        {/* Expanded OKR Details */}
                                        {expandedOKR === buName && (
                                            <div className="p-6 border-t border-stone-200 space-y-4">
                                                {buOKRs.map(okr => (
                                                    <div key={okr.id} className="bg-stone-50 rounded-lg p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <div className="text-sm text-stone-600 mb-1">{okr.quarter}</div>
                                                                <h3 className="text-lg font-semibold text-stone-900">{okr.objective}</h3>
                                                                {okr.owners && (
                                                                    <div className="text-sm text-stone-600 mt-1">Owners: {okr.owners}</div>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteOKR(okr.id);
                                                                }}
                                                                className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>

                                                        {/* Key Results */}
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium text-stone-900 text-sm">Key Results:</h4>
                                                            {okr.keyResults && okr.keyResults.length > 0 ? (
                                                                okr.keyResults.map((kr, idx) => (
                                                                    <div key={idx} className="bg-white rounded p-3 text-sm">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="font-medium text-stone-900">{kr.category}</span>
                                                                            <span className="text-amber-600 font-semibold">{kr.ratio}</span>
                                                                        </div>
                                                                        {kr.target && (
                                                                            <div className="text-stone-600 text-xs">Target: {kr.target}</div>
                                                                        )}
                                                                        {kr.metrics && kr.metrics.length > 0 && (
                                                                            <div className="mt-2 space-y-1">
                                                                                {kr.metrics.map((metric, mIdx) => (
                                                                                    <div key={mIdx} className="text-xs text-stone-600 pl-3 border-l-2 border-amber-300">
                                                                                        {metric}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                                                    <p className="text-sm text-amber-800">
                                                                        No Key Results defined. Use "Import from Lark" or edit this OKR to add Key Results.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'vm' && (
                    <div>
                        {/* VM Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-stone-900">Value Metrics</h1>
                                <p className="text-stone-600 mt-1">Track and analyze your value metrics</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowVMLarkModal(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-lg transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                    </svg>
                                    Import from Lark
                                </button>
                                <button
                                    onClick={() => setShowVMForm(!showVMForm)}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    {showVMForm ? '✕ Cancel' : '+ Create New VM'}
                                </button>
                            </div>
                        </div>

                        {/* VM Form (inline) */}
                        {showVMForm && (
                            <div className="bg-white rounded-xl p-6 border border-stone-200 mb-6 shadow-sm">
                                <h2 className="text-xl font-bold text-stone-900 mb-4">{editingVM ? 'Edit Value Metric' : 'Create New Value Metric'}</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">Metric Name *</label>
                                        <input
                                            type="text"
                                            value={vmData.metricName}
                                            onChange={(e) => setVmData({ ...vmData, metricName: e.target.value })}
                                            placeholder="e.g., Search Job by Public Transport"
                                            className="w-full px-4 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">Description *</label>
                                        <textarea
                                            value={vmData.description}
                                            onChange={(e) => setVmData({ ...vmData, description: e.target.value })}
                                            placeholder="Describe what this feature does and why it matters..."
                                            rows={3}
                                            className="w-full px-4 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    {/* Business Unit Selection - PRIMARY */}
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">Business Unit *</label>
                                        <select
                                            value={vmData.selectedBU || ''}
                                            onChange={(e) => {
                                                setVmData({ ...vmData, selectedBU: e.target.value, selectedOKR: '' });
                                            }}
                                            className="w-full px-4 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="">Select a Business Unit</option>
                                            {[...new Set(okrs.map(okr => okr.buName))].map((buName) => (
                                                <option key={buName} value={buName}>
                                                    {buName}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-stone-500 mt-1">
                                            💡 VM will be analyzed against all KRs in this BU by default
                                        </p>
                                    </div>

                                    {/* Optional: Specific Key Result */}
                                    {vmData.selectedBU && (
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                                Specific Key Result <span className="text-stone-500">(Optional - for advanced targeting)</span>
                                            </label>
                                            <select
                                                value={vmData.selectedOKR || ''}
                                                onChange={(e) => setVmData({ ...vmData, selectedOKR: e.target.value })}
                                                className="w-full px-4 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            >
                                                <option value="">None - analyze against all {vmData.selectedBU} KRs</option>
                                                {okrs
                                                    .filter(okr => okr.buName === vmData.selectedBU)
                                                    .map((okr) => (
                                                        <optgroup key={okr.id} label={`${okr.quarter} - ${okr.objective}`}>
                                                            {okr.keyResults && okr.keyResults.map((kr) => (
                                                                <option key={`${okr.id}-${kr.id}`} value={`${okr.id}-${kr.id}`}>
                                                                    {kr.category} ({kr.ratio})
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                            </select>
                                            <p className="text-xs text-stone-500 mt-1">
                                                ℹ️ Only select if you want to target a specific KR
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">OKR Rationale (Optional)</label>
                                        <textarea
                                            value={vmData.okrRationale}
                                            onChange={(e) => setVmData({ ...vmData, okrRationale: e.target.value })}
                                            placeholder="Explain how this metric impacts the selected Key Result..."
                                            rows={2}
                                            className="w-full px-4 py-2 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setShowVMForm(false);
                                            setEditingVM(null);
                                            setVmData({
                                                metricName: '',
                                                description: '',
                                                selectedOKR: '',
                                                okrRationale: ''
                                            });
                                        }}
                                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveVM}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                                    >
                                        {editingVM ? 'Update VM' : 'Save VM'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* VM List */}
                        <div className="space-y-4">
                            {vms.length === 0 ? (
                                <div className="bg-white rounded-xl p-12 border border-stone-200 text-center">
                                    <div className="text-6xl mb-4">📊</div>
                                    <h3 className="text-xl font-semibold text-stone-900 mb-2">No Value Metrics Yet</h3>
                                    <p className="text-stone-600 mb-4">Create your first VM or import from Lark</p>
                                </div>
                            ) : (
                                vms.map(vm => (
                                    <div key={vm.id} className="bg-white rounded-xl border border-stone-200 p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-stone-900 mb-2">{vm.metricName}</h3>
                                                <p className="text-stone-600 text-sm mb-3">{vm.description}</p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="text-stone-600">BU: <span className="font-medium text-stone-900">{vm.bu}</span></span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${vm.status === 'analyzed'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {vm.status === 'analyzed' ? '✓ Analyzed' : '⏳ Pending Analysis'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {vm.strategicCompassAnalysis ? (
                                                    <button
                                                        onClick={() => handleAnalyze(vm)}
                                                        disabled={analyzing === vm.id}
                                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm rounded-lg font-medium transition-all flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        View Results
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAnalyze(vm)}
                                                        disabled={analyzing === vm.id}
                                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg font-medium disabled:opacity-50"
                                                    >
                                                        {analyzing === vm.id ? '⏳ Analyzing...' : '🔍 Analyze'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditVM(vm);
                                                    }}
                                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteVM(vm.id);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        {/* Show analysis if available */}
                                        {vm.analysis && (
                                            <div className="mt-4 pt-4 border-t border-stone-200">
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <div className="text-stone-600 mb-1">Strategic Alignment</div>
                                                        <div className="text-2xl font-bold text-amber-600">
                                                            {vm.analysis.strategicAlignment || 'N/A'}%
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-stone-600 mb-1">Business Impact</div>
                                                        <div className="text-2xl font-bold text-blue-600">
                                                            {vm.analysis.businessImpact || 'N/A'}%
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-stone-600 mb-1">Final Score</div>
                                                        <div className="text-2xl font-bold text-green-600">
                                                            {vm.analysis.finalScore || 'N/A'}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
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

            {/* Analysis Modal */}
            {showAnalysisModal && (
                <AnalysisModal
                    analysis={showAnalysisModal}
                    onClose={() => {
                        setShowAnalysisModal(null);
                        setAnalyzedVMId(null);
                    }}
                    onReanalyze={async () => {
                        // Find the VM by the tracked ID
                        const vmToReanalyze = vms.find(vm => vm.id === analyzedVMId);

                        if (vmToReanalyze) {
                            // Close modal immediately
                            setShowAnalysisModal(null);
                            setAnalyzedVMId(null);

                            // Clear existing analysis
                            const updatedVMs = vms.map(v =>
                                v.id === vmToReanalyze.id
                                    ? { ...v, strategicCompassAnalysis: null, status: 'pending' }
                                    : v
                            );
                            setVms(updatedVMs);
                            localStorage.setItem('austina_vms', JSON.stringify(updatedVMs));

                            // Trigger new analysis after a short delay to ensure state updates
                            setTimeout(async () => {
                                await handleAnalyze(vmToReanalyze);
                            }, 100);
                        } else {
                            alert('Error: Could not find the VM to re-analyze.');
                        }
                    }}
                    isReanalyzing={analyzing !== null}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Confirm Delete"
                message={`Are you sure you want to delete this ${deleteTarget?.type === 'okr' ? 'OKR' : 'Value Metric'}? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                }}
            />
        </div>
    );
};

export default UnifiedDashboard;
