import './auth';
import './datatable';
import './email';

import type { E2eContext } from './e2e-context';

export type { E2eContext } from './e2e-context';
export type { E2ePersona, LoginMode } from './personas';
export type { EmulatedEmail } from './email';

declare global {
  namespace Cypress {
    interface Chainable {
      loadE2eContext(): Chainable<E2eContext>;
      uniqueLabel(base: string): Chainable<string>;
      assertTodoVisible(title: string): Chainable<void>;
      assertTodoNotVisible(title: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loadE2eContext', () => {
  return cy.fixture('e2e-context.json').then((ctx: E2eContext) => {
    Cypress.env('e2e', ctx);
    return ctx;
  });
});

Cypress.Commands.add('uniqueLabel', (base: string) => {
  return cy.wrap(`${base} ${Date.now()}`);
});

Cypress.Commands.add('assertTodoVisible', (title: string) => {
  cy.contains(title).should('be.visible');
});

Cypress.Commands.add('assertTodoNotVisible', (title: string) => {
  cy.contains(title).should('not.exist');
});
