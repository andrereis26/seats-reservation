import { SeatDto } from "../dtos/SeatDto";

export default interface ISeatService {
    getAvailableSeatsByEventId(eventId: string): Promise<SeatDto[]>;
    holdSeatsRequest(eventId: string, seats: SeatDto[]): Promise<boolean>;
    releaseSeatsRequest(eventId: string, seats: SeatDto[]): Promise<boolean>;
    confirmSeatsRequest(eventId: string, seats: SeatDto[]): Promise<boolean>;
}