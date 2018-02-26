import * as program from 'commander';
import * as express from 'express';

/**
 * Spin up a minimal web server serving static content out of dirName/../static.
 *
 * See packages/fleet/server/server.ts for usage.
 */
export function runServer(description: string, dirName: string) {
  program
    .version('1.0.0')
    .description(description)
    .option('-p, --port <port>', 'Port on which to serve traffic (default: 1337)', Number, 1337)
    .parse(process.argv);

  console.log('Starting up...');

  const app = express();
  app.get('/healthy', (request, response) => {
    response.send('OK');
  });

  // Log all requests.
  app.use(require('morgan')('dev'));

  app.use(express.static(dirName + '/../static'));

  app.listen(program['port']);
  console.log(`Listening on port ${program['port']}`);
}
