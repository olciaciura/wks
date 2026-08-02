import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CurrentUser } from "../types/backend";

const STORAGE_KEY = "wks.currentUser";

type AuthContextValue = {
   currentUser: CurrentUser | null;
   setCurrentUser: (user: CurrentUser | null) => void;
   logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): CurrentUser | null {
   const storedValue = localStorage.getItem(STORAGE_KEY);
   if (!storedValue) {
      return null;
   }

   try {
      return JSON.parse(storedValue) as CurrentUser;
   } catch {
      return null;
   }
}

export function AuthProvider({ children }: { children: ReactNode }) {
   const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(() => readStoredUser());

   useEffect(() => {
      if (currentUser) {
         localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      } else {
         localStorage.removeItem(STORAGE_KEY);
      }
   }, [currentUser]);

   const value = useMemo<AuthContextValue>(
      () => ({
         currentUser,
         setCurrentUser: setCurrentUserState,
         logout: () => setCurrentUserState(null),
      }),
      [currentUser],
   );

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
   const context = useContext(AuthContext);
   if (!context) {
      throw new Error("useAuth must be used within AuthProvider");
   }

   return context;
}
