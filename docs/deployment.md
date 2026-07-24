# Vercel Deployment

pitchsteps is deployed as a static Vite application. It has no server-side
runtime, environment variables, or uploaded audio data.

Production: [https://pitchsteps.vercel.app](https://pitchsteps.vercel.app)

## Local verification

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run e2e
npm run build
```

The production build is written to `dist/` and contains the application,
pitch worker, AudioWorklet bundle, and public assets.

## Vercel CLI workflow

Install and authenticate the Vercel CLI, then link this directory to a Vercel
project:

```sh
npm install --global vercel
vercel login
vercel link
```

Deploy a preview:

```sh
vercel deploy
```

Verify the preview over HTTPS before promoting it. In particular, check the
microphone permission flow, device selection, AudioWorklet and pitch worker
loading, warmup scoring, retry/error states, and `/og.png` social metadata.

Deploy production:

```sh
vercel deploy --prod
```

The initial launch uses the generated `vercel.app` domain. A custom domain can
be added later through the Vercel project settings and DNS provider.

## GitHub Actions

Every push to `main` runs the checks above and deploys the production build to
Vercel through `.github/workflows/deploy-vercel.yml`.

Add these repository secrets in GitHub before pushing to `main`:

- `VERCEL_TOKEN`: a Vercel personal access token
- `VERCEL_ORG_ID`: the Vercel team or account ID
- `VERCEL_PROJECT_ID`: the Vercel project ID

The organization and project IDs are available in the linked project's
`.vercel/project.json` after running `vercel link`, or in the Vercel project
settings.
