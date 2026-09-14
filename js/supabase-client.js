// ==========================================================================
// VELOURA — Supabase Client
// ==========================================================================
// 1. Create a project at https://supabase.com
// 2. Go to Project Settings > API
// 3. Copy your Project URL and anon/public key below.
// NEVER put your service_role key here — only the public anon key belongs
// in frontend code. The anon key is safe to expose because Row Level
// Security (RLS) policies (see /sql/schema.sql) control what it can access.
// ==========================================================================

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL"; // e.g. https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Loaded via CDN script tag in each HTML page (see index.html <head>)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Shared helpers used across pages ----

/**
 * Returns the currently logged-in user, or null.
 */
async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

/**
 * Fetches the profile row (role, name, etc.) for a given user id.
 */
async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) {
    console.error("getProfile error:", error.message);
    return null;
  }
  return data;
}

/**
 * Convenience: is the logged-in user an admin?
 */
async function isAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;
  const profile = await getProfile(user.id);
  return profile?.role === "admin";
}

/**
 * Small toast notification used across the site for success/error feedback.
 */
function showToast(message, type = "success") {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast show ${type === "error" ? "error" : ""}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/**
 * Friendly error mapper — never show raw Supabase/JS errors to users.
 */
function friendlyError(error) {
  if (!error) return "Something went wrong. Please try again.";
  const msg = (error.message || "").toLowerCase();
  if (msg.includes("invalid login")) return "Incorrect email or password.";
  if (msg.includes("already registered")) return "An account with this email already exists.";
  if (msg.includes("network")) return "Network error — please check your connection.";
  if (msg.includes("password")) return "Password must be at least 6 characters.";
  return "Something went wrong. Please try again.";
}
