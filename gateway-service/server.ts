import Fastify, { FastifyRequest } from "fastify";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import config from "./conf/config";
import { setupWorker } from "@socket.io/sticky";
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
    console.log("Client connected:", socket.id);

    socket.on("message", (msg) => {
      console.log("Message received:", msg);
      socket.emit("reply", "Got your message!");
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
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