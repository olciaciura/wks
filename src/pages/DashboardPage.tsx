import EventCard from "../components/EventCard";
import { useEffect, useMemo, useState } from "react";
import { getAllEventsForUser, getEventsForUser } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { EventListItemDto } from "../types/backend";
import EventRow from "../components/EventRow";

const quickFilters = ["Wszystkie", "training", "competition", "uzupelnione", "nieuzupelnione"];

export default function DashboardPage() {
   const { currentUser } = useAuth();
   const [events, setEvents] = useState<EventListItemDto[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      async function loadEvents() {
         if (!currentUser) {
            return;
         }

         try {
            setIsLoading(true);
            setErrorMessage(null);
            const data =
               currentUser.role === "user"
                  ? await getEventsForUser(currentUser.user_id)
                  : await getAllEventsForUser(currentUser.user_id);
            if (isMounted) {
               setEvents(data);
            }
         } catch (error) {
            if (isMounted) {
               setErrorMessage(error instanceof Error ? error.message : "Nie udało się pobrać wydarzeń.");
            }
         } finally {
            if (isMounted) {
               setIsLoading(false);
            }
         }
      }

      void loadEvents();

      return () => {
         isMounted = false;
      };
   }, [currentUser]);

   const summary = useMemo(
      () => ({
         responded: events.filter((event) => event.user_response_status === "uzupelnione").length,
         training: events.filter((event) => event.event_type === "training").length,
         competition: events.filter((event) => event.event_type === "competition").length,
      }),
      [events],
   );

   return (
      <section className="dashboard screen-stack">
         <header className="dashboard-hero page-stack page-stack--compact">
            <p className="eyebrow">Dashboard</p>
            <div>
               <h1>Wydarzenia</h1>
               <p className="page-copy">
                  {currentUser
                     ? `${currentUser.login} · szybki podgląd treningów i zawodów z odpowiedziami i terminami.`
                     : "Szybki podgląd treningów i zawodów z odpowiedziami i terminami."}
               </p>
            </div>

            <div className="filter-row" aria-label="Szybkie filtry">
               {quickFilters.map((filter) => (
                  <span key={filter} className="chip chip--soft">
                     {filter}
                  </span>
               ))}
            </div>
         </header>

         <div className="dashboard-summary">
            <article className="summary-card">
               <span className="summary-card__label">Uzupełnione</span>
               <strong>{summary.responded}</strong>
            </article>
            <article className="summary-card">
               <span className="summary-card__label">Treningi</span>
               <strong>{summary.training}</strong>
            </article>
            <article className="summary-card">
               <span className="summary-card__label">Zawody</span>
               <strong>{summary.competition}</strong>
            </article>
         </div>

         {isLoading ? <div className="page-card">Ładowanie wydarzeń...</div> : null}
         {errorMessage ? <div className="page-card page-copy">{errorMessage}</div> : null}

         <div className="event-list">
            {events.map((event) => (
               <EventRow
                  key={event.event_id}
                  id={event.event_id}
                  name={event.event_name}
                  type={event.event_type}
                  status={event.user_response_status}
                  eventStartDate={event.event_start_date || "22-08-2026"}
                  eventEndDate={event.event_end_date || "23-08-2026"}
                  dueDate={event.signup_close_date}
                  newInfo={false}
               />
            ))}
         </div>
      </section>
   );
}
