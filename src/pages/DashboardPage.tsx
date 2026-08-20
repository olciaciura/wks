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
            const data = await getAllEventsForUser(currentUser.user_id);
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
         pending: events.filter((event) => event.user_response_status === "nieuzupelnione").length,
         trainingSignedUp: events.filter(
            (event) => event.event_type === "training" && event.user_response_status === "uzupelnione",
         ).length,
         competitionSignedUp: events.filter(
            (event) => event.event_type === "competition" && event.user_response_status === "uzupelnione",
         ).length,
      }),
      [events],
   );

   function handleRejected(eventId: string) {
      setEvents((prev) =>
         prev.map((event) => (event.event_id === eventId ? { ...event, user_response_status: "nie_jade" } : event)),
      );
   }

   const visibleEvents = events.filter((event) => {
      const isSignupClosed = new Date(event.signup_close_date).getTime() < Date.now();
      return !isSignupClosed || event.user_response_status === "uzupelnione";
   });

   return (
      <section className="dashboard screen-stack">
         <header className="dashboard-hero page-stack page-stack--compact">
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
               <span className="summary-card__label">Do uzupełnienia</span>
               <strong>{summary.pending}</strong>
            </article>
            <article className="summary-card">
               <span className="summary-card__label">Zapisane treningi</span>
               <strong>{summary.trainingSignedUp}</strong>
            </article>
            <article className="summary-card">
               <span className="summary-card__label">Zapisane zawody</span>
               <strong>{summary.competitionSignedUp}</strong>
            </article>
         </div>

         {isLoading ? <div className="page-card">Ładowanie wydarzeń...</div> : null}
         {errorMessage ? <div className="page-card page-copy">{errorMessage}</div> : null}

         <div className="event-list">
            {visibleEvents.flatMap((event) => (
               <EventRow
                  key={`${event.event_id}`}
                  id={event.event_id}
                  name={event.event_name}
                  type={event.event_type}
                  status={event.user_response_status}
                  eventStartDate={event.date_from}
                  eventEndDate={event.date_to}
                  dueDate={event.signup_close_date}
                  newInfo={false}
                  onRejected={handleRejected}
               />
            ))}
         </div>
      </section>
   );
}
