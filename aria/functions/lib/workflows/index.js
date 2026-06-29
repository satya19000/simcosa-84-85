"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCustomStepHandler = exports.validateWorkflow = exports.WorkflowLogger = exports.WorkflowMetrics = exports.WorkflowScheduler = exports.WorkflowHistory = exports.WorkflowRegistry = exports.WorkflowRunner = exports.workflowRegistry = void 0;
exports.runWorkflow = runWorkflow;
exports.getWorkflowHistory = getWorkflowHistory;
exports.listWorkflows = listWorkflows;
exports.registerWorkflow = registerWorkflow;
exports.getScheduledWorkflows = getScheduledWorkflows;
const WorkflowRegistry_1 = require("./WorkflowRegistry");
const WorkflowRunner_1 = require("./WorkflowRunner");
const WorkflowHistory_1 = require("./WorkflowHistory");
const WorkflowScheduler_1 = require("./WorkflowScheduler");
const MorningBriefingWorkflow_1 = require("./builtin/MorningBriefingWorkflow");
const TodaysPlanningWorkflow_1 = require("./builtin/TodaysPlanningWorkflow");
const PrepareForTomorrowWorkflow_1 = require("./builtin/PrepareForTomorrowWorkflow");
const OverdueTaskRecoveryWorkflow_1 = require("./builtin/OverdueTaskRecoveryWorkflow");
const ReminderEscalationWorkflow_1 = require("./builtin/ReminderEscalationWorkflow");
const ContactFollowUpWorkflow_1 = require("./builtin/ContactFollowUpWorkflow");
const WeeklyReviewWorkflow_1 = require("./builtin/WeeklyReviewWorkflow");
// ── Singleton registry — shared across warm Cloud Function instances ───────────
exports.workflowRegistry = new WorkflowRegistry_1.WorkflowRegistry();
const BUILTIN_WORKFLOWS = [
    MorningBriefingWorkflow_1.MorningBriefingWorkflow,
    TodaysPlanningWorkflow_1.TodaysPlanningWorkflow,
    PrepareForTomorrowWorkflow_1.PrepareForTomorrowWorkflow,
    OverdueTaskRecoveryWorkflow_1.OverdueTaskRecoveryWorkflow,
    ReminderEscalationWorkflow_1.ReminderEscalationWorkflow,
    ContactFollowUpWorkflow_1.ContactFollowUpWorkflow,
    WeeklyReviewWorkflow_1.WeeklyReviewWorkflow,
];
let registered = false;
function ensureBuiltinsRegistered() {
    if (registered)
        return;
    registered = true;
    for (const wf of BUILTIN_WORKFLOWS) {
        exports.workflowRegistry.register(wf);
    }
}
// ── Public API ─────────────────────────────────────────────────────────────────
async function runWorkflow(workflowId, userId, db, apiKey, triggerData, userDisplayName) {
    ensureBuiltinsRegistered();
    const definition = exports.workflowRegistry.get(workflowId);
    if (!definition)
        throw new Error(`Workflow "${workflowId}" not found`);
    if (!definition.enabled)
        throw new Error(`Workflow "${workflowId}" is disabled`);
    const runner = new WorkflowRunner_1.WorkflowRunner(db, apiKey);
    return runner.run(definition, userId, triggerData, userDisplayName);
}
async function getWorkflowHistory(userId, db, workflowId, limit) {
    const history = new WorkflowHistory_1.WorkflowHistory(db);
    return history.list(userId, { workflowId, limit });
}
function listWorkflows(triggerType) {
    ensureBuiltinsRegistered();
    return triggerType ? exports.workflowRegistry.listByTrigger(triggerType) : exports.workflowRegistry.list();
}
function registerWorkflow(definition) {
    ensureBuiltinsRegistered();
    exports.workflowRegistry.register(definition);
}
async function getScheduledWorkflows(userId, db) {
    const scheduler = new WorkflowScheduler_1.WorkflowScheduler(db);
    return scheduler.list(userId);
}
var WorkflowRunner_2 = require("./WorkflowRunner");
Object.defineProperty(exports, "WorkflowRunner", { enumerable: true, get: function () { return WorkflowRunner_2.WorkflowRunner; } });
var WorkflowRegistry_2 = require("./WorkflowRegistry");
Object.defineProperty(exports, "WorkflowRegistry", { enumerable: true, get: function () { return WorkflowRegistry_2.WorkflowRegistry; } });
var WorkflowHistory_2 = require("./WorkflowHistory");
Object.defineProperty(exports, "WorkflowHistory", { enumerable: true, get: function () { return WorkflowHistory_2.WorkflowHistory; } });
var WorkflowScheduler_2 = require("./WorkflowScheduler");
Object.defineProperty(exports, "WorkflowScheduler", { enumerable: true, get: function () { return WorkflowScheduler_2.WorkflowScheduler; } });
var WorkflowMetrics_1 = require("./WorkflowMetrics");
Object.defineProperty(exports, "WorkflowMetrics", { enumerable: true, get: function () { return WorkflowMetrics_1.WorkflowMetrics; } });
var WorkflowLogger_1 = require("./WorkflowLogger");
Object.defineProperty(exports, "WorkflowLogger", { enumerable: true, get: function () { return WorkflowLogger_1.WorkflowLogger; } });
var WorkflowValidator_1 = require("./WorkflowValidator");
Object.defineProperty(exports, "validateWorkflow", { enumerable: true, get: function () { return WorkflowValidator_1.validateWorkflow; } });
var WorkflowRunner_3 = require("./WorkflowRunner");
Object.defineProperty(exports, "registerCustomStepHandler", { enumerable: true, get: function () { return WorkflowRunner_3.registerCustomStepHandler; } });
//# sourceMappingURL=index.js.map