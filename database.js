import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const databasePath = process.env.DATABASE_PATH || "./data/student_management.db";
const resolvedPath = path.resolve(databasePath);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(path.resolve("database/schema.sql"), "utf8");
db.exec(schema);

export default db;