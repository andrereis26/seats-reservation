const config = {
  apiUrl: {
    base: "http://localhost:3000",
    seats: "/seats/",
    stats: "/stats/",
  },
  socketUrl: {
    base: "http://localhost:3000",
    events: "/events/",
    stats: "/stats/",
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
