import { auth, database } from '../firebase.config';
import { ref, push, set, update, remove, onValue, query, orderByChild, equalTo } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSACTIONS_KEY = 'transactions';

// Get user's transactions reference
const getUserTransactionsRef = (userId) => {
    return ref(database, `transactions/${userId}`);
};

// Add a new transaction
export const addTransaction = async (userId, transactionData) => {
    try {
        const transactionsRef = getUserTransactionsRef(userId);
        const newTransactionRef = push(transactionsRef);

        const transaction = {
            ...transactionData,
            id: newTransactionRef.key,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await set(newTransactionRef, transaction);

        // Also save to local storage for offline support
        await saveToLocalStorage(userId, transaction);

        return transaction;
    } catch (error) {
        console.error('Error adding transaction:', error);
        throw error;
    }
};

// Update an existing transaction
export const updateTransaction = async (userId, transactionId, updates) => {
    try {
        const transactionRef = ref(database, `transactions/${userId}/${transactionId}`);
        const updatedData = {
            ...updates,
            updatedAt: Date.now(),
        };

        await update(transactionRef, updatedData);
        return updatedData;
    } catch (error) {
        console.error('Error updating transaction:', error);
        throw error;
    }
};

// Delete a transaction
export const deleteTransaction = async (userId, transactionId) => {
    try {
        const transactionRef = ref(database, `transactions/${userId}/${transactionId}`);
        await remove(transactionRef);
    } catch (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
};

// Listen to transactions in real-time
export const subscribeToTransactions = (userId, callback) => {
    const transactionsRef = getUserTransactionsRef(userId);

    const unsubscribe = onValue(transactionsRef, (snapshot) => {
        const transactions = [];
        snapshot.forEach((childSnapshot) => {
            transactions.push({
                id: childSnapshot.key,
                ...childSnapshot.val(),
            });
        });

        // Sort by date (newest first)
        transactions.sort((a, b) => b.date - a.date);

        callback(transactions);
    });

    return unsubscribe;
};

// Get transactions for a specific month
export const getTransactionsByMonth = (transactions, year, month) => {
    return transactions.filter(transaction => {
        const date = new Date(transaction.date);
        return date.getFullYear() === year && date.getMonth() === month;
    });
};

// Get transactions by category
export const getTransactionsByCategory = (transactions, categoryId) => {
    return transactions.filter(transaction => transaction.category === categoryId);
};

// Local storage helpers for offline support
const saveToLocalStorage = async (userId, transaction) => {
    try {
        const key = `${TRANSACTIONS_KEY}_${userId}`;
        const existing = await AsyncStorage.getItem(key);
        const transactions = existing ? JSON.parse(existing) : [];
        transactions.push(transaction);
        await AsyncStorage.setItem(key, JSON.stringify(transactions));
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
};

export const getLocalTransactions = async (userId) => {
    try {
        const key = `${TRANSACTIONS_KEY}_${userId}`;
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting local transactions:', error);
        return [];
    }
};
