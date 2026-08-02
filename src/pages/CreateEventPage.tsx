import { useState } from "react";
import { Link } from "react-router-dom";
import type { EventType } from "../types/events";

type CreateEventPageProps = {
   initialType: EventType;
};

export default function CreateEventPage({ initialType }: CreateEventPageProps) {
   const [eventType, setEventType] = useState<EventType>(initialType);

   return (
      <section className="page-card page-stack create-event">
         <div className="page-stack page-stack--compact">
            <p className="eyebrow">Create event</p>
            <div>
               <h1>Nowe wydarzenie</h1>
               <p className="page-copy">
                  Oddzielne ścieżki dla treningu i zawodów. Wybierz typ i uzupełnij pola specyficzne dla danego flow.
               </p>
            </div>
         </div>

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

         <form className="page-stack">
            <div className="form-grid">
               <label className="field-group">
                  <span className="field-label">Nazwa wydarzenia</span>
                  <input className="field-input" type="text" placeholder="Np. Letni trening w lesie" />
               </label>

               <label className="field-group">
                  <span className="field-label">Status</span>
                  <select className="field-input field-select" defaultValue="open">
                     <option value="future">future</option>
                     <option value="open">open</option>
                     <option value="closed">closed</option>
                     <option value="archived">archived</option>
                  </select>
               </label>

               <label className="field-group">
                  <span className="field-label">Zakres dat</span>
                  <input className="field-input" type="text" placeholder="12 lip 2026 - 14 lip 2026" />
               </label>

               <label className="field-group">
                  <span className="field-label">Okno zapisów</span>
                  <input className="field-input" type="text" placeholder="Do 10 lip 20:00" />
               </label>
            </div>

            {eventType === "training" ? (
               <section className="detail-panel detail-panel--soft page-stack">
                  <p className="eyebrow eyebrow--compact">Training</p>
                  <div className="form-grid">
                     <label className="field-group">
                        <span className="field-label">Miejsce spotkania</span>
                        <input className="field-input" type="text" placeholder="Parking przy stadionie" />
                     </label>
                     <label className="field-group">
                        <span className="field-label">Czas spotkania</span>
                        <input className="field-input" type="text" placeholder="17:20" />
                     </label>
                     <label className="field-group">
                        <span className="field-label">Miejsce startu</span>
                        <input className="field-input" type="text" placeholder="Polana startowa" />
                     </label>
                     <label className="field-group">
                        <span className="field-label">Czas startu</span>
                        <input className="field-input" type="text" placeholder="18:00" />
                     </label>
                     <label className="field-group">
                        <span className="field-label">Typ treningu</span>
                        <select className="field-input field-select" defaultValue="forest">
                           <option value="sprint">sprint</option>
                           <option value="forest">forest</option>
                        </select>
                     </label>
                     <label className="field-group">
                        <span className="field-label">Transport</span>
                        <select className="field-input field-select" defaultValue="yes">
                           <option value="yes">Dostępny</option>
                           <option value="no">Brak</option>
                        </select>
                     </label>
                     <label className="field-group field-group--full">
                        <span className="field-label">Trasy</span>
                        <textarea
                           className="field-input field-textarea"
                           rows={3}
                           placeholder="5 km spokojnie, 7 km technicznie"
                        />
                     </label>
                  </div>
               </section>
            ) : (
               <section className="detail-panel detail-panel--soft page-stack">
                  <p className="eyebrow eyebrow--compact">Competition</p>
                  <div className="form-grid">
                     <label className="field-group">
                        <span className="field-label">Nazwa zawodów</span>
                        <input className="field-input" type="text" placeholder="Puchar klubu" />
                     </label>
                     <label className="field-group">
                        <span className="field-label">Wyjazd</span>
                        <input className="field-input" type="text" placeholder="06:15 · Parking klubowy" />
                     </label>
                     <label className="field-group">
                        <span className="field-label">Transport</span>
                        <select className="field-input field-select" defaultValue="yes">
                           <option value="yes">Dostępny</option>
                           <option value="no">Brak</option>
                        </select>
                     </label>
                     <label className="field-group">
                        <span className="field-label">Nocleg</span>
                        <select className="field-input field-select" defaultValue="yes">
                           <option value="yes">Tak</option>
                           <option value="no">Nie</option>
                        </select>
                     </label>
                     <label className="field-group">
                        <span className="field-label">Wyżywienie</span>
                        <select className="field-input field-select" defaultValue="yes">
                           <option value="yes">Tak</option>
                           <option value="no">Nie</option>
                        </select>
                     </label>
                     <label className="field-group">
                        <span className="field-label">Wega / wege</span>
                        <select className="field-input field-select" defaultValue="yes">
                           <option value="yes">Tak</option>
                           <option value="no">Nie</option>
                        </select>
                     </label>
                     <label className="field-group">
                        <span className="field-label">Biegi</span>
                        <textarea
                           className="field-input field-textarea"
                           rows={3}
                           placeholder="Bieg 1, Bieg 2, Bieg 3"
                        />
                     </label>
                     <label className="field-group field-group--full">
                        <span className="field-label">Harmonogram jedzenia</span>
                        <textarea
                           className="field-input field-textarea"
                           rows={3}
                           placeholder="19 lip - obiad po starcie"
                        />
                     </label>
                  </div>
               </section>
            )}

            <div className="action-row">
               <Link className="ghost-btn" to="/dashboard">
                  Anuluj
               </Link>
               <button className="primary-btn" type="submit">
                  Zapisz wydarzenie
               </button>
            </div>
         </form>
      </section>
   );
}
