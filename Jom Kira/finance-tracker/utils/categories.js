export const EXPENSE_CATEGORIES = [
    { id: 'food', name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B' },
    { id: 'transport', name: 'Transportation', icon: 'car', color: '#4ECDC4' },
    { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#95E1D3' },
    { id: 'bills', name: 'Bills & Utilities', icon: 'receipt', color: '#F38181' },
    { id: 'entertainment', name: 'Entertainment', icon: 'game-controller', color: '#AA96DA' },
    { id: 'health', name: 'Health & Fitness', icon: 'fitness', color: '#FCBAD3' },
    { id: 'education', name: 'Education', icon: 'book', color: '#A8D8EA' },
    { id: 'travel', name: 'Travel', icon: 'airplane', color: '#FFD93D' },
    { id: 'gifts', name: 'Gifts & Donations', icon: 'gift', color: '#FF8FB1' },
    { id: 'personal', name: 'Personal Care', icon: 'person', color: '#C7CEEA' },
    { id: 'home', name: 'Home & Garden', icon: 'home', color: '#B8E994' },
    { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#A0A0A0' }
];

export const INCOME_CATEGORIES = [
    { id: 'salary', name: 'Salary', icon: 'briefcase', color: '#6BCF7F' },
    { id: 'business', name: 'Business', icon: 'business', color: '#4A90E2' },
    { id: 'investment', name: 'Investment', icon: 'trending-up', color: '#F5A623' },
    { id: 'freelance', name: 'Freelance', icon: 'laptop', color: '#7B68EE' },
    { id: 'bonus', name: 'Bonus', icon: 'star', color: '#FFD700' },
    { id: 'gift', name: 'Gift Received', icon: 'gift', color: '#FF69B4' },
    { id: 'refund', name: 'Refund', icon: 'return-up-back', color: '#50C878' },
    { id: 'other', name: 'Other Income', icon: 'cash', color: '#20B2AA' }
];

export const getCategoryById = (categoryId, type) => {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    return categories.find(cat => cat.id === categoryId) || categories[categories.length - 1];
};

export const getAllCategories = () => {
    return [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
};
