async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({ message: "The server returned an invalid response." }));
  if (!response.ok) {
    const error = new Error(body.message || "Request failed.");
    error.status = response.status;
    error.errors = body.errors || {};
    throw error;
  }
  return body;
}

export const api = {
  getStudents: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
    return request(`/api/students${query.toString() ? `?${query}` : ""}`);
  },
  getStudent: (id) => request(`/api/students/${id}`),
  createStudent: (data) => request("/api/students", { method: "POST", body: JSON.stringify(data) }),
  updateStudent: (id, data) => request(`/api/students/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteStudent: (id) => request(`/api/students/${id}`, { method: "DELETE" }),
  getStats: () => request("/api/dashboard/stats")
};