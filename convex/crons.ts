import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// 08:00 in Brasília: prazo, fase and divulgação avisos for the day.
crons.cron('avisos diarios', '0 11 * * *', internal.avisos.runDaily, {});

export default crons;
