"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelBenchmark = void 0;
/**
 * Lightweight in-memory benchmark aggregator. Each AIGateway request can
 * feed a sample here; getSummary() rolls them up per (provider, model) for
 * the dashboard's "observed performance" view. This is intentionally
 * process-local (not persisted) — ProviderHealth is the durable source of
 * truth for routing decisions; ModelBenchmark is an inspection aid layered
 * on top, not a second source of routing truth.
 */
class ModelBenchmark {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.samples = [];
        void this.healthTracker;
    }
    record(sample) {
        this.samples.push(sample);
        if (this.samples.length > ModelBenchmark.MAX_SAMPLES) {
            this.samples = this.samples.slice(-ModelBenchmark.MAX_SAMPLES);
        }
    }
    getSummary() {
        const grouped = new Map();
        for (const sample of this.samples) {
            const key = `${sample.provider}::${sample.model}`;
            const list = grouped.get(key) ?? [];
            list.push(sample);
            grouped.set(key, list);
        }
        return Array.from(grouped.entries()).map(([key, samples]) => {
            const [provider, model] = key.split('::');
            const avgLatencyMs = Math.round(samples.reduce((s, x) => s + x.latencyMs, 0) / samples.length);
            const successRate = samples.filter((x) => x.success).length / samples.length;
            return { provider, model, sampleCount: samples.length, avgLatencyMs, successRate };
        });
    }
}
exports.ModelBenchmark = ModelBenchmark;
ModelBenchmark.MAX_SAMPLES = 500;
//# sourceMappingURL=ModelBenchmark.js.map