// Sign-in check for the API and live events (Supabase Auth). Owner: LEAD.
// Always on. The server will not start without SUPABASE_URL (server/.env, see docs/AUTH.md).
// Every /api call needs "Authorization: Bearer <Supabase access token>".
// The user's role, name and outlet come from Supabase app_metadata (only an admin can set it):
//   { "role": "dispatcher" | "loader" | "driver" | "store", "name": "Kavindi Perera", "outletId": "OUT014" }
import crypto from "node:crypto";

export const ROLES = ["dispatcher", "loader", "driver", "store"];
const ALL = ROLES;

// Who may call what. [method or "*", path prefix (after /api), roles]. First match wins; no match = refused.
export const ACCESS = [
  ["POST", "/meta/reset", ["dispatcher"]],
  ["GET", "/meta", ALL],
  ["*", "/plan", ["dispatcher"]],
  ["GET", "/deferrals", ["dispatcher", "driver", "store"]],
  ["*", "/deferrals", ["dispatcher"]],
  ["*", "/orders", ["dispatcher", "store"]],
  ["*", "/notices", ["dispatcher", "store"]],
  ["*", "/issues", ["dispatcher", "store"]],
  ["GET", "/runs", ALL],
  ["GET", "/loads", ["dispatcher", "loader", "store"]],
  ["*", "/loads", ["dispatcher", "loader"]],
  ["GET", "/deliveries", ["dispatcher", "driver", "store"]],
  ["*", "/deliveries", ["dispatcher", "driver"]],
  ["*", "/sync", ["dispatcher", "driver"]],
  ["*", "/tracking", ["dispatcher", "driver"]],
];

export function canAccess(role, method, path) {
  const rule = ACCESS.find(
    ([m, prefix]) => (m === "*" || m === method) && (path === prefix || path.startsWith(prefix + "/"))
  );
  return !!rule && rule[2].includes(role);
}

const b64 = (s) => Buffer.from(s, "base64url");

// Checks a JWT and returns its claims, or throws. HS256 needs `secret`; ES256/RS256 need the key in `jwks`.
// An HS256 token is never checked against a public key (blocks the classic "alg confusion" trick).
export function verifyJwt(token, { secret, jwks = [], issuer, now = Date.now() / 1000 }) {
  const [h, p, s] = String(token).split(".");
  if (!h || !p || !s) throw new Error("Malformed token");
  const header = JSON.parse(b64(h));
  const claims = JSON.parse(b64(p));
  const data = Buffer.from(`${h}.${p}`);
  const sig = b64(s);
  let ok = false;
  if (header.alg === "HS256" && secret) {
    const mac = crypto.createHmac("sha256", secret).update(data).digest();
    ok = mac.length === sig.length && crypto.timingSafeEqual(mac, sig);
  } else if (header.alg === "ES256" || header.alg === "RS256") {
    const jwk = jwks.find((k) => k.kid === header.kid);
    if (jwk) {
      const key = crypto.createPublicKey({ key: jwk, format: "jwk" });
      ok = crypto.verify(
        "sha256",
        data,
        header.alg === "ES256" ? { key, dsaEncoding: "ieee-p1363" } : key,
        sig
      );
    }
  }
  if (!ok) throw new Error("Bad signature");
  if (!claims.exp || claims.exp < now) throw new Error("Token expired");
  if (issuer && claims.iss !== issuer) throw new Error("Wrong issuer");
  if (claims.aud !== "authenticated") throw new Error("Not a signed-in user");
  return claims;
}

export const userFrom = (claims) => {
  const m = claims.app_metadata || {};
  return {
    id: claims.sub,
    email: claims.email,
    role: m.role,
    name: m.name || claims.email,
    outletId: m.outletId,
  };
};

// Returns check(token) -> user. Public keys are cached and refetched for a new key id.
export function makeTokenCheck({
  url = process.env.SUPABASE_URL,
  secret = process.env.SUPABASE_JWT_SECRET,
} = {}) {
  if (!url) throw new Error("SUPABASE_URL is not set. Add it to server/.env (see docs/AUTH.md).");
  const issuer = `${url.replace(/\/$/, "")}/auth/v1`;
  let jwks = [];
  let fetchedAt = 0;
  const loadKeys = async () => {
    if (Date.now() - fetchedAt < 60_000) return; // ponytail: at most one fetch a minute, enough for key rotation
    fetchedAt = Date.now();
    const res = await fetch(`${issuer}/.well-known/jwks.json`);
    if (res.ok) jwks = (await res.json()).keys || [];
  };
  return async (token) => {
    if (!secret) {
      let kid;
      try {
        kid = JSON.parse(b64(String(token).split(".")[0])).kid;
      } catch {}
      if (!jwks.some((k) => k.kid === kid)) await loadKeys();
    }
    return userFrom(verifyJwt(token, { secret, jwks, issuer }));
  };
}

// Express middleware for app.use("/api", requireAuth()).
export function requireAuth(options) {
  const check = makeTokenCheck(options);
  return async (req, res, next) => {
    if (req.path === "/health") return next();
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Please sign in." });
    try {
      req.user = await check(token);
    } catch {
      return res.status(401).json({ error: "Your sign-in has expired. Please sign in again." });
    }
    if (!canAccess(req.user.role, req.method, req.path))
      return res
        .status(403)
        .json({ error: "Your account cannot open this. Ask the dispatcher if you need it." });
    next();
  };
}

// Socket.IO middleware for io.use(socketAuth()): live events only reach signed-in users.
export function socketAuth(options) {
  const check = makeTokenCheck(options);
  return async (socket, next) => {
    try {
      socket.user = await check(socket.handshake.auth?.token);
      next();
    } catch {
      next(new Error("Please sign in."));
    }
  };
}
