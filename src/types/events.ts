export type EventType = "training" | "competition";

export type EventStatus = "open" | "closed" | "archived" | "future";

export type ResponseStatus = "pending" | "filled" | "rejected";

export type UserRole = "user" | "trainer" | "admin";

export type TrainingType = "sprint" | "forest";

export type TrainingRoute = {
   id: string;
   name: string;
   distanceKm: number;
};

export type CompetitionRun = {
   id: string;
   name: string;
   date: string;
   signedUp: boolean;
};

export type SportEvent = {
   id: string;
   type: EventType;
   title: string;
   status: EventStatus;
   responseStatus: ResponseStatus;
   dateRange: string;
   signupWindow: string;
   location: string;
   summary: string;
   training?: {
      meetingTime: string;
      meetingPlace: string;
      startTime: string;
      startPlace: string;
      transportAvailable: boolean;
      trainingType: TrainingType;
      routes: TrainingRoute[];
   };
   competition?: {
      competitionName: string;
      departureTime: string;
      departurePlace: string;
      transportAvailable: boolean;
      accommodationAvailable: boolean;
      foodAvailable: boolean;
      vegetarianFoodAvailable: boolean;
      seriesSignup: boolean;
      runs: CompetitionRun[];
      foodSchedule: Array<{ date: string; note: string }>;
   };
};
