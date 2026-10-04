// Sign-in (Supabase Auth). Owner: LEAD.  Setup: docs/AUTH.md
// OFF when VITE_SUPABASE_URL is not set: no login, the role picker works like the demo.
//   const { user } = useAuth();   user = { id, email, role, name, outletId } or null
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
// sessionStorage: each browser tab keeps its own sign-in, so four roles can be open side by side.
const supabase = url && key ? createClient(url, key, { auth: { storage: window.sessionStorage } }) : null;
export const authOn = !!supabase;

// The current access token, read by api.js and live.js on every call.
let token = null;
export const getToken = () => token;

const toUser = (u) => {
  const m = u.app_metadata || {};
  return { id: u.id, email: u.email, role: m.role, name: m.name || u.email, outletId: m.outletId };
};

const AuthContext = createContext({ ready: true, user: null });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ready: !authOn, user: null });
  useEffect(() => {
    if (!supabase) return;
    const apply = (session) => {
      token = session?.access_token || null;
      setState({ ready: true, user: session ? toUser(session.user) : null });
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    // Fires on sign in, sign out and every token refresh, so `token` is always fresh.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => data.subscription.unsubscribe();
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("That email and password do not match. Check them and try again.");
}

export const signOut = () => supabase?.auth.signOut();
