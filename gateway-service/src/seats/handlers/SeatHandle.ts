import { Socket, Server as SocketIOServer } from "socket.io";
import config from "../../conf/config";
import { SeatsReservationDto } from "../dtos/SeatsReservationDto";
import { SeatsReleaseDto } from "../dtos/SeatsReleaseDto";
import ISeatService from "../services/ISeatService";
import { injectable, inject } from "tsyringe";

@injectable()
export default class SeatHandle {
  private seatsService: ISeatService;

  constructor(@inject("ISeatService") seatsService: ISeatService) {
    this.seatsService = seatsService;
  }

  register(io: SocketIOServer<any>, socket: Socket<any>) {
    // Handle seat reservation
    const handleSeatsReservation = (data: SeatsReservationDto) => {
      // Optionally use this.seatsService here
      io.emit(config.socket.messages.reserve, data);
    };

    const handleSeatsRelease = (data: SeatsReleaseDto) => {
      // Optionally use this.seatsService here
      io.emit(config.socket.messages.release, data);
    };

    // define event listeners
    socket.on(config.socket.messages.reserve, handleSeatsReservation);
    socket.on(config.socket.messages.release, handleSeatsRelease);
  }
}