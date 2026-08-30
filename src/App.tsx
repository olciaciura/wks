import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AppShell from "./components/AppShell";
import CompetitionForm from "./pages/CompetitionForm";
import DashboardPage from "./pages/DashboardPage";
import EventDetailPage from "./pages/EventDetailPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import TreningForm from "./pages/TreningForm";
import OrganizerEventResponsesPage from "./pages/OrganizerEventResponsesPage";
import EditEventPage from "./pages/UpdateEventPage";
import PrzerwaTechniczna from "./pages/PrzerwaTechniczna";

export default function App() {
   return (
      <Router>
         <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            {/* <Route path="/login" element={<LoginPage mode="login" />} /> */}
            <Route path="/login" element={<PrzerwaTechniczna />} />
            <Route path="/register" element={<LoginPage mode="register" />} />
            <Route element={<AppShell />}>
               <Route path="/dashboard" element={<DashboardPage />} />
               <Route path="/events/:eventId" element={<EventDetailPage />} />
               <Route path="/profile" element={<ProfilePage />} />
               <Route path="/trening" element={<TreningForm />} />
               <Route path="/competition" element={<CompetitionForm />} />
               <Route path="/results/:eventId" element={<OrganizerEventResponsesPage />} />
               <Route path="/events/:eventId/edit" element={<EditEventPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
         </Routes>
      </Router>
   );
}
