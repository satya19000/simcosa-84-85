"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionEngine = void 0;
const MissionManager_1 = require("./MissionManager");
const MissionTaskManager_1 = require("./MissionTaskManager");
const MissionPlanner_1 = require("./MissionPlanner");
const MissionAnalytics_1 = require("./MissionAnalytics");
const RecommendationManager_1 = require("./RecommendationManager");
const RecommendationEngine_1 = require("./RecommendationEngine");
const LearningEngine_1 = require("./LearningEngine");
const PredictionManager_1 = require("./PredictionManager");
const PredictionEngine_1 = require("./PredictionEngine");
const ContinuousPlanningEngine_1 = require("./ContinuousPlanningEngine");
const MissionScheduler_1 = require("./MissionScheduler");
const MissionApprovalBridge_1 = require("./MissionApprovalBridge");
const MissionPermissions_1 = require("./MissionPermissions");
const MissionHistory_1 = require("./MissionHistory");
const MissionLogger_1 = require("./MissionLogger");
const memory_graph_1 = require("../memory-graph");
/**
 * Facade orchestrating Mission Control end-to-end. Mirrors FinanceEngine /
 * ApprovalEngine's constructor signature and per-user singleton pattern
 * (see index.ts). Mission Control is purely additive: it reads from
 * FinanceEngine/HealthEngine/ApprovalEngine (passed in by the caller, never
 * constructed internally) and routes every risky action through
 * MissionApprovalBridge -> the real ApprovalEngine. It never writes
 * directly to Finance/Health collections and never bypasses ApprovalEngine.
 */
