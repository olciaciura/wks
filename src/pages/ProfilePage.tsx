import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
   const { currentUser, logout } = useAuth();
   const navigate = useNavigate();

   function handleLogout() {
      logout();
      navigate("/login");
   }

   return (
      <section className="page-stack">
         <div className="page-stack page-stack--compact">
            <p className="eyebrow">Profil</p>
            <div>
               <h1>{currentUser?.login}</h1>
               <p className="page-copy">Twoje konto i ustawienia.</p>
            </div>
         </div>

         <div className="page-card page-stack">
            <div className="detail-list">
               <div>
                  <span>Login</span>
                  <p>{currentUser?.login}</p>
               </div>
               <div>
                  <span>Rola</span>
                  <p>{currentUser?.role}</p>
               </div>
            </div>
         </div>

         <button type="button" className="ghost-btn" onClick={handleLogout}>
            Wyloguj się
         </button>
      </section>
   );
}
