import { SeatDto } from "../dtos/SeatDto";

export default interface ISeatService {
    getAvailableSeatsByEventId(eventId: string): Promise<SeatDto[]>;
    reserveSeats(eventId: string, seats: SeatDto[]): Promise<boolean>;
    releaseSeats(eventId: string, seats: SeatDto[]): Promise<boolean>;
}