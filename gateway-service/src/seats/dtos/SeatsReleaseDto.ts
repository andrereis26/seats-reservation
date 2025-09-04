import { SeatDto } from "./SeatDto";

export type SeatsReleaseDto = {
  eventId: string;
  seats: SeatDto[];
};