'use strict';
const cluster = require('cluster');
const os      = require('os');
const N       = process.env.WEB_CONCURRENCY || os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} – forking ${N} workers`);
  for (let i = 0; i < N; i++) cluster.fork();
  cluster.on('exit', (w, c, s) => { console.warn(`Worker ${w.process.pid} died (${s || c}). Restarting…`); cluster.fork(); });
} else {
  require('./server.js');
}
