import { SeatDto } from "./SeatDto";

export type SeatsReservationDto = {
  eventId: string;
  seats: SeatDto[];
};