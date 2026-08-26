import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventResponses, type EventResponsesDto } from "../lib/api";

// Typy pomocnicze do sortowania i filtrowania
type SortConfig = { key: string; direction: "asc" | "desc" } | null;

export default function OrganizerEventResponsesPage() {
   const { eventId } = useParams();
   const [data, setData] = useState<EventResponsesDto | null>(null);
   const [loading, setLoading] = useState(true);

   // Stany dla sortowania i filtrowania
   const [sortConfig, setSortConfig] = useState<SortConfig>(null);
   const [filters, setFilters] = useState<Record<string, string>>({});

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

   // Wyciągamy statystyki i opcje dostępne na wydarzeniu
   const stats = data?.statistics;
   const isTraining = data?.event.type === "training";
   const isCompetition = data?.event.type === "competition";
   
   const runsList = useMemo(() => stats?.runs?.map(r => r.run_name) || [], [stats]);
   const hasAccommodation = stats && "needs_accommodation" in stats;
   const hasFood = stats && "wants_food" in stats;
   const hasVege = stats && "wants_vege" in stats; // Zakładam, że backend to zwraca, jeśli było wege

   // --- PRZYGOTOWANIE WIERSSZY DO TABELI ---
   // Mapujemy surowe dane z API na płaskie obiekty, żeby łatwo było je sortować i filtrować
   // --- PRZYGOTOWANIE WIERSSZY DO TABELI ---
   const tableRows = useMemo(() => {
      if (!data) return [];
      
      // FILTR: Dla zawodów bierzemy TYLKO osoby zgłoszone na co najmniej jeden bieg
      const activeUsers = data.users.filter((u: any) => {
         if (isCompetition) {
            // Zwraca true, jeśli u użytkownika istnieje jakikolwiek bieg z participates: true
            return u.competition?.runs?.some((r: any) => r.participates);
         }
         // Dla treningów zostawiamy wszystkich (lub możesz dodać własną logikę)
         return true; 
      });

      // Mapujemy przefiltrowaną listę 'activeUsers' zamiast 'data.users'
      return activeUsers.map((u: any) => {
         const transportText = 
            Number(u.can_take_people) > 0 ? `Bierze ${u.can_take_people}` 
            : u.needs_transport ? "Potrzebuje" 
            : "Własny / Nie";

         const row: Record<string, any> = {
            id: u.user_id,
            name: u.name,
            category: u.category || "-",
            transport: transportText,
            comment: u.comment || "-",
         };

         if (isTraining) {
            row.route = u.training?.selected_route?.name || "-";
         }

         if (isCompetition) {
            row.accommodation = u.competition?.needs_accommodation ? "Tak" : "Nie";
            row.food = u.competition?.wants_food ? "Tak" : "Nie";
            row.vege = u.competition?.is_vege ? "Tak" : "Nie";
            
            runsList.forEach(runName => {
               const participates = u.competition?.runs?.find((r: any) => r.run_name === runName)?.participates;
               row[`run_${runName}`] = participates ? "Tak" : "Nie";
            });
         }
         return row;
      });
   }, [data, isTraining, isCompetition, runsList]);

   // --- FILTROWANIE ---
   const filteredRows = useMemo(() => {
      return tableRows.filter(row => {
         return Object.entries(filters).every(([key, filterValue]) => {
            if (!filterValue) return true; // puste filtry ignorujemy
            const cellValue = String(row[key]).toLowerCase();
            return cellValue.includes(filterValue.toLowerCase());
         });
      });
   }, [tableRows, filters]);

   // --- SORTOWANIE ---
   const sortedRows = useMemo(() => {
      if (!sortConfig) return filteredRows;
      return [...filteredRows].sort((a, b) => {
         const aVal = String(a[sortConfig.key]);
         const bVal = String(b[sortConfig.key]);
         
         // Sortowanie alfabetyczne (localeCompare dobrze radzi sobie z polskimi znakami)
         if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
         if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
         return 0;
      });
   }, [filteredRows, sortConfig]);


   // --- FUNKCJE POMOCNICZE UI ---
   const handleSort = (key: string) => {
      let direction: "asc" | "desc" = "asc";
      if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
         direction = "desc";
      }
      setSortConfig({ key, direction });
   };

   const handleFilterChange = (key: string, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
   };

   const renderCheck = (val: string) => 
      val === "Tak" ? <span className="check-yes">✓</span> : <span className="check-no">✕</span>;

   if (loading) return <div className="page-card">Ładowanie...</div>;
   if (!data || !stats) return <div className="page-card">Brak danych</div>;

