const { alexa } = require('./src/app');
const config = require('./src/config');

alexa.startServer(config.server.port);
