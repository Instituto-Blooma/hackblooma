import { defineApp } from 'convex/server';
import authz from '@djpanda/convex-authz/convex.config';
import tenants from '@djpanda/convex-tenants/convex.config';
import convexPresence from '@talentum-ventures/convex-presence/convex.config';

const app = defineApp();
app.use(authz);
app.use(tenants);
app.use(convexPresence);

export default app;
