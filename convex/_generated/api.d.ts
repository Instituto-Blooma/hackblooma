/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authz from "../authz.js";
import type * as avisos from "../avisos.js";
import type * as avisosDelivery from "../avisosDelivery.js";
import type * as collab from "../collab.js";
import type * as crons from "../crons.js";
import type * as devForm from "../devForm.js";
import type * as devFormSchemas from "../devFormSchemas.js";
import type * as emails from "../emails.js";
import type * as equipe from "../equipe.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_avisos from "../lib/avisos.js";
import type * as lib_collabAccess from "../lib/collabAccess.js";
import type * as lib_collabIds from "../lib/collabIds.js";
import type * as lib_equipe from "../lib/equipe.js";
import type * as lib_forms from "../lib/forms.js";
import type * as lib_googleProvider from "../lib/googleProvider.js";
import type * as lib_guestQuery from "../lib/guestQuery.js";
import type * as lib_invitations from "../lib/invitations.js";
import type * as lib_listaOficial2026 from "../lib/listaOficial2026.js";
import type * as lib_olimpiadas from "../lib/olimpiadas.js";
import type * as lib_onboarding from "../lib/onboarding.js";
import type * as lib_orgAccess from "../lib/orgAccess.js";
import type * as lib_succession from "../lib/succession.js";
import type * as lib_tenantsClient from "../lib/tenantsClient.js";
import type * as lib_testLoginProvider from "../lib/testLoginProvider.js";
import type * as lib_users from "../lib/users.js";
import type * as olimpiadas from "../olimpiadas.js";
import type * as onboarding from "../onboarding.js";
import type * as platform from "../platform.js";
import type * as push from "../push.js";
import type * as seedOlimpiadas from "../seedOlimpiadas.js";
import type * as tenants from "../tenants.js";
import type * as testing_e2e from "../testing/e2e.js";
import type * as todos from "../todos.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authz: typeof authz;
  avisos: typeof avisos;
  avisosDelivery: typeof avisosDelivery;
  collab: typeof collab;
  crons: typeof crons;
  devForm: typeof devForm;
  devFormSchemas: typeof devFormSchemas;
  emails: typeof emails;
  equipe: typeof equipe;
  files: typeof files;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/avisos": typeof lib_avisos;
  "lib/collabAccess": typeof lib_collabAccess;
  "lib/collabIds": typeof lib_collabIds;
  "lib/equipe": typeof lib_equipe;
  "lib/forms": typeof lib_forms;
  "lib/googleProvider": typeof lib_googleProvider;
  "lib/guestQuery": typeof lib_guestQuery;
  "lib/invitations": typeof lib_invitations;
  "lib/listaOficial2026": typeof lib_listaOficial2026;
  "lib/olimpiadas": typeof lib_olimpiadas;
  "lib/onboarding": typeof lib_onboarding;
  "lib/orgAccess": typeof lib_orgAccess;
  "lib/succession": typeof lib_succession;
  "lib/tenantsClient": typeof lib_tenantsClient;
  "lib/testLoginProvider": typeof lib_testLoginProvider;
  "lib/users": typeof lib_users;
  olimpiadas: typeof olimpiadas;
  onboarding: typeof onboarding;
  platform: typeof platform;
  push: typeof push;
  seedOlimpiadas: typeof seedOlimpiadas;
  tenants: typeof tenants;
  "testing/e2e": typeof testing_e2e;
  todos: typeof todos;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  authz: import("@djpanda/convex-authz/_generated/component.js").ComponentApi<"authz">;
  tenants: import("@djpanda/convex-tenants/_generated/component.js").ComponentApi<"tenants">;
  convexPresence: import("@talentum-ventures/convex-presence/_generated/component.js").ComponentApi<"convexPresence">;
};
