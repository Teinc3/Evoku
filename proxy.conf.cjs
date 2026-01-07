const protocol = require('./config/shared/base.json').networking.ws.protocol;


module.exports = {
  '/api': {
    target: 'http://127.0.0.1:8745',
    secure: false,
    changeOrigin: true,
  },
  '/': {
    target: 'http://127.0.0.1:8745',
    secure: false,
    changeOrigin: true,
    ws: true,
    bypass: req => {
      const upgradeHeader = req.headers.upgrade;

      // Never proxy regular HTTP traffic on '/'.
      if (typeof upgradeHeader !== 'string' || upgradeHeader.toLowerCase() !== 'websocket') {
        return req.url;
      }

      const protocolHeader = req.headers['sec-websocket-protocol'];
      const protocols = String(protocolHeader ?? '');

      // Leave Vite's HMR websocket and all other non-Evoku websockets alone.
      if (protocols.includes('vite-hmr') || !protocols.includes(protocol)) {
        return req.url;
      }

      // Allows the Evoku WebSocket to be proxied to the target.
      return undefined;
    },
  },
};
