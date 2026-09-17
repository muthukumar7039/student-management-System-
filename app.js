import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import db from "./database.js";
import { validateStudent } from "./validation.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const clientOrigin = process.env.CLIENT_ORIGIN || true;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "100kb" }));

const selectStudent = db.prepare("SELECT * FROM students WHERE id = ?");
const selectAll = db.prepare("SELECT * FROM students ORDER BY created_at DESC, id DESC");

function sendError(res, status, message, details) {
  return res.status(status).json({ success: false, message, ...(details ? { errors: details } : {}) });
}

function handleDatabaseError(res, error) {
  if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
    const field = String(error.message).includes("register_number") ? "register_number" : "email";
    return sendError(res, 409, `${field === "register_number" ? "Register number" : "Email"} is already in use.`, {
      [field]: `${field === "register_number" ? "Register number" : "Email"} must be unique.`
    });
  }
  console.error(error);
  return sendError(res, 500, "The server could not complete that request.");
}

function buildWhere(query) {
  const clauses = [];
  const params = {};
  if (query.search?.trim()) {
    clauses.push("(full_name LIKE @search OR register_number LIKE @search OR email LIKE @search)");
    params.search = `%${query.search.trim()}%`;
  }
  if (query.department?.trim()) {
    clauses.push("department = @department");
    params.department = query.department.trim();
  }
  if (query.year) {
    const year = Number(query.year);
    if (Number.isInteger(year) && year >= 1 && year <= 4) {
      clauses.push("year = @year");
      params.year = year;
    }
  }
  return { sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

app.get("/api/health", (_req, res) => res.json({ success: true, status: "ok" }));

function listStudents(req, res) {
  try {
    const { sql, params } = buildWhere(req.query);
    const students = db.prepare(`SELECT * FROM students ${sql} ORDER BY created_at DESC, id DESC`).all(params);
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    handleDatabaseError(res, error);
  }
}

app.get("/api/students/search", (req, res) => {
  req.query.search = req.query.q || req.query.search;
  return listStudents(req, res);
});
app.get("/api/students", listStudents);

app.get("/api/students/:id", (req, res) => {
  const student = selectStudent.get(Number(req.params.id));
  if (!student) return sendError(res, 404, "Student record not found.");
  return res.json({ success: true, data: student });
});

app.post("/api/students", (req, res) => {
  const { errors, values } = validateStudent(req.body);
  if (Object.keys(errors).length) return sendError(res, 400, "Please correct the highlighted fields.", errors);
  try {
    const result = db.prepare(`
      INSERT INTO students (register_number, full_name, email, phone_number, department, year, gender, admission_date)
      VALUES (@register_number, @full_name, @email, @phone_number, @department, @year, @gender, @admission_date)
    `).run(values);
    const student = selectStudent.get(result.lastInsertRowid);
    return res.status(201).json({ success: true, message: "Student added successfully.", data: student });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
});

app.put("/api/students/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!selectStudent.get(id)) return sendError(res, 404, "Student record not found.");
  const { errors, values } = validateStudent(req.body);
  if (Object.keys(errors).length) return sendError(res, 400, "Please correct the highlighted fields.", errors);
  try {
    db.prepare(`
      UPDATE students SET register_number=@register_number, full_name=@full_name, email=@email,
      phone_number=@phone_number, department=@department, year=@year, gender=@gender,
      admission_date=@admission_date, updated_at=CURRENT_TIMESTAMP WHERE id=@id
    `).run({ ...values, id });
    return res.json({ success: true, message: "Student updated successfully.", data: selectStudent.get(id) });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
});

app.delete("/api/students/:id", (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare("DELETE FROM students WHERE id = ?").run(id);
  if (!result.changes) return sendError(res, 404, "Student record not found.");
  return res.json({ success: true, message: "Student deleted successfully." });
});

app.get("/api/dashboard/stats", (_req, res) => {
  try {
    const total = db.prepare("SELECT COUNT(*) AS count FROM students").get().count;
    const departments = db.prepare("SELECT department AS name, COUNT(*) AS count FROM students GROUP BY department ORDER BY count DESC, name ASC").all();
    const years = db.prepare("SELECT year, COUNT(*) AS count FROM students GROUP BY year ORDER BY year ASC").all();
    const recent = db.prepare("SELECT * FROM students ORDER BY created_at DESC, id DESC LIMIT 5").all();
    return res.json({ success: true, data: { total, departments, years, recent } });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
});

app.use(express.static(path.resolve(__dirname, "../dist")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  return res.sendFile(path.resolve(__dirname, "../dist/index.html"));
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) return sendError(res, 400, "Request body must be valid JSON.");
  return handleDatabaseError(res, error);
});

if (process.env.NODE_ENV !== "test") {
  app.listen(port, "0.0.0.0", () => console.log(`CampusCore server listening on port ${port}`));
}

export default app;