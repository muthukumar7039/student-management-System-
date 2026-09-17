import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "campuscore-"));
const databasePath = path.join(tempDir, "student_management.db");
const port = 3400 + Math.floor(Math.random() * 400);
const server = spawn(process.execPath, ["server/app.js"], {
  env: { ...process.env, NODE_ENV: "test-run", PORT: String(port), DATABASE_PATH: databasePath, CLIENT_ORIGIN: "http://localhost" },
  stdio: ["ignore", "pipe", "pipe"]
});

const base = `http://127.0.0.1:${port}/api`;
const validStudent = {
  register_number: "IT2026001",
  full_name: "Ravi Kumar",
  email: "ravi@example.com",
  phone_number: "9876543210",
  department: "Information Technology",
  year: 2,
  gender: "Male",
  admission_date: "2025-08-01"
};

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Test server did not start.");
}

async function call(endpoint, options) {
  const response = await fetch(`${base}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options?.body ? JSON.stringify(options.body) : undefined
  });
  return { status: response.status, body: await response.json() };
}

try {
  await waitForServer();
  const created = await call("/students", { method: "POST", body: validStudent });
  assert.equal(created.status, 201, "TC-01 create valid student");
  const id = created.body.data.id;

  const missing = await call("/students", { method: "POST", body: {} });
  assert.equal(missing.status, 400, "TC-02 missing fields");
  const invalidEmail = await call("/students", { method: "POST", body: { ...validStudent, register_number: "IT2026002", email: "not-an-email" } });
  assert.equal(invalidEmail.status, 400, "TC-03 invalid email");
  const duplicateRegister = await call("/students", { method: "POST", body: { ...validStudent, email: "other@example.com" } });
  assert.equal(duplicateRegister.status, 409, "TC-04 duplicate register number");
  const duplicateEmail = await call("/students", { method: "POST", body: { ...validStudent, register_number: "IT2026002" } });
  assert.equal(duplicateEmail.status, 409, "TC-05 duplicate email");

  const all = await call("/students");
  assert.equal(all.status, 200, "TC-06 read all");
  assert.equal(all.body.count, 1);
  const one = await call(`/students/${id}`);
  assert.equal(one.status, 200, "TC-07 read one");
  assert.equal(one.body.data.full_name, "Ravi Kumar");
  assert.equal((await call("/students/999999")).status, 404, "TC-08 missing read");

  const updated = await call(`/students/${id}`, { method: "PUT", body: { ...validStudent, full_name: "Ravi K. Kumar", year: 3 } });
  assert.equal(updated.status, 200, "TC-09 update");
  assert.equal(updated.body.data.year, 3);
  assert.equal((await call("/students/999999", { method: "PUT", body: validStudent })).status, 404, "TC-10 missing update");

  const search = await call("/students/search?q=Ravi");
  assert.equal(search.status, 200, "TC-13 search");
  assert.equal(search.body.count, 1);
  const filters = await call("/students?department=Information%20Technology&year=3");
  assert.equal(filters.status, 200, "TC-14 filters");
  assert.equal(filters.body.count, 1);
  const stats = await call("/dashboard/stats");
  assert.equal(stats.status, 200, "TC-15 dashboard stats");
  assert.equal(stats.body.data.total, 1);

  assert.equal((await call(`/students/${id}`, { method: "DELETE" })).status, 200, "TC-11 delete");
  assert.equal((await call(`/students/${id}`, { method: "DELETE" })).status, 404, "TC-12 missing delete");
  console.log("API tests passed: 15 automated cases.");
} finally {
  server.kill("SIGTERM");
  fs.rmSync(tempDir, { recursive: true, force: true });
}