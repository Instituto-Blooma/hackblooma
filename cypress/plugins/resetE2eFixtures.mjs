import {
  readSessionEpoch,
  resetE2eFixtures,
  readAnchorDateFromContext,
} from '../../script/seed.mjs';

export function isStatefulSpec(specRelative) {
  return specRelative.endsWith('.stateful.cy.ts');
}

/**
 * Node-side E2E fixture reset for stateful specs (before:spec).
 * Reuses frozen anchorDate from the initial seed — never re-computes "today".
 */
export function resetE2eFixturesForSpec(specRelative) {
  if (!isStatefulSpec(specRelative)) {
    return null;
  }

  const anchorDate =
    readAnchorDateFromContext() ??
    process.env.E2E_ANCHOR_DATE ??
    new Date().toISOString().slice(0, 10);

  const context = resetE2eFixtures({ anchorDate });
  return context.sessionEpoch ?? null;
}

export function readSessionEpochFromContext() {
  return readSessionEpoch();
}
