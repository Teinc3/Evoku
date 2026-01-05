module.exports = [
  {
    context: ['/api'],
    target: 'http://localhost:8745',
    secure: false,
    changeOrigin: true,
  },
  {
    context: (_pathname, req) => {
      const upgradeHeader = req.headers.upgrade;
      const isWebSocketUpgrade = typeof upgradeHeader === 'string'
        && upgradeHeader.toLowerCase() === 'websocket';

      if (!isWebSocketUpgrade) {
        return false;
      }

      const protocolHeader = req.headers['sec-websocket-protocol'];
      const protocols = String(protocolHeader ?? '');

      // Vite (used by Angular dev-server) uses a websocket for HMR/livereload.
      // It sets `Sec-WebSocket-Protocol: vite-hmr`, and must not be proxied.
      return !protocols.toLowerCase().includes('vite-hmr');
    },
    target: 'http://localhost:8745',
    secure: false,
    changeOrigin: true,
    ws: true,
  },
];
