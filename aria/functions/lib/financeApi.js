"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dismissFinanceSuggestion = exports.listFinanceSuggestions = exports.runFinanceReminderChecks = exports.getFinanceYearlyReport = exports.getFinanceMonthlyReport = exports.getFinanceStats = exports.disposeAsset = exports.checkAssetMaintenanceDue = exports.scheduleAssetMaintenance = exports.returnAsset = exports.assignAsset = exports.listAssets = exports.registerAsset = exports.rejectProcurementRequest = exports.approveProcurementRequest = exports.matchInvoiceToRequest = exports.recordGoodsReceipt = exports.issuePurchaseOrder = exports.selectVendorForRequest = exports.compareQuotations = exports.addQuotation = exports.listProcurementRequests = exports.createProcurementRequest = exports.listPayments = exports.recordPayment = exports.linkInvoiceDocument = exports.detectOverdueInvoices = exports.markInvoicePaid = exports.listInvoices = exports.createInvoice = exports.evaluateVendor = exports.searchVendors = exports.listVendors = exports.createVendor = exports.listIncome = exports.recordIncome = exports.markExpenseReimbursed = exports.rejectExpense = exports.approveExpense = exports.listExpenses = exports.getExpense = exports.recordExpense = exports.forecastBudget = exports.listBudgets = exports.getBudget = exports.createBudget = exports.listFinanceProviders = exports.getFinanceProviderHealth = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const finance_1 = require("./finance");
function db() {
    return admin.firestore();
}
function apiKey() {
    return process.env.ANTHROPIC_API_KEY ?? '';
}
// ── Providers ─────────────────────────────────────────────────────────────────
exports.getFinanceProviderHealth = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.healthCheckAll(request.auth.uid);
});
exports.listFinanceProviders = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.listProviders();
});
// ── Budgets ───────────────────────────────────────────────────────────────────
exports.createBudget = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.name || fields?.amount === undefined)
        throw new https_1.HttpsError('invalid-argument', 'name and amount required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.createBudget(request.auth.uid, fields);
});
exports.getBudget = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { budgetId } = request.data;
    if (!budgetId)
        throw new https_1.HttpsError('invalid-argument', 'budgetId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.getBudget(request.auth.uid, budgetId);
});
exports.listBudgets = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = (request.data ?? {});
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.listBudgets(request.auth.uid, opts);
});
exports.forecastBudget = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { budgetId } = request.data;
    if (!budgetId)
        throw new https_1.HttpsError('invalid-argument', 'budgetId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.forecastBudget(request.auth.uid, budgetId);
});
// ── Expenses ──────────────────────────────────────────────────────────────────
exports.recordExpense = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.description || fields?.amount === undefined)
        throw new https_1.HttpsError('invalid-argument', 'description and amount required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.recordExpense(request.auth.uid, fields);
});
exports.getExpense = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { expenseId } = request.data;
    if (!expenseId)
        throw new https_1.HttpsError('invalid-argument', 'expenseId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.getExpense(request.auth.uid, expenseId);
});
exports.listExpenses = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = (request.data ?? {});
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.listExpenses(request.auth.uid, opts);
});
exports.approveExpense = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { expenseId } = request.data;
    if (!expenseId)
        throw new https_1.HttpsError('invalid-argument', 'expenseId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.approveExpense(request.auth.uid, expenseId, request.auth.uid);
});
exports.rejectExpense = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { expenseId } = request.data;
    if (!expenseId)
        throw new https_1.HttpsError('invalid-argument', 'expenseId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.rejectExpense(request.auth.uid, expenseId, request.auth.uid);
});
exports.markExpenseReimbursed = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { expenseId } = request.data;
    if (!expenseId)
        throw new https_1.HttpsError('invalid-argument', 'expenseId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    await engine.markExpenseReimbursed(request.auth.uid, expenseId);
    return { success: true };
});
// ── Income ────────────────────────────────────────────────────────────────────
exports.recordIncome = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.source || fields?.amount === undefined)
        throw new https_1.HttpsError('invalid-argument', 'source and amount required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.recordIncome(request.auth.uid, fields);
});
exports.listIncome = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = (request.data ?? {});
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.listIncome(request.auth.uid, opts);
});
// ── Vendors ───────────────────────────────────────────────────────────────────
exports.createVendor = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.name)
        throw new https_1.HttpsError('invalid-argument', 'name required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.createVendor(request.auth.uid, fields);
});
exports.listVendors = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = (request.data ?? {});
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.listVendors(request.auth.uid, opts);
});
exports.searchVendors = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { term } = request.data;
    if (!term)
        throw new https_1.HttpsError('invalid-argument', 'term required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.searchVendors(request.auth.uid, term);
});
exports.evaluateVendor = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { vendorId, rating, note } = request.data;
    if (!vendorId || rating === undefined)
        throw new https_1.HttpsError('invalid-argument', 'vendorId and rating required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.evaluateVendor(request.auth.uid, vendorId, rating, note);
});
// ── Invoices ──────────────────────────────────────────────────────────────────
exports.createInvoice = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.invoiceNumber || fields?.totalAmount === undefined)
        throw new https_1.HttpsError('invalid-argument', 'invoiceNumber and totalAmount required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.createInvoice(request.auth.uid, fields);
});
exports.listInvoices = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = (request.data ?? {});
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.listInvoices(request.auth.uid, opts);
});
exports.markInvoicePaid = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { invoiceId } = request.data;
    if (!invoiceId)
        throw new https_1.HttpsError('invalid-argument', 'invoiceId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.markInvoicePaid(request.auth.uid, invoiceId);
});
exports.detectOverdueInvoices = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.detectOverdueInvoices(request.auth.uid);
});
exports.linkInvoiceDocument = (0, https_1.onCall)({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { documentId, extractedFields } = request.data;
    if (!documentId || !extractedFields?.invoiceNumber)
        throw new https_1.HttpsError('invalid-argument', 'documentId and extractedFields.invoiceNumber required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.linkInvoiceDocument(request.auth.uid, documentId, extractedFields);
});
// ── Payments ──────────────────────────────────────────────────────────────────
exports.recordPayment = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (fields?.amount === undefined)
        throw new https_1.HttpsError('invalid-argument', 'amount required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.recordPayment(request.auth.uid, fields);
});
exports.listPayments = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = (request.data ?? {});
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.listPayments(request.auth.uid, opts);
});
// ── Procurement ───────────────────────────────────────────────────────────────
exports.createProcurementRequest = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.title)
        throw new https_1.HttpsError('invalid-argument', 'title required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.createProcurementRequest(request.auth.uid, fields);
});
exports.listProcurementRequests = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = (request.data ?? {});
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.listProcurementRequests(request.auth.uid, opts);
});
exports.addQuotation = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId, quotation } = request.data;
    if (!requestId || !quotation)
        throw new https_1.HttpsError('invalid-argument', 'requestId and quotation required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.addQuotation(request.auth.uid, requestId, quotation);
});
exports.compareQuotations = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId } = request.data;
    if (!requestId)
        throw new https_1.HttpsError('invalid-argument', 'requestId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.compareQuotations(request.auth.uid, requestId);
});
exports.selectVendorForRequest = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId, vendorId } = request.data;
    if (!requestId || !vendorId)
        throw new https_1.HttpsError('invalid-argument', 'requestId and vendorId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.selectVendorForRequest(request.auth.uid, requestId, vendorId);
});
exports.issuePurchaseOrder = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId, purchaseOrderNumber } = request.data;
    if (!requestId || !purchaseOrderNumber)
        throw new https_1.HttpsError('invalid-argument', 'requestId and purchaseOrderNumber required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.issuePurchaseOrder(request.auth.uid, requestId, purchaseOrderNumber);
});
exports.recordGoodsReceipt = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId } = request.data;
    if (!requestId)
        throw new https_1.HttpsError('invalid-argument', 'requestId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.recordGoodsReceipt(request.auth.uid, requestId);
});
exports.matchInvoiceToRequest = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId, invoiceId } = request.data;
    if (!requestId || !invoiceId)
        throw new https_1.HttpsError('invalid-argument', 'requestId and invoiceId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.matchInvoiceToRequest(request.auth.uid, requestId, invoiceId);
});
exports.approveProcurementRequest = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId } = request.data;
    if (!requestId)
        throw new https_1.HttpsError('invalid-argument', 'requestId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.approveProcurementRequest(request.auth.uid, requestId, request.auth.uid);
});
exports.rejectProcurementRequest = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { requestId } = request.data;
    if (!requestId)
        throw new https_1.HttpsError('invalid-argument', 'requestId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.rejectProcurementRequest(request.auth.uid, requestId, request.auth.uid);
});
// ── Assets ────────────────────────────────────────────────────────────────────
exports.registerAsset = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const fields = request.data;
    if (!fields?.name)
        throw new https_1.HttpsError('invalid-argument', 'name required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.registerAsset(request.auth.uid, fields);
});
exports.listAssets = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const opts = (request.data ?? {});
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.listAssets(request.auth.uid, opts);
});
exports.assignAsset = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { assetId, assignedTo } = request.data;
    if (!assetId || !assignedTo)
        throw new https_1.HttpsError('invalid-argument', 'assetId and assignedTo required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.assignAsset(request.auth.uid, assetId, assignedTo);
});
exports.returnAsset = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { assetId } = request.data;
    if (!assetId)
        throw new https_1.HttpsError('invalid-argument', 'assetId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.returnAsset(request.auth.uid, assetId);
});
exports.scheduleAssetMaintenance = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { assetId, date } = request.data;
    if (!assetId || !date)
        throw new https_1.HttpsError('invalid-argument', 'assetId and date required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.scheduleAssetMaintenance(request.auth.uid, assetId, date);
});
exports.checkAssetMaintenanceDue = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.checkMaintenanceDue(request.auth.uid);
});
exports.disposeAsset = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { assetId, notes } = request.data;
    if (!assetId)
        throw new https_1.HttpsError('invalid-argument', 'assetId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.disposeAsset(request.auth.uid, assetId, notes ?? '');
});
// ── Analytics ─────────────────────────────────────────────────────────────────
exports.getFinanceStats = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.getStats(request.auth.uid);
});
exports.getFinanceMonthlyReport = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { year, month } = request.data;
    if (!year || !month)
        throw new https_1.HttpsError('invalid-argument', 'year and month required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.getMonthlyReport(request.auth.uid, year, month);
});
exports.getFinanceYearlyReport = (0, https_1.onCall)({ timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { year } = request.data;
    if (!year)
        throw new https_1.HttpsError('invalid-argument', 'year required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.getYearlyReport(request.auth.uid, year);
});
// ── Reminders / Suggestions ───────────────────────────────────────────────────
exports.runFinanceReminderChecks = (0, https_1.onCall)({ timeoutSeconds: 60 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.runReminderChecks(request.auth.uid);
});
exports.listFinanceSuggestions = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    return engine.listPendingSuggestions(request.auth.uid);
});
exports.dismissFinanceSuggestion = (0, https_1.onCall)({ timeoutSeconds: 10 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { suggestionId } = request.data;
    if (!suggestionId)
        throw new https_1.HttpsError('invalid-argument', 'suggestionId required');
    const engine = (0, finance_1.getFinanceEngine)(request.auth.uid, db(), apiKey());
    await engine.dismissSuggestion(request.auth.uid, suggestionId);
    return { success: true };
});
//# sourceMappingURL=financeApi.js.map