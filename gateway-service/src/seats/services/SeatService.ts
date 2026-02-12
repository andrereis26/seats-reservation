import { SeatDto } from "../dtos/SeatDto";
import ISeatService from "./ISeatService";

export default class SeatService implements ISeatService {
    constructor() { }

    async getAvailableSeatsByEventId(eventId: string): Promise<SeatDto[]> {
        console.info(`Fetching seats for showtime ID: ${eventId}`);
        return [];
    }

    async holdSeatsRequest(eventId: string, seats: SeatDto[]): Promise<boolean> {
        console.info(`Holding seats for event ID: ${eventId}`);
        return true;
    }

    async releaseSeatsRequest(eventId: string, seats: SeatDto[]): Promise<boolean> {
        console.info(`Releasing seats for event ID: ${eventId}`);
        return true;
    }

    async confirmSeatsRequest(eventId: string, seats: SeatDto[]): Promise<boolean> {
        console.info(`Confirming seat request for event ID: ${eventId}`);
        return true;
    }
}