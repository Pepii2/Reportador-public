# BigQuery Dataset Configuration Fix

## Issue
The application is looking for dataset `Reportador` but your actual dataset name is `reportador` (lowercase).

## Solution
Update the `BIGQUERY_DATASET` environment variable in Netlify:

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site: `reportadorabnero`
3. Navigate to: **Site Settings** → **Environment Variables**
4. Find and update the variable:
   - Variable name: `BIGQUERY_DATASET`
   - Current value: `Reportador` (incorrect)
   - New value: `reportador` (correct - lowercase)

## Your BigQuery Configuration
- **Project ID**: `bigquery-388915`
- **Dataset**: `reportador` (lowercase)
- **Table**: `unified_data`
- **Location**: US

## Verification
After updating the environment variable:
1. Redeploy your site (or trigger a new build)
2. The API endpoint should work: `https://reportadorabnero.netlify.app/.netlify/functions/get-teams`

## Note
BigQuery dataset names are case-sensitive. Always use the exact case as shown in your BigQuery console.