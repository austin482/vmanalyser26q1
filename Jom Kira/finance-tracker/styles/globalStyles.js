import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
    },

    // Card styles
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.md,
    },

    cardTitle: {
        fontSize: theme.fonts.sizes.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },

    // Button styles
    button: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },

    buttonText: {
        color: theme.colors.textDark,
        fontSize: theme.fonts.sizes.md,
        fontWeight: '600',
    },

    buttonSecondary: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },

    buttonSecondaryText: {
        color: theme.colors.primary,
    },

    // Input styles
    input: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fonts.sizes.md,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },

    inputFocused: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },

    label: {
        fontSize: theme.fonts.sizes.sm,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },

    // Text styles
    title: {
        fontSize: theme.fonts.sizes.xxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },

    subtitle: {
        fontSize: theme.fonts.sizes.lg,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },

    text: {
        fontSize: theme.fonts.sizes.md,
        color: theme.colors.text,
    },

    textMuted: {
        fontSize: theme.fonts.sizes.sm,
        color: theme.colors.textMuted,
    },

    // Layout
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    spaceBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    // Error
    errorText: {
        color: theme.colors.error,
        fontSize: theme.fonts.sizes.sm,
        marginTop: theme.spacing.xs,
    },
});
