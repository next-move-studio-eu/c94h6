/**
 * Stub for editor: ChessVideo and Slideshow use useAuth().
 * In editor we have no auth; preview shows content without access checks.
 */
import { createContext, useContext, type ReactNode } from 'react';

export interface AuthUser {
  user_id: number;
  name: string;
  roles: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const stubValue: AuthContextType = {
  user: null,
  loading: false,
  refetch: async () => {},
  logout: async () => {},
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={stubValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  return ctx ?? stubValue;
}
