import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import UserPage from "./pages/UserPage";
import TreningForm from "./pages/TreningForm";
import CompetitionForm from "./pages/CompetitionForm";

export default function App() {
   return (
      <Router>
         <header style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <nav style={{ display: "flex", gap: 12 }}>
               <Link to="/login">Login</Link>
               <Link to="/user">User</Link>
               <Link to="/trening">Trening</Link>
               <Link to="/competition">Competition</Link>
            </nav>
         </header>

         <main style={{ padding: 20 }}>
            <Routes>
               <Route path="/" element={<LoginPage />} />
               <Route path="/login" element={<LoginPage />} />
               <Route path="/user" element={<UserPage />} />
               <Route path="/trening" element={<TreningForm />} />
               <Route path="/competition" element={<CompetitionForm />} />
               <Route
                  path="*"
                  element={
                     <div>
                        <h2>404 — Not Found</h2>
                        <p>
                           <Link to="/login">Powrót</Link>
                        </p>
                     </div>
                  }
               />
            </Routes>
         </main>
      </Router>
   );
}
