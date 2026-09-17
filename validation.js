const departments = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Business Administration"
];

const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateStudent(payload = {}) {
  const errors = {};
  const values = {
    register_number: String(payload.register_number ?? "").trim(),
    full_name: String(payload.full_name ?? "").trim(),
    email: String(payload.email ?? "").trim().toLowerCase(),
    phone_number: String(payload.phone_number ?? "").trim(),
    department: String(payload.department ?? "").trim(),
    year: Number(payload.year),
    gender: String(payload.gender ?? "").trim(),
    admission_date: String(payload.admission_date ?? "").trim()
  };

  if (!values.register_number) errors.register_number = "Register number is required.";
  else if (!/^[A-Za-z0-9][A-Za-z0-9/_-]{2,19}$/.test(values.register_number)) {
    errors.register_number = "Use 3–20 letters, numbers, /, _ or -.";
  }
  if (!values.full_name) errors.full_name = "Full name is required.";
  else if (!/^[\p{L}][\p{L}\s.'-]{1,79}$/u.test(values.full_name)) {
    errors.full_name = "Enter a valid name using letters, spaces, or . ' -.";
  }
  if (!values.email) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) errors.email = "Enter a valid email address.";
  if (values.phone_number && !/^\+?[0-9\s()-]{7,20}$/.test(values.phone_number)) {
    errors.phone_number = "Enter a valid phone number.";
  }
  if (!departments.includes(values.department)) errors.department = "Select a valid department.";
  if (!Number.isInteger(values.year) || values.year < 1 || values.year > 4) errors.year = "Year must be between 1 and 4.";
  if (values.gender && !genders.includes(values.gender)) errors.gender = "Select a valid gender.";
  if (!isValidDate(values.admission_date)) errors.admission_date = "Use a valid date in YYYY-MM-DD format.";

  return { errors, values };
}

export { departments, genders };