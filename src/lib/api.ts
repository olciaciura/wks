import type {
   CreateEventPayload,
   EventDetailDto,
   EventListItemDto,
   EventResponsePayload,
   LoginRequest,
   LoginResponse,
   RegisterRequest,
} from "../types/backend";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
   const url = API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
   const response = await fetch(url, {
      headers: {
         "Content-Type": "application/json",
         ...(init?.headers ?? {}),
      },
      ...init,
   });

   if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with status ${response.status}`);
   }

   if (response.status === 204) {
      return undefined as T;
   }

   return (await response.json()) as T;
}

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
   return apiRequest<LoginResponse>("/users/login", {
      method: "POST",
      body: JSON.stringify(payload),
   });
}

export async function registerUser(payload: RegisterRequest): Promise<LoginResponse> {
   return apiRequest<LoginResponse>("/users/", {
      method: "POST",
      body: JSON.stringify(payload),
   });
}

export async function getEventsForUser(userId: string): Promise<EventListItemDto[]> {
   return apiRequest<EventListItemDto[]>(`/events/user/${userId}`);
}

export async function getAllEventsForUser(userId: string): Promise<EventListItemDto[]> {
   return apiRequest<EventListItemDto[]>(`/events/all?${new URLSearchParams({ user_id: userId }).toString()}`);
}

export async function getEventDetail(eventId: string, userId: string): Promise<EventDetailDto> {
   const query = new URLSearchParams({ user_id: userId });
   return apiRequest<EventDetailDto>(`/events/${eventId}?${query.toString()}`);
}

export async function submitEventResponse(
   eventId: string,
   eventType: "training" | "competition",
   payload: EventResponsePayload,
): Promise<unknown> {
   return apiRequest(`/events/${eventId}/responses/${eventType}`, {
      method: "POST",
      body: JSON.stringify(payload),
   });
}

export async function createEvent(payload: CreateEventPayload): Promise<unknown> {
   const path = payload.type === "training" ? "/events/training" : "/events/competition";
   return apiRequest(path, {
      method: "POST",
      body: JSON.stringify(payload),
   });
}

export type { CurrentUser } from "../types/backend";
