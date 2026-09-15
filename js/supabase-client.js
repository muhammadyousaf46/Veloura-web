// ==========================================================================
// VELOURA — Supabase Client
// ==========================================================================
// 1. Create a project at https://supabase.com
// 2. Go to Project Settings > API
// 3. Copy your Project URL and anon/public key below.
// NEVER put your service_role key here — only the public anon key belongs
// in frontend code. The anon key is safe to expose because Row Level
// Security (RLS) policies (see /sql/schema.sql) control what it can access.
//
// This whole file is wrapped in a guarded IIFE so that if this script tag
// ever ends up on a page twice (duplicate <script> tag, a copy-paste while
// editing, etc.) it silently no-ops the second time instead of crashing
// with "Identifier has already been declared".
// ==========================================================================

(function () {
  if (window.__velouraSupabaseLoaded) return;
  window.__velouraSupabaseLoaded = true;

  const SUPABASE_URL = "https://owyyxnrumposabelapid.supabase.co"; // e.g. https://xxxxx.supabase.co
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93eXl4bnJ1bXBvc2FiZWxhcGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NjA4OTksImV4cCI6MjEwNTAzNjg5OX0.L8sHHMj0eij0pzkPJL1tuqtGIxM9MH6qfyYp_YOMEG0";

  // Loaded via CDN script tag in each HTML page (see index.html <head>)
  window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ---- Shared helpers used across pages ----

  /**
   * Returns the currently logged-in user, or null.
   */
  window.getCurrentUser = async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  };

  /**
   * Fetches the profile row (role, name, etc.) for a given user id.
   */
  window.getProfile = async function getProfile(userId) {
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
  };

  /**
   * Convenience: is the logged-in user an admin?
   */
  window.isAdmin = async function isAdmin() {
    const user = await getCurrentUser();
    if (!user) return false;
    const profile = await getProfile(user.id);
    return profile?.role === "admin";
  };

  /**
   * Small toast notification used across the site for success/error feedback.
   */
  window.showToast = function showToast(message, type = "success") {
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
  };

  /**
   * Uploads a file to the shared "veloura-images" Supabase Storage bucket
   * under the given subfolder (e.g. "menu", "categories", "deals") and
   * returns its public URL. Used by every admin image upload field.
   */
  window.uploadToVelouraStorage = async function uploadToVelouraStorage(file, subfolder = "misc") {
    const ext = file.name.split(".").pop();
    const path = `${subfolder}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("veloura-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("veloura-images").getPublicUrl(path);
    return data.publicUrl;
  };

  /**
   * Friendly error mapper — never show raw Supabase/JS errors to users.
   */
  window.friendlyError = function friendlyError(error) {
    if (!error) return "Something went wrong. Please try again.";
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("invalid login")) return "Incorrect email or password.";
    if (msg.includes("already registered")) return "An account with this email already exists.";
    if (msg.includes("network")) return "Network error — please check your connection.";
    if (msg.includes("password")) return "Password must be at least 6 characters.";
    return "Something went wrong. Please try again.";
  };
})();