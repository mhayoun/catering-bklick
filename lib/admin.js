// Admin emails are checked in lower-case, comma-separated.
// Configure via the ADMIN_EMAILS env var in production
// (e.g. "joetiger05@gmail.com,someoneelse@example.com").
// Falls back to the requested default if the env var isn't set.
const DEFAULT_ADMIN_EMAILS = ['joetiger05@gmail.com'];

function adminList() {
  const fromEnv = process.env.ADMIN_EMAILS;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS;
}

export function isAdminEmail(email) {
  if (!email) return false;
  return adminList().includes(email.toLowerCase());
}
