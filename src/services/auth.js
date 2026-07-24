const ADMIN_TOKEN_KEY = 'aws_admin_authenticated';

export const authService = {
  // Check if admin is currently logged in
  isAdminAuthenticated() {
    return localStorage.getItem(ADMIN_TOKEN_KEY) === 'true' || sessionStorage.getItem(ADMIN_TOKEN_KEY) === 'true';
  },

  // Set admin session state
  setAdminSession(rememberMe = true) {
    if (rememberMe) {
      localStorage.setItem(ADMIN_TOKEN_KEY, 'true');
    } else {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, 'true');
    }
  },

  // Logout admin
  logout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  }
};
