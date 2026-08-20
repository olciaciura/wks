import { NavLink, useLocation } from "react-router-dom";
import { FiHome, FiUser, FiPlus } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const links = [
   { to: "/dashboard", label: "Dashboard" },
   { to: "/trening", label: "Trening" },
   { to: "/competition", label: "Competition" },
];

export default function BottomNav() {
   const { currentUser } = useAuth();
   const location = useLocation();

   if (currentUser?.role === "user") {
      const onProfile = location.pathname.startsWith("/profile");

      return (
         <nav className="bottom-nav bottom-nav--icon" aria-label="Glowna nawigacja">
            <NavLink
               to={onProfile ? "/dashboard" : "/profile"}
               className="bottom-nav__icon-link"
               aria-label={onProfile ? "Dashboard" : "Profil"}
            >
               {onProfile ? <FiHome size={48} /> : <FiUser size={48} />}
            </NavLink>
         </nav>
      );
   }

   if (currentUser?.role === "trainer" || currentUser?.role === "admin") {
      return (
         <nav className="bottom-nav bottom-nav--icon" aria-label="Glowna nawigacja">
            <NavLink
               to="/profile"
               className={({ isActive }) => `bottom-nav__icon-link${isActive ? " is-active" : ""}`}
               aria-label="Profil"
            >
               <FiUser size={40} />
            </NavLink>

            <NavLink
               to="/dashboard"
               className={({ isActive }) => `bottom-nav__icon-link${isActive ? " is-active" : ""}`}
               aria-label="Dashboard"
            >
               <FiHome size={40} />
            </NavLink>

            <NavLink
               to="/trening"
               className={({ isActive }) => `bottom-nav__icon-link${isActive ? " is-active" : ""}`}
               aria-label="Dodaj trening"
            >
               <FiPlus size={40} />
            </NavLink>
         </nav>
      );
   }

   return (
      <nav className="bottom-nav" aria-label="Glowna nawigacja">
         {links.map((link) => (
            <NavLink
               key={link.to}
               to={link.to}
               className={({ isActive }) => `bottom-nav__link${isActive ? " is-active" : ""}`}
            >
               {link.label}
            </NavLink>
         ))}
      </nav>
   );
}
