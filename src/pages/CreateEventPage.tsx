import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { EventType } from "../types/events";
import { GiTrashCan } from "react-icons/gi";
import { createEvent } from "../lib/api";
import type { CreateEventPayload } from "../types/backend";

type CreateEventPageProps = {
   initialType: EventType;
};

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

const defaultRoutes: RouteItem[] = [
   { id: crypto.randomUUID(), name: "K/M 12", description: "" },
   { id: crypto.randomUUID(), name: "K/M14", description: "" },
   { id: crypto.randomUUID(), name: "K/M 16 + weterani", description: "" },
   { id: crypto.randomUUID(), name: "K/M 18 + weterani", description: "" },
   { id: crypto.randomUUID(), name: "K/M 20+", description: "" },
];

export default function CreateEventPage({ initialType }: CreateEventPageProps) {
   const navigate = useNavigate();
   const [eventType, setEventType] = useState<EventType>(initialType);

   const [competitionDateMode, setCompetitionDateMode] = useState<CompetitionDateMode>("single");

   const [trainingTransport, setTrainingTransport] = useState(false);

   const [competitionTransport, setCompetitionTransport] = useState(false);
   const [accommodation, setAccommodation] = useState(false);
   const [food, setFood] = useState(false);
   const [vege, setVege] = useState(false);

   const [routes, setRoutes] = useState<RouteItem[]>(defaultRoutes);
   const [runs, setRuns] = useState<RunItem[]>([]);

   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);

   function addRoute() {
      setRoutes((current) => [...current, { id: crypto.randomUUID(), name: "", description: "" }]);
   }

   function updateRoute(id: string, field: "name" | "description", value: string) {
      setRoutes((current) => current.map((route) => (route.id === id ? { ...route, [field]: value } : route)));
   }

   function removeRoute(id: string) {
      setRoutes((current) => current.filter((route) => route.id !== id));
   }

   function addRun() {
      setRuns((current) => [...current, { id: crypto.randomUUID(), date: "", name: "" }]);
   }

   function updateRun(id: string, field: "date" | "name", value: string) {
      setRuns((current) => current.map((run) => (run.id === id ? { ...run, [field]: value } : run)));
   }

   function removeRun(id: string) {
      setRuns((current) => current.filter((run) => run.id !== id));
   }

   function handleFoodChange(checked: boolean) {
      setFood(checked);
      if (!checked) {
         setVege(false);
      }
   }

   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const getValue = (key: string) => String(formData.get(key) ?? "").trim();

      const title = getValue("title");
      const signupOpen = getValue("signupOpen");
      const signupClose = getValue("signupClose");
      const location = getValue("location");

      let dateFrom = "";
      let dateTo = "";
      let trainingDetails: CreateEventPayload["training_details"] = null;
      let competitionDetails: CreateEventPayload["competition_details"] = null;
      let trainingRoutes: CreateEventPayload["training_routes"] = [];
      let competitionRuns: CreateEventPayload["competition_runs"] = [];

      if (eventType === "training") {
         const trainingDateTime = getValue("trainingDateTime");
         dateFrom = trainingDateTime;
         dateTo = trainingDateTime;

         trainingDetails = {
            type: getValue("trainingType") as "sprint" | "forest",
            meeting_time: getValue("meetingTime") || undefined,
            meeting_location_desc: getValue("meetingLocationDesc") || undefined,
            meeting_location_link: getValue("meetingLocationLink") || undefined,
            start_time: getValue("startTime") || undefined,
            start_location_desc: getValue("startLocationDesc") || undefined,
            start_location_link: getValue("startLocationLink") || undefined,
            transport_available: trainingTransport,
         };

         trainingRoutes = routes
            .filter((route) => route.name.trim().length > 0)
            .map((route) => ({
               name: route.name.trim(),
               description: route.description.trim() || undefined,
               distance: 0,
            }));
      } else {
         const isSingleDay = competitionDateMode === "single";

         if (isSingleDay) {
            const singleDate = getValue("competitionDateSingle");
            dateFrom = singleDate;
            dateTo = singleDate;
         } else {
            dateFrom = getValue("competitionDateFrom");
            dateTo = getValue("competitionDateTo");
         }

         competitionDetails = {
            competition_name: title,
            transport_available: competitionTransport,
            departure_time: getValue("departureTime") || undefined,
            departure_location_desc: getValue("departureLocationDesc") || undefined,
            departure_location_link: getValue("departureLocationLink") || undefined,
            accomodation_available: accommodation,
            food_available: food,
            food_vege_available: food && vege,
            series_signup: !isSingleDay,
         };

         if (isSingleDay) {
            const singleRunName = getValue("singleRunName") || title;
            competitionRuns = [{ name: singleRunName, run_date: dateFrom }];
         } else {
            competitionRuns = runs
               .filter((run) => run.name.trim().length > 0 && run.date)
               .map((run) => ({ name: run.name.trim(), run_date: run.date }));
         }
      }

      const payload: CreateEventPayload = {
         type: eventType,
         title,
         date_from: dateFrom,
         date_to: dateTo,
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
         await createEvent(payload);
         navigate("/dashboard");
      } catch (error) {
         setSubmitError(error instanceof Error ? error.message : "Nie udało się zapisać wydarzenia.");
      } finally {
         setIsSubmitting(false);
      }
   }

   return (
      <section className="page-card page-stack create-event">
         <h1>Nowe wydarzenie</h1>

         <div className="switcher" role="tablist" aria-label="Typ wydarzenia">
            <button
               className={`switcher__button${eventType === "training" ? " is-active" : ""}`}
               type="button"
               onClick={() => setEventType("training")}
            >
               Training
            </button>
            <button
               className={`switcher__button${eventType === "competition" ? " is-active" : ""}`}
               type="button"
               onClick={() => setEventType("competition")}
            >
               Competition
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
                     required
                  />
               </label>
               <label className="field-group field-group--full">
                  <span className="field-label">Miejsce</span>
                  <input className="field-input" name="location" type="text" placeholder="np. Ślęża" required />
               </label>
            </div>

            {eventType === "training" ? (
               <section className="detail-panel detail-panel--soft page-stack">
                  <div className="form-grid">
                     <label className="field-group">
                        <span className="field-label">Data treningu</span>
                        <input className="field-input" name="trainingDateTime" type="date" required />
                     </label>
                     <label className="field-group">
                        <span className="field-label">Typ treningu</span>
                        <select className="field-input field-select" name="trainingType" defaultValue="forest">
                           <option value="sprint">spinterski</option>
                           <option value="forest">leśny</option>
                        </select>
                     </label>
                     <div className="field-group--full field-pair">
                        <label className="field-group">
                           <span className="field-label">Zapisy od</span>
                           <input className="field-input" name="signupOpen" type="datetime-local" required />
                        </label>
                        <label className="field-group">
                           <span className="field-label">Zapisy do</span>
                           <input className="field-input" name="signupClose" type="datetime-local" required />
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
                           />
                        </label>
                        <div className="field-group--full field-pair">
                           <label className="field-group">
                              <span className="field-label">Pinezka miejsca zbiórki</span>
                              <input
                                 className="field-input"
                                 name="meetingLocationLink"
                                 type="url"
                                 placeholder="Link do mapy"
                              />
                           </label>
                           <label className="field-group">
                              <span className="field-label">Godzina zbiórki</span>
                              <input className="field-input" name="meetingTime" type="time" placeholder="17:20" />
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
                           />
                        </label>
                        <div className="field-group--full field-pair">
                           <label className="field-group">
                              <span className="field-label">Pinezka miejsca startu</span>
                              <input
                                 className="field-input"
                                 name="startLocationLink"
                                 type="url"
                                 placeholder="Link do mapy"
                              />
                           </label>
                           <label className="field-group">
                              <span className="field-label">Godzina startu</span>
                              <input className="field-input" name="startTime" type="time" placeholder="18:00" />
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
                           <div className="field-pair field-pair--with-action" key={route.id}>
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
                              <button className="icon-btn" type="button" onClick={() => removeRoute(route.id)}>
                                 <GiTrashCan size={24} />
                              </button>
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
                           <input className="field-input" name="competitionDateSingle" type="date" required />
                        </label>
                     ) : (
                        <>
                           <label className="field-group">
                              <span className="field-label">Data od</span>
                              <input className="field-input" name="competitionDateFrom" type="date" required />
                           </label>
                           <label className="field-group">
                              <span className="field-label">Data do</span>
                              <input className="field-input" name="competitionDateTo" type="date" required />
                           </label>
                        </>
                     )}

                     <div className="field-group--full field-pair">
                        <label className="field-group">
                           <span className="field-label">Zapisy od</span>
                           <input className="field-input" name="signupOpen" type="datetime-local" required />
                        </label>
                        <label className="field-group">
                           <span className="field-label">Zapisy do</span>
                           <input className="field-input" name="signupClose" type="datetime-local" required />
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
                        />
                     </label>
                     <label className="field-group">
                        <span className="field-label">Godzina wyjazdu</span>
                        <input className="field-input" name="departureTime" type="time" placeholder="06:15" />
                     </label>
                     <label className="field-group field-group--full">
                        <span className="field-label">Pinezka miejsca wyjazdu</span>
                        <input
                           className="field-input"
                           name="departureLocationLink"
                           type="url"
                           placeholder="Link do mapy"
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
                           <input className="field-input" name="singleRunName" type="text" placeholder="Bieg główny" />
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
                              <div className="form-grid" key={run.id}>
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
                                       placeholder="Bieg 1"
                                    />
                                 </label>
                                 <button
                                    className="ghost-btn ghost-btn--small"
                                    type="button"
                                    onClick={() => removeRun(run.id)}
                                 >
                                    Usuń
                                 </button>
                              </div>
                           ))}
                           {runs.length === 0 ? (
                              <p className="page-copy">Brak biegów - dodaj pierwszy powyżej.</p>
                           ) : null}
                        </div>
                     </div>
                  )}
               </section>
            )}

            {submitError ? <p className="page-copy">{submitError}</p> : null}

            <div className="action-row">
               <Link className="ghost-btn" to="/dashboard">
                  Anuluj
               </Link>
               <button className="primary-btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Zapisywanie..." : "Zapisz wydarzenie"}
               </button>
            </div>
         </form>
      </section>
   );
}
