import { useCallback, useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BarChart3, BookOpen, CheckCircle2, ChevronRight, ClipboardList, FilePlus2,
  GraduationCap, LayoutDashboard, Menu, Pencil, Plus, Search, Trash2, Users, X
} from "lucide-react";
import { api } from "./api.js";

const departments = [
  "Computer Science", "Information Technology", "Electronics & Communication",
  "Mechanical Engineering", "Civil Engineering", "Electrical Engineering", "Business Administration"
];
const emptyForm = {
  register_number: "", full_name: "", email: "", phone_number: "", department: "",
  year: "", gender: "", admission_date: ""
};

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);
  const notify = useCallback((type, message) => setToast({ type, message }), []);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><GraduationCap size={22} /></div>
          <div><strong>CampusCore</strong><span>Student records</span></div>
          <button className="icon-button close-sidebar" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <div className="nav-section-label">Workspace</div>
        <nav className="main-nav" aria-label="Primary navigation">
          <NavLink to="/" end><LayoutDashboard size={18} /> Dashboard</NavLink>
          <NavLink to="/students"><Users size={18} /> Students <span className="nav-chevron"><ChevronRight size={14} /></span></NavLink>
          <NavLink to="/students/new"><FilePlus2 size={18} /> Add student</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-icon"><BookOpen size={18} /></div>
          <div><strong>Academic year</strong><span>2025 – 2026</span></div>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}
      <main className="main-content">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={15} /><strong>{location.pathname === "/" ? "Dashboard" : location.pathname.includes("new") ? "Add student" : "Students"}</strong></div>
          <div className="topbar-actions"><div className="avatar">AD</div><span className="admin-name">Admin</span></div>
        </header>
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard onNotify={notify} />} />
            <Route path="/students" element={<Students onNotify={notify} />} />
            <Route path="/students/new" element={<StudentForm onNotify={notify} />} />
            <Route path="/students/:id/edit" element={<StudentForm onNotify={notify} />} />
            <Route path="/students/:id" element={<StudentDetails onNotify={notify} />} />
            <Route path="*" element={<Dashboard onNotify={notify} />} />
          </Routes>
        </div>
      </main>
      {toast && <div className={`toast toast-${toast.type}`} role="status"><CheckCircle2 size={18} /><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

function Dashboard({ onNotify }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.getStats().then((result) => setStats(result.data)).catch((error) => onNotify("error", error.message)).finally(() => setLoading(false));
  }, [onNotify]);
  const yearCount = (year) => stats?.years.find((item) => item.year === year)?.count || 0;
  return <section>
    <PageHeading eyebrow="Overview" title="Good morning, Admin" description="Here’s what’s happening across your student records today." action={<NavLink className="primary-button" to="/students/new"><Plus size={18} /> Add student</NavLink>} />
    {loading ? <LoadingState label="Loading dashboard..." /> : <div className="dashboard-grid">
      <div className="stat-card stat-card-primary"><div className="stat-icon"><Users size={21} /></div><div><span>Total students</span><strong>{stats.total}</strong><small>Active records</small></div><BarChart3 className="stat-spark" size={62} /></div>
      <div className="stat-card"><div className="stat-icon soft-blue"><ClipboardList size={21} /></div><div><span>Departments</span><strong>{stats.departments.length}</strong><small>Across the campus</small></div></div>
      <div className="stat-card"><div className="stat-icon soft-green"><GraduationCap size={21} /></div><div><span>New this year</span><strong>{stats.total ? stats.recent.filter((student) => student.admission_date?.startsWith("2025")).length : 0}</strong><small>Recent admissions</small></div></div>
      <div className="stat-card"><div className="stat-icon soft-orange"><BookOpen size={21} /></div><div><span>Senior students</span><strong>{yearCount(3) + yearCount(4)}</strong><small>Year 3 & 4</small></div></div>
      <div className="panel year-panel"><div className="panel-heading"><div><h2>Students by year</h2><p>Current distribution</p></div><span className="panel-badge">2025–26</span></div><div className="year-bars">{[1, 2, 3, 4].map((year) => <div className="year-bar-row" key={year}><span>Year {year}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${stats.total ? Math.max(4, (yearCount(year) / stats.total) * 100) : 0}%` }} /></div><strong>{yearCount(year)}</strong></div>)}</div></div>
      <div className="panel department-panel"><div className="panel-heading"><div><h2>Departments</h2><p>Student distribution</p></div><NavLink to="/students">View all <ChevronRight size={15} /></NavLink></div>{stats.departments.length ? <div className="department-list">{stats.departments.slice(0, 5).map((department, index) => <div className="department-row" key={department.name}><span className={`department-dot dot-${index % 5}`} /> <span>{department.name}</span><strong>{department.count}</strong></div>)}</div> : <EmptyState compact title="No department data yet" description="Add a student to see the breakdown." />}</div>
      <div className="panel recent-panel"><div className="panel-heading"><div><h2>Recent students</h2><p>Latest records added</p></div><NavLink to="/students">View all <ChevronRight size={15} /></NavLink></div>{stats.recent.length ? <div className="recent-list">{stats.recent.map((student) => <NavLink className="recent-row" to={`/students/${student.id}`} key={student.id}><div className="student-avatar">{initials(student.full_name)}</div><div><strong>{student.full_name}</strong><span>{student.register_number} · {student.department}</span></div><ChevronRight size={16} /></NavLink>)}</div> : <EmptyState compact title="Your dashboard is ready" description="Add your first student record to get started." />}</div>
    </div>}
  </section>;
}

function Students({ onNotify }) {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ search: "", department: "", year: "" });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const loadStudents = useCallback(() => {
    setLoading(true);
    api.getStudents(filters).then((result) => setStudents(result.data)).catch((error) => onNotify("error", error.message)).finally(() => setLoading(false));
  }, [filters, onNotify]);
  useEffect(() => { const timer = setTimeout(loadStudents, 200); return () => clearTimeout(timer); }, [loadStudents]);
  const clearFilters = () => setFilters({ search: "", department: "", year: "" });
  const deleteStudent = async (student) => {
    if (!window.confirm(`Delete ${student.full_name}'s record? This action cannot be undone.`)) return;
    setDeleting(student.id);
    try { await api.deleteStudent(student.id); onNotify("success", "Student record deleted."); loadStudents(); }
    catch (error) { onNotify("error", error.message); } finally { setDeleting(null); }
  };
  return <section>
    <PageHeading eyebrow="Directory" title="Student management" description="Search, filter, and manage every student record in one place." action={<NavLink className="primary-button" to="/students/new"><Plus size={18} /> Add student</NavLink>} />
    <div className="panel records-panel">
      <div className="filters"><div className="search-input"><Search size={18} /><input aria-label="Search students" placeholder="Search by name, register number, or email..." value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></div><select aria-label="Filter by department" value={filters.department} onChange={(event) => setFilters({ ...filters, department: event.target.value })}><option value="">All departments</option>{departments.map((department) => <option key={department}>{department}</option>)}</select><select aria-label="Filter by year" value={filters.year} onChange={(event) => setFilters({ ...filters, year: event.target.value })}><option value="">All years</option>{[1, 2, 3, 4].map((year) => <option value={year} key={year}>Year {year}</option>)}</select>{(filters.search || filters.department || filters.year) && <button className="text-button" onClick={clearFilters}>Clear filters</button>}</div>
      <div className="records-meta"><strong>{loading ? "Loading..." : `${students.length} ${students.length === 1 ? "student" : "students"}`}</strong><span>{filters.search || filters.department || filters.year ? "matching your filters" : "all records"}</span></div>
      {loading ? <LoadingState label="Loading student records..." /> : students.length ? <div className="table-wrap"><table><thead><tr><th>Student</th><th>Register number</th><th>Department</th><th>Year</th><th>Admission date</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td><NavLink className="table-student" to={`/students/${student.id}`}><div className="student-avatar">{initials(student.full_name)}</div><div><strong>{student.full_name}</strong><span>{student.email}</span></div></NavLink></td><td><span className="mono">{student.register_number}</span></td><td>{student.department}</td><td><span className="year-pill">Year {student.year}</span></td><td>{formatDate(student.admission_date)}</td><td><div className="row-actions"><NavLink className="icon-action" to={`/students/${student.id}`} aria-label={`View ${student.full_name}`}><Search size={16} /></NavLink><NavLink className="icon-action" to={`/students/${student.id}/edit`} aria-label={`Edit ${student.full_name}`}><Pencil size={16} /></NavLink><button className="icon-action danger" onClick={() => deleteStudent(student)} disabled={deleting === student.id} aria-label={`Delete ${student.full_name}`}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No students found" description={filters.search || filters.department || filters.year ? "Try changing your search or filters." : "Your student directory is empty. Add the first record to begin."} action={<NavLink className="secondary-button" to="/students/new"><Plus size={17} /> Add student</NavLink>} />}
    </div>
  </section>;
}

function StudentForm({ onNotify }) {
  const { id } = useParamsSafe();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!editing) return;
    api.getStudent(id).then((result) => setForm({ ...result.data, year: String(result.data.year) })).catch((error) => { onNotify("error", error.message); navigate("/students"); }).finally(() => setLoading(false));
  }, [editing, id, navigate, onNotify]);
  const update = (field, value) => { setForm({ ...form, [field]: value }); if (errors[field]) setErrors({ ...errors, [field]: "" }); };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setErrors({});
    try { const result = editing ? await api.updateStudent(id, form) : await api.createStudent(form); onNotify("success", result.message); navigate(editing ? `/students/${id}` : "/students"); }
    catch (error) { setErrors(error.errors || {}); onNotify("error", error.message); } finally { setSaving(false); }
  };
  if (loading) return <LoadingState label="Loading student..." />;
  return <section>
    <button className="back-link" onClick={() => navigate(editing ? `/students/${id}` : "/students")}><ArrowLeft size={16} /> Back to students</button>
    <PageHeading eyebrow={editing ? "Student record" : "New record"} title={editing ? "Edit student" : "Add a student"} description={editing ? "Update the details below and save your changes." : "Create a new student record for the campus directory."} />
    <form className="panel form-panel" onSubmit={submit} noValidate><div className="form-section"><div className="form-section-heading"><div className="form-number">01</div><div><h2>Personal information</h2><p>Basic details used to identify the student.</p></div></div><div className="form-grid"><Field label="Full name" required error={errors.full_name}><input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="e.g. Ravi Kumar" autoComplete="name" /></Field><Field label="Register number" required error={errors.register_number}><input value={form.register_number} onChange={(e) => update("register_number", e.target.value)} placeholder="e.g. IT2026001" /></Field><Field label="Email address" required error={errors.email}><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="student@example.com" autoComplete="email" /></Field><Field label="Phone number" error={errors.phone_number}><input value={form.phone_number} onChange={(e) => update("phone_number", e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" /></Field></div></div><div className="form-section"><div className="form-section-heading"><div className="form-number">02</div><div><h2>Academic details</h2><p>Course and admission information for this record.</p></div></div><div className="form-grid"><Field label="Department" required error={errors.department}><select value={form.department} onChange={(e) => update("department", e.target.value)}><option value="">Select department</option>{departments.map((department) => <option key={department}>{department}</option>)}</select></Field><Field label="Year" required error={errors.year}><select value={form.year} onChange={(e) => update("year", e.target.value)}><option value="">Select year</option>{[1, 2, 3, 4].map((year) => <option value={year} key={year}>Year {year}</option>)}</select></Field><Field label="Gender" error={errors.gender}><select value={form.gender} onChange={(e) => update("gender", e.target.value)}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option></select></Field><Field label="Admission date" required error={errors.admission_date}><input type="date" value={form.admission_date} onChange={(e) => update("admission_date", e.target.value)} /></Field></div></div><div className="form-actions"><button type="button" className="secondary-button" onClick={() => navigate(editing ? `/students/${id}` : "/students")}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Add student"}</button></div></form>
  </section>;
}