class MissionEngine {
    constructor(db, config, apiKey, approvalEngine) {
        this.db = db;
        this.config = config;
        this.apiKey = apiKey;
        this.approvalEngine = approvalEngine;
        this.missions = new MissionManager_1.MissionManager(db);
        this.tasks = new MissionTaskManager_1.MissionTaskManager(db);
        this.planner = new MissionPlanner_1.MissionPlanner(this.tasks);
        this.analytics = new MissionAnalytics_1.MissionAnalytics(this.missions);
        this.recommendationStore = new RecommendationManager_1.RecommendationManager(db);
        this.learningEngine = new LearningEngine_1.LearningEngine(db, config);
        this.recommendationEngine = new RecommendationEngine_1.RecommendationEngine(this.recommendationStore, this.learningEngine);
        this.predictionStore = new PredictionManager_1.PredictionManager(db);
        this.predictionEngine = new PredictionEngine_1.PredictionEngine(this.predictionStore, this.missions, this.tasks, config);
        this.planningEngine = new ContinuousPlanningEngine_1.ContinuousPlanningEngine(this.missions, this.recommendationStore, this.recommendationEngine, this.predictionEngine, config);
        this.scheduler = new MissionScheduler_1.MissionScheduler(this.planningEngine);
        this.permissions = new MissionPermissions_1.MissionPermissions(db);
        this.history = new MissionHistory_1.MissionHistory(db);
        this.logger = new MissionLogger_1.MissionLogger(this.history);
        this.approvalBridge = new MissionApprovalBridge_1.MissionApprovalBridge(approvalEngine, this.tasks);
    }
    // ── Missions ──────────────────────────────────────────────────────────────
    async createMission(userId, fields, plan) {
        const mission = await this.missions.createMission(userId, fields);
        await this.logger.log(userId, { requestId: mission.id, actor: userId, action: 'mission_created' });
        void this.linkMissionToMemory(userId, mission);
        const tasks = await this.planner.applyPlan(userId, mission, plan);
        return { mission, tasks };
    }
    async getMission(userId, missionId) {
        return this.missions.getMission(userId, missionId);
    }
    async listMissions(userId, opts) {
        return this.missions.listMissions(userId, opts ?? {});
    }
    async updateMission(userId, missionId, fields) {
        const updated = await this.missions.updateMission(userId, missionId, fields);
        if (updated)
            await this.logger.log(userId, { requestId: missionId, actor: userId, action: 'mission_updated', details: fields });
        return updated;
    }
    async activateMission(userId, missionId) {
        return this.updateMission(userId, missionId, { status: 'active' });
    }
    async pauseMission(userId, missionId) {
        return this.updateMission(userId, missionId, { status: 'paused' });
    }
    async abandonMission(userId, missionId, reason) {
        const result = await this.missions.abandonMission(userId, missionId, reason);
        if (result)
            await this.logger.log(userId, { requestId: missionId, actor: userId, action: 'mission_abandoned', notes: reason });
        return result;
    }
    // ── Tasks ─────────────────────────────────────────────────────────────────
    async listTasks(userId, missionId) {
        return this.tasks.listTasksForMission(userId, missionId);
    }
    async addTask(userId, missionId, fields) {
        const existing = await this.tasks.listTasksForMission(userId, missionId);
        return this.tasks.createTask(userId, {
            missionId,
            title: fields.title,
            description: fields.description,
            order: fields.order ?? existing.length,
            dependsOn: fields.dependsOn ?? [],
        });
    }
    /** Marks a task completed only if its declared dependencies are already complete, then recomputes mission progress. */
    async completeTask(userId, taskId) {
        const task = await this.tasks.getTask(userId, taskId);
        if (!task)
            return null;
        const ready = await this.tasks.dependenciesSatisfied(userId, task);
        if (!ready)
            throw new Error(`Cannot complete task ${taskId}: unmet dependencies`);
        const updated = await this.tasks.setStatus(userId, taskId, 'completed');
        if (updated) {
            await this.logger.log(userId, { requestId: taskId, actor: userId, action: 'task_completed' });
            await this.recomputeProgress(userId, task.missionId);
        }
        return updated;
    }
    async setTaskStatus(userId, taskId, status) {
        if (status === 'completed')
            return this.completeTask(userId, taskId);
        const updated = await this.tasks.setStatus(userId, taskId, status);
        if (updated)
            await this.recomputeProgress(userId, updated.missionId);
        return updated;
    }
    async recomputeProgress(userId, missionId) {
        const all = await this.tasks.listTasksForMission(userId, missionId);
        if (all.length === 0)
            return;
        const completed = all.filter((t) => t.status === 'completed').length;
        await this.missions.setProgress(userId, missionId, Math.round((completed / all.length) * 100));
    }
    // ── Approval Bridge (the ONLY path to risky action gating) ─────────────────
    async requestTaskApproval(userId, taskId, input) {
        const task = await this.tasks.getTask(userId, taskId);
        if (!task)
            throw new Error(`Task ${taskId} not found`);
        return this.approvalBridge.requestApprovalForTask(userId, task, input);
    }
    async getTaskApprovalStatus(userId, taskId) {
        const task = await this.tasks.getTask(userId, taskId);
        if (!task)
            return null;
        return this.approvalBridge.getLinkedApprovalStatus(userId, task);
    }
    // ── Recommendations ───────────────────────────────────────────────────────
    async listRecommendations(userId, minConfidence) {
        return this.recommendationEngine.listOpen(userId, minConfidence ?? this.config.minRecommendationConfidence);
    }
    async acceptRecommendation(userId, recommendationId, missionId) {
        const result = await this.recommendationEngine.accept(userId, recommendationId, missionId);
        if (result)
            await this.logger.log(userId, { requestId: recommendationId, actor: userId, action: 'recommendation_accepted', details: { missionId } });
        return result;
    }
    async dismissRecommendation(userId, recommendationId) {
        const result = await this.recommendationEngine.dismiss(userId, recommendationId);
        if (result)
            await this.logger.log(userId, { requestId: recommendationId, actor: userId, action: 'recommendation_dismissed' });
        return result;
    }
    // ── Predictions ───────────────────────────────────────────────────────────
    async getPredictionsForMission(userId, missionId) {
        const mission = await this.missions.getMission(userId, missionId);
        if (!mission)
            return [];
        return this.predictionEngine.refreshAll(userId, mission);
    }
    // ── Learning ──────────────────────────────────────────────────────────────
    async getLearningSnapshot(userId, sourceDomain) {
        return this.learningEngine.getSnapshot(userId, sourceDomain);
    }
    async getAllLearningSnapshots(userId) {
        return this.learningEngine.getAllSnapshots(userId);
    }
    // ── Continuous Planning / Scheduler ──────────────────────────────────────
    async runPlanningCycle(userId, connected = {}) {
        return this.scheduler.runAllChecks(userId, { approvals: this.approvalEngine, ...connected });
    }
    // ── Stats ─────────────────────────────────────────────────────────────────
    async getStats(userId) {
        return this.analytics.getStats(userId);
    }
    // ── History ───────────────────────────────────────────────────────────────
    async listHistory(userId, requestId) {
        if (requestId)
            return this.history.listForRequest(userId, requestId);
        return this.history.listAll(userId);
    }
    // ── Permissions passthrough ──────────────────────────────────────────────
    get permissionsApi() {
        return this.permissions;
    }
    // ── Memory Graph Integration ──────────────────────────────────────────────
    async linkMissionToMemory(userId, mission) {
        try {
            const graph = (0, memory_graph_1.getMemoryGraph)(userId, this.db, this.apiKey);
            const { node } = await graph.upsertNode('project', mission.title, `${mission.domain} mission: ${mission.description}`, { missionId: mission.id, status: mission.status }, 30);
            await this.missions.setMemoryNodeId(userId, mission.id, node.id);
        }
        catch {
            // best-effort
        }
    }
}
exports.MissionEngine = MissionEngine;
//# sourceMappingURL=MissionEngine.js.map