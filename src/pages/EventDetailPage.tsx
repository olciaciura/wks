import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { getEventDetail, submitEventResponse } from "../lib/api";
import type { EventDetailDto, EventResponsePayload } from "../types/backend";

type TransportChoice = "" | "needs" | "self" | "can_take";
type YesNoChoice = "" | "tak" | "nie";

export default function EventDetailPage() {
   const { eventId } = useParams();
   const { currentUser } = useAuth();
   const [eventDetail, setEventDetail] = useState<EventDetailDto | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);
   const [submitMessage, setSubmitMessage] = useState<string | null>(null);

   const [transportChoice, setTransportChoice] = useState<TransportChoice>("");
   const [accommodationChoice, setAccommodationChoice] = useState<YesNoChoice>("");
   const [foodChoice, setFoodChoice] = useState<YesNoChoice>("");
   const [vegeChoice, setVegeChoice] = useState<YesNoChoice>("");

   const runsContainerRef = useRef<HTMLDivElement>(null);

   const signUpClosedDate = eventDetail?.event.signup_close_date ?? "";
   const isClosed = new Date() > new Date(signUpClosedDate);

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

   useEffect(() => {
      if (!eventDetail?.user_response) {
         return;
      }

      const response = eventDetail.user_response;

      if (response.can_take_people > 0) {
         setTransportChoice("can_take");
      } else if (response.self_transport) {
         setTransportChoice("self");
      } else if (response.needs_transport) {
         setTransportChoice("needs");
      }

      if (eventDetail.event.type === "competition" && response.competition) {
         setAccommodationChoice(response.competition.needs_accommodation ? "tak" : "nie");
         setFoodChoice(response.competition.wants_food ? "tak" : "nie");
         setVegeChoice(response.competition.wants_vege ? "tak" : "nie");
      }
   }, [eventDetail]);

   function selectAllRuns() {
      const container = runsContainerRef.current;
      if (!container) {
         return;
      }

      container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((input) => {
         input.checked = true;
      });
   }

   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();

      if (!currentUser || !eventId || !eventDetail) {
         return;
      }

      const formData = new FormData(event.currentTarget);
      const payload: EventResponsePayload = {
         user_id: currentUser.user_id,
         status: "filled",
         needs_transport: transportChoice === "needs",
         self_transport: transportChoice === "self",
         can_take_people: transportChoice === "can_take" ? Number(formData.get("can_take_people") ?? 0) || 0 : 0,
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
            needs_accommodation: accommodationChoice === "tak",
            wants_food: foodChoice === "tak",
            wants_vege: foodChoice === "tak" && vegeChoice === "tak",
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
   const responseTone = mapResponseLabel(user_response?.status);

   return (
      <section className="detail-page page-stack">
         <header className="detail-hero page-card page-stack">
            <div className="detail-hero__top">
               <Link className="ghost-btn detail-back" to="/dashboard">
                  ← Dashboard
               </Link>
               <div className="event-card__badges">
                  <StatusBadge tone={event.type}>{event.type}</StatusBadge>
               </div>
            </div>

            <div className="page-stack page-stack--compact">
               <h1>{event.title}</h1>
            </div>

            <div className="detail-hero__grid">
               <div>
                  <p className="detail-hero__date">
                     {formatDate(event.date_from)}{" "}
                     {event.date_from != event.date_to && `– ${formatDate(event.date_to)}`}
                  </p>
               </div>
               <div>
                  <span className="event-card__label">Zapisy do</span>
                  <p className="detail-hero__date">{formatDateAndHour(event.signup_close_date)}</p>
                  <StatusBadge tone={responseTone}>{mapResponseDisplay(responseTone)}</StatusBadge>
               </div>
            </div>
         </header>

         <div className="detail-grid">
            <details className="detail-panel info-collapsible">
               <summary className="info-collapsible__summary">Dodatkowe informacje</summary>

               <div className="info-collapsible__content">
                  {event.type === "training" ? (
                     <div className="page-stack">
                        {/* KAFELKI Z LOGISTYKĄ */}
                        <div
                           className="detail-list"
                           style={{
                              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                              display: "grid",
                              gap: "12px",
                           }}
                        >
                           {/* Zbiórka */}
                           <div className="info-card info-card--muted">
                              <span className="info-card__label">Zbiórka</span>
                              {options.meeting_time || options.meeting_location_desc ? (
                                 <>
                                    <div className="info-card__value">
                                       {options.meeting_time?.slice(0, 5) || "--:--"}
                                       {options.meeting_location_desc && (
                                          <span className="info-card__sub"> • {options.meeting_location_desc}</span>
                                       )}
                                    </div>
                                    {options.meeting_location_link && (
                                       <a
                                          href={options.meeting_location_link}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="ghost-btn ghost-btn--small"
                                          style={{ marginTop: "4px", width: "fit-content" }}
                                       >
                                          📍 Pokaż na mapie
                                       </a>
                                    )}
                                 </>
                              ) : (
                                 <span className="info-card__sub" style={{ fontStyle: "italic", marginTop: "2px" }}>
                                    Szczegóły wkrótce...
                                 </span>
                              )}
                           </div>

                           {/* Start */}
                           <div className="info-card info-card--muted">
                              <span className="info-card__label">Start</span>
                              {options.start_time || options.start_location_desc ? (
                                 <>
                                    <div className="info-card__value">
                                       {options.start_time?.slice(0, 5) || "--:--"}
                                       {options.start_location_desc && (
                                          <span className="info-card__sub"> • {options.start_location_desc}</span>
                                       )}
                                    </div>
                                    {options.start_location_link && (
                                       <a
                                          href={options.start_location_link}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="ghost-btn ghost-btn--small"
                                          style={{ marginTop: "4px", width: "fit-content" }}
                                       >
                                          📍 Pokaż na mapie
                                       </a>
                                    )}
                                 </>
                              ) : (
                                 <span className="info-card__sub" style={{ fontStyle: "italic", marginTop: "2px" }}>
                                    Szczegóły wkrótce...
                                 </span>
                              )}
                           </div>

                           {/* Informacje ogólne */}
                           <div className="info-card info-card--muted">
                              <span className="info-card__label">Informacje</span>
                              <div style={{ marginTop: "4px" }}>
                                 <div className="info-card__row">
                                    <span className="info-card__sub">Typ treningu</span>
                                    <strong style={{ color: "var(--text-h)", fontSize: "0.95rem" }}>
                                       {options.training_type === "sprint"
                                          ? "Sprinterski"
                                          : options.training_type === "forest"
                                            ? "Leśny"
                                            : options.training_type || "Brak"}
                                    </strong>
                                 </div>
                                 <div className="info-card__row">
                                    <span className="info-card__sub">Transport</span>
                                    <strong style={{ color: "var(--text-h)", fontSize: "0.95rem" }}>
                                       {options.transport_available ? "Dostępny" : "Własny"}
                                    </strong>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* TRASY */}
                        <h3 style={{ fontSize: "1.05rem", marginTop: "12px", color: "var(--text-h)" }}>
                           Dostępne trasy
                        </h3>
                        <div
                           style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                              gap: "10px",
                           }}
                        >
                           {(options.routes?.length ?? 0) > 0 ? (
                              options.routes?.map((route: any) => (
                                 <div key={route.id} className="info-card" style={{ padding: "14px 16px" }}>
                                    <strong style={{ color: "var(--color-primary)", fontSize: "1.05rem" }}>
                                       {route.name}
                                    </strong>
                                    {route.description && (
                                       <span
                                          className="info-card__sub"
                                          style={{ marginTop: "4px", fontSize: "0.85rem" }}
                                       >
                                          {route.description}
                                       </span>
                                    )}
                                 </div>
                              ))
                           ) : (
                              <div
                                 className="info-card"
                                 style={{
                                    borderStyle: "dashed",
                                    opacity: 0.6,
                                    gridColumn: "1 / -1",
                                    textAlign: "center",
                                    padding: "16px",
                                 }}
                              >
                                 <span style={{ fontStyle: "italic", fontSize: "0.9rem" }}>
                                    Zestawienie tras pojawi się w późniejszym terminie.
                                 </span>
                              </div>
                           )}
                        </div>
                     </div>
                  ) : null}

                  {event.type === "competition" ? (
                     <div className="page-stack">
                        {/* KAFELKI Z LOGISTYKĄ */}
                        <div
                           className="detail-list"
                           style={{
                              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                              display: "grid",
                              gap: "12px",
                           }}
                        >
                           {/* Wyjazd */}
                           <div className="info-card info-card--muted">
                              <span className="info-card__label">Miejsce wyjazdu</span>
                              {options.departure_time || options.departure_location_desc ? (
                                 <>
                                    <div className="info-card__value">
                                       {options.departure_time?.split("T")[1]?.slice(0, 5) || "--:--"}
                                       {options.departure_location_desc && (
                                          <span className="info-card__sub"> • {options.departure_location_desc}</span>
                                       )}
                                    </div>
                                    {options.departure_location_link && (
                                       <a
                                          href={options.departure_location_link}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="ghost-btn ghost-btn--small"
                                          style={{ marginTop: "4px", width: "fit-content" }}
                                       >
                                          📍 Pokaż na mapie
                                       </a>
                                    )}
                                 </>
                              ) : (
                                 <span className="info-card__sub" style={{ fontStyle: "italic", marginTop: "2px" }}>
                                    Szczegóły wkrótce...
                                 </span>
                              )}
                           </div>

                           {/* Logistyka */}
                           <div className="info-card info-card--muted">
                              <span className="info-card__label">Logistyka</span>
                              <div style={{ marginTop: "4px" }}>
                                 <div className="info-card__row">
                                    <span className="info-card__sub">Transport</span>
                                    <strong style={{ color: "var(--text-h)", fontSize: "0.95rem" }}>
                                       {options.transport_available ? "Dostępny" : "Własny"}
                                    </strong>
                                 </div>
                                 <div className="info-card__row">
                                    <span className="info-card__sub">Nocleg</span>
                                    <strong style={{ color: "var(--text-h)", fontSize: "0.95rem" }}>
                                       {options.accomodation_available ? "Dostępny" : "Własny"}
                                    </strong>
                                 </div>
                              </div>
                           </div>

                           {/* Wyżywienie */}
                           <div className="info-card info-card--muted">
                              <span className="info-card__label">Wyżywienie</span>
                              <div style={{ marginTop: "4px" }}>
                                 <div className="info-card__row">
                                    <span className="info-card__sub">Dostępność</span>
                                    <strong style={{ color: "var(--text-h)", fontSize: "0.95rem" }}>
                                       {options.food_available ? "Tak" : "Brak"}
                                    </strong>
                                 </div>
                                 {options.food_available && (
                                    <div className="info-card__row">
                                       <span className="info-card__sub">Opcja wege</span>
                                       <strong style={{ color: "var(--text-h)", fontSize: "0.95rem" }}>
                                          {options.food_vege_available ? "Tak" : "Nie"}
                                       </strong>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>

                        {/* BIEGI */}
                        <h3 style={{ fontSize: "1.05rem", marginTop: "12px", color: "var(--text-h)" }}>
                           Harmonogram startów
                        </h3>
                        <div
                           style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                              gap: "10px",
                           }}
                        >
                           {(options.runs?.length ?? 0) > 0 ? (
                              options.runs?.map((run: any) => (
                                 <div key={run.id} className="info-card" style={{ padding: "14px 16px" }}>
                                    <strong style={{ color: "var(--color-accent)", fontSize: "1.05rem" }}>
                                       {run.name}
                                    </strong>
                                    <span
                                       className="info-card__sub"
                                       style={{ display: "block", marginTop: "4px", fontSize: "0.85rem" }}
                                    >
                                       {run.run_date
                                          ? new Date(run.run_date).toLocaleDateString("pl-PL", {
                                               day: "numeric",
                                               month: "long",
                                            })
                                          : "Brak daty"}
                                    </span>
                                 </div>
                              ))
                           ) : (
                              <div
                                 className="info-card"
                                 style={{
                                    borderStyle: "dashed",
                                    opacity: 0.6,
                                    gridColumn: "1 / -1",
                                    textAlign: "center",
                                    padding: "16px",
                                 }}
                              >
                                 <span style={{ fontStyle: "italic", fontSize: "0.9rem" }}>
                                    Lista biegów zostanie opublikowana wkrótce.
                                 </span>
                              </div>
                           )}
                        </div>

                        {/* {(options.food_schedule?.length ?? 0) > 0 && (
                           <>
                              <h3 style={{ fontSize: "1.05rem", marginTop: "12px", color: "var(--text-h)" }}>Rozpiska posiłków</h3>
                              <div className="info-card info-card--muted" style={{ padding: "8px 16px" }}>
                                 {options.food_schedule.map((entry: any, index: number) => (
                                    <div key={entry.date} className="info-card__row" style={{ borderBottom: index === options.food_schedule.length - 1 ? 'none' : '' }}>
                                       <strong style={{ color: "var(--text-h)", fontSize: "0.95rem" }}>
                                          {new Date(entry.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', weekday: 'short' })}
                                       </strong>
                                       <span className="info-card__sub" style={{ fontSize: "0.85rem", textAlign: "right" }}>
                                          {[
                                             entry.breakfast && "Śniadanie",
                                             entry.lunch && "Lunch",
                                             entry.dinner && "Obiad",
                                             entry.supper && "Kolacja"
                                          ].filter(Boolean).join(" · ") || "Brak"}
                                       </span>
                                    </div>
                                 ))}
                              </div>
                           </>
                        )} */}
                     </div>
                  ) : null}
               </div>
            </details>

            <form className="detail-panel response-form" onSubmit={handleSubmit}>
               <p className="eyebrow eyebrow--compact">Twoja odpowiedź</p>
               <h2>Wyślij odpowiedź</h2>

               <div className="field-group">
                  {options.transport_available && (
                     <>
                        <span className="field-label">Transport</span>
                        <div className="radio-group">
                           <label className="radio-row">
                              <input
                                 className="radio-row__input"
                                 type="radio"
                                 name="transport_choice"
                                 value="needs"
                                 checked={transportChoice === "needs"}
                                 onChange={() => setTransportChoice("needs")}
                              />
                              <span className="radio-row__label">Potrzebuję transportu</span>
                           </label>

                           <label className="radio-row">
                              <input
                                 className="radio-row__input"
                                 type="radio"
                                 name="transport_choice"
                                 value="self"
                                 checked={transportChoice === "self"}
                                 onChange={() => setTransportChoice("self")}
                              />
                              <span className="radio-row__label">Jadę samodzielnie</span>
                           </label>

                           <label className="radio-row">
                              <input
                                 className="radio-row__input"
                                 type="radio"
                                 name="transport_choice"
                                 value="can_take"
                                 checked={transportChoice === "can_take"}
                                 onChange={() => setTransportChoice("can_take")}
                              />
                              <span className="radio-row__label">Mogę kogoś zabrać</span>
                           </label>

                           {transportChoice === "can_take" ? (
                              <label className="field-group field-group--nested">
                                 <span className="field-label">Ile osób mogę zabrać</span>
                                 <input
                                    className="field-input"
                                    type="number"
                                    name="can_take_people"
                                    min={1}
                                    defaultValue={user_response?.can_take_people || 1}
                                 />
                              </label>
                           ) : null}
                        </div>
                     </>
                  )}
               </div>

               {event.type === "training" ? (
                  <label className="field-group">
                     <span className="field-label">Wybrana trasa</span>
                     <select
                        className="field-input field-select"
                        name="selected_route_id"
                        defaultValue={options.routes?.[0]?.id ?? ""}
                     >
                        {options.routes?.map((route) => (
                           <option key={route.id ?? route.name} value={route.id ?? route.name}>
                              {route.name}
                           </option>
                        ))}
                     </select>
                  </label>
               ) : null}

               {event.type === "competition" ? (
                  <>
                     <div className="field-group">
                        <span className="field-label">Czy nocujesz z klubem?</span>
                        <div className="radio-group radio-group--inline">
                           <label className="radio-row radio-row--compact">
                              <input
                                 className="radio-row__input"
                                 type="radio"
                                 name="needs_accommodation_choice"
                                 value="tak"
                                 checked={accommodationChoice === "tak"}
                                 onChange={() => setAccommodationChoice("tak")}
                              />
                              <span className="radio-row__label">Tak</span>
                           </label>
                           <label className="radio-row radio-row--compact">
                              <input
                                 className="radio-row__input"
                                 type="radio"
                                 name="needs_accommodation_choice"
                                 value="nie"
                                 checked={accommodationChoice === "nie"}
                                 onChange={() => setAccommodationChoice("nie")}
                              />
                              <span className="radio-row__label">Nie</span>
                           </label>
                        </div>
                     </div>

                     <div className="field-group">
                        <span className="field-label">Wyżywienie</span>
                        <div className="radio-group radio-group--inline">
                           <label className="radio-row radio-row--compact">
                              <input
                                 className="radio-row__input"
                                 type="radio"
                                 name="wants_food_choice"
                                 value="tak"
                                 checked={foodChoice === "tak"}
                                 onChange={() => setFoodChoice("tak")}
                              />
                              <span className="radio-row__label">Tak</span>
                           </label>
                           <label className="radio-row radio-row--compact">
                              <input
                                 className="radio-row__input"
                                 type="radio"
                                 name="wants_food_choice"
                                 value="nie"
                                 checked={foodChoice === "nie"}
                                 onChange={() => {
                                    setFoodChoice("nie");
                                    setVegeChoice("");
                                 }}
                              />
                              <span className="radio-row__label">Nie</span>
                           </label>
                        </div>
                     </div>

                     {foodChoice === "tak" ? (
                        <div className="field-group">
                           <span className="field-label">Wegetariańskie?</span>
                           <div className="radio-group radio-group--inline">
                              <label className="radio-row radio-row--compact">
                                 <input
                                    className="radio-row__input"
                                    type="radio"
                                    name="wants_vege_choice"
                                    value="tak"
                                    checked={vegeChoice === "tak"}
                                    onChange={() => setVegeChoice("tak")}
                                 />
                                 <span className="radio-row__label">Tak</span>
                              </label>
                              <label className="radio-row radio-row--compact">
                                 <input
                                    className="radio-row__input"
                                    type="radio"
                                    name="wants_vege_choice"
                                    value="nie"
                                    checked={vegeChoice === "nie"}
                                    onChange={() => setVegeChoice("nie")}
                                 />
                                 <span className="radio-row__label">Nie</span>
                              </label>
                           </div>
                        </div>
                     ) : null}

                     {options.runs?.length ? (
                        <div className="field-group">
                           <div className="field-group__header">
                              <span className="field-label">Starty</span>
                              <button type="button" className="ghost-btn ghost-btn--small" onClick={selectAllRuns}>
                                 Wszystko
                              </button>
                           </div>
                           <div className="radio-group" ref={runsContainerRef}>
                              {options.runs.map((run) => {
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
                                       <span className="checkbox-row__label">
                                          {run.name} · {formatDate(run.run_date)}
                                       </span>
                                    </label>
                                 );
                              })}
                           </div>
                        </div>
                     ) : null}
                  </>
               ) : null}

               <label className="field-group">
                  <span className="field-label">Komentarz</span>
                  <textarea
                     className="field-input field-textarea"
                     name="comment"
                     rows={4}
                     placeholder="Tu wpisz uwagi odnośnie noclegu, wyżywienia lub startów."
                  />
               </label>

               {submitMessage ? <p className="page-copy">{submitMessage}</p> : null}

               <button className="primary-btn" type="submit" disabled={isClosed}>
                  {isClosed ? "Zapisy zakończone" : "Wyślij odpowiedź"}
               </button>
            </form>
         </div>
      </section>
   );
}

function formatDateAndHour(value?: string | null) {
   if (!value) {
      return "Brak danych";
   }

   const date = new Date(value);
   if (Number.isNaN(date.getTime())) {
      return value;
   }

   return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
   });
}

function formatDate(value?: string | null) {
   if (!value) {
      return "Brak danych";
   }

   const date = new Date(value);
   if (Number.isNaN(date.getTime())) {
      return value;
   }

   return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
   });
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

function mapResponseDisplay(tone: string) {
   if (tone === "uzupelnione") {
      return "uzupełnione";
   }

   if (tone === "nieuzupelnione") {
      return "do uzupełnienia";
   }

   return "odrzucone";
}
