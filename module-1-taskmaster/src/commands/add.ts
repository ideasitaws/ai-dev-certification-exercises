import { addTask, Priority } from "../db";

const VALID_PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

export async function handleAdd(title: string, options: { priority: string }): Promise<void> {
  const priority = options.priority.toUpperCase() as Priority;
  if (!VALID_PRIORITIES.includes(priority)) {
    console.error(`Error: priority must be LOW, MEDIUM, or HIGH`);
    process.exit(1);
  }
  const task = await addTask(title, priority);
  console.log(`✓ Added task #${task.id}: "${task.title}" [${task.priority}]`);
}
