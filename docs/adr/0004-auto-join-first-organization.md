# Auto-join the first Organization on sign-in

Hackblooma has one group (Instituto Blooma). Anyone who signs in with Google is added to that group as a **member**. No Invitation is required. If more than one Organization exists, they join the one created first. If none exists yet, the app creates Instituto Blooma.

This supersedes the invite-before-sign-in OAuth gate in [ADR 0001](./0001-b2b-tenancy-and-platform-admin.md). Platform Admin provisioning and Invitations still exist as an optional extra, not as a gate. Equipe Blooma access stays on the platform-admin email list.
