# Deploy (Lead)

One service serves both the API and the built web app, so you get **one URL** for the judges. Render's free plan is enough.

## Render (recommended, about 10 minutes)

1. Make sure `main` is pushed to GitHub and `npm run build && npm start` works on your laptop (open http://localhost:4000).
2. Go to **render.com** → sign in with GitHub → **New → Blueprint** → pick the `waypoint` repo. Render reads `render.yaml` from the repo and fills everything in. Click **Apply**.
   - Without the blueprint: **New → Web Service** → the repo → Runtime **Node** → Build command `npm ci --include=dev && npm run build` → Start command `npm start` → Instance type **Free** → Health check path `/api/health`.
3. Wait for "Live". Open `https://waypoint-xxxx.onrender.com`. Test the demo script once on the live URL.
4. Every merge to `main` deploys again automatically.

Things to know:

- The free service **sleeps after 15 minutes** without visitors and takes about a minute to wake up. Open the URL a few minutes before the demo.
- The JSON database is reset to the demo data whenever the service restarts or redeploys. For a demo that's a feature. Still press **Reset demo data** before presenting.
- Live updates use WebSockets, which Render supports. Nothing else to configure.

## Plan B: run it on the demo laptop

```bash
npm install
npm run build
npm start          # http://localhost:4000
```

Other laptops on the same Wi-Fi can open `http://<your-laptop-ip>:4000` (find the IP with `ipconfig` on Windows or `ifconfig` on Mac), so the phone and the tablet can be real devices.

## What to say about deployment

The hackathon build runs as one Node.js service. The production plan from our Designathon submission is AWS serverless in ap-south-1 (API Gateway and Lambda on Node.js, SNS and SQS for events, RDS Postgres with PostGIS, DynamoDB, S3 and CloudFront, Cognito), provisioned with Terraform and deployed by GitHub Actions. The code is split the same way (planning, dock, delivery and sync services behind one API contract), so each route group maps to a Lambda.
