# ARIA Finance, Procurement & Expense Intelligence Platform (Phase 4.9)

A secure, extensible finance module covering budgeting, expense tracking,
income, vendor management, invoicing, payments, procurement, and asset
lifecycle management. The core engine is generic; organization-specific
financial logic (NGO grant compliance, retail POS reconciliation, school fee
collection, healthcare billing, or any future vertical) is implemented as
plugins via `FinanceProgramPlugin`.

## Architecture

```
finance/
├── FinanceEngine.ts            facade — orchestrates all managers
├── FinanceProvider.ts          provider interface + base/no-op implementations
├── FinanceRegistry.ts          provider registry (register/get/list/unregister)
├── FinanceProgramPlugin.ts     program/vertical plugin contract + plugin registry
├── BudgetManager.ts            budget repository, spend tracking, alerts, forecast
├── ExpenseManager.ts           expense repository, approval workflow (calls
│                                 BudgetManager.recordSpend on approval)
├── IncomeManager.ts            income repository
├── VendorManager.ts            vendor repository, search, evaluation
├── InvoiceManager.ts           invoice repository, overdue detection
├── PaymentManager.ts           payment repository (auto-marks linked invoice paid)
├── ProcurementManager.ts       procurement request repository + PO state machine
├── AssetManager.ts             asset repository, assignment history, maintenance,
│                                 disposal, depreciation extension point
├── FinanceAnalytics.ts         stats: cash flow, budget utilization, monthly/
│                                 yearly reports
├── FinanceScheduler.ts         generates reminder/alert suggestions (never
│                                 auto-sends)
├── FinancePermissions.ts       per-scope role-based access control
├── FinanceValidator.ts         input validation for all entities
├── FinanceEvents.ts            event bus (budget/expense/invoice/payment/etc.)
├── FinanceConfig.ts            tunables (lead times, thresholds, budgets, limits)
├── FinanceTypes.ts             shared types for the entire module
└── index.ts                    per-user singleton sessions + re-exports
```

`functions/src/financeApi.ts` exposes the engine to the frontend as Firebase
Cloud Functions (`onCall`), following the same pattern as the Healthcare and
Communication modules: every function checks `request.auth`, validates
input, and delegates to a per-user `FinanceEngine` instance obtained from
`getFinanceEngine`.

## Provider Model

Every financial data source provider implements `FinanceProvider`:

```ts
initialize() / authenticate() / connect() / disconnect()
search() / sync() / healthCheck() / shutdown() / getStatus()
```

`FinanceRegistry` holds providers in a `Map<string, FinanceProvider>`. No
providers are pre-registered — banks, UPI gateways, credit card processors,
accounting systems, ERPs, and government finance APIs are vendor-specific
integrations, not a fixed enumerable channel set. `BaseFinanceProvider` and
`NoOpFinanceProvider` are available to build new providers without code
changes to the engine.

## Budget System

`BudgetManager` tracks `amount`, `spent`, `status` (`active | closed |
over_budget | draft`) per budget (annual, monthly, quarterly, project, or
department scoped). `recordSpend` increments `spent`, flips `status` to
`over_budget` and emits `budget:exceeded` when spend reaches the full
amount, or emits `budget:alert` when spend crosses `alertThresholdPct`
(default 90%). `forecastBudget` does a simple linear projection based on
elapsed-time vs. spend ratio.

## Expense System

`ExpenseManager.recordExpense` creates a `pending` expense and emits
`expense:recorded`. `approveExpense` flips status to `approved`, applies the
amount against the linked budget via `BudgetManager.recordSpend` (which may
itself emit `budget:alert` / `budget:exceeded`), and emits
`expense:approved`. `rejectExpense` and `markReimbursed` round out the
lifecycle. Recurring expenses are surfaced via `listRecurringExpenses`.

## Procurement

`ProcurementManager` implements the procurement state machine:

```
requested → quotation_pending → quotation_received → po_issued
  → goods_received → invoice_matched → completed | rejected
```

`addQuotation` appends a vendor quote and advances status to
`quotation_received`. `compareQuotations` returns quotes sorted ascending by
amount. `selectVendor` records the chosen vendor; `issuePurchaseOrder` sets
a PO number and emits `procurement:po_issued`; `recordGoodsReceipt` and
`matchInvoice` advance state; `approveRequest` finalizes to `completed` and
emits `procurement:approved`.

## Assets

`AssetManager` tracks asset lifecycle: `registerAsset` (emits
`asset:registered`), `assignAsset`/`returnAsset` (append/close entries in
`assignmentHistory`), `scheduleMaintenance`/`checkMaintenanceDue` (emits
`asset:maintenance_due` for assets whose `nextMaintenanceAt` has arrived),
and `disposeAsset` (emits `asset:disposed`).
`computeDepreciationPlaceholder(asset)` is an explicit, documented extension
point — it returns `asset.purchaseValue` unchanged today and is meant to be
overridden by a plugin or future module implementing real depreciation
methods (straight-line, declining-balance, etc.).

## Workflow Integration

**Expense → Approval → Budget Check → Payment → Audit Log** is implemented
today at the manager/event level rather than through the repo's separate
Workflow Engine (`functions/src/workflows/`):

1. `ExpenseManager.recordExpense` → emits `expense:recorded`.
2. `ExpenseManager.approveExpense` → calls `BudgetManager.recordSpend`,
   which emits `budget:alert` / `budget:exceeded` as needed → emits
   `expense:approved`.
