import type { ReactNode } from "react";
import { GiPodiumWinner, GiRunningShoe, GiTrophyCup } from "react-icons/gi";
import "./EventRow.css";

type EventDetails = {
   id: string;
   name: string;
   type: string;
   status: string;
   eventStartDate: string;
   eventEndDate?: string;
   dueDate: string;
   newInfo: boolean;
   place?: string;
};

// export default function EventRow(props: { children: ReactNode; className?: string }) {
//    return <div className={props.className}>{props.children}</div>;
// }

export default function EventRow(props: EventDetails) {
   return (
      <div className="event-row">
         <div className="event-row icon">
            {props.type === "training" && <GiRunningShoe size={40} />}
            {props.type === "competition" && <GiPodiumWinner size={40} />}
         </div>

         <div className="event-row details">
            <div className="event-row__name">{props.name}</div>
            <div className="event-row__date">
               {props.eventStartDate} {props.eventEndDate ? `- ${props.eventEndDate}` : ""}
            </div>
            <div className="event-row__place">{props.place || "Wrocław"}</div>
         </div>
      </div>
   );
}
