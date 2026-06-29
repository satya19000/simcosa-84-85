"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWorkflow = validateWorkflow;
function validateStep(step, path) {
    const errors = [];
    if (!step.id?.trim())
        errors.push({ path: `${path}.id`, message: 'Step id is required' });
    if (!step.name?.trim())
        errors.push({ path: `${path}.name`, message: 'Step name is required' });
    switch (step.type) {
        case 'run_action':
            if (!step.toolName?.trim())
                errors.push({ path: `${path}.toolName`, message: 'toolName is required for run_action steps' });
            break;
        case 'run_plugin':
            if (!step.pluginId?.trim())
                errors.push({ path: `${path}.pluginId`, message: 'pluginId is required for run_plugin steps' });
            if (!step.toolName?.trim())
                errors.push({ path: `${path}.toolName`, message: 'toolName is required for run_plugin steps' });
            break;
        case 'run_ai':
            if (!step.prompt?.trim())
                errors.push({ path: `${path}.prompt`, message: 'prompt is required for run_ai steps' });
            break;
        case 'delay':
            if (typeof step.durationMs !== 'number' || step.durationMs <= 0) {
                errors.push({ path: `${path}.durationMs`, message: 'durationMs must be a positive number' });
            }
            break;
        case 'parallel':
            if (!step.steps || step.steps.length === 0) {
                errors.push({ path: `${path}.steps`, message: 'parallel step must have at least one child step' });
            }
            else {
                step.steps.flatMap((s, i) => validateStep(s, `${path}.steps[${i}]`)).forEach((e) => errors.push(e));
            }
            break;
        case 'loop':
            if (!step.steps || step.steps.length === 0) {
                errors.push({ path: `${path}.steps`, message: 'loop step must have at least one child step' });
            }
            if (typeof step.maxIterations !== 'number' || step.maxIterations <= 0) {
                errors.push({ path: `${path}.maxIterations`, message: 'maxIterations must be a positive number' });
            }
            break;
        case 'notification':
            if (!step.title?.trim())
                errors.push({ path: `${path}.title`, message: 'title is required for notification steps' });
            if (!step.body?.trim())
                errors.push({ path: `${path}.body`, message: 'body is required for notification steps' });
            break;
        case 'speak_text':
            if (!step.text?.trim())
                errors.push({ path: `${path}.text`, message: 'text is required for speak_text steps' });
            break;
        case 'custom':
            if (!step.handler?.trim())
                errors.push({ path: `${path}.handler`, message: 'handler is required for custom steps' });
            break;
    }
    return errors;
}
function validateWorkflow(def) {
    const errors = [];
    if (!def.id?.trim())
        errors.push({ path: 'id', message: 'Workflow id is required' });
    if (!def.name?.trim())
        errors.push({ path: 'name', message: 'Workflow name is required' });
    if (!def.version?.trim())
        errors.push({ path: 'version', message: 'Workflow version is required' });
    if (!def.trigger)
        errors.push({ path: 'trigger', message: 'Workflow trigger is required' });
    if (!def.steps || def.steps.length === 0) {
        errors.push({ path: 'steps', message: 'Workflow must have at least one step' });
    }
    else {
        def.steps
            .flatMap((s, i) => validateStep(s, `steps[${i}]`))
            .forEach((e) => errors.push(e));
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=WorkflowValidator.js.map