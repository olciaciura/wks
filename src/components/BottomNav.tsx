import { NavLink } from "react-router-dom";

const links = [
   { to: "/dashboard", label: "Dashboard" },
   { to: "/trening", label: "Trening" },
   { to: "/competition", label: "Competition" },
];

export default function BottomNav() {
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
