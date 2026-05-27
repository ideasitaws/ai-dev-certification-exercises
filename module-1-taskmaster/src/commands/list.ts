import { getAllTasks } from "../db";

const PRIORITY_DISPLAY: Record<string, string> = {
  HIGH:   "\x1b[31mHIGH  \x1b[0m",  // red
  MEDIUM: "\x1b[33mMED   \x1b[0m",  // yellow
  LOW:    "\x1b[32mLOW   \x1b[0m",  // green
};

export async function handleList(): Promise<void> {
  const tasks = await getAllTasks();

  if (tasks.length === 0) {
    console.log("No tasks yet. Add one with: taskmaster add \"Your task\"");
    return;
  }

  console.log("\n  ID  Status  Priority  Title");
  console.log("  " + "─".repeat(48));

  for (const task of tasks) {
    const status = task.status === "done" ? "✓ done" : "○ todo";
    const priority = PRIORITY_DISPLAY[task.priority] ?? PRIORITY_DISPLAY["MEDIUM"];
    console.log(`  ${String(task.id).padStart(2)}  ${status.padEnd(6)}  ${priority}  ${task.title}`);
  }

  console.log();
}
