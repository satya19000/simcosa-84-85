"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpolate = interpolate;
/** Replace {{varName}} tokens in a template string from context vars. */
function interpolate(template, vars) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const val = vars[key];
        return val !== undefined ? String(val) : `{{${key}}}`;
    });
}
//# sourceMappingURL=WorkflowContext.js.map