#!/usr/bin/env bash
# One-command deploy to Google Cloud Run.
# Prereqs: gcloud CLI installed + `gcloud auth login` done, and the env vars below set once.
set -euo pipefail

# ------- EDIT THESE THREE LINES ONCE -------
PROJECT_ID="${PROJECT_ID:-delta-food-supplies}"
REGION="${REGION:-us-south1}"           # us-south1 = Dallas
SERVICE="${SERVICE:-delta-api}"
# -------------------------------------------

gcloud config set project "$PROJECT_ID"

# Build the container with Cloud Build and deploy to Cloud Run in one step.
# Secrets are read from Secret Manager (created in README step 4).
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 3 \
  --memory 256Mi \
  --set-secrets "MONGODB_URI=MONGODB_URI:latest,SMTP_HOST=SMTP_HOST:latest,SMTP_USER=SMTP_USER:latest,SMTP_PASS=SMTP_PASS:latest" \
  --set-env-vars "CORS_ORIGINS=https://deltafoodsupplies.com,https://www.deltafoodsupplies.com,MAIL_TO=sales@deltafoodsupplies.com,MAIL_FROM=website@deltafoodsupplies.com"

echo
echo "Deployed. Test it:"
echo "  curl \$(gcloud run services describe $SERVICE --region $REGION --format='value(status.url)')/healthz"
