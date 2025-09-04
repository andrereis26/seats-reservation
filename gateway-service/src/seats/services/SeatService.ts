import { SeatDto } from "../dtos/SeatDto";
import ISeatService from "./ISeatService";

export default class SeatService implements ISeatService {
    constructor() { }

    async getAvailableSeatsByEventId(eventId: string): Promise<SeatDto[]> {
        console.info(`Fetching seats for showtime ID: ${eventId}`);
        return [];
    }

    async reserveSeats(eventId: string, seats: SeatDto[]): Promise<boolean> {
        console.info(`Reserving seats for event ID: ${eventId}`);
        return true;
    }

    async releaseSeats(eventId: string, seats: SeatDto[]): Promise<boolean> {
        console.info(`Releasing seats for event ID: ${eventId}`);
        return true;
    }
}