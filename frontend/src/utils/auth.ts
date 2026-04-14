const API_BASE = import.meta.env.VITE_API_URL || '';

export function getGoogleLoginUrl(): string {
  const loginUrl = new URL(`${API_BASE}/api/v1/auth/google`, window.location.origin);
  loginUrl.searchParams.set('frontend_redirect', window.location.origin);
  return loginUrl.toString();
}
