"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
/**
 * Cross-cuts all agent outputs and validates them for completeness and safety.
 * Used by the Orchestrator as a final quality gate.
 */
class ValidatorAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.manifest = {
            id: 'validator-agent',
            name: 'Validator Agent',
            description: 'Validates agent outputs for completeness and safety',
            version: '1.0.0',
            capabilities: ['validation'],
        };
    }
    canHandle(task) {
        return task.capability === 'validation';
    }
    async execute(task, ctx) {
        const startMs = Date.now();
        const results = task.input['results'];
        if (!results || results.length === 0) {
            return this.makeResult(task, ctx, { outcome: 'pass', issues: [] }, 'Nothing to validate', startMs);
        }
        const issues = [];
        for (const r of results) {
            if (r.status === 'failed') {
                issues.push(`Task "${r.taskId}" failed: ${r.error ?? 'unknown error'}`);
            }
            else if (r.output === null || r.output === undefined) {
                issues.push(`Task "${r.taskId}" completed with null output`);
            }
        }
        const outcome = issues.length === 0 ? 'pass' : 'fail';
        return this.makeResult(task, ctx, { outcome, issues }, outcome === 'pass' ? 'All outputs validated' : `Validation issues: ${issues.join('; ')}`, startMs);
    }
    async validate(result, _ctx) {
        // Validator always passes its own output
        return { outcome: 'pass', issues: [], confidence: 1 };
    }
}
exports.ValidatorAgent = ValidatorAgent;
//# sourceMappingURL=ValidatorAgent.js.map