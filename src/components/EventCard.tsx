import { Link } from "react-router-dom";
import type { EventListItemDto } from "../types/backend";
import StatusBadge from "./StatusBadge";

type EventCardProps = {
   event: EventListItemDto;
};

export default function EventCard({ event }: EventCardProps) {
   return (
      <Link className="event-card event-card--link" to={`/events/${event.event_id}`}>
         <div className="event-card__top">
            <div className="event-card__badges">
               <StatusBadge tone={event.event_type}>{event.event_type}</StatusBadge>
               <StatusBadge tone={mapResponseStatus(event.user_response_status)}>
                  {mapResponseStatus(event.user_response_status)}
               </StatusBadge>
            </div>
            <h3 className="event-card__title">{event.event_name}</h3>
            <p className="event-card__summary">{formatDates(event.signup_open_date, event.signup_close_date)}</p>
         </div>

         <div className="event-card__meta">
            <div>
               <span className="event-card__label">Typ</span>
               <p>{event.event_type}</p>
            </div>
            <div>
               <span className="event-card__label">Zapis</span>
               <p>
                  {formatDate(event.signup_open_date)} - {formatDate(event.signup_close_date)}
               </p>
            </div>
            <div>
               <span className="event-card__label">Odpowiedź</span>
               <p>{mapResponseStatus(event.user_response_status)}</p>
            </div>
         </div>
      </Link>
   );
}

function formatDate(value: string) {
   return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
   }).format(new Date(value));
}

function formatDates(start: string, end: string) {
   return `${formatDate(start)} - ${formatDate(end)}`;
}

function mapResponseStatus(status: EventListItemDto["user_response_status"]) {
   if (!status || status === "nieuzupelnione") {
      return "nieuzupelnione";
   }

   if (status === "uzupelnione") {
      return "uzupelnione";
   }

   return "nie_jade";
}
