import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { getEventDetail, submitEventResponse } from "../lib/api";
import type { EventDetailDto, EventResponsePayload } from "../types/backend";

export default function EventDetailPage() {
   const { eventId } = useParams();
   const { currentUser } = useAuth();
   const [eventDetail, setEventDetail] = useState<EventDetailDto | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);
   const [submitMessage, setSubmitMessage] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      async function loadDetail() {
         if (!eventId || !currentUser) {
            return;
         }

         try {
            setIsLoading(true);
            setErrorMessage(null);
            const detail = await getEventDetail(eventId, currentUser.user_id);
            if (isMounted) {
               setEventDetail(detail);
            }
         } catch (error) {
            if (isMounted) {
               setErrorMessage(error instanceof Error ? error.message : "Nie udało się pobrać szczegółów wydarzenia.");
            }
         } finally {
            if (isMounted) {
               setIsLoading(false);
            }
         }
      }

      void loadDetail();

      return () => {
         isMounted = false;
      };
   }, [currentUser, eventId]);

   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();

      if (!currentUser || !eventId || !eventDetail) {
         return;
      }

      const formData = new FormData(event.currentTarget);
      const payload: EventResponsePayload = {
         user_id: currentUser.user_id,
         status: String(formData.get("status") ?? "pending") as EventResponsePayload["status"],
         needs_transport: formData.get("needs_transport") === "on",
         self_transport: formData.get("self_transport") === "on",
         can_take_people: Number(formData.get("can_take_people") ?? 0) || 0,
         comment: String(formData.get("comment") ?? ""),
         training: null,
         competition: null,
      };

      if (eventDetail.event.type === "training") {
         payload.training = {
            selected_route_id: String(formData.get("selected_route_id") ?? ""),
         };
      }

      if (eventDetail.event.type === "competition") {
         payload.competition = {
            needs_accommodation: formData.get("needs_accommodation") === "on",
            wants_food: formData.get("wants_food") === "on",
            wants_vege: formData.get("wants_vege") === "on",
            run_selections:
               eventDetail.options.runs?.map((run) => ({
                  run_id: run.id,
                  participates: formData.get(`run_${run.id}`) === "on",
               })) ?? [],
         };
      }

      await submitEventResponse(eventId, eventDetail.event.type, payload);
      setSubmitMessage("Odpowiedź została wysłana.");
   }

   if (isLoading) {
      return <section className="page-card">Ładowanie szczegółów wydarzenia...</section>;
   }

   if (errorMessage) {
      return (
         <section className="page-card page-stack">
            <p className="eyebrow">Błąd</p>
            <p className="page-copy">{errorMessage}</p>
            <Link className="ghost-btn" to="/dashboard">
               Wróć do dashboardu
            </Link>
         </section>
      );
   }

   if (!eventDetail) {
      return null;
   }

   const { event, options, user_response } = eventDetail;
   const responseBadge = mapResponseLabel(user_response?.status);

   return (
      <section className="detail-page page-stack">
         <header className="detail-hero page-card page-stack">
            <div className="detail-hero__top">
               <Link className="ghost-btn detail-back" to="/dashboard">
                  ← Dashboard
               </Link>
               <div className="event-card__badges">
                  <StatusBadge tone={event.type}>{event.type}</StatusBadge>
                  <StatusBadge tone={event.status}>{event.status}</StatusBadge>
                  <StatusBadge tone={responseBadge}>{responseBadge}</StatusBadge>
               </div>
            </div>

            <div className="page-stack page-stack--compact">
               <p className="eyebrow">Szczegóły wydarzenia</p>
               <h1>{event.title}</h1>
               <p className="page-copy">{event.description}</p>
            </div>

            <div className="detail-hero__grid">
               <div>
                  <span className="event-card__label">Termin</span>
                  <p>
                     {event.date_from} - {event.date_to}
                  </p>
               </div>
               <div>
                  <span className="event-card__label">Zapis</span>
                  <p>
                     {event.signup_open_date} - {event.signup_close_date}
                  </p>
               </div>
               <div>
                  <span className="event-card__label">Status</span>
                  <p>{event.status}</p>
               </div>
            </div>
         </header>

         <div className="detail-grid">
            <article className="detail-panel">
               <p className="eyebrow eyebrow--compact">{event.type === "training" ? "Trening" : "Competition"}</p>
               <h2>{event.type === "training" ? "Dane treningu" : "Dane zawodów"}</h2>

               {event.type === "training" ? (
                  <div className="detail-list">
                     <div>
                        <span>Spotkanie</span>
                        <p>
                           {options.meeting_time ?? "Brak danych"} · {options.meeting_location_desc ?? "Brak danych"}
                        </p>
                     </div>
                     <div>
                        <span>Start</span>
                        <p>
                           {options.start_time ?? "Brak danych"} · {options.start_location_desc ?? "Brak danych"}
                        </p>
                     </div>
                     <div>
                        <span>Transport</span>
                        <p>{options.transport_available ? "Dostępny" : "Brak"}</p>
                     </div>
                     <div>
                        <span>Typ</span>
                        <p>{options.training_type ?? "-"}</p>
                     </div>
                     <div>
                        <span>Trasy</span>
                        <ul className="detail-list__items">
                           {options.training_routes?.length ? (
                              options.training_routes.map((route) => (
                                 <li key={route.id ?? route.name}>
                                    <strong>{route.name}</strong>
                                    <span>{route.description ?? route.distance ?? ""}</span>
                                 </li>
                              ))
                           ) : (
                              <li>
                                 <strong>Brak tras</strong>
                                 <span>Backend nie zwrócił jeszcze tras</span>
                              </li>
                           )}
                        </ul>
                     </div>
                  </div>
               ) : null}

               {event.type === "competition" ? (
                  <div className="detail-list">
                     <div>
                        <span>Nazwa</span>
                        <p>{event.title}</p>
                     </div>
                     <div>
                        <span>Nocleg</span>
                        <p>{options.accomodation_available ? "Tak" : "Nie"}</p>
                     </div>
                     <div>
                        <span>Transport</span>
                        <p>{options.transport_available ? "Dostępny" : "Brak"}</p>
                     </div>
                     <div>
                        <span>Wyżywienie</span>
                        <p>
                           {options.food_available ? "Tak" : "Nie"} ·{" "}
                           {options.food_vege_available ? "wege" : "standard"}
                        </p>
                     </div>
                     <div>
                        <span>Serie</span>
                        <p>{options.series_signup ? "Tak" : "Nie"}</p>
                     </div>
                     <div>
                        <span>Biegi</span>
                        <ul className="detail-list__items">
                           {options.runs?.map((run) => (
                              <li key={run.id}>
                                 <strong>{run.name}</strong>
                                 <span>{run.run_date}</span>
                              </li>
                           ))}
                        </ul>
                     </div>
                     <div>
                        <span>Posiłki</span>
                        <ul className="detail-list__items">
                           {options.food_schedule?.map((entry) => (
                              <li key={entry.date}>
                                 <strong>{entry.date}</strong>
                                 <span>
                                    {entry.breakfast ? "Śniadanie " : ""}
                                    {entry.lunch ? "Lunch " : ""}
                                    {entry.dinner ? "Obiad " : ""}
                                    {entry.supper ? "Kolacja" : ""}
                                 </span>
                              </li>
                           ))}
                        </ul>
                     </div>
                  </div>
               ) : null}
            </article>

            <form className="detail-panel response-form" onSubmit={handleSubmit}>
               <p className="eyebrow eyebrow--compact">Twoja odpowiedź</p>
               <h2>Wyślij odpowiedź</h2>

               <label className="field-group">
                  <span className="field-label">Status odpowiedzi</span>
                  <select
                     className="field-input field-select"
                     name="status"
                     defaultValue={user_response?.status ?? "pending"}
                  >
                     <option value="pending">pending</option>
                     <option value="filled">filled</option>
                     <option value="rejected">rejected</option>
                  </select>
               </label>

               <label className="checkbox-row">
                  <input
                     className="checkbox-row__input"
                     type="checkbox"
                     name="needs_transport"
                     defaultChecked={user_response?.needs_transport ?? false}
                  />
                  <span className="checkbox-row__label">Potrzebuję transportu</span>
               </label>

               <label className="checkbox-row">
                  <input
                     className="checkbox-row__input"
                     type="checkbox"
                     name="self_transport"
                     defaultChecked={user_response?.self_transport ?? false}
                  />
                  <span className="checkbox-row__label">Jadę samodzielnie</span>
               </label>

               <label className="field-group">
                  <span className="field-label">Ile osób mogę zabrać</span>
                  <input
                     className="field-input"
                     type="number"
                     name="can_take_people"
                     min={0}
                     defaultValue={user_response?.can_take_people ?? 0}
                  />
               </label>

               {event.type === "training" ? (
                  <label className="field-group">
                     <span className="field-label">Wybrana trasa</span>
                     <select
                        className="field-input field-select"
                        name="selected_route_id"
                        defaultValue={options.training_routes?.[0]?.id ?? ""}
                     >
                        {options.training_routes?.map((route) => (
                           <option key={route.id ?? route.name} value={route.id ?? route.name}>
                              {route.name}
                           </option>
                        ))}
                     </select>
                  </label>
               ) : null}

               {event.type === "competition" ? (
                  <div className="response-grid">
                     <label className="checkbox-row">
                        <input
                           className="checkbox-row__input"
                           type="checkbox"
                           name="needs_accommodation"
                           defaultChecked={user_response?.competition?.needs_accommodation ?? false}
                        />
                        <span className="checkbox-row__label">Nocleg</span>
                     </label>

                     <label className="checkbox-row">
                        <input
                           className="checkbox-row__input"
                           type="checkbox"
                           name="wants_food"
                           defaultChecked={user_response?.competition?.wants_food ?? false}
                        />
                        <span className="checkbox-row__label">Wyżywienie</span>
                     </label>

                     <label className="checkbox-row">
                        <input
                           className="checkbox-row__input"
                           type="checkbox"
                           name="wants_vege"
                           defaultChecked={user_response?.competition?.wants_vege ?? false}
                        />
                        <span className="checkbox-row__label">Wegetariańskie</span>
                     </label>

                     {options.runs?.map((run) => {
                        const isChecked = user_response?.competition?.run_selections?.some(
                           (selection) => selection.run_id === run.id && selection.participates,
                        );

                        return (
                           <label key={run.id} className="checkbox-row">
                              <input
                                 className="checkbox-row__input"
                                 type="checkbox"
                                 name={`run_${run.id}`}
                                 defaultChecked={Boolean(isChecked)}
                              />
                              <span className="checkbox-row__label">{run.name}</span>
                           </label>
                        );
                     })}
                  </div>
               ) : null}

               <label className="field-group">
                  <span className="field-label">Komentarz</span>
                  <textarea
                     className="field-input field-textarea"
                     name="comment"
                     rows={4}
                     defaultValue={user_response?.comment ?? ""}
                     placeholder="Np. jadę, potrzebuję transportu, noclegu i jedzenia."
                  />
               </label>

               {submitMessage ? <p className="page-copy">{submitMessage}</p> : null}

               <button className="primary-btn" type="submit">
                  Wyślij odpowiedź
               </button>
            </form>
         </div>
      </section>
   );
}

function mapResponseLabel(value?: string | null) {
   if (!value || value === "pending") {
      return "nieuzupelnione";
   }

   if (value === "filled") {
      return "uzupelnione";
   }

   return "nie_jade";
}
