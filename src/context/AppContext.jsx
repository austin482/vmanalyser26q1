import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(null); // null, 'member', 'manager'
    const [currentUser, setCurrentUser] = useState('');

    // Sources Data (Editable)
    const [sources, setSources] = useState({
        weeks: [
            { id: '1', startDate: '2023-11-20', endDate: '2023-11-26', name: 'Week 01' },
            { id: '2', startDate: '2023-11-27', endDate: '2023-12-03', name: 'Week 02' },
        ],
        humanCosts: [
            { id: '1', name: 'Alice', cost: 500 },
            { id: '2', name: 'Bob', cost: 600 },
            { id: '3', name: 'Charlie', cost: 550 },
        ],
        pkrs: [
            { id: '1', name: 'Alice', pkr: 'Increase Brand Awareness' },
            { id: '2', name: 'Bob', pkr: 'Drive Sales' },
        ],
        platforms: [
            { id: '1', name: 'Alice', platform: 'Maukerja' },
            { id: '2', name: 'Bob', platform: 'Ricebowl' },
        ]
    });

    const updateSource = (type, id, updates) => {
        setSources(prev => ({
            ...prev,
            [type]: prev[type].map(item => item.id === id ? { ...item, ...updates } : item)
        }));
    };

    const addSource = (type, item) => {
        setSources(prev => ({
            ...prev,
            [type]: [...prev[type], { ...item, id: Date.now().toString() }]
        }));
    };

    const deleteSource = (type, id) => {
        setSources(prev => ({
            ...prev,
            [type]: prev[type].filter(item => item.id !== id)
        }));
    };

    // Campaign Data
    const [campaigns, setCampaigns] = useState([
        {
            id: '1',
            status: 'APPROVED',
            submissionDate: '2023-11-15',
            memberId: 'Alice',
            name: 'Alice',
            startTrack: '2023-11-20',
            description: 'Black Friday Sale',
            conversionRateBaseline: 2.5,
            conversionRateTarget: 3.0,
            budgetProposed: 1000,
            budgetPrevious: 800,
            volumeBaseline: 500,
            volumeTarget: 600,
            minVolume: 300,
            humanCostPrevious: 500,
            humanCostCurrent: 500,
            conversionRateResult: 0,
            volumeResult: 0,
            pkrResult: 0,
        }
    ]);

    const addCampaign = (campaign) => {
        // Find current human cost
        const memberCost = sources.humanCosts.find(h => h.name === campaign.name)?.cost || 0;

        const newCampaign = {
            ...campaign,
            id: Date.now().toString(),
            status: 'PENDING',
            submissionDate: new Date().toISOString().split('T')[0],
            memberId: campaign.name, // Use selected name
            // Auto-calculate minVolume
            minVolume: campaign.volumeTarget / 2,
            // Auto-fill known data
            humanCostCurrent: memberCost,
        };
        setCampaigns([...campaigns, newCampaign]);
        console.log(`[Lark] New campaign submitted by ${campaign.name}`);
    };

    const updateCampaign = (id, updates) => {
        setCampaigns(campaigns.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const approveCampaign = (id) => {
        updateCampaign(id, { status: 'APPROVED' });
        console.log(`[Lark] Campaign ${id} approved`);
    };

    const rejectCampaign = (id, reason) => {
        updateCampaign(id, { status: 'REJECTED', rejectionReason: reason });
        console.log(`[Lark] Campaign ${id} rejected: ${reason}`);
    };

    const getHumanCost = (name) => sources.humanCosts.find(h => h.name === name)?.cost || 0;

    return (
        <AppContext.Provider value={{
            userRole,
            setUserRole,
            currentUser,
            setCurrentUser,
            campaigns,
            addCampaign,
            updateCampaign,
            approveCampaign,
            rejectCampaign,
            getHumanCost,
            sources,
            updateSource,
            addSource,
            deleteSource
        }}>
            {children}
        </AppContext.Provider>
    );
};
