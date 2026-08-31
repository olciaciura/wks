import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { EventType } from "../types/events";
import { GiTrashCan } from "react-icons/gi";
import { getEventDetails, updateEvent } from "../lib/api"; // Upewnij się, że masz te funkcje w api.ts!
import type { CreateEventPayload } from "../types/backend";

type CompetitionDateMode = "single" | "range";

type RouteItem = {
   id: string;
   name: string;
   description: string;
};

type RunItem = {
   id: string;
   date: string;
   name: string;
};

export default function EditEventPage() {
   const { eventId } = useParams(); // Pobieramy ID z adresu URL
   const navigate = useNavigate();

   const [eventType, setEventType] = useState<EventType>("training");
   const [competitionDateMode, setCompetitionDateMode] = useState<CompetitionDateMode>("single");

   const [trainingTransport, setTrainingTransport] = useState(false);
   const [competitionTransport, setCompetitionTransport] = useState(false);
   const [accommodation, setAccommodation] = useState(false);
   const [food, setFood] = useState(false);
   const [vege, setVege] = useState(false);

   const [routes, setRoutes] = useState<RouteItem[]>([]);
   const [runs, setRuns] = useState<RunItem[]>([]);

   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);

   const [dateFrom, setDateFrom] = useState("");
   const [dateTo, setDateTo] = useState("");
   const [signUpDateFrom, setSignUpDateFrom] = useState("");
   const [signUpDateTo, setSignUpDateTo] = useState("");

   const [initialData, setInitialData] = useState<any>(null);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      async function loadEvent() {
         if (!eventId) return;
         try {
            const data = await getEventDetails(eventId); 
            const { event, options } = data;

            // 1. Główne dane i kontrolowane daty
            setEventType(event.type);
            setInitialData(data);

            if (event.signup_open_date) setSignUpDateFrom(event.signup_open_date.slice(0, 16));
            if (event.signup_close_date) setSignUpDateTo(event.signup_close_date.slice(0, 16));

            if (event.type === "training") {
               setTrainingTransport(options.transport_available || false);
               if (options.routes) {
                  setRoutes(options.routes.map((r: any) => ({
                     id: r.id || crypto.randomUUID(),
                     name: r.name,
                     description: r.description || ""
                  })));
               }
            } else if (event.type === "competition") {
               setCompetitionTransport(options.transport_available || false);
               setAccommodation(options.accomodation_available || false);
               setFood(options.food_available || false);
               setVege(options.food_vege_available || false);

               const isSeries = options.series_signup || false;
               setCompetitionDateMode(isSeries ? "range" : "single");

               if (event.date_from) setDateFrom(event.date_from.split("T")[0]);
               if (event.date_to) setDateTo(event.date_to.split("T")[0]);

               if (options.runs) {
                  setRuns(options.runs.map((r: any) => ({
                     id: r.id || crypto.randomUUID(),
                     name: r.name,
                     date: r.run_date ? r.run_date.split("T")[0] : ""
                  })));
               }
            }
         } catch (err) {
            setSubmitError("Nie udało się załadować wydarzenia.");
         } finally {
            setIsLoading(false);
         }
      }
      void loadEvent();
   }, [eventId]);

   function addRoute() {
      setRoutes((current) => [...current, { id: crypto.randomUUID(), name: "", description: "" }]);
   }

   function updateRoute(routeId: string, field: "name" | "description", value: string) {
      setRoutes((current) => current.map((route) => (route.id === routeId ? { ...route, [field]: value } : route)));
   }

   function removeRoute(routeId: string) {
      setRoutes((current) => current.filter((route) => route.id !== routeId));
   }

   function addRun() {
      setRuns((current) => [...current, { id: crypto.randomUUID(), date: "", name: "" }]);
   }

   function updateRun(runId: string, field: "date" | "name", value: string) {
      setRuns((current) => current.map((run) => (run.id === runId ? { ...run, [field]: value } : run)));
   }

   function removeRun(runId: string) {
      setRuns((current) => current.filter((run) => run.id !== runId));
   }

   function handleFoodChange(checked: boolean) {
      setFood(checked);
      if (!checked) setVege(false);
   }

   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!eventId) return;
      
      const formData = new FormData(event.currentTarget);
      const getValue = (key: string) => String(formData.get(key) ?? "").trim();

      const title = getValue("title");
      const signupOpen = getValue("signupOpen");
      const signupClose = getValue("signupClose");
      const location = getValue("location");

      let eventDateFrom = "";
      let eventDateTo = "";
      let trainingDetails: CreateEventPayload["training_details"] = null;
      let competitionDetails: CreateEventPayload["competition_details"] = null;
      let trainingRoutes: CreateEventPayload["training_routes"] = [];
      let competitionRuns: CreateEventPayload["competition_runs"] = [];

      if (eventType === "training") {
         const trainingDateTime = getValue("trainingDateTime");
         eventDateFrom = trainingDateTime;
         eventDateTo = trainingDateTime;

         const meetingTimeRaw = getValue("meetingTime");
         const startTimeRaw = getValue("startTime");

         trainingDetails = {
            type: getValue("trainingType") as "sprint" | "forest",
            meeting_time: meetingTimeRaw ? `${meetingTimeRaw}:00` : undefined,
            meeting_location_desc: getValue("meetingLocationDesc") || undefined,
            meeting_location_link: getValue("meetingLocationLink") || undefined,
            start_time: startTimeRaw ? `${startTimeRaw}:00` : undefined,
            start_location_desc: getValue("startLocationDesc") || undefined,
            start_location_link: getValue("startLocationLink") || undefined,
            transport_available: trainingTransport,
         };

         trainingRoutes = routes
            .filter((route) => route.name.trim().length > 0)
            .map((route) => ({
               id: route.id.includes("-") ? route.id : undefined, // Odfiltrujemy tylko prawdziwe UUID (jeśli użyłeś jakiegoś mock-id)
               name: route.name.trim(),
               description: route.description.trim() || undefined,
               distance: 0,
            }));
      } else {
         const isSingleDay = competitionDateMode === "single";

         if (isSingleDay) {
            const singleDate = getValue("competitionDateSingle");
            eventDateFrom = singleDate;
            eventDateTo = singleDate;
         } else {
            eventDateFrom = getValue("competitionDateFrom");
            eventDateTo = getValue("competitionDateTo");
         }

         const departureTimeRaw = getValue("departureTime");

         competitionDetails = {
            competition_name: title,
            transport_available: competitionTransport,
            departure_time: departureTimeRaw ? `${eventDateFrom}T${departureTimeRaw}:00` : undefined,
            departure_location_desc: getValue("departureLocationDesc") || undefined,
            departure_location_link: getValue("departureLocationLink") || undefined,
            accomodation_available: accommodation,
            food_available: food,
            food_vege_available: food && vege,
            series_signup: !isSingleDay,
         };

         if (isSingleDay) {
            const singleRunName = getValue("singleRunName") || title;
            const existingId = initialData?.options?.runs?.[0]?.id;
            competitionRuns = [{ 
               id: existingId, // <-- to kluczowe!
               name: singleRunName, 
               run_date: eventDateFrom 
            }];
         } else {
            competitionRuns = runs
               .filter((run) => run.name.trim().length > 0 && run.date)
               .map((run) => ({ id: run.id.includes("-") ? run.id : undefined, name: run.name.trim(), run_date: run.date }));
         }
      }

      const payload: CreateEventPayload = {
         type: eventType,
         title,
         date_from: eventDateFrom,
         date_to: eventDateTo,
         signup_open_date: signupOpen,
         signup_close_date: signupClose,
         training_details: trainingDetails,
         training_routes: trainingRoutes,
         competition_details: competitionDetails,
         competition_runs: competitionRuns,
         location: location,
         food_options: [],
      };

      try {
         setIsSubmitting(true);
         setSubmitError(null);
         // ZMIANA: używamy updateEvent zamiast createEvent
         await updateEvent(eventId, payload);
         navigate("/dashboard");
      } catch (error) {
         setSubmitError(error instanceof Error ? error.message : "Nie udało się zaktualizować wydarzenia.");
      } finally {
         setIsSubmitting(false);
      }
   }

   if (isLoading) {
      return <div className="page-card" style={{ padding: "2rem", textAlign: "center" }}>Pobieranie danych wydarzenia...</div>;
   }

   if (!initialData) {
      return <div className="page-card page-copy">Nie udało się załadować wydarzenia.</div>;
   }

   return (
      <section className="page-card page-stack create-event">
         <h1>Edytuj wydarzenie</h1>

         <div className="switcher" role="tablist" aria-label="Typ wydarzenia">
            <button
               className={`switcher__button${eventType === "training" ? " is-active" : ""}`}
               type="button"
               onClick={() => setEventType("training")}
               disabled // Najlepiej zablokować zmianę głównego typu po utworzeniu
            >
               Trening
            </button>
            <button
               className={`switcher__button${eventType === "competition" ? " is-active" : ""}`}
               type="button"
               onClick={() => setEventType("competition")}
               disabled
            >
               Zawody
            </button>
         </div>

         <form className="page-stack" onSubmit={handleSubmit}>
            <div className="form-grid">
               <label className="field-group field-group--full">
                  <span className="field-label">Nazwa wydarzenia</span>
                  <input
                     className="field-input"
                     name="title"
                     type="text"
                     placeholder="Np. Letni trening w lesie"
                     defaultValue={initialData.event.title}
                     required
                  />
               </label>
               <label className="field-group field-group--full">
                  <span className="field-label">Miejsce</span>
                  <input 
                     className="field-input" 
                     name="location" 
                     type="text" 
                     placeholder="np. Ślęża" 
                     defaultValue={initialData.event.location}
                     required 
                  />
               </label>
            </div>

            {eventType === "training" ? (
               <section className="detail-panel detail-panel--soft page-stack">
                  <div className="form-grid">
                     <label className="field-group">
                        <span className="field-label">Data treningu</span>
                        <input 
                           className="field-input" 
                           name="trainingDateTime" 
                           type="date" 
                           defaultValue={initialData.event.date_from?.split("T")[0]}
                           required 
                        />
                     </label>
                     <label className="field-group">
                        <span className="field-label">Typ treningu</span>
                        <select 
                           className="field-input field-select" 
                           name="trainingType" 
                           defaultValue={initialData.options?.training_type || "forest"}
                        >
                           <option value="sprint">sprinterski</option>
                           <option value="forest">leśny</option>
                        </select>
                     </label>
                     
                     <div className="field-group--full form-grid">
                        <label className="field-group">
                           <span className="field-label">Zapisy od</span>
                           <input 
                              className="field-input" 
                              name="signupOpen" 
                              type="datetime-local" 
                              required 
                              value={signUpDateFrom}
                              onChange={(e) => {
                                 const newDate = e.target.value;
                                 setSignUpDateFrom(newDate);
                                 if (signUpDateTo && newDate > signUpDateTo) {
                                    setSignUpDateTo(newDate);
                                 }
                              }}
                           />
                        </label>
                        <label className="field-group">
                           <span className="field-label">Zapisy do</span>
                           <input 
                              className="field-input" 
                              name="signupClose" 
                              type="datetime-local" 
                              required 
                              min={signUpDateFrom}
                              value={signUpDateTo || signUpDateFrom}
                              onChange={(e) => setSignUpDateTo(e.target.value)}
                           />
                        </label>
                     </div>

                     <div className="field-group--full">
                        <label className="field-group">
                           <span className="field-label">Miejsce zbiórki</span>
                           <input
                              className="field-input"
                              name="meetingLocationDesc"
                              type="text"
                              placeholder="Parking przy stadionie"
                              defaultValue={initialData.options?.meeting_location_desc}
                           />
                        </label>
                        <div className="field-group--full form-grid" style={{ marginTop: '14px' }}>
                           <label className="field-group">
                              <span className="field-label">Pinezka miejsca zbiórki</span>
                              <input
                                 className="field-input"
                                 name="meetingLocationLink"
                                 type="url"
                                 placeholder="Link do mapy"
                                 defaultValue={initialData.options?.meeting_location_link}
                              />
                           </label>
                           <label className="field-group">
                              <span className="field-label">Godzina zbiórki</span>
                              <input 
                                 className="field-input" 
                                 name="meetingTime" 
                                 type="time" 
                                 defaultValue={initialData.options?.meeting_time?.slice(0, 5)}
                              />
                           </label>
                        </div>
                     </div>

                     <div className="field-group--full">
                        <label className="field-group">
                           <span className="field-label">Miejsce startu</span>
                           <input
                              className="field-input"
                              name="startLocationDesc"
                              type="text"
                              placeholder="Polana startowa"
                              defaultValue={initialData.options?.start_location_desc}
                           />
                        </label>
                        <div className="field-group--full form-grid" style={{ marginTop: '14px' }}>
                           <label className="field-group">
                              <span className="field-label">Pinezka miejsca startu</span>
                              <input
                                 className="field-input"
                                 name="startLocationLink"
                                 type="url"
                                 placeholder="Link do mapy"
                                 defaultValue={initialData.options?.start_location_link}
                              />
                           </label>
                           <label className="field-group">
                              <span className="field-label">Godzina startu</span>
                              <input 
                                 className="field-input" 
                                 name="startTime" 
                                 type="time" 
                                 defaultValue={initialData.options?.start_time?.slice(0, 5)}
                              />
                           </label>
                        </div>
                     </div>
                  </div>

                  <label className="checkbox-row">
                     <input
                        className="checkbox-row__input"
                        type="checkbox"
                        checked={trainingTransport}
                        onChange={(event) => setTrainingTransport(event.target.checked)}
                     />
                     <span className="checkbox-row__label">Transport dostępny</span>
                  </label>

                  <div className="field-group field-group--full">
                     <div className="field-group__header">
                        <span className="field-label">Trasy</span>
                        <button className="ghost-btn ghost-btn--small" type="button" onClick={addRoute}>
                           + Dodaj trasę
                        </button>
                     </div>
                     <div className="page-stack page-stack--compact">
                        {routes.map((route) => (
                           <div className="info-card page-stack page-stack--compact" key={route.id}>
                              <div className="form-grid">
                                 <label className="field-group">
                                    <span className="field-label">Nazwa trasy</span>
                                    <input
                                       className="field-input"
                                       type="text"
                                       value={route.name}
                                       onChange={(event) => updateRoute(route.id, "name", event.target.value)}
                                    />
                                 </label>
                                 <label className="field-group">
                                    <span className="field-label">Opis</span>
                                    <input
                                       className="field-input"
                                       type="text"
                                       value={route.description}
                                       onChange={(event) => updateRoute(route.id, "description", event.target.value)}
                                       placeholder="Np. 7 km technicznie"
                                    />
                                 </label>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                 <button className="ghost-btn ghost-btn--small" type="button" onClick={() => removeRoute(route.id)}>
                                    <GiTrashCan size={16} style={{ marginRight: '6px' }} /> Usuń trasę
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </section>
            ) : (
               <section className="detail-panel detail-panel--soft page-stack">
                  <div className="switcher" role="tablist" aria-label="Długość zawodów">
                     <button
                        className={`switcher__button${competitionDateMode === "single" ? " is-active" : ""}`}
                        type="button"
                        onClick={() => setCompetitionDateMode("single")}
                     >
                        Jeden dzień
                     </button>
                     <button
                        className={`switcher__button${competitionDateMode === "range" ? " is-active" : ""}`}
                        type="button"
                        onClick={() => setCompetitionDateMode("range")}
                     >
                        Kilka dni
                     </button>
                  </div>

                  <div className="form-grid">
                     {competitionDateMode === "single" ? (
                        <label className="field-group">
                           <span className="field-label">Data zawodów</span>
                           <input 
                              className="field-input" 
                              name="competitionDateSingle" 
                              type="date" 
                              defaultValue={initialData.event.date_from?.split("T")[0]}
                              required 
                           />
                        </label>
                     ) : (
                        <>
                           <label className="field-group">
                              <span className="field-label">Data od</span>
                              <input 
                                 className="field-input" 
                                 name="competitionDateFrom" 
                                 type="date" 
                                 required 
                                 value={dateFrom}
                                 onChange={(e) => {
                                    const newDate = e.target.value;
                                    setDateFrom(newDate);
                                    if (dateTo && newDate > dateTo) setDateTo(newDate);
                                 }}
                              />
                           </label>
                           <label className="field-group">
                              <span className="field-label">Data do</span>
                              <input 
                                 className="field-input" 
                                 name="competitionDateTo" 
                                 type="date" 
                                 required 
                                 min={dateFrom}
                                 value={dateTo || dateFrom} 
                                 onChange={(e) => setDateTo(e.target.value)}
                              />
                           </label>
                        </>
                     )}

                     <div className="field-group--full form-grid">
                        <label className="field-group">
                           <span className="field-label">Zapisy od</span>
                           <input 
                              className="field-input" 
                              name="signupOpen" 
                              type="datetime-local" 
                              required 
                              value={signUpDateFrom}
                              onChange={(e) => {
                                 const newDate = e.target.value;
                                 setSignUpDateFrom(newDate);
                                 if (signUpDateTo && newDate > signUpDateTo) {
                                    setSignUpDateTo(newDate);
                                 }
                              }}
                           />
                        </label>
                        <label className="field-group">
                           <span className="field-label">Zapisy do</span>
                           <input 
                              className="field-input" 
                              name="signupClose" 
                              type="datetime-local" 
                              required 
                              min={signUpDateFrom}
                              value={signUpDateTo || signUpDateFrom} 
                              onChange={(e) => setSignUpDateTo(e.target.value)}
                           />
                        </label>
                     </div>
                  </div>

                  <div className="form-grid">
                     <label className="field-group">
                        <span className="field-label">Miejsce wyjazdu</span>
                        <input
                           className="field-input"
                           name="departureLocationDesc"
                           type="text"
                           placeholder="Parking klubowy"
                           defaultValue={initialData.options?.departure_location_desc}
                        />
                     </label>
                     <label className="field-group">
                        <span className="field-label">Godzina wyjazdu</span>
                        <input 
                           className="field-input" 
                           name="departureTime" 
                           type="time" 
                           defaultValue={initialData.options?.departure_time?.split("T")[1]?.slice(0, 5)} 
                        />
                     </label>
                     <label className="field-group field-group--full">
                        <span className="field-label">Pinezka miejsca wyjazdu</span>
                        <input
                           className="field-input"
                           name="departureLocationLink"
                           type="url"
                           placeholder="Link do mapy"
                           defaultValue={initialData.options?.departure_location_link}
                        />
                     </label>
                  </div>

                  <div className="form-grid">
                     <label className="checkbox-row">
                        <input
                           className="checkbox-row__input"
                           type="checkbox"
                           checked={competitionTransport}
                           onChange={(event) => setCompetitionTransport(event.target.checked)}
                        />
                        <span className="checkbox-row__label">Transport dostępny</span>
                     </label>
                     <label className="checkbox-row">
                        <input
                           className="checkbox-row__input"
                           type="checkbox"
                           checked={accommodation}
                           onChange={(event) => setAccommodation(event.target.checked)}
                        />
                        <span className="checkbox-row__label">Nocleg</span>
                     </label>
                     <label className="checkbox-row">
                        <input
                           className="checkbox-row__input"
                           type="checkbox"
                           checked={food}
                           onChange={(event) => handleFoodChange(event.target.checked)}
                        />
                        <span className="checkbox-row__label">Wyżywienie</span>
                     </label>
                     {food ? (
                        <label className="checkbox-row">
                           <input
                              className="checkbox-row__input"
                              type="checkbox"
                              checked={vege}
                              onChange={(event) => setVege(event.target.checked)}
                           />
                           <span className="checkbox-row__label">Wege</span>
                        </label>
                     ) : null}
                  </div>

                  {competitionDateMode === "single" ? (
                     <div className="form-grid">
                        <label className="field-group field-group--full">
                           <span className="field-label">Nazwa biegu</span>
                           <input 
                              className="field-input" 
                              name="singleRunName" 
                              type="text" 
                              placeholder="Bieg główny" 
                              defaultValue={initialData.options?.runs?.[0]?.name}
                           />
                        </label>
                     </div>
                  ) : (
                     <div className="field-group field-group--full">
                        <div className="field-group__header">
                           <span className="field-label">Biegi</span>
                           <button className="ghost-btn ghost-btn--small" type="button" onClick={addRun}>
                              + Dodaj bieg
                           </button>
                        </div>
                        <div className="page-stack page-stack--compact">
                           {runs.map((run) => (
                              <div className="info-card page-stack page-stack--compact" key={run.id}>
                                 <div className="form-grid">
                                    <label className="field-group">
                                       <span className="field-label">Data biegu</span>
                                       <input
                                          className="field-input"
                                          type="date"
                                          value={run.date}
                                          onChange={(event) => updateRun(run.id, "date", event.target.value)}
                                       />
                                    </label>
                                    <label className="field-group">
                                       <span className="field-label">Nazwa biegu</span>
                                       <input
                                          className="field-input"
                                          type="text"
                                          value={run.name}
                                          onChange={(event) => updateRun(run.id, "name", event.target.value)}
                                          placeholder="Np. Bieg 1"
                                       />
                                    </label>
                                 </div>
                                 <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                       className="ghost-btn ghost-btn--small"
                                       type="button"
                                       onClick={() => removeRun(run.id)}
                                    >
                                       <GiTrashCan size={16} style={{ marginRight: '6px' }} /> Usuń bieg
                                    </button>
                                 </div>
                              </div>
                           ))}
                           {runs.length === 0 ? (
                              <p className="page-copy" style={{ textAlign: "center", padding: "10px 0" }}>Brak biegów - dodaj pierwszy przyciskiem powyżej.</p>
                           ) : null}
                        </div>
                     </div>
                  )}
               </section>
            )}

            {submitError ? <p className="page-copy" style={{ color: "var(--color-accent)" }}>{submitError}</p> : null}

           <div className="action-row">
               <Link className="ghost-btn" to="/dashboard" style={{ display: "flex", justifyContent: "center" }}>
                  Anuluj
               </Link>
               <button className="primary-btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Aktualizowanie..." : "Zapisz zmiany"}
               </button>
            </div>
         </form>
      </section>
   );
}