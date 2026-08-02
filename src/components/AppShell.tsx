import { Navigate, Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import { useAuth } from "../context/AuthContext";

export default function AppShell() {
   const { currentUser } = useAuth();

   if (!currentUser) {
      return <Navigate to="/login" replace />;
   }

   return (
      <div className="app-shell">
         <main className="app-shell__content">
            <Outlet />
         </main>
         <BottomNav />
      </div>
   );
}
