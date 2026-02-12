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

    const handleSeatHoldRequest = (data: SeatsReservationDto) => {
      // Optionally use this.seatsService here
      io.emit(config.socket.messages.holdRequest, data);
    };

    const handleSeatsReleaseRequest = (data: SeatsReleaseDto) => {
      // Optionally use this.seatsService here
      io.emit(config.socket.messages.releaseRequest, data);
    };

    // Handle seat confirmation request
    const handleSeatsConfirmationRequest = (data: SeatsReservationDto) => {
      // Optionally use this.seatsService here
      io.emit(config.socket.messages.confirmationRequest, data);
    };

    // define event listeners
    socket.on(config.socket.messages.holdRequest, handleSeatHoldRequest);
    socket.on(config.socket.messages.releaseRequest, handleSeatsReleaseRequest);
    socket.on(config.socket.messages.confirmationRequest, handleSeatsConfirmationRequest);

  }
}