3. `PaymentManager.recordPayment` → auto-marks the linked invoice paid via
   `InvoiceManager.markPaid` → emits `payment:recorded` / `payment:failed`.
4. `FinanceEvents` (the module's event bus) is the audit trail surface —
   every state transition emits a typed event with `emittedAt`.

This satisfies the workflow today without introducing a dependency on the
generic Workflow Engine. **Phase 5.0 recommendation**: formalize this chain
as a declared `Workflow` (using `functions/src/workflows/Workflow.ts` /
`WorkflowStep.ts`) so it gains the Workflow Engine's retry, history, and
metrics instrumentation for free. This was intentionally deferred — the
existing event chain already enforces approval-gated budget checks and
payment-triggered invoice settlement without adding cross-module coupling.

## Analytics

`FinanceAnalytics.getStats` reads all finance collections in parallel
(`Promise.all` over the manager classes, never raw Firestore) and computes
`totalIncome`, `totalExpenses`, `cashFlow`, `budgetUtilizationRate`,
`pendingInvoices`, `overdueInvoices`, `pendingApprovals`, `assetsCount`,
`vendorsCount`, and `byExpenseCategory`. `getMonthlyReport` /
`getYearlyReport` filter expenses/income by date range and aggregate
income/expenses/cashFlow/byCategory for the period.

## Plugin Extensions

`FinanceProgramPlugin` is the contract for organization-specific financial
verticals:

```ts
interface FinanceProgramPlugin {
  id, name, description
  registerFinancialModules?(): Array<{ id, name, description }>
  registerProcurementWorkflows?(): Array<{ id, name, description }>
  computeAnalytics?(userId, engine): Promise<Record<string, unknown>>
  registerComplianceRules?(): FinanceComplianceRule[]
  registerApprovalChains?(): FinanceApprovalChainStep[]
  generateReports?(userId, engine): Promise<FinanceProgramReport[]>
  registerDashboards?(): FinanceProgramDashboardWidget[]
}
```

`FinancePluginRegistry.installInto(userId, engine)` lets a plugin register
financial modules, procurement workflow extensions, compliance rules, and
approval chains without `FinanceEngine` ever importing a concrete vertical.
New verticals are added purely by implementing this interface — zero
changes to `FinanceEngine` or any other core file.

## Integration

- **Document Intelligence**: `FinanceEngine.linkInvoiceDocument(userId,
  documentId, extractedFields)` is the entry point for OCR → entity
  extraction pipelines. It creates/updates the `Invoice` record and the
  Memory Graph node, then returns a *suggested* Expense shape — it never
  writes the Expense itself. Actual Expense creation happens via explicit
  approval through ActionEngine elsewhere in the system, preserving the
  "never write directly and bypass approval" rule.
- **Communication Hub**: `FinanceScheduler` only ever *creates suggestions*
  (`FinanceSuggestion`, always `requiresApproval: true`). It never calls a
  send function directly — the Communication Hub dispatches a suggestion
  only after explicit user approval.
- **Memory Graph**: budgets (`project` node), vendors (`organization`
  node), invoices and payments (`expense` node), and procurement requests
  (`task` node) are each upserted and linked with `RELATED_TO` edges
  (vendor → invoice, invoice → payment). All Memory Graph calls are
  best-effort (wrapped in `try/catch`) and never block the primary
  financial-record write.

## Security

- Never auto-sends a communication or executes a payment automatically;
  every reminder/alert is a suggestion requiring explicit user approval
  (`requiresApproval: true` is hardcoded on every `FinanceSuggestion`).
- All AI-assisted calls (invoice entity extraction, analytics summaries)
  run through Firebase Cloud Functions using the `ANTHROPIC_API_KEY` Secret
  Manager secret — never exposed to the frontend.
- `FinancePermissions` provides per-scope, role-based access control
  (`reader < approver < finance_admin < admin`).
- All writes go through the repository/manager classes — no direct,
  unvalidated Firestore writes from the API layer.

## Manual Test Scenarios

1. **Create annual budget** — `createBudget` with `period: 'annual'`;
   verify it appears via `listBudgets({ period: 'annual' })`.
2. **Record expense** — `recordExpense` against the budget; verify
   `approvalStatus: 'pending'` and `expense:recorded` fires.
3. **Upload invoice** — `createInvoice` with line items; verify
   `invoice:created` fires and status is `draft`.
4. **Extract invoice details** — `linkInvoiceDocument` with mock OCR
   fields; verify it returns both the created `Invoice` and a
   `suggestedExpense` (no Expense is written).
5. **Create purchase order** — `createProcurementRequest` →
   `addQuotation` (multiple vendors) → `compareQuotations` (sorted by
   amount) → `selectVendor` → `issuePurchaseOrder`; verify status reaches
   `po_issued` and `procurement:po_issued` fires.
6. **Approve procurement** — `recordGoodsReceipt` → `matchInvoice` →
   `approveRequest`; verify status reaches `completed` and
   `procurement:approved` fires.
7. **Generate monthly report** — `getMonthlyReport(userId, year, month)`;
   verify income/expenses/cashFlow/byCategory reflect only that period's
   records.
8. **Search vendor** — `createVendor` then `searchVendors(term)`; verify
   case-insensitive substring match against vendor name.
9. **View analytics dashboard** — open `/devtools/finance`; verify
   providers, budgets, expenses, invoices, payments, assets, vendors,
   analytics stats, and pending suggestions all render and `Dismiss`
   removes a suggestion from the list.
