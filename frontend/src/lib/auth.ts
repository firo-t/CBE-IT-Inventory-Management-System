export type User = {
  id: string;
  email: string;
  role: string;
  employeeId?: string;
  branchId?: string;
  fullName: string;
  phone?: string;
  status?: string;
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  try {
    return JSON.parse(
      localStorage.getItem('cbe_user') || 'null'
    );
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('cbe_access_token');
  localStorage.removeItem('cbe_user');
  location.href = '/login';
};

export type UserSession = User;

export const getSession = getUser;