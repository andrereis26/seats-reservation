const config = {
  apiUrl: {
    base: "http://localhost:3000",
    seats: "/seats/",
    stats: "/stats/",
  },
  gatewayServer: {
    url: "http://localhost:3000",
    endpoints: {
      events: "/events/",
      stats: "/stats/"
    },
    messages: {
      reserve: "seat.reserve",
      release: "seat.release",
    },
    maxReconnectionAttempts: 5,
  },
  seatStates: {
    free: {
      value: "free",
      color: "green",
    },
    reserved: {
      value: "reserved",
      color: "red",
    },
    selected: {
      color: "yellow",
    },
  },
};

export default config;
