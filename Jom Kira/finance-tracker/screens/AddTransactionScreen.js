import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    Platform,
} from 'react-native';
import { auth } from '../firebase.config';
import { addTransaction, updateTransaction } from '../services/transactionService';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddTransactionScreen({ route, navigation }) {
    const { type: initialType, transaction: editTransaction } = route.params || {};

    const [type, setType] = useState(editTransaction?.type || initialType || 'expense');
    const [amount, setAmount] = useState(editTransaction?.amount?.toString() || '');
    const [category, setCategory] = useState(editTransaction?.category || null);
    const [note, setNote] = useState(editTransaction?.note || '');
    const [date, setDate] = useState(editTransaction?.date ? new Date(editTransaction.date) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const selectedCategory = categories.find(cat => cat.id === category);

    const handleSave = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        if (!category) {
            Alert.alert('Error', 'Please select a category');
            return;
        }

        setLoading(true);
        try {
            const userId = auth.currentUser?.uid;
            const transactionData = {
                type,
                amount: parseFloat(amount),
                category,
                note: note.trim(),
                date: date.getTime(),
            };

            if (editTransaction) {
                await updateTransaction(userId, editTransaction.id, transactionData);
                Alert.alert('Success', 'Transaction updated successfully');
            } else {
                await addTransaction(userId, transactionData);
                Alert.alert('Success', 'Transaction added successfully');
            }

            navigation.goBack();
        } catch (error) {
            console.error('Error saving transaction:', error);
            Alert.alert('Error', 'Failed to save transaction');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <View style={globalStyles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    {/* Type Selector */}
                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                type === 'income' && styles.typeButtonActive,
                                type === 'income' && { backgroundColor: theme.colors.income }
                            ]}
                            onPress={() => {
                                setType('income');
                                setCategory(null); // Reset category when switching type
                            }}
                        >
                            <Ionicons
                                name="arrow-down"
                                size={20}
                                color={type === 'income' ? 'white' : theme.colors.income}
                            />
                            <Text style={[
                                styles.typeButtonText,
                                type === 'income' && styles.typeButtonTextActive
                            ]}>
                                Income
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                type === 'expense' && styles.typeButtonActive,
                                type === 'expense' && { backgroundColor: theme.colors.expense }
                            ]}
                            onPress={() => {
                                setType('expense');
                                setCategory(null); // Reset category when switching type
                            }}
                        >
                            <Ionicons
                                name="arrow-up"
                                size={20}
                                color={type === 'expense' ? 'white' : theme.colors.expense}
                            />
                            <Text style={[
                                styles.typeButtonText,
                                type === 'expense' && styles.typeButtonTextActive
                            ]}>
                                Expense
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Amount Input */}
                    <View style={styles.section}>
                        <Text style={globalStyles.label}>Amount (RM)</Text>
                        <View style={styles.amountInputContainer}>
                            <Text style={styles.currencySymbol}>RM</Text>
                            <TextInput
                                style={styles.amountInput}
                                placeholder="0.00"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                                placeholderTextColor={theme.colors.textMuted}
                            />
                        </View>
                    </View>

                    {/* Category Selector */}
                    <View style={styles.section}>
                        <Text style={globalStyles.label}>Category</Text>
                        <TouchableOpacity
                            style={styles.categorySelector}
                            onPress={() => setShowCategoryModal(true)}
                        >
                            {selectedCategory ? (
                                <>
                                    <View style={[styles.categoryIconSmall, { backgroundColor: selectedCategory.color + '20' }]}>
                                        <Ionicons name={selectedCategory.icon} size={20} color={selectedCategory.color} />
                                    </View>
                                    <Text style={styles.categorySelectorText}>{selectedCategory.name}</Text>
                                </>
                            ) : (
                                <Text style={styles.categorySelectorPlaceholder}>Select a category</Text>
                            )}
                            <Ionicons name="chevron-down" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Date Picker */}
                    <View style={styles.section}>
                        <Text style={globalStyles.label}>Date</Text>
                        <TouchableOpacity
                            style={styles.dateSelector}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={theme.colors.text} />
                            <Text style={styles.dateSelectorText}>{formatDate(date)}</Text>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                        />
                    )}

                    {/* Note Input */}
                    <View style={styles.section}>
                        <Text style={globalStyles.label}>Note (Optional)</Text>
                        <TextInput
                            style={[globalStyles.input, styles.noteInput]}
                            placeholder="Add a note..."
                            value={note}
                            onChangeText={setNote}
                            multiline
                            numberOfLines={3}
                            placeholderTextColor={theme.colors.textMuted}
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[globalStyles.button, styles.saveButton]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.textDark} />
                        ) : (
                            <Text style={globalStyles.buttonText}>
                                {editTransaction ? 'Update Transaction' : 'Add Transaction'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Category Modal */}
            <Modal
                visible={showCategoryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Category</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.categoryList}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryItem,
                                        category === cat.id && styles.categoryItemSelected
                                    ]}
                                    onPress={() => {
                                        setCategory(cat.id);
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <View style={[styles.categoryIconLarge, { backgroundColor: cat.color + '20' }]}>
                                        <Ionicons name={cat.icon} size={28} color={cat.color} />
                                    </View>
                                    <Text style={styles.categoryItemText}>{cat.name}</Text>
                                    {category === cat.id && (
                                        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    content: {
        padding: theme.spacing.lg,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        gap: theme.spacing.sm,
    },
    typeButtonActive: {
        borderColor: 'transparent',
    },
    typeButtonText: {
        fontSize: theme.fonts.sizes.md,
        fontWeight: '600',
        color: theme.colors.text,
    },
    typeButtonTextActive: {
        color: 'white',
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
        ...theme.shadows.sm,
    },
    currencySymbol: {
        fontSize: theme.fonts.sizes.xxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginRight: theme.spacing.sm,
    },
    amountInput: {
        flex: 1,
        fontSize: theme.fonts.sizes.xxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        paddingVertical: theme.spacing.md,
    },
    categorySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        ...theme.shadows.sm,
    },
    categoryIconSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    categorySelectorText: {
        flex: 1,
        fontSize: theme.fonts.sizes.md,
        color: theme.colors.text,
        fontWeight: '500',
    },
    categorySelectorPlaceholder: {
        flex: 1,
        fontSize: theme.fonts.sizes.md,
        color: theme.colors.textMuted,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        ...theme.shadows.sm,
    },
    dateSelectorText: {
        fontSize: theme.fonts.sizes.md,
        color: theme.colors.text,
        fontWeight: '500',
    },
    noteInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        marginTop: theme.spacing.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalTitle: {
        fontSize: theme.fonts.sizes.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    categoryList: {
        padding: theme.spacing.md,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.sm,
        backgroundColor: theme.colors.background,
    },
    categoryItemSelected: {
        backgroundColor: theme.colors.primary + '10',
    },
    categoryIconLarge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    categoryItemText: {
        flex: 1,
        fontSize: theme.fonts.sizes.md,
        color: theme.colors.text,
        fontWeight: '500',
    },
});
