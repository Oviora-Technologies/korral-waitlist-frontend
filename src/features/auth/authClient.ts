export const API = process.env.REACT_APP_API_URL || '';
const key = 'korral_creator_session';
export function getToken() {
  return sessionStorage.getItem(key) || '';
}
export function setToken(token: string) {
  sessionStorage.setItem(key, token);
}
export function clearToken() {
  sessionStorage.removeItem(key);
}
export async function apiAuth(path: string, options: RequestInit = {}) {
  const response = await fetch(API + path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: 'Bearer ' + getToken(),
    },
  });
  if (response.status === 401) clearToken();
  return response;
}
