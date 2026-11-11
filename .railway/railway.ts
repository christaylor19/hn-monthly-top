import { defineRailway, github, project, service } from 'railway/iac';

export default defineRailway(() => {
  const hnMonthly = service('hn-monthly', {
    source: github('christaylor19/hn-monthly-top', { branch: 'main', checkSuites: false }),
    build: {
      buildEnvironment: 'V3',
      builder: 'RAILPACK',
      buildCommand: 'pnpm install --frozen-lockfile && pnpm build:server',
    },
    deploy: {
      startCommand: 'pnpm start:server',
      healthcheckPath: '/health',
    },
    replicas: { 'europe-west4-drams3a': 1 },
  });

  return project('hn-monthly', {
    variables: { managed: false },
    resources: [hnMonthly],
  });
});
