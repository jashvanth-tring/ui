export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken');
  const session = JSON.stringify(localStorage.getItem('session'));

  return token && session;
};

export const getSessionDetails = () => {
  const session = localStorage.getItem('session');
  return session !== null ? JSON.parse(session) : null;
};
