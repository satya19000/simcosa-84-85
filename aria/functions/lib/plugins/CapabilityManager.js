"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapabilityManager = void 0;
const PluginPermissions_1 = require("./PluginPermissions");
/**
 * Wraps PermissionManager with capability-level checks.
 * Plugins interact through capabilities; permissions are implementation detail.
 */
class CapabilityManager {
    constructor(permissions) {
        this.permissions = permissions;
    }
    hasCapability(pluginId, capability) {
        const required = PluginPermissions_1.CAPABILITY_PERMISSIONS[capability] ?? [];
        return required.every((perm) => this.permissions.has(pluginId, perm));
    }
    /** Throws if the plugin lacks the required capability. Use inside plugin handlers. */
    requireCapability(pluginId, capability) {
        if (!this.hasCapability(pluginId, capability)) {
            throw new Error(`Plugin "${pluginId}" does not have capability "${capability}". ` +
                `Declare it in your manifest and ensure permissions are granted.`);
        }
    }
    listGrantedCapabilities(pluginId) {
        const allCapabilities = Object.keys(PluginPermissions_1.CAPABILITY_PERMISSIONS);
        return allCapabilities.filter((cap) => this.hasCapability(pluginId, cap));
    }
}
exports.CapabilityManager = CapabilityManager;
//# sourceMappingURL=CapabilityManager.js.map