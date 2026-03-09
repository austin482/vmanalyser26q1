import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { auth } from '../firebase.config';
import { subscribeToTransactions, deleteTransaction } from '../services/transactionService';
import { getCategoryById } from '../utils/categories';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TransactionsScreen({ navigation }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, income, expense
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const unsubscribe = subscribeToTransactions(userId, (data) => {
            setTransactions(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = (transaction) => {
        Alert.alert(
            'Delete Transaction',
            'Are you sure you want to delete this transaction?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const userId = auth.currentUser?.uid;
                            await deleteTransaction(userId, transaction.id);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete transaction');
                        }
                    },
                },
            ]
        );
    };

    const formatCurrency = (amount) => {
        return `RM ${parseFloat(amount).toFixed(2)}`;
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-MY', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const filteredTransactions = transactions.filter(transaction => {
        if (filter === 'all') return true;
        return transaction.type === filter;
    });

    // Group transactions by date
    const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
        const date = new Date(transaction.date).toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
    }, {});

    const calculateTotal = (type) => {
        return filteredTransactions
            .filter(t => type === 'all' || t.type === type)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    };

    if (loading) {
        return (
            <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={globalStyles.container}>
            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
                        All
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'income' && styles.filterTabActive]}
                    onPress={() => setFilter('income')}
                >
                    <Text style={[styles.filterTabText, filter === 'income' && styles.filterTabTextActive]}>
                        Income
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'expense' && styles.filterTabActive]}
                    onPress={() => setFilter('expense')}
                >
                    <Text style={[styles.filterTabText, filter === 'expense' && styles.filterTabTextActive]}>
                        Expense
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.summary}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total</Text>
                    <Text style={styles.summaryValue}>
                        {formatCurrency(calculateTotal('all'))}
                    </Text>
                </View>
            </View>

            {/* Transactions List */}
            <ScrollView style={styles.scrollView}>
                {filteredTransactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color={theme.colors.textMuted} />
                        <Text style={styles.emptyStateText}>No transactions found</Text>
                        <TouchableOpacity
                            style={[globalStyles.button, { marginTop: theme.spacing.lg }]}
                            onPress={() => navigation.navigate('AddTransaction')}
                        >
                            <Text style={globalStyles.buttonText}>Add Transaction</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    Object.keys(groupedTransactions).map((date) => (
                        <View key={date} style={styles.dateGroup}>
                            <Text style={styles.dateHeader}>{date}</Text>
                            {groupedTransactions[date].map((transaction) => {
                                const category = getCategoryById(transaction.category, transaction.type);
                                return (
                                    <TouchableOpacity
                                        key={transaction.id}
                                        style={styles.transactionCard}
                                        onPress={() => navigation.navigate('AddTransaction', { transaction })}
                                        onLongPress={() => handleDelete(transaction)}
                                    >
                                        <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                                            <Ionicons name={category.icon} size={24} color={category.color} />
                                        </View>
                                        <View style={styles.transactionInfo}>
                                            <Text style={styles.transactionCategory}>{category.name}</Text>
                                            {transaction.note ? (
                                                <Text style={styles.transactionNote} numberOfLines={1}>
                                                    {transaction.note}
                                                </Text>
                                            ) : null}
                                        </View>
                                        <View style={styles.transactionRight}>
                                            <Text style={[
                                                styles.transactionAmount,
                                                { color: transaction.type === 'income' ? theme.colors.income : theme.colors.expense }
                                            ]}>
                                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDelete(transaction)}
                                            >
                                                <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Floating Add Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddTransaction')}
            >
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    filterContainer: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    filterTab: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    filterTabActive: {
        backgroundColor: theme.colors.primary,
    },
    filterTabText: {
        fontSize: theme.fonts.sizes.sm,
        fontWeight: '600',
        color: theme.colors.text,
    },
    filterTabTextActive: {
        color: 'white',
    },
    summary: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: theme.fonts.sizes.sm,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.xs,
    },
    summaryValue: {
        fontSize: theme.fonts.sizes.xxl,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    scrollView: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xxl,
        marginTop: theme.spacing.xxl,
    },
    emptyStateText: {
        fontSize: theme.fonts.sizes.md,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.md,
        fontWeight: '600',
    },
    dateGroup: {
        marginBottom: theme.spacing.md,
    },
    dateHeader: {
        fontSize: theme.fonts.sizes.sm,
        fontWeight: '600',
        color: theme.colors.textMuted,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionCategory: {
        fontSize: theme.fonts.sizes.md,
        fontWeight: '600',
        color: theme.colors.text,
    },
    transactionNote: {
        fontSize: theme.fonts.sizes.sm,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: theme.fonts.sizes.lg,
        fontWeight: 'bold',
        marginBottom: theme.spacing.xs,
    },
    deleteButton: {
        padding: theme.spacing.xs,
    },
    fab: {
        position: 'absolute',
        right: theme.spacing.lg,
        bottom: theme.spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.lg,
    },
});
