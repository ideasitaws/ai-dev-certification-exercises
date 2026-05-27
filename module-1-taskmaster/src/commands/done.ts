import { markDone } from "../db";

export async function handleDone(id: string): Promise<void> {
  const taskId = parseInt(id, 10);
  if (isNaN(taskId)) {
    console.error("Error: ID must be a number");
    process.exit(1);
  }

  if (await markDone(taskId)) {
    console.log(`✓ Task #${taskId} marked as done`);
  } else {
    console.error(`Error: Task #${taskId} not found`);
    process.exit(1);
  }
}
