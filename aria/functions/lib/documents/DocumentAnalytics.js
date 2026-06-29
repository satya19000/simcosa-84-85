"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentAnalytics = void 0;
class DocumentAnalytics {
    constructor(db) {
        this.db = db;
    }
    async getStats(userId) {
        const snap = await this.db
            .collection(`users/${userId}/documents`)
            .where('status', '!=', 'deleted')
            .get();
        const docs = snap.docs.map((d) => d.data());
        const now = Date.now();
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
        const byCategory = {};
        const byFormat = {};
        const byStatus = {};
        const tagCounts = {};
        let totalSizeBytes = 0;
        let recentCount = 0;
        let starredCount = 0;
        let pinnedCount = 0;
        for (const doc of docs) {
            byCategory[doc.category] = (byCategory[doc.category] ?? 0) + 1;
            byFormat[doc.format] = (byFormat[doc.format] ?? 0) + 1;
            byStatus[doc.status] = (byStatus[doc.status] ?? 0) + 1;
            totalSizeBytes += doc.sizeBytes ?? 0;
            if (doc.createdAt >= sevenDaysAgo)
                recentCount++;
            if (doc.starred)
                starredCount++;
            if (doc.pinned)
                pinnedCount++;
            for (const tag of doc.tags ?? []) {
                tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
            }
        }
        const topTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));
        return {
            total: docs.length,
            byCategory: byCategory,
            byFormat: byFormat,
            byStatus,
            topTags,
            totalSizeBytes,
            recentCount,
            starredCount,
            pinnedCount,
        };
    }
}
exports.DocumentAnalytics = DocumentAnalytics;
//# sourceMappingURL=DocumentAnalytics.js.map