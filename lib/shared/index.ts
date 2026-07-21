/**
 * @nexora/shared — Phase 1 Restructured Foundation
 *
 * Monorepo layout (headless, UI-agnostic):
 *
 * packages/shared/src/
 * ├── client/                 Supabase bindings (headless + Next adapter)
 * ├── types/                  Cross-app canonical models & context templates
 * ├── services/
 * │   ├── auth/
 * │   ├── notifications/
 * │   ├── billing/
 * │   ├── emr/
 * │   ├── appointments/
 * │   ├── inventory/
 * │   ├── procurement/
 * │   ├── payments/
 * │   ├── reports/
 * │   └── audit/
 * └── pipeline/
 *     └── processSharedTransaction.ts
 *
 * Consumed by: admin · hospital · vendor · patient · operations (5 standalone apps)
 */

export * from './types';
export * as services from './services';
export { processSharedTransaction } from './pipeline/processSharedTransaction';
export * from './client';
