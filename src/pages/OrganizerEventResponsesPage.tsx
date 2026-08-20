import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventResponses, type EventResponsesDto } from "../lib/api";
import StatusBadge from "../components/StatusBadge";

export default function OrganizerEventResponsesPage() {
   const { eventId } = useParams();

   const [data, setData] = useState<EventResponsesDto | null>(null);
   const [loading, setLoading] = useState(true);
   const [filter, setFilter] = useState("all");

   useEffect(() => {
      async function load() {
         if (!eventId) return;

         try {
            const result = await getEventResponses(eventId);
            setData(result);
         } finally {
            setLoading(false);
         }
      }

      void load();
   }, [eventId]);

   const transportUsers = useMemo(() => data?.users?.filter((u: any) => u.needs_transport) ?? [], [data]);

   const driverUsers = useMemo(() => data?.users?.filter((u: any) => Number(u.can_take_people ?? 0) > 0) ?? [], [data]);

   const accommodationUsers = useMemo(
      () => data?.users?.filter((u: any) => u.competition?.needs_accommodation) ?? [],
      [data],
   );

   const foodUsers = useMemo(() => data?.users?.filter((u: any) => u.competition?.wants_food) ?? [], [data]);

   const filteredUsers = useMemo(() => {
      if (!data) return [];

      switch (filter) {
         case "filled":
            return data.users.filter((u: any) => u.status === "FILLED");

         case "transport":
            return transportUsers;

         case "drivers":
            return driverUsers;

         case "accommodation":
            return accommodationUsers;

         case "food":
            return foodUsers;

         default:
            return data.users;
      }
   }, [data, filter, transportUsers, driverUsers, accommodationUsers, foodUsers]);

   if (loading) {
      return <div className="page-card">Ładowanie...</div>;
   }

   if (!data) {
      return <div className="page-card">Brak danych</div>;
   }

   const stats = data.statistics;

   return (
      <section className="screen-stack page-stack">
         <header className="page-card">
            <h1>{data.event.title}</h1>

            <p>{data.event.type === "training" ? "Trening" : "Zawody"}</p>
         </header>

         <div className="dashboard-summary">
            <article className="summary-card">
               <span className="summary-card__label">Uczestnicy</span>
               <strong>{stats.participants}</strong>
            </article>

            <article className="summary-card">
               <span className="summary-card__label">Transport</span>
               <strong>{stats.needs_transport}</strong>
            </article>

            <article className="summary-card">
               <span className="summary-card__label">Wolne miejsca</span>
               <strong>{stats.transport_places_offered}</strong>
            </article>

            {"needs_accommodation" in stats && (
               <article className="summary-card">
                  <span className="summary-card__label">Noclegi</span>
                  <strong>{stats.needs_accommodation}</strong>
               </article>
            )}

            {"wants_food" in stats && (
               <article className="summary-card">
                  <span className="summary-card__label">Wyżywienie</span>
                  <strong>{stats.wants_food}</strong>
               </article>
            )}
         </div>

         {data.event.type === "training" && stats.routes?.length && stats.routes?.length > 0 && (
            <div className="page-card">
               <h2>Trasy</h2>

               <div className="stats-grid">
                  {stats.routes?.map((route) => (
                     <div key={route.route_id} className="mini-stat">
                        <strong>{route.route_name}</strong>

                        <div>{route.participants} osób</div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {data.event.type === "competition" && stats.runs?.length && stats.runs?.length > 0 && (
            <div className="page-card">
               <h2>Biegi</h2>

               <div className="stats-grid">
                  {stats.runs?.map((run) => (
                     <div key={run.run_id} className="mini-stat">
                        <strong>{run.run_name}</strong>

                        <div>{run.participants} osób</div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         <div className="page-card">
            <div className="filter-row">
               <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
                  Wszyscy
               </button>

               <button className={filter === "filled" ? "active" : ""} onClick={() => setFilter("filled")}>
                  Zgłoszeni
               </button>

               <button className={filter === "transport" ? "active" : ""} onClick={() => setFilter("transport")}>
                  Transport
               </button>

               <button className={filter === "drivers" ? "active" : ""} onClick={() => setFilter("drivers")}>
                  Kierowcy
               </button>

               {data.event.type === "competition" && (
                  <>
                     <button
                        className={filter === "accommodation" ? "active" : ""}
                        onClick={() => setFilter("accommodation")}
                     >
                        Nocleg
                     </button>

                     <button className={filter === "food" ? "active" : ""} onClick={() => setFilter("food")}>
                        Wyżywienie
                     </button>
                  </>
               )}
            </div>

            <div className="organizer-table-wrapper">
               <table className="organizer-table">
                  <thead>
                     <tr>
                        <th>Uczestnik</th>
                        <th>Status</th>
                        <th>Transport</th>
                        <th>Miejsca</th>

                        {data.event.type === "training" && <th>Trasa</th>}

                        {data.event.type === "competition" && (
                           <>
                              <th>Nocleg</th>
                              <th>Jedzenie</th>
                              <th>Starty</th>
                           </>
                        )}

                        <th>Komentarz</th>
                     </tr>
                  </thead>

                  <tbody>
                     {filteredUsers.map((user) => (
                        <tr key={user.user_id}>
                           <td>
                              <div>
                                 <strong>{user.name}</strong>

                                 <div>{user.email}</div>
                              </div>
                           </td>

                           <td>
                              <StatusBadge tone={user.status === "FILLED" ? "uzupelnione" : "nie_jade"}>
                                 {user.status === "FILLED" ? "Zgłoszony" : "Nie jedzie"}
                              </StatusBadge>
                           </td>

                           <td>{user.needs_transport ? "Tak" : "Nie"}</td>

                           <td>{user.can_take_people}</td>

                           {data.event.type === "training" && <td>{user.training?.selected_route?.name ?? "-"}</td>}

                           {data.event.type === "competition" && (
                              <>
                                 <td>{user.competition?.needs_accommodation ? "Tak" : "Nie"}</td>

                                 <td>{user.competition?.wants_food ? "Tak" : "Nie"}</td>

                                 <td>
                                    {user.competition?.runs
                                       ?.filter((run) => run.participates)
                                       .map((run) => run.run_name)
                                       .join(", ")}
                                 </td>
                              </>
                           )}

                           <td>{user.comment ?? "-"}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </section>
   );
}
