// Small helpers shared by routes. Owner: LEAD.
export const httpError = (status, message) => Object.assign(new Error(message), { status });
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const outletName = (d, id) => (d.outlets.find((o) => o.id === id) || {}).name || id;