function StudentDetails({ onNotify }) {
  const { id } = useParamsSafe();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getStudent(id).then((result) => setStudent(result.data)).catch((error) => { onNotify("error", error.message); navigate("/students"); }).finally(() => setLoading(false)); }, [id, navigate, onNotify]);
  if (loading) return <LoadingState label="Loading student details..." />;
  if (!student) return null;
  return <section><button className="back-link" onClick={() => navigate("/students")}><ArrowLeft size={16} /> Back to students</button><div className="detail-hero"><div className="detail-identity"><div className="detail-avatar">{initials(student.full_name)}</div><div><div className="eyebrow">Student profile</div><h1>{student.full_name}</h1><p>{student.register_number} · {student.department}</p></div></div><NavLink className="secondary-button" to={`/students/${student.id}/edit`}><Pencil size={17} /> Edit record</NavLink></div><div className="detail-grid"><div className="panel detail-panel"><div className="panel-heading"><div><h2>Personal information</h2><p>Identity and contact details</p></div></div><DetailRow label="Full name" value={student.full_name} /><DetailRow label="Email address" value={student.email} /><DetailRow label="Phone number" value={student.phone_number || "Not provided"} /><DetailRow label="Gender" value={student.gender || "Not provided"} /></div><div className="panel detail-panel"><div className="panel-heading"><div><h2>Academic information</h2><p>Enrollment and course details</p></div></div><DetailRow label="Register number" value={student.register_number} mono /><DetailRow label="Department" value={student.department} /><DetailRow label="Current year" value={`Year ${student.year}`} /><DetailRow label="Admission date" value={formatDate(student.admission_date)} /><DetailRow label="Record created" value={formatDateTime(student.created_at)} /></div></div></section>;
}

function Field({ label, required, error, children }) { return <label className={`field ${error ? "has-error" : ""}`}><span>{label}{required && <em>*</em>}</span>{children}{error && <small>{error}</small>}</label>; }
function DetailRow({ label, value, mono }) { return <div className="detail-row"><span>{label}</span><strong className={mono ? "mono" : ""}>{value}</strong></div>; }
function LoadingState({ label }) { return <div className="loading-state"><div className="spinner" /><span>{label}</span></div>; }
function EmptyState({ title, description, action, compact }) { return <div className={`empty-state ${compact ? "compact" : ""}`}><div className="empty-icon"><Users size={22} /></div><h3>{title}</h3><p>{description}</p>{action}</div>; }
function initials(name = "") { return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function formatDate(value) { if (!value) return "—"; return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }
function formatDateTime(value) { if (!value) return "—"; return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value.replace(" ", "T"))); }
function useParamsSafe() { const location = useLocation(); return { id: location.pathname.split("/")[2] }; }

export default App;