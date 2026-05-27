import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "tasks.db");

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: number;
  title: string;
  status: "todo" | "done";
  priority: Priority;
  createdAt: string;
}

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    const SQL = await initSqlJs();
    const fileBuffer = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;
    db = fileBuffer ? new SQL.Database(new Uint8Array(fileBuffer)) : new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'todo',
        priority TEXT NOT NULL DEFAULT 'MEDIUM',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Add priority column to existing databases that predate this field
    try {
      db.run("ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'MEDIUM'");
    } catch {
      // Column already exists — safe to ignore
    }
    save();
  }
  return db;
}

function save(): void {
  if (!db) return;
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

export async function getAllTasks(): Promise<Task[]> {
  const database = await getDb();
  const stmt = database.prepare(
    "SELECT id, title, status, priority, created_at as createdAt FROM tasks ORDER BY id"
  );
  const rows: Task[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    rows.push({
      id: row["id"] as number,
      title: row["title"] as string,
      status: row["status"] as "todo" | "done",
      priority: (row["priority"] ?? "MEDIUM") as Priority,
      createdAt: row["createdAt"] as string,
    });
  }
  stmt.free();
  return rows;
}

export async function addTask(title: string, priority: Priority = "MEDIUM"): Promise<Task> {
  const database = await getDb();
  database.run("INSERT INTO tasks (title, priority) VALUES (?, ?)", [title, priority]);
  const result = database.exec("SELECT last_insert_rowid()");
  const id = result[0].values[0][0] as number;
  save();
  return { id, title, status: "todo", priority, createdAt: new Date().toISOString() };
}

export async function markDone(id: number): Promise<boolean> {
  const database = await getDb();
  database.run("UPDATE tasks SET status = 'done' WHERE id = ?", [id]);
  const changed = database.getRowsModified() > 0;
  if (changed) save();
  return changed;
}

export async function deleteTask(id: number): Promise<boolean> {
  const database = await getDb();
  database.run("DELETE FROM tasks WHERE id = ?", [id]);
  const changed = database.getRowsModified() > 0;
  if (changed) save();
  return changed;
}
