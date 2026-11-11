import { defineRailway, github, postgres, project, service } from 'railway/iac';

export default defineRailway(() => {
  const db = postgres('Postgres', { region: 'europe-west4-drams3a' });

  const hnMonthly = service('hn-monthly', {
    source: github('christaylor19/hn-monthly-top', { branch: 'main', checkSuites: false }),
    build: {
      buildEnvironment: 'V3',
      builder: 'RAILPACK',
      buildCommand: 'pnpm install --frozen-lockfile && pnpm build:server',
    },
    deploy: {
      preDeployCommand: ['node apps/server/dist/migrate.js'],
      startCommand: 'pnpm start:server',
      healthcheckPath: '/health',
    },
    replicas: { 'europe-west4-drams3a': 1 },
  });

  return project('hn-monthly', {
    variables: { managed: false },
    resources: [db, hnMonthly],
  });
});
