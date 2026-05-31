import EventRow from "./EventRow";

export default function CompetitorEventRow(props: { event: { name: string; date: string } }) {
   return (
      <EventRow>
         <h3>{props.event.name}</h3>
         <p>{props.event.date}</p>
         <button>Edit</button>
         <button>Delete</button>
      </EventRow>
   );
}
