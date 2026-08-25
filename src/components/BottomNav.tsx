import { NavLink, useLocation } from "react-router-dom";
import { FiHome, FiUser, FiPlus } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "./BottomNav.css";

const links = [
   { to: "/dashboard", label: "Dashboard", icon: <FiHome size={24} /> },
   { to: "/trening", label: "Trening", icon: <FiPlus size={24} /> },
   { to: "/competition", label: "Zawody", icon: <FiUser size={24} /> }, // zmień ikonę według potrzeb
];

export default function BottomNav() {
   const { currentUser } = useAuth();
   const location = useLocation();

   // WIDOK: USER
   if (currentUser?.role === "user") {
      const onProfile = location.pathname.startsWith("/profile");

      return (
         <nav className="bottom-nav" aria-label="Glowna nawigacja">
            <NavLink
               to={onProfile ? "/dashboard" : "/profile"}
               className="bottom-nav__item"
               aria-label={onProfile ? "Dashboard" : "Profil"}
            >
               {onProfile ? <FiHome size={28} /> : <FiUser size={28} />}
               <span className="bottom-nav__label">{onProfile ? "Dashboard" : "Profil"}</span>
            </NavLink>
         </nav>
      );
   }

   // WIDOK: TRAINER / ADMIN
   if (currentUser?.role === "trainer" || currentUser?.role === "admin") {
      return (
         <nav className="bottom-nav" aria-label="Glowna nawigacja">
            <NavLink
               to="/dashboard"
               className={({ isActive }) => `bottom-nav__item${isActive ? " is-active" : ""}`}
            >
               <FiHome size={24} />
               <span className="bottom-nav__label">Dashboard</span>
            </NavLink>

            <NavLink
               to="/trening"
               className={({ isActive }) => `bottom-nav__item${isActive ? " is-active" : ""}`}
            >
               <FiPlus size={24} />
               <span className="bottom-nav__label">Trening</span>
            </NavLink>

            <NavLink
               to="/profile"
               className={({ isActive }) => `bottom-nav__item${isActive ? " is-active" : ""}`}
            >
               <FiUser size={24} />
               <span className="bottom-nav__label">Profil</span>
            </NavLink>
         </nav>
      );
   }

   // WIDOK DOMYŚLNY (Fallback)
   return (
      <nav className="bottom-nav" aria-label="Glowna nawigacja">
         {links.map((link) => (
            <NavLink
               key={link.to}
               to={link.to}
               className={({ isActive }) => `bottom-nav__item${isActive ? " is-active" : ""}`}
            >
               {link.icon}
               <span className="bottom-nav__label">{link.label}</span>
            </NavLink>
         ))}
      </nav>
   );
}