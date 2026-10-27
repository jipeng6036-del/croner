import { Cron } from 'croner';

// Keep the runtime's normal unhandled-rejection behavior: no process listeners.
const original = new Error('scheduled task failed');
let caught = 0;
const job = new Cron('* * * * * *', {
  paused: true,
  protect: true,
  catch: async (error, currentJob) => {
    if (error !== original || currentJob !== job) throw new Error('wrong callback arguments');
    caught++;
    await Promise.resolve();
    throw new Error('async error handler failed');
  },
}, () => { throw original; });

await job.trigger();
await new Promise((resolve) => setTimeout(resolve, 30));
job.stop();
if (caught !== 1 || job.isBusy()) throw new Error('unexpected task lifecycle');
console.log('survived: callback called once, job not busy');
