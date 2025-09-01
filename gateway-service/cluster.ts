import cluster from "cluster";
import http from "http";
import { setupMaster } from "@socket.io/sticky";
import server from "./server.js";
import config from "./conf/config.ts";

const WORKERS_COUNT = 4; // or const numCPUs = require("os").cpus().length;

if (cluster.isPrimary) {
    console.debug(`Primary ${process.pid} is running`);

    for (let i = 0; i < WORKERS_COUNT; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker) => {
        console.debug(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });

    const httpServer = http.createServer();
    setupMaster(httpServer, {
        loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
    });

    httpServer.listen(config.port, () =>
        console.log(`server listening at http://localhost:${config.port}`)
    );
} else {
    console.debug(`Worker ${process.pid} started`);
    server();
}