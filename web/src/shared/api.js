// Talk to the API. Owner: LEAD.
// Usage:   const runs = await api.get("/runs?date=2026-09-29");
//          await api.post("/deferrals", { orderIds: ["ORD41907"], toDate: "2026-10-01", reason: "..." });
// All endpoints are listed in docs/API_CONTRACT.md.
async function request(method, path, body) {
  const res = await fetch("/api" + path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${method} ${path} failed (${res.status})`);
  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body = {}) => request("POST", path, body),
};
