# Deployment and remaining configuration

Commands use `PROJECT=your-firebase-project`, region `asia-south1` (Mumbai). Run from `meetbrief/`.

## 1. Firebase

1. Create a Firebase project (Blaze plan, needed for Cloud Run, Cloud Tasks and larger Storage).
2. Enable **Authentication** → Email/Password and Google. Add your Vercel domain to Authorized domains.
3. Create **Firestore** (Native mode, `asia-south1`) and **Storage** (same region).
4. Deploy rules and indexes:
   ```bash
   npx firebase deploy --only firestore:rules,firestore:indexes,storage --project $PROJECT
   ```
5. Register a Web app and copy its config into Vercel environment variables (`VITE_FIREBASE_*`).
6. Storage CORS so the browser can play audio and download files from your domain:
   ```bash
   echo '[{"origin":["https://your-app.vercel.app"],"method":["GET"],"maxAgeSeconds":3600}]' > cors.json
   gsutil cors set cors.json gs://$BUCKET
   ```

## 2. Service accounts and secrets

```bash
gcloud iam service-accounts create meetbrief-api
gcloud iam service-accounts create meetbrief-worker
gcloud iam service-accounts create meetbrief-tasks   # signs Cloud Tasks → worker calls

# api: Firestore + Storage + enqueue tasks (+ act as the tasks SA to set the OIDC token)
for r in roles/datastore.user roles/storage.objectAdmin roles/cloudtasks.enqueuer; do
  gcloud projects add-iam-policy-binding $PROJECT --member serviceAccount:meetbrief-api@$PROJECT.iam.gserviceaccount.com --role $r; done
gcloud iam service-accounts add-iam-policy-binding meetbrief-tasks@$PROJECT.iam.gserviceaccount.com \
  --member serviceAccount:meetbrief-api@$PROJECT.iam.gserviceaccount.com --role roles/iam.serviceAccountUser
# worker: Firestore + Storage + enqueue next steps + Speech (if using Google)
for r in roles/datastore.user roles/storage.objectAdmin roles/cloudtasks.enqueuer roles/speech.client; do
  gcloud projects add-iam-policy-binding $PROJECT --member serviceAccount:meetbrief-worker@$PROJECT.iam.gserviceaccount.com --role $r; done
gcloud iam service-accounts add-iam-policy-binding meetbrief-tasks@$PROJECT.iam.gserviceaccount.com \
  --member serviceAccount:meetbrief-worker@$PROJECT.iam.gserviceaccount.com --role roles/iam.serviceAccountUser

printf '%s' "$ANTHROPIC_KEY" | gcloud secrets create anthropic-api-key --data-file=-
printf '%s' "$SARVAM_KEY"    | gcloud secrets create sarvam-api-key --data-file=-
# grant roles/secretmanager.secretAccessor on these secrets to meetbrief-api and meetbrief-worker
```

## 3. Durable queue

```bash
gcloud tasks queues create meetbrief-jobs --location asia-south1 \
  --max-attempts 8 --min-backoff 10s --max-backoff 600s --max-concurrent-dispatches 20
```

## 4. Cloud Run (one image, two services)

```bash
gcloud builds submit --tag asia-south1-docker.pkg.dev/$PROJECT/meetbrief/server -f server/Dockerfile .
# (or: docker build -f server/Dockerfile -t … . && docker push …)

COMMON="FIREBASE_PROJECT_ID=$PROJECT,FIREBASE_STORAGE_BUCKET=$BUCKET,QUEUE_DRIVER=cloud-tasks,\
CLOUD_TASKS_LOCATION=asia-south1,TASKS_SERVICE_ACCOUNT=meetbrief-tasks@$PROJECT.iam.gserviceaccount.com,\
STT_PROVIDER=sarvam,LLM_PROVIDER=anthropic"

gcloud run deploy meetbrief-worker --image …/server --region asia-south1 --no-allow-unauthenticated \
  --service-account meetbrief-worker@$PROJECT.iam.gserviceaccount.com \
  --memory 4Gi --cpu 2 --timeout 1800 --concurrency 2 \
  --set-env-vars ROLE=worker,$COMMON \
  --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest,SARVAM_API_KEY=sarvam-api-key:latest
WORKER_URL=$(gcloud run services describe meetbrief-worker --region asia-south1 --format 'value(status.url)')
gcloud run services update meetbrief-worker --region asia-south1 --update-env-vars WORKER_URL=$WORKER_URL
gcloud run services add-iam-policy-binding meetbrief-worker --region asia-south1 \
  --member serviceAccount:meetbrief-tasks@$PROJECT.iam.gserviceaccount.com --role roles/run.invoker

gcloud run deploy meetbrief-api --image …/server --region asia-south1 --allow-unauthenticated \
  --service-account meetbrief-api@$PROJECT.iam.gserviceaccount.com --memory 1Gi --timeout 300 \
  --set-env-vars ROLE=api,WORKER_URL=$WORKER_URL,CORS_ORIGINS=https://your-app.vercel.app,$COMMON \
  --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest
```

Notes: the worker's `/tmp` is in memory, so 4 GiB covers several hours of audio per step. The API
also needs the Anthropic key for Ask AI. The API's in-memory rate limit is per instance; put Cloud
Armor or API Gateway in front for stricter limits.

## 5. Vercel (frontend)

Create a new Vercel project from this repository with **Root Directory = `meetbrief/web`** (the
repository root is a different site). `web/vercel.json` installs and builds from the workspace.
Environment variables: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
`VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_APP_ID`,
`VITE_API_BASE_URL` (the `meetbrief-api` URL). No provider keys.

## Remaining configuration checklist

- [ ] Firebase project, auth providers, authorized domains, rules and indexes deployed
- [ ] Storage CORS for the Vercel domain
- [ ] Cloud Tasks queue, three service accounts, IAM bindings
- [ ] Secrets: Anthropic key; Sarvam key (or enable Speech-to-Text API for Google)
- [ ] Verify provider request details listed in PROVIDERS.md, and run the accuracy evaluation
- [ ] Cloud Run services deployed; `WORKER_URL` set on both
- [ ] Vercel project with root `meetbrief/web` and `VITE_*` variables
- [ ] Data retention policy: set a Storage lifecycle rule (e.g. delete `processed/` after 90 days)
      and document how long originals are kept, in line with your organisation's records rules
- [ ] Budget alerts on the GCP project and provider dashboards
- [ ] Privacy notice for users, and a decision on where audio may be processed (Google Chirp in
      `asia-south1` keeps it in India; check each provider's data-residency terms)
