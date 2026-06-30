"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillDependencyResolver = void 0;
const KNOWN_ENGINES = [
    'finance', 'delegation', 'mission-control', 'organization', 'security',
    'plugins', 'action-engine', 'intelligence', 'memory-graph', 'health', 'communication', 'documents',
];
/** Resolves a skill manifest's requiredPlugins/requiredEngines against what is actually installed/available. */
class SkillDependencyResolver {
    resolve(manifest, installedPluginIds) {
        const missingPlugins = manifest.requiredPlugins.filter((id) => !installedPluginIds.includes(id));
        const missingEngines = manifest.requiredEngines.filter((name) => !KNOWN_ENGINES.includes(name));
        return {
            resolved: missingPlugins.length === 0 && missingEngines.length === 0,
            missingPlugins,
            missingEngines,
        };
    }
}
exports.SkillDependencyResolver = SkillDependencyResolver;
//# sourceMappingURL=SkillDependencyResolver.js.map