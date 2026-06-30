"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceValidator = void 0;
class FinanceValidator {
    validateBudget(budget) {
        const errors = [];
        const warnings = [];
        if (!budget.userId)
            errors.push('userId is required');
        if (!budget.name)
            errors.push('name is required');
        if (budget.amount === undefined || budget.amount < 0)
            errors.push('amount must be a non-negative number');
        if (!budget.startDate || isNaN(Date.parse(budget.startDate)))
            errors.push('startDate must be a valid date');
        if (!budget.endDate || isNaN(Date.parse(budget.endDate)))
            errors.push('endDate must be a valid date');
        if (budget.startDate && budget.endDate && Date.parse(budget.startDate) > Date.parse(budget.endDate)) {
            errors.push('startDate must be before endDate');
        }
        if (!budget.alertThresholdPct)
            warnings.push('No alert threshold set — using default');
        return { valid: errors.length === 0, errors, warnings };
    }
    validateExpense(expense) {
        const errors = [];
        const warnings = [];
        if (!expense.userId)
            errors.push('userId is required');
        if (!expense.description)
            errors.push('description is required');
        if (expense.amount === undefined || expense.amount <= 0)
            errors.push('amount must be a positive number');
        if (!expense.category)
            errors.push('category is required');
        if (!expense.incurredAt || isNaN(Date.parse(expense.incurredAt)))
            errors.push('incurredAt must be a valid date');
        if (!expense.attachments || expense.attachments.length === 0)
            warnings.push('No receipt/attachment provided');
        return { valid: errors.length === 0, errors, warnings };
    }
    validateInvoice(invoice) {
        const errors = [];
        const warnings = [];
        if (!invoice.userId)
            errors.push('userId is required');
        if (!invoice.invoiceNumber)
            errors.push('invoiceNumber is required');
        if (invoice.totalAmount === undefined || invoice.totalAmount <= 0)
            errors.push('totalAmount must be a positive number');
        if (!invoice.dueDate || isNaN(Date.parse(invoice.dueDate)))
            errors.push('dueDate must be a valid date');
        if (!invoice.vendorId)
            warnings.push('No vendor linked to this invoice');
        return { valid: errors.length === 0, errors, warnings };
    }
    validatePayment(payment) {
        const errors = [];
        const warnings = [];
        if (!payment.userId)
            errors.push('userId is required');
        if (payment.amount === undefined || payment.amount <= 0)
            errors.push('amount must be a positive number');
        if (!payment.method)
            errors.push('method is required');
        if (!payment.invoiceId && !payment.expenseId)
            warnings.push('Payment is not linked to an invoice or expense');
        return { valid: errors.length === 0, errors, warnings };
    }
    validateProcurementRequest(req) {
        const errors = [];
        const warnings = [];
        if (!req.userId)
            errors.push('userId is required');
        if (!req.title)
            errors.push('title is required');
        if (!req.description)
            errors.push('description is required');
        if (!req.quotations || req.quotations.length === 0)
            warnings.push('No quotations attached yet');
        return { valid: errors.length === 0, errors, warnings };
    }
    validateAsset(asset) {
        const errors = [];
        const warnings = [];
        if (!asset.userId)
            errors.push('userId is required');
        if (!asset.name)
            errors.push('name is required');
        if (asset.purchaseValue === undefined || asset.purchaseValue < 0)
            errors.push('purchaseValue must be a non-negative number');
        if (!asset.purchaseDate || isNaN(Date.parse(asset.purchaseDate)))
            errors.push('purchaseDate must be a valid date');
        if (!asset.warrantyExpiresAt)
            warnings.push('No warranty expiration set');
        return { valid: errors.length === 0, errors, warnings };
    }
}
exports.FinanceValidator = FinanceValidator;
//# sourceMappingURL=FinanceValidator.js.map