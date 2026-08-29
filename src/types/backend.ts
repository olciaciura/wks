export type UserRole = "user" | "trainer" | "admin";
export type EventType = "training" | "competition";
export type EventStatus = "open" | "closed" | "archived" | "future";
export type ResponseStatus = "pending" | "filled" | "rejected";
export type UserResponseStatus = "nie_jade" | "uzupelnione" | "nieuzupelnione";
export type TrainingType = "sprint" | "forest";

export type CurrentUser = {
   user_id: string;
   login: string;
   role: UserRole;
   first_name?: string;
   last_name?: string;
   email?: string;
   birth_year?: number;
   gender?: string;
   category?: string;
};

export type LoginRequest = {
   login: string;
   password: string;
};

export type LoginResponse = CurrentUser;

export type RegisterRequest = {
   email: string;
   login: string;
   password: string;
   first_name?: string;
   last_name?: string;
   birth_year?: number;
   gender?: string;
   category?: string;
};

export type EventListItemDto = {
   event_id: string;
   event_name: string;
   event_type: EventType;
   date_from: string;
   date_to?: string;
   signup_open_date: string;
   signup_close_date: string;
   user_response_status: UserResponseStatus;
};

export type EventDetailDto = {
   event: {
      id: string;
      type: EventType;
      title: string;
      description: string;
      date_from: string;
      date_to: string;
      signup_open_date: string;
      signup_close_date: string;
      status: EventStatus;
   };
   options: {
      transport_available: boolean;
      training_type?: TrainingType | null;
      meeting_time?: string | null;
      meeting_location_desc?: string | null;
      meeting_location_link?: string | null;
      start_time?: string | null;
      start_location_desc?: string | null;
      start_location_link?: string | null;
      routes?: Array<{
         id?: string;
         name: string;
         description?: string | null;
         distance?: number | null;
      }>;
      departure_time?: string | null;
      departure_location_desc?: string | null;
      departure_location_link?: string | null;
      accomodation_available?: boolean | null;
      accomodation_location_desc?: string | null;
      accomodation_location_link?: string | null;
      food_available?: boolean | null;
      food_vege_available?: boolean | null;
      series_signup?: boolean | null;
      runs?: Array<{
         id: string;
         name: string;
         run_date: string;
      }>;
      food_schedule?: Array<{
         date: string;
         breakfast: boolean;
         lunch: boolean;
         dinner: boolean;
         supper: boolean;
      }>;
   };
   user_response?: {
      status: ResponseStatus;
      needs_transport: boolean;
      self_transport: boolean;
      can_take_people: number;
      comment: string;
      submitted_at?: string;
      training?: {
         selected_route_id?: string | null;
      } | null;
      competition?: {
         needs_accommodation?: boolean;
         wants_food?: boolean;
         wants_vege?: boolean;
         run_selections?: Array<{
            run_id: string;
            participates: boolean;
         }>;
      } | null;
   } | null;
};

export type CreateEventPayload = {
   type: EventType;
   title: string;
   description?: string;
   date_from: string;
   date_to: string;
   signup_open_date: string;
   signup_close_date: string;
   location: string;
   training_details: null | {
      type: TrainingType;
      meeting_time?: string;
      meeting_location_desc?: string;
      meeting_location_link?: string;
      start_time?: string;
      start_location_desc?: string;
      start_location_link?: string;
      transport_available: boolean;
   };
   training_routes: Array<{
      name: string;
      description?: string;
      distance: number;
   }>;
   competition_details: null | {
      competition_name: string;
      transport_available: boolean;
      departure_time?: string;
      departure_location_desc?: string;
      departure_location_link?: string;
      accomodation_available: boolean;
      accomodation_location_desc?: string;
      accomodation_location_link?: string;
      food_available: boolean;
      food_vege_available: boolean;
      series_signup: boolean;
   };
   competition_runs: Array<{
      name: string;
      run_date: string;
   }>;
   food_options: Array<{
      date: string;
      breakfast: boolean;
      lunch: boolean;
      dinner: boolean;
      supper: boolean;
   }>;
};

export type EventResponsePayload = {
   user_id: string;
   status: ResponseStatus;
   needs_transport: boolean;
   self_transport: boolean;
   can_take_people: number;
   comment: string;
   training?: {
      selected_route_id: string;
   } | null;
   competition?: {
      needs_accommodation: boolean;
      wants_food: boolean;
      wants_vege: boolean;
      run_selections: Array<{
         run_id: string;
         participates: boolean;
      }>;
   } | null;
};
