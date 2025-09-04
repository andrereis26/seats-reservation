import Fastify, { FastifyRequest } from "fastify";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import config from "./conf/config";
import { setupWorker } from "@socket.io/sticky";

// for Dependency Injection
import "reflect-metadata";
import { container } from "tsyringe";

// services
import SeatService from "./seats/services/SeatService";
import ISeatService from "./seats/services/ISeatService";

// handlers
import SeatHandle from "./seats/handlers/SeatHandle";

// register DI bindings
container.register<ISeatService>("ISeatService", { useClass: SeatService });

// create Fastify instance
const fastify = Fastify();

export default function server() {
  // Attach Socket.IO to the same HTTP server Fastify uses
  const httpServer = createServer(fastify.server);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
    },
  });

  // Socket.IO connection
  io.on("connection", (socket) => {
    console.info("Client connected:", socket.id);

  // register seat handlers using DI
  const seatHandle = container.resolve(SeatHandle);
  seatHandle.register(io, socket);

    socket.on("disconnect", () => {
      console.info("Client disconnected:", socket.id);
    });
  });

  // REST endpoints //

  // Health check endpoint
  fastify.get("/health", async () => ({ status: "ok" }));

  // Get seats for an event
  fastify.get("/seats/:eventId", async (request: FastifyRequest<{ Params: { eventId: string } }>) => {
    const { eventId } = request.params;
    return { status: "ok", eventId };
  });

  // Get statistics for an event
  fastify.get("/stats/:eventId", async (request: FastifyRequest<{ Params: { eventId: string } }>) => {
    const { eventId } = request.params;
    return { status: "ok", eventId };
  });

  // start server
  setupWorker(io);
}