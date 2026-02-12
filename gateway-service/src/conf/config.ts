import dotenv from 'dotenv'
dotenv.config();

// Configuration settings for the gateway service
const config = {
  numWorkers: process.env.NUM_WORKERS ? parseInt(process.env.NUM_WORKERS) : 4,
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.includes(',')
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : process.env.CORS_ORIGIN
      : "*",
  },
  socket: {
    messages: {
      joinEvent: "event.join",
      confirmationRequest: "seat.confirmationRequest",
      releaseRequest: "seat.releaseRequest",
      holdRequest: "seat.holdRequest",
    },
  },
};

export default config;
