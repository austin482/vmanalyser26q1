// API Service — uses relative /api path (works locally with `vercel dev` and on Vercel)
const API_BASE = '/api';

// ============================================
// OKR API
// ============================================

export async function fetchOKRs() {
    try {
        const response = await fetch(`${API_BASE}/okrs`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch OKRs:', error);
        throw error;
    }
}

export async function saveOKR(okr) {
    try {
        const response = await fetch(`${API_BASE}/okrs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(okr),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to save OKR:', error);
        throw error;
    }
}

export async function deleteOKR(id) {
    try {
        const response = await fetch(`${API_BASE}/okrs/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to delete OKR:', error);
        throw error;
    }
}

// ============================================
// VM API
// ============================================

export async function fetchVMs() {
    try {
        const response = await fetch(`${API_BASE}/vms`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch VMs:', error);
        throw error;
    }
}

export async function saveVM(vm) {
    try {
        const response = await fetch(`${API_BASE}/vms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vm),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to save VM:', error);
        throw error;
    }
}

export async function deleteVM(id) {
    try {
        const response = await fetch(`${API_BASE}/vms/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to delete VM:', error);
        throw error;
    }
}