return (
   <div className="full-width-layout">
      <section className="screen-stack page-stack">
        <header className="page-card detail-hero__top">
               <div>
                  <h1>{data.event.title}</h1>
                  <p className="page-copy" style={{ marginTop: 4 }}>
                     {isTraining ? "Odpowiedzi na trening" : "Odpowiedzi na zawody"}
                  </p>
               </div>
            </header>

            {/* ZJEDNOCZONA SIATKA KAFELKÓW - stała, węższa szerokość (150px) bez rozciągania */}
            <div style={{ 
               display: "grid", 
               gridTemplateColumns: "repeat(auto-fill, 150px)", 
               gap: "12px", 
               width: "100%" 
            }}>
               
               {isTraining && (
                  <article className="summary-card">
                     <span className="summary-card__label">Zgłoszeni</span>
                     <strong>{stats.participants ?? 0}</strong>
                  </article>
               )}

               {isTraining && stats.routes?.map(route => (
                  <article key={route.route_id} className="summary-card" style={{ borderColor: 'var(--color-primary)' }}>
                     <span className="summary-card__label">{route.route_name}</span>
                     <strong>{route.participants} osób</strong>
                  </article>
               ))}
               
               {isCompetition && stats.runs?.map(run => (
                  <article key={run.run_id} className="summary-card" style={{ borderColor: 'var(--color-accent)' }}>
                     <span className="summary-card__label">{run.run_name}</span>
                     <strong>{run.participants} osób</strong>
                  </article>
               ))}

               <article className="summary-card">
                  <span className="summary-card__label">Transport</span>
                  <strong>{stats.needs_transport ?? 0}</strong>
               </article>
               
               <article className="summary-card">
                  <span className="summary-card__label">Wolne miejsca</span>
                  <strong>{stats.transport_places_offered ?? 0}</strong>
               </article>
               
               {hasAccommodation && (
                  <article className="summary-card">
                     <span className="summary-card__label">Nocleg</span>
                     <strong>{stats.needs_accommodation ?? 0}</strong>
                  </article>
               )}
               
               {hasFood && (
                  <article className="summary-card">
                     <span className="summary-card__label">Wyżywienie</span>
                     <strong>{stats.wants_food ?? 0}</strong>
                  </article>
               )}
               
               {hasVege && (
                  <article className="summary-card">
                     <span className="summary-card__label">Wege</span>
                     <strong>{stats.wants_vege ?? 0}</strong>
                  </article>
               )}
            </div>

         {/* TABELA Z FILTRAMI I SORTOWANIEM - PEŁNA SZEROKOŚĆ */}
            <div className="page-card" style={{ padding: "16px 0", borderRadius: "24px" }}>
               <div className="organizer-table-wrapper">
                  <table className="organizer-table">
                     <thead>
                        <tr>
                           <ThSortFilter keyName="name" label="Imię i Nazwisko" sortConfig={sortConfig} onSort={handleSort} onFilter={handleFilterChange} filterValue={filters.name} />
                           <ThSortFilter keyName="category" label="Kategoria" sortConfig={sortConfig} onSort={handleSort} onFilter={handleFilterChange} filterValue={filters.category} />
                           
                           {isTraining && <ThSortFilter keyName="route" label="Trasa" sortConfig={sortConfig} onSort={handleSort} onFilter={handleFilterChange} filterValue={filters.route} />}
                           
                           {isCompetition && runsList.map(runName => (
                              <ThSortFilter key={`run_${runName}`} keyName={`run_${runName}`} label={runName} sortConfig={sortConfig} onSort={handleSort} onFilter={handleFilterChange} filterValue={filters[`run_${runName}`]} alignCenter />
                           ))}

                           <ThSortFilter keyName="transport" label="Transport" sortConfig={sortConfig} onSort={handleSort} onFilter={handleFilterChange} filterValue={filters.transport} />

                           {isCompetition && hasAccommodation && <ThSortFilter keyName="accommodation" label="Nocleg" sortConfig={sortConfig} onSort={handleSort} onFilter={handleFilterChange} filterValue={filters.accommodation} alignCenter />}
                           {isCompetition && hasFood && <ThSortFilter keyName="food" label="Jedzenie" sortConfig={sortConfig} onSort={handleSort} onFilter={handleFilterChange} filterValue={filters.food} alignCenter />}
                           {isCompetition && hasVege && <ThSortFilter keyName="vege" label="Wege" sortConfig={sortConfig} onSort={handleSort} onFilter={handleFilterChange} filterValue={filters.vege} alignCenter />}

                           <ThSortFilter keyName="comment" label="Komentarz" sortConfig={sortConfig} onSort={handleSort} onFilter={handleFilterChange} filterValue={filters.comment} />
                        </tr>
                     </thead>
                     <tbody>
                        {sortedRows.length === 0 ? (
                           <tr><td colSpan={15} style={{ textAlign: "center", padding: "3rem" }}>Brak wyników spełniających kryteria.</td></tr>
                        ) : (
                           sortedRows.map(row => (
                              <tr key={row.id}>
                                 <td><strong>{row.name}</strong></td>
                                 <td>{row.category}</td>
                                
                                 
                                 {isTraining && <td>{row.route}</td>}

                                 {isCompetition && runsList.map(runName => (
                                    <td key={runName} style={{ textAlign: "center" }}>{renderCheck(row[`run_${runName}`])}</td>
                                 ))}

                                 <td>{row.transport}</td>

                                 {isCompetition && hasAccommodation && <td style={{ textAlign: "center" }}>{renderCheck(row.accommodation)}</td>}
                                 {isCompetition && hasFood && <td style={{ textAlign: "center" }}>{renderCheck(row.food)}</td>}
                                 {isCompetition && hasVege && <td style={{ textAlign: "center" }}>{renderCheck(row.vege)}</td>}
                                 
                                 <td className="table-comment">{row.comment}</td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
      </section>
      </div>
   );
}

// Rozbudowany komponent nagłówka (dodana flaga alignCenter dla ładniejszego UI)
function ThSortFilter({ 
   keyName, label, sortConfig, onSort, onFilter, filterValue = "", alignCenter = false
}: { 
   keyName: string; label: string; sortConfig: SortConfig; onSort: (k: string) => void; onFilter: (k: string, v: string) => void; filterValue?: string; alignCenter?: boolean;
}) {
   const isSorted = sortConfig?.key === keyName;
   return (
      <th style={{ textAlign: alignCenter ? "center" : "left" }}>
         <div className="th-content" style={{ alignItems: alignCenter ? "center" : "flex-start" }}>
            <button type="button" className="th-sort-btn" onClick={() => onSort(keyName)} style={{ justifyContent: alignCenter ? "center" : "space-between" }}>
               {label}
               <span className="sort-icon">
                  {isSorted ? (sortConfig.direction === "asc" ? " ▴" : " ▾") : " ⇕"}
               </span>
            </button>
            <input 
               className="th-filter-input" 
               type="text" 
               placeholder="Filtruj..." 
               value={filterValue}
               onChange={(e) => onFilter(keyName, e.target.value)}
            />
         </div>
      </th>
   );
}