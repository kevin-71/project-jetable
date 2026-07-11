export function loginWithGoogle() {
  window.location.href = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000'}/auth/google`;
}
