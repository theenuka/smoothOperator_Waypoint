// Sign-in (Supabase Auth). Owner: LEAD.  Setup: docs/AUTH.md
// Always on. Needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in web/.env; without them App shows a setup page.
//   const { user } = useAuth();   user = { id, email, role, name, outletId } or null
// Each role app (/dispatcher, /loader, /driver, /store) keeps its OWN sign-in, so one browser can be signed in
// as all four at once, and reopening a role's tab keeps it signed in.
import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const authOn = !!(url && key);

// One Supabase client per role app, each saving its session under its own key.
const clients = {};
const clientFor = (app) =>
  (clients[app] ||= createClient(url, key, { auth: { storageKey: `waypoint-auth-${app}` } }));

// The sign-in of the role app this tab shows. Read by api.js and live.js on every call.
let current = null;
let token = null;
export const getToken = () => token;

const toUser = (u) => {
  const m = u.app_metadata || {};
  return { id: u.id, email: u.email, role: m.role, name: m.name || u.email, outletId: m.outletId };
};

const AuthContext = createContext({ ready: true, user: null });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const app = useLocation().pathname.split("/")[1] || null; // "driver", or null on the role picker
  const [state, setState] = useState({ ready: !authOn, user: null });
  useEffect(() => {
    if (!authOn || !app) {
      current = null;
      token = null;
      setState({ ready: true, user: null });
      return;
    }
    current = clientFor(app);
    let live = true;
    const apply = (session) => {
      if (!live) return;
      token = session?.access_token || null;
      setState({ ready: true, user: session ? toUser(session.user) : null });
    };
    setState({ ready: false, user: null });
    current.auth.getSession().then(({ data }) => apply(data.session));
    // Fires on sign in, sign out and every token refresh, so `token` is always fresh.
    const { data } = current.auth.onAuthStateChange((_event, session) => apply(session));
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, [app]);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

// Signs in to the role app this tab shows.
export async function signIn(email, password) {
  const { error } = await current.auth.signInWithPassword({ email, password });
  if (error) throw new Error("That email and password do not match. Check them and try again.");
}

// Signs out of this role app only; the other role apps stay signed in.
export const signOut = () => current?.auth.signOut({ scope: "local" });
