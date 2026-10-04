# Deployment

One container serves both the API and the built web app, so the whole system runs behind one HTTPS URL.

## Google Cloud Run

The repo has a `Dockerfile`. Cloud Run builds it and gives an HTTPS URL. WebSockets (live updates) work.

```bash
gcloud auth login
gcloud projects list                       # pick your project id
gcloud config set project <PROJECT_ID>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

gcloud run deploy waypoint --source . --region asia-southeast1 --allow-unauthenticated \
  --max-instances 1 --session-affinity --timeout 3600 --memory 512Mi
```

- `--max-instances 1` matters: the demo database is a JSON file inside the container, so there must be only one copy.
- When nobody uses it for a while Cloud Run scales to zero, and the next visit starts with fresh demo data.
- The region is Singapore (`asia-southeast1`) because Cloud Run custom domains are not offered in Mumbai.
- Deploy again after merging new PRs: `git checkout main && git pull`, then the same `gcloud run deploy` command.

## Continuous deployment

Every push to `main` that passes CI is deployed by `.github/workflows/deploy.yml`, then smoke tested. GitHub signs in to Google Cloud with Workload Identity Federation, so there is no service account key anywhere. It can also be run by hand from the Actions tab (**Deploy → Run workflow**).

Each deploy starts a fresh container, so the demo data resets. Stop merging before a live demo.

One-time setup:

```bash
PROJECT_ID=waypoint-smoothop
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
REPO=theenuka/smoothOperator_Waypoint
SA=github-deployer@$PROJECT_ID.iam.gserviceaccount.com

gcloud services enable iamcredentials.googleapis.com sts.googleapis.com
gcloud iam service-accounts create github-deployer --display-name "GitHub Actions deployer"
for role in run.admin iam.serviceAccountUser cloudbuild.builds.editor artifactregistry.writer storage.admin serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:$SA" --role "roles/$role" --condition None --quiet > /dev/null
done

gcloud iam workload-identity-pools create github --location global --display-name "GitHub"
gcloud iam workload-identity-pools providers create-oidc waypoint --location global --workload-identity-pool github \
  --issuer-uri https://token.actions.githubusercontent.com \
  --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition "assertion.repository == '$REPO'"
gcloud iam service-accounts add-iam-policy-binding $SA --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$REPO"
```

## Custom domain

The live demo runs at https://waypoint.theenuka.in.

```bash
gcloud domains verify theenuka.in          # adds a TXT record at the DNS provider
gcloud beta run domain-mappings create --service waypoint \
  --domain waypoint.theenuka.in --region asia-southeast1
```

Then add the DNS record it prints (`CNAME waypoint -> ghs.googlehosted.com`). Google issues the HTTPS certificate on its own, usually within an hour.

## Quick public link from a laptop

```bash
npm run build && npm start                      # tab 1
cloudflared tunnel --url http://localhost:4000  # tab 2 (brew install cloudflared)
```

## Run it on a laptop

```bash
npm install
npm run build
npm start          # http://localhost:4000
```

Other laptops on the same Wi-Fi can open `http://<your-laptop-ip>:4000` (find the IP with `ipconfig` on Windows or `ifconfig` on Mac), so the phone and the tablet can be real devices.

## Future scaling plan

This build runs as one Node.js service, which is enough for the demo. To run it for a real chain, the plan is to move the store to PostgreSQL with PostGIS, run the route groups (planning, dock, delivery, sync) as separate services behind the same API contract, and move live events to a managed queue. The domain logic and the API contract do not change, because data access is isolated in `server/src/db.js` and every rule lives in `server/src/logic/`.
