"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "shouldRunScheduledTasks", {
    enumerable: true,
    get: function() {
        return shouldRunScheduledTasks;
    }
});
function shouldRunScheduledTasks() {
    return process.env.RUN_SCHEDULED_JOBS !== "false";
}

//# sourceMappingURL=scheduled-tasks.js.map