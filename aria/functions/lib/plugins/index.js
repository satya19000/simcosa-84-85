"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRuntime = void 0;
exports.getPluginRuntime = getPluginRuntime;
exports.initializePlugins = initializePlugins;
exports.getPluginTools = getPluginTools;
exports.executePluginTool = executePluginTool;
const PluginRuntime_1 = require("./PluginRuntime");
Object.defineProperty(exports, "PluginRuntime", { enumerable: true, get: function () { return PluginRuntime_1.PluginRuntime; } });
const NotesPlugin_1 = require("./samples/NotesPlugin");
const WeatherPlugin_1 = require("./samples/WeatherPlugin");
let runtimeInstance = null;
let initialized = false;
function getPluginRuntime(db) {
    if (!runtimeInstance) {
        runtimeInstance = new PluginRuntime_1.PluginRuntime(db);
    }
    return runtimeInstance;
}
async function initializePlugins(db, userId) {
    if (initialized)
        return;
    initialized = true;
    const runtime = getPluginRuntime(db);
    const plugins = [new NotesPlugin_1.NotesPlugin(), new WeatherPlugin_1.WeatherPlugin()];
    await Promise.allSettled(plugins.map((p) => runtime.loadPlugin(p, userId)));
}
async function getPluginTools(db, userId) {
    await initializePlugins(db, userId);
    return getPluginRuntime(db).getAllToolDefinitions();
}
async function executePluginTool(toolName, args, userId, db) {
    return getPluginRuntime(db).executeTool(toolName, args, userId);
}
//# sourceMappingURL=index.js.map