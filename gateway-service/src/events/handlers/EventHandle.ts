import { Socket, Server as SocketIOServer } from "socket.io";
import config from "../../conf/config";
import IEventService from "../services/IEventService";
import { injectable, inject } from "tsyringe";

@injectable()
export default class EventHandle {
  private eventsService: IEventService;

  constructor(@inject("IEventService") eventsService: IEventService) {
    this.eventsService = eventsService;
  }

  register(io: SocketIOServer<any>, socket: Socket<any>) {
    // Handle event reservation
    const handleJoinEvent = (eventId: string) => {
      // join client to event room
      socket.join(eventId);
    };
    
    // define event listeners
    socket.on(config.socket.messages.joinEvent, handleJoinEvent);
  }
}