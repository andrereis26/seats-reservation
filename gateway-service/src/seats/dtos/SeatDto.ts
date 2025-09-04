export type SeatDto = {
    id: string;
    row: string;
    number: number;
    userId?: string;
    status: SeatStatusDto;
}

export type SeatStatusDto = {
    status: 'available' | 'reserved' | 'held';
};