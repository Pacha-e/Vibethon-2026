import { createContext, useContext } from 'react';
import type { Role } from './session';

export interface Session {
  email: string;
  role: Role;
}

export const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession fuera de SessionContext');
  return s;
}
