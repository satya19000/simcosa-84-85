"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentEventBus = exports.Orchestrator = exports.AgentScheduler = exports.AgentManager = exports.AgentHealthMonitor = exports.AgentRegistry = void 0;
exports.bootstrap = bootstrap;
const AgentRegistry_1 = require("./AgentRegistry");
const AgentHealth_1 = require("./AgentHealth");
const AgentManager_1 = require("./AgentManager");
const AgentScheduler_1 = require("./AgentScheduler");
const Orchestrator_1 = require("./Orchestrator");
const PlannerAgent_1 = require("./builtin/PlannerAgent");
const TaskAgent_1 = require("./builtin/TaskAgent");
const ReminderAgent_1 = require("./builtin/ReminderAgent");
const CalendarAgent_1 = require("./builtin/CalendarAgent");
const ContactAgent_1 = require("./builtin/ContactAgent");
const MemoryAgent_1 = require("./builtin/MemoryAgent");
const WorkflowAgent_1 = require("./builtin/WorkflowAgent");
const NotificationAgent_1 = require("./builtin/NotificationAgent");
const VoiceAgent_1 = require("./builtin/VoiceAgent");
const BriefingAgent_1 = require("./builtin/BriefingAgent");
const KnowledgeAgent_1 = require("./builtin/KnowledgeAgent");
const SearchAgent_1 = require("./builtin/SearchAgent");
const ValidatorAgent_1 = require("./builtin/ValidatorAgent");
const PlaceholderAgents_1 = require("./builtin/PlaceholderAgents");
// ── Singleton warm-instance state ──────────────────────────────────────────
let _registry = null;
let _health = null;
let _manager = null;
let _scheduler = null;
let _orchestrator = null;
let _initializedAt = 0;
const REINIT_TTL_MS = 30 * 60 * 1000; // 30 min
async function bootstrap() {
    const now = Date.now();
    if (_registry && _manager && _scheduler && _orchestrator && now - _initializedAt < REINIT_TTL_MS) {
        return { registry: _registry, health: _health, manager: _manager, scheduler: _scheduler, orchestrator: _orchestrator };
    }
    const registry = new AgentRegistry_1.AgentRegistry();
    const health = new AgentHealth_1.AgentHealthMonitor();
    const manager = new AgentManager_1.AgentManager(registry, health);
    const agents = [
        new PlannerAgent_1.PlannerAgent(),
        new TaskAgent_1.TaskAgent(),
        new ReminderAgent_1.ReminderAgent(),
        new CalendarAgent_1.CalendarAgent(),
        new ContactAgent_1.ContactAgent(),
        new MemoryAgent_1.MemoryAgent(),
        new WorkflowAgent_1.WorkflowAgent(),
        new NotificationAgent_1.NotificationAgent(),
        new VoiceAgent_1.VoiceAgent(),
        new BriefingAgent_1.BriefingAgent(),
        new KnowledgeAgent_1.KnowledgeAgent(),
        new SearchAgent_1.SearchAgent(),
        new ValidatorAgent_1.ValidatorAgent(),
        // Placeholders (registered but disabled via canHandle returning false)
        PlaceholderAgents_1.EmailAgent,
        PlaceholderAgents_1.WhatsAppAgent,
        PlaceholderAgents_1.MapsAgent,
        PlaceholderAgents_1.FinanceAgent,
        PlaceholderAgents_1.HealthAgent,
        PlaceholderAgents_1.DocumentAgent,
        PlaceholderAgents_1.OCRAgent,
        PlaceholderAgents_1.AutomationAgent,
    ];
    await manager.registerAll(agents);
    const orchestrator = new Orchestrator_1.Orchestrator(registry, health);
    const scheduler = new AgentScheduler_1.AgentScheduler(manager);
    _registry = registry;
    _health = health;
    _manager = manager;
    _scheduler = scheduler;
    _orchestrator = orchestrator;
    _initializedAt = now;
    return { registry, health, manager, scheduler, orchestrator };
}
var AgentRegistry_2 = require("./AgentRegistry");
Object.defineProperty(exports, "AgentRegistry", { enumerable: true, get: function () { return AgentRegistry_2.AgentRegistry; } });
var AgentHealth_2 = require("./AgentHealth");
Object.defineProperty(exports, "AgentHealthMonitor", { enumerable: true, get: function () { return AgentHealth_2.AgentHealthMonitor; } });
var AgentManager_2 = require("./AgentManager");
Object.defineProperty(exports, "AgentManager", { enumerable: true, get: function () { return AgentManager_2.AgentManager; } });
var AgentScheduler_2 = require("./AgentScheduler");
Object.defineProperty(exports, "AgentScheduler", { enumerable: true, get: function () { return AgentScheduler_2.AgentScheduler; } });
var Orchestrator_2 = require("./Orchestrator");
Object.defineProperty(exports, "Orchestrator", { enumerable: true, get: function () { return Orchestrator_2.Orchestrator; } });
var AgentEvents_1 = require("./AgentEvents");
Object.defineProperty(exports, "agentEventBus", { enumerable: true, get: function () { return AgentEvents_1.agentEventBus; } });
//# sourceMappingURL=index.js.map