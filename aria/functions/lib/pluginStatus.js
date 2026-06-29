"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPluginStatus = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const plugins_1 = require("./plugins");
exports.getPluginStatus = (0, https_1.onCall)({ secrets: [] }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in');
    const userId = request.auth.uid;
    const db = (0, firestore_1.getFirestore)();
    await (0, plugins_1.initializePlugins)(db, userId);
    const runtime = (0, plugins_1.getPluginRuntime)(db);
    const health = await runtime.getHealth(userId);
    const metrics = runtime.getAllMetrics();
    return { health, metrics };
});
//# sourceMappingURL=pluginStatus.js.map