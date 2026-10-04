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

## Production architecture

This build runs as one Node.js service. The production design is AWS serverless in ap-south-1 (API Gateway and Lambda on Node.js, SNS and SQS for events, RDS Postgres with PostGIS, DynamoDB, S3 and CloudFront, Cognito), provisioned with Terraform and deployed by GitHub Actions. The code is split the same way (planning, dock, delivery and sync services behind one API contract), so each route group maps to a Lambda.
