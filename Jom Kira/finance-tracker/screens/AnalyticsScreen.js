import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { auth } from '../firebase.config';
import { subscribeToTransactions } from '../services/transactionService';
import {
    calculateMonthlyTotals,
    getCategoryBreakdown,
    getSpendingTrends,
    compareWithPreviousMonth,
} from '../services/analyticsService';
import { getCategoryById } from '../utils/categories';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const currentYear = selectedDate.getFullYear();
    const currentMonth = selectedDate.getMonth();

    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const unsubscribe = subscribeToTransactions(userId, (data) => {
            setTransactions(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatCurrency = (amount) => {
        return `RM ${parseFloat(amount).toFixed(2)}`;
    };

    const monthlyTotals = calculateMonthlyTotals(transactions, currentYear, currentMonth);
    const categoryBreakdown = getCategoryBreakdown(transactions, currentYear, currentMonth, 'expense');
    const spendingTrends = getSpendingTrends(transactions, 6);
    const comparison = compareWithPreviousMonth(transactions, currentYear, currentMonth);

    // Prepare pie chart data
    const pieChartData = categoryBreakdown.slice(0, 5).map((item) => {
        const category = getCategoryById(item.category, 'expense');
        return {
            name: category.name,
            amount: item.total,
            color: category.color,
            legendFontColor: theme.colors.text,
            legendFontSize: 12,
        };
    });

    // Prepare line chart data
    const lineChartData = {
        labels: spendingTrends.map(t => t.monthName),
        datasets: [
            {
                data: spendingTrends.map(t => t.expense),
                color: (opacity = 1) => theme.colors.expense,
                strokeWidth: 2,
            },
            {
                data: spendingTrends.map(t => t.income),
                color: (opacity = 1) => theme.colors.income,
                strokeWidth: 2,
            },
        ],
        legend: ['Expense', 'Income'],
    };

    const changeMonth = (direction) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setSelectedDate(newDate);
    };

    if (loading) {
        return (
            <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={globalStyles.container}>
            <View style={styles.content}>
                {/* Month Selector */}
                <View style={styles.monthSelector}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
                        <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.monthText}>
                        {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </Text>
                    <TouchableOpacity
                        onPress={() => changeMonth(1)}
                        style={styles.monthButton}
                        disabled={currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear()}
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color={currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear()
                                ? theme.colors.textMuted
                                : theme.colors.text
                            }
                        />
                    </TouchableOpacity>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryCards}>
                    <View style={[styles.summaryCard, { backgroundColor: theme.colors.income + '15' }]}>
                        <Ionicons name="arrow-down" size={24} color={theme.colors.income} />
                        <Text style={styles.summaryCardLabel}>Income</Text>
                        <Text style={[styles.summaryCardValue, { color: theme.colors.income }]}>
                            {formatCurrency(monthlyTotals.income)}
                        </Text>
                        {comparison.incomeChangePercent !== 0 && (
                            <Text style={styles.changeText}>
                                {comparison.incomeChangePercent > 0 ? '+' : ''}{comparison.incomeChangePercent}% from last month
                            </Text>
                        )}
                    </View>

                    <View style={[styles.summaryCard, { backgroundColor: theme.colors.expense + '15' }]}>
                        <Ionicons name="arrow-up" size={24} color={theme.colors.expense} />
                        <Text style={styles.summaryCardLabel}>Expense</Text>
                        <Text style={[styles.summaryCardValue, { color: theme.colors.expense }]}>
                            {formatCurrency(monthlyTotals.expense)}
                        </Text>
                        {comparison.expenseChangePercent !== 0 && (
                            <Text style={styles.changeText}>
                                {comparison.expenseChangePercent > 0 ? '+' : ''}{comparison.expenseChangePercent}% from last month
                            </Text>
                        )}
                    </View>
                </View>

                {/* Spending by Category */}
                {categoryBreakdown.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Spending by Category</Text>
                        <View style={styles.chartContainer}>
                            <PieChart
                                data={pieChartData}
                                width={screenWidth - 32}
                                height={220}
                                chartConfig={{
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                }}
                                accessor="amount"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                absolute
                            />
                        </View>

                        {/* Category List */}
                        <View style={styles.categoryList}>
                            {categoryBreakdown.map((item, index) => {
                                const category = getCategoryById(item.category, 'expense');
                                const percentage = ((item.total / monthlyTotals.expense) * 100).toFixed(1);

                                return (
                                    <View key={item.category} style={styles.categoryItem}>
                                        <View style={styles.categoryItemLeft}>
                                            <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                                            <View style={styles.categoryItemInfo}>
                                                <Text style={styles.categoryItemName}>{category.name}</Text>
                                                <Text style={styles.categoryItemCount}>{item.count} transactions</Text>
                                            </View>
                                        </View>
                                        <View style={styles.categoryItemRight}>
                                            <Text style={styles.categoryItemAmount}>{formatCurrency(item.total)}</Text>
                                            <Text style={styles.categoryItemPercentage}>{percentage}%</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Spending Trends */}
                {spendingTrends.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>6-Month Trend</Text>
                        <View style={styles.chartContainer}>
                            <LineChart
                                data={lineChartData}
                                width={screenWidth - 32}
                                height={220}
                                chartConfig={{
                                    backgroundColor: theme.colors.surface,
                                    backgroundGradientFrom: theme.colors.surface,
                                    backgroundGradientTo: theme.colors.surface,
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
                                    labelColor: (opacity = 1) => theme.colors.text,
                                    style: {
                                        borderRadius: theme.borderRadius.md,
                                    },
                                    propsForDots: {
                                        r: '4',
                                        strokeWidth: '2',
                                    },
                                }}
                                bezier
                                style={styles.chart}
                            />
                        </View>
                    </View>
                )}

                {/* Insights */}
                {categoryBreakdown.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Insights</Text>
                        <View style={styles.insightCard}>
                            <Ionicons name="bulb" size={24} color={theme.colors.warning} />
                            <View style={styles.insightContent}>
                                <Text style={styles.insightText}>
                                    Your top spending category is <Text style={styles.insightBold}>
                                        {getCategoryById(categoryBreakdown[0].category, 'expense').name}
                                    </Text> with {formatCurrency(categoryBreakdown[0].total)}
                                </Text>
                            </View>
                        </View>

                        {monthlyTotals.balance < 0 && (
                            <View style={[styles.insightCard, { backgroundColor: theme.colors.error + '10' }]}>
                                <Ionicons name="warning" size={24} color={theme.colors.error} />
                                <View style={styles.insightContent}>
                                    <Text style={styles.insightText}>
                                        You spent more than you earned this month. Consider reviewing your expenses.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {monthlyTotals.balance > 0 && (
                            <View style={[styles.insightCard, { backgroundColor: theme.colors.success + '10' }]}>
                                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                                <View style={styles.insightContent}>
                                    <Text style={styles.insightText}>
                                        Great job! You saved {formatCurrency(monthlyTotals.balance)} this month.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: theme.spacing.md,
    },
    monthSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
    },
    monthButton: {
        padding: theme.spacing.sm,
    },
    monthText: {
        fontSize: theme.fonts.sizes.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    summaryCards: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    summaryCard: {
        flex: 1,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.sm,
    },
    summaryCardLabel: {
        fontSize: theme.fonts.sizes.sm,
        color: theme.colors.text,
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },
    summaryCardValue: {
        fontSize: theme.fonts.sizes.xl,
        fontWeight: 'bold',
    },
    changeText: {
        fontSize: theme.fonts.sizes.xs,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xs,
    },
    section: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
    },
    sectionTitle: {
        fontSize: theme.fonts.sizes.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    chartContainer: {
        alignItems: 'center',
        marginVertical: theme.spacing.sm,
    },
    chart: {
        borderRadius: theme.borderRadius.md,
    },
    categoryList: {
        marginTop: theme.spacing.md,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    categoryItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: theme.spacing.sm,
    },
    categoryItemInfo: {
        flex: 1,
    },
    categoryItemName: {
        fontSize: theme.fonts.sizes.md,
        fontWeight: '500',
        color: theme.colors.text,
    },
    categoryItemCount: {
        fontSize: theme.fonts.sizes.xs,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    categoryItemRight: {
        alignItems: 'flex-end',
    },
    categoryItemAmount: {
        fontSize: theme.fonts.sizes.md,
        fontWeight: '600',
        color: theme.colors.text,
    },
    categoryItemPercentage: {
        fontSize: theme.fonts.sizes.xs,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.warning + '10',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.sm,
    },
    insightContent: {
        flex: 1,
        marginLeft: theme.spacing.sm,
    },
    insightText: {
        fontSize: theme.fonts.sizes.sm,
        color: theme.colors.text,
        lineHeight: 20,
    },
    insightBold: {
        fontWeight: 'bold',
    },
});
