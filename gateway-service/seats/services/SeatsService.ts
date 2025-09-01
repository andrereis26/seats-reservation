import { Socket, Server as SocketIOServer } from "socket.io"
import config from "../../conf/config"

export default (io: SocketIOServer<any>, socket: Socket<any>) => {
  // Handle seat reservation
  const handleSeatReservation = (data: any) => {
    console.log("Seat reserved:", data);
    // Emit event to all connected clients
    io.emit("seat_reserved", data);
  };

  // define event listeners
  socket.on(config.socket.messages.reserve, handleSeatReservation);
}