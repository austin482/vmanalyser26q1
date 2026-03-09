// Analytics service for calculating spending insights
export const calculateMonthlyTotals = (transactions, year, month) => {
    const monthTransactions = transactions.filter(transaction => {
        const date = new Date(transaction.date);
        return date.getFullYear() === year && date.getMonth() === month;
    });

    const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
        income,
        expense,
        balance: income - expense,
        transactionCount: monthTransactions.length,
    };
};

// Calculate category-wise breakdown
export const getCategoryBreakdown = (transactions, year, month, type = 'expense') => {
    const monthTransactions = transactions.filter(transaction => {
        const date = new Date(transaction.date);
        return date.getFullYear() === year &&
            date.getMonth() === month &&
            transaction.type === type;
    });

    const categoryTotals = {};

    monthTransactions.forEach(transaction => {
        const category = transaction.category;
        if (!categoryTotals[category]) {
            categoryTotals[category] = {
                total: 0,
                count: 0,
                transactions: [],
            };
        }
        categoryTotals[category].total += parseFloat(transaction.amount);
        categoryTotals[category].count += 1;
        categoryTotals[category].transactions.push(transaction);
    });

    // Convert to array and sort by total
    const breakdown = Object.keys(categoryTotals).map(category => ({
        category,
        ...categoryTotals[category],
    })).sort((a, b) => b.total - a.total);

    return breakdown;
};

// Get spending trends over last N months
export const getSpendingTrends = (transactions, monthsCount = 6) => {
    const now = new Date();
    const trends = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();

        const totals = calculateMonthlyTotals(transactions, year, month);

        trends.push({
            year,
            month,
            monthName: date.toLocaleString('default', { month: 'short' }),
            ...totals,
        });
    }

    return trends;
};

// Get top spending categories
export const getTopCategories = (transactions, year, month, limit = 5) => {
    const breakdown = getCategoryBreakdown(transactions, year, month, 'expense');
    return breakdown.slice(0, limit);
};

// Calculate average daily spending
export const getAverageDailySpending = (transactions, year, month) => {
    const monthTransactions = transactions.filter(transaction => {
        const date = new Date(transaction.date);
        return date.getFullYear() === year &&
            date.getMonth() === month &&
            transaction.type === 'expense';
    });

    const totalExpense = monthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return totalExpense / daysInMonth;
};

// Compare with previous month
export const compareWithPreviousMonth = (transactions, year, month) => {
    const currentMonth = calculateMonthlyTotals(transactions, year, month);

    // Calculate previous month
    const prevDate = new Date(year, month - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();
    const previousMonth = calculateMonthlyTotals(transactions, prevYear, prevMonth);

    const incomeChange = currentMonth.income - previousMonth.income;
    const expenseChange = currentMonth.expense - previousMonth.expense;

    const incomeChangePercent = previousMonth.income > 0
        ? ((incomeChange / previousMonth.income) * 100).toFixed(1)
        : 0;

    const expenseChangePercent = previousMonth.expense > 0
        ? ((expenseChange / previousMonth.expense) * 100).toFixed(1)
        : 0;

    return {
        current: currentMonth,
        previous: previousMonth,
        incomeChange,
        expenseChange,
        incomeChangePercent,
        expenseChangePercent,
    };
};
