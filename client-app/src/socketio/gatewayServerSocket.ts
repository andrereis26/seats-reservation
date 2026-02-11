import io from 'socket.io-client';
import config from '../conf/config';

const gatewayServerSocket = io(config.gatewayServer.url, {
    reconnectionAttempts: config.gatewayServer.maxReconnectionAttempts,
});

export default gatewayServerSocket;