const config = {
  port: process.env.PORT || 3000,
  cors: {
    origin: process.env.CORS_ORIGIN || "*", 
  },
  socket: {
    messages: {
      reserve: "seat.reserve",
      release: "seat.release",
    },
  },
};

export default config;
