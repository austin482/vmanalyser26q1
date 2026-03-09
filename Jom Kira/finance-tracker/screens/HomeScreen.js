import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { auth } from '../firebase.config';
import { signOut } from 'firebase/auth';
import { subscribeToTransactions } from '../services/transactionService';
import { calculateMonthlyTotals } from '../services/analyticsService';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryById } from '../utils/categories';

export default function HomeScreen({ navigation }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [monthlyTotals, setMonthlyTotals] = useState({
        income: 0,
        expense: 0,
        balance: 0,
    });

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const unsubscribe = subscribeToTransactions(userId, (data) => {
            setTransactions(data);
            const totals = calculateMonthlyTotals(data, currentYear, currentMonth);
            setMonthlyTotals(totals);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const recentTransactions = transactions.slice(0, 5);

    const formatCurrency = (amount) => {
        return `RM ${parseFloat(amount).toFixed(2)}`;
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
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
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello!</Text>
                        <Text style={styles.email}>{auth.currentUser?.email}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Monthly Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </Text>

                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>Current Balance</Text>
                        <Text style={[
                            styles.balanceAmount,
                            { color: monthlyTotals.balance >= 0 ? theme.colors.success : theme.colors.error }
                        ]}>
                            {formatCurrency(monthlyTotals.balance)}
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.colors.income + '20' }]}>
                                <Ionicons name="arrow-down" size={20} color={theme.colors.income} />
                            </View>
                            <Text style={styles.summaryLabel}>Income</Text>
                            <Text style={[styles.summaryValue, { color: theme.colors.income }]}>
                                {formatCurrency(monthlyTotals.income)}
                            </Text>
                        </View>

                        <View style={styles.summaryItem}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.colors.expense + '20' }]}>
                                <Ionicons name="arrow-up" size={20} color={theme.colors.expense} />
                            </View>
                            <Text style={styles.summaryLabel}>Expense</Text>
                            <Text style={[styles.summaryValue, { color: theme.colors.expense }]}>
                                {formatCurrency(monthlyTotals.expense)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.income }]}
                        onPress={() => navigation.navigate('AddTransaction', { type: 'income' })}
                    >
                        <Ionicons name="add-circle" size={24} color="white" />
                        <Text style={styles.actionButtonText}>Add Income</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.expense }]}
                        onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
                    >
                        <Ionicons name="remove-circle" size={24} color="white" />
                        <Text style={styles.actionButtonText}>Add Expense</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {recentTransactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color={theme.colors.textMuted} />
                            <Text style={styles.emptyStateText}>No transactions yet</Text>
                            <Text style={styles.emptyStateSubtext}>Start by adding your first transaction</Text>
                        </View>
                    ) : (
                        recentTransactions.map((transaction) => {
                            const category = getCategoryById(transaction.category, transaction.type);
                            return (
                                <TouchableOpacity
                                    key={transaction.id}
                                    style={styles.transactionCard}
                                    onPress={() => navigation.navigate('Transactions')}
                                >
                                    <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                                        <Ionicons name={category.icon} size={24} color={category.color} />
                                    </View>
                                    <View style={styles.transactionInfo}>
                                        <Text style={styles.transactionCategory}>{category.name}</Text>
                                        <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                                        {transaction.note ? (
                                            <Text style={styles.transactionNote} numberOfLines={1}>{transaction.note}</Text>
                                        ) : null}
                                    </View>
                                    <Text style={[
                                        styles.transactionAmount,
                                        { color: transaction.type === 'income' ? theme.colors.income : theme.colors.expense }
                                    ]}>
                                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
    },
    greeting: {
        fontSize: theme.fonts.sizes.xxl,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    email: {
        fontSize: theme.fonts.sizes.sm,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xs,
    },
    logoutButton: {
        padding: theme.spacing.sm,
    },
    summaryCard: {
        backgroundColor: theme.colors.primary,
        margin: theme.spacing.lg,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
        ...theme.shadows.lg,
    },
    summaryTitle: {
        fontSize: theme.fonts.sizes.md,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: theme.spacing.md,
    },
    balanceContainer: {
        marginBottom: theme.spacing.lg,
    },
    balanceLabel: {
        fontSize: theme.fonts.sizes.sm,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: theme.spacing.xs,
    },
    balanceAmount: {
        fontSize: theme.fonts.sizes.xxxl,
        fontWeight: 'bold',
        color: 'white',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    summaryLabel: {
        fontSize: theme.fonts.sizes.sm,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: theme.spacing.xs,
    },
    summaryValue: {
        fontSize: theme.fonts.sizes.lg,
        fontWeight: 'bold',
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        gap: theme.spacing.sm,
        ...theme.shadows.md,
    },
    actionButtonText: {
        color: 'white',
        fontSize: theme.fonts.sizes.md,
        fontWeight: '600',
    },
    section: {
        padding: theme.spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.fonts.sizes.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    seeAllText: {
        fontSize: theme.fonts.sizes.sm,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        padding: theme.spacing.xxl,
    },
    emptyStateText: {
        fontSize: theme.fonts.sizes.md,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.md,
        fontWeight: '600',
    },
    emptyStateSubtext: {
        fontSize: theme.fonts.sizes.sm,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xs,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.sm,
        ...theme.shadows.sm,
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
    transactionDate: {
        fontSize: theme.fonts.sizes.sm,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xs,
    },
    transactionNote: {
        fontSize: theme.fonts.sizes.xs,
        color: theme.colors.textLight,
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: theme.fonts.sizes.lg,
        fontWeight: 'bold',
    },
});
