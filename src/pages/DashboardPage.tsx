import { useEffect, useMemo, useState } from "react";
import { getAllEventsForUser } from "../lib/api";
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

// Pobieramy informację, czy użytkownik jest adminem
   // UWAGA: Zmień 'role === "admin"' na takie pole, jakiego używasz w swoim typie User! (np. currentUser?.is_admin)
   const isAdmin = currentUser?.role === "admin" || currentUser?.role === "trainer";

   const visibleEvents = events.filter((event) => {
      const now = Date.now();
      
      // 1. Sprawdzamy, czy zapisy wciąż są otwarte
      const isSignupOpen = new Date(event.signup_close_date).getTime() > now;

      // 2. Sprawdzamy czas trwania wydarzenia
      const fromTime = new Date(event.date_from).getTime();
      const toTime = event.date_to ? new Date(event.date_to).getTime() : fromTime;

      let eventEndTime: number;
      if (fromTime === toTime) {
         // Jednodniowe: początek + 6 godzin
         eventEndTime = fromTime + (6 * 60 * 60 * 1000);
      } else {
         // Wielodniowe: do końca dnia (23:59:59) ostatniego dnia
         const toDateObj = new Date(toTime);
         toDateObj.setHours(23, 59, 59, 999);
         eventEndTime = toDateObj.getTime();
      }

      // Czy wydarzenie nadal trwa?
      const isEventOngoing = eventEndTime > now;
      
      // Czy dany użytkownik (zwykły) jest zgłoszony?
      const isSignedUp = event.user_response_status === "uzupelnione";

      // LOGIKA WIDOCZNOŚCI:
      // Pokaż, jeśli:
      // A) Zapisy są otwarte (widzą wszyscy)
      // B) Wydarzenie wciąż trwa ORAZ (użytkownik jest na nie zapisany LUB użytkownik jest adminem)
      return isSignupOpen || (isEventOngoing && (isSignedUp || isAdmin));
   });

   return (
      <section className="dashboard screen-stack">
         <div style={{ display: "none" }}>
         <header className="dashboard-hero page-stack page-stack--compact">
            {/* Dodano wrapper .filter-scroll-area dla płynnego przewijania na smartfonach */}
            <div className="filter-scroll-area">
               <div className="filter-row" aria-label="Szybkie filtry">
                  {quickFilters.map((filter) => (
                     <span key={filter} className="chip chip--soft">
                        {filter}
                     </span>
                  ))}
               </div>
            </div>
         </header>

         {/* Wrapper dla statystyk - na mobile będzie przewijany palcem poziomo */}
         <div className="summary-scroll-area">
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
         </div>

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
                  location={event.location}
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