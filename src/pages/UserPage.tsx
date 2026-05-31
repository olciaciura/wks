import CompetitorEventRow from "../components/CompetitorEventRow";

export default function UserPage() {
   const events = [
      {
         name: "Event 1",
         date: "2024-01-01",
      },
      {
         name: "Event 2",
         date: "2024-01-02",
      },
   ];

   return (
      <div>
         <h1>Imie i nazwisko</h1>
         <h2>Kategoria</h2>
         <button type="button">settings icon</button>
         {events.map((event) => (
            <CompetitorEventRow key={event.name} event={event}></CompetitorEventRow>
         ))}
      </div>
   );
}
