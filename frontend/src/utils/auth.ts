const API_BASE = import.meta.env.VITE_API_URL || '';

export function getGoogleLoginUrl(): string {
  const baseUrl = API_BASE.replace(/\/api\/v1$/, '');
  const loginUrl = new URL(`${baseUrl}/auth/google`, window.location.origin);
  loginUrl.searchParams.set('frontend_redirect', window.location.origin);
  return loginUrl.toString();
}
