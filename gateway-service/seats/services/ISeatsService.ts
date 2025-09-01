export interface ISeatsService {
    getAvailableSeats(eventId: string): Promise<number>;
    reserveSeats(eventId: string, seats: string[]): Promise<boolean>;
    releaseSeats(eventId: string, seats: string[]): Promise<boolean>;
}
