export function shouldRunScheduledTasks(): boolean {
  return process.env.RUN_SCHEDULED_JOBS !== "false";
}
