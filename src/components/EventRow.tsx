import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FiCornerUpRight, FiX } from "react-icons/fi";
import { GiPodiumWinner, GiRunningShoe } from "react-icons/gi";
import { useAuth } from "../context/AuthContext";
import { submitEventResponse } from "../lib/api";
import StatusBadge from "./StatusBadge";
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
   onRejected?: (id: string) => void;
};

const STATUS_LABELS: Record<string, string> = {
   uzupelnione: "Signed up",
   nieuzupelnione: "To do",
   nie_jade: "Rejected",
};

const OPEN_THRESHOLD = 88;
const REJECT_THRESHOLD = -88;
const MAX_DRAG = 120;
const DRAG_LOCK_DISTANCE = 8;

function getDaysLeft(dueDate: string) {
   const due = new Date(dueDate);
   const now = new Date();
   due.setHours(0, 0, 0, 0);
   now.setHours(0, 0, 0, 0);
   return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function EventRow(props: EventDetails) {
   const navigate = useNavigate();
   const { currentUser } = useAuth();
   const [dragX, setDragX] = useState(0);
   const [isAnimating, setIsAnimating] = useState(false);
   const draggingRef = useRef(false);
   const startXRef = useRef(0);
   const startYRef = useRef(0);
   const axisLockRef = useRef<"x" | "y" | null>(null);

   const daysLeft = getDaysLeft(props.dueDate);
   const isClosed = daysLeft < 0;
   const isUrgent = !isClosed && daysLeft < 4;
   const openOpacity = dragX > 0 ? Math.min(dragX / OPEN_THRESHOLD, 1) : 0;
   const rejectOpacity = dragX < 0 ? Math.min(-dragX / Math.abs(REJECT_THRESHOLD), 1) : 0;

   function goToEvent() {
      navigate(`/events/${props.id}`);
   }

   async function rejectEvent() {
      if (!currentUser) {
         return;
      }

      try {
         await submitEventResponse(props.id, props.type === "competition" ? "competition" : "training", {
            user_id: currentUser.user_id,
            status: "rejected",
            needs_transport: false,
            self_transport: false,
            can_take_people: 0,
            comment: "",
         });
         props.onRejected?.(props.id);
      } catch {
         // Ignore network errors here; the row simply springs back.
      }
   }

   function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
      if (event.pointerType === "mouse" && event.button !== 0) {
         return;
      }
      draggingRef.current = true;
      axisLockRef.current = null;
      startXRef.current = event.clientX;
      startYRef.current = event.clientY;
      setIsAnimating(false);
   }

   function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
      if (!draggingRef.current) {
         return;
      }

      const dx = event.clientX - startXRef.current;
      const dy = event.clientY - startYRef.current;

      if (axisLockRef.current === null) {
         if (Math.abs(dx) > DRAG_LOCK_DISTANCE || Math.abs(dy) > DRAG_LOCK_DISTANCE) {
            axisLockRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
         }
      }

      if (axisLockRef.current === "x") {
         setDragX(Math.max(Math.min(dx, MAX_DRAG), -MAX_DRAG));
      }
   }

   function endDrag() {
      if (!draggingRef.current) {
         return;
      }
      draggingRef.current = false;
      setIsAnimating(true);

      if (axisLockRef.current === "x") {
         if (dragX <= REJECT_THRESHOLD) {
            void rejectEvent();
         } else if (dragX >= OPEN_THRESHOLD) {
            goToEvent();
         }
      } else if (axisLockRef.current === null) {
         goToEvent();
      }

      axisLockRef.current = null;
      setDragX(0);
   }

   function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      if (event.key === "Enter" || event.key === " ") {
         event.preventDefault();
         goToEvent();
      }
   }

   return (
      <div className="event-row-wrapper">
         <div className="event-row-action open" style={{ opacity: openOpacity }}>
            <FiCornerUpRight size={20} />
            <span>Otwórz</span>
         </div>
         <div className="event-row-action reject" style={{ opacity: rejectOpacity }}>
            <span>Odrzuć</span>
            <FiX size={20} />
         </div>

         <div
            className="event-row card"
            role="link"
            tabIndex={0}
            style={
               dragX !== 0 || isAnimating
                  ? {
                       transform: `translateX(${dragX}px)`,
                       transition: isAnimating ? "transform 0.2s ease" : "none",
                    }
                  : undefined
            }
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onTransitionEnd={() => setIsAnimating(false)}
            onKeyDown={handleKeyDown}
         >
            <div className="event-row icon">
               {props.type === "training" && <GiRunningShoe size={48} />}
               {props.type === "competition" && <GiPodiumWinner size={48} />}
            </div>

            <div className="event-row details">
               <div className="name">{props.name}</div>
               <div className="meta">
                  {props.eventStartDate}
                  {props.eventEndDate ? ` - ${props.eventEndDate}` : ""} | {props.place || "Wrocław"}
               </div>
               <StatusBadge tone={props.status}>{STATUS_LABELS[props.status] || props.status}</StatusBadge>
            </div>

            <div className={`event-row due${isUrgent ? " urgent" : ""}`}>
               {isClosed ? (
                  <div className="due-closed">Closed</div>
               ) : (
                  <>
                     <div className="due-number">{daysLeft}</div>
                     <div className="due-label">days left</div>
                  </>
               )}
            </div>
         </div>
      </div>
   );
}
