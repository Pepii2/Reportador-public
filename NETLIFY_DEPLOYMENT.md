# Netlify Deployment Guide

## Pre-Deployment Checklist

### 1. **Build Test**
Run locally to ensure everything builds correctly:
```bash
npm run build
```

### 2. **Environment Variables**
Set these in Netlify Dashboard > Site Settings > Environment Variables:

```
BIGQUERY_PROJECT_ID=bigquery-388915
BIGQUERY_DATASET=unified_data
GOOGLE_CLOUD_CREDENTIALS=<Your entire service account JSON as a single line>
```

To convert your JSON credentials to a single line:
1. Open `bigquery-credentials.json`
2. Remove all line breaks and extra spaces
3. Copy the entire JSON as one line

### 3. **Deploy to Netlify**

#### Option A: Via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

#### Option B: Via Git
1. Push your code to GitHub
2. Connect the repo in Netlify Dashboard
3. It will auto-deploy on push

#### Option C: Drag & Drop
1. Run `npm run build`
2. Drag the `dist` folder to Netlify dashboard

### 4. **Post-Deployment Setup**

1. **Set Environment Variables** in Netlify Dashboard:
   - Go to Site Settings > Environment Variables
   - Add all variables from `.env.example`

2. **Test the Functions**:
   - Visit `https://your-site.netlify.app/api/get-teams`
   - Should return a list of teams

3. **Enable Functions Logs**:
   - Go to Functions tab in Netlify Dashboard
   - Monitor for any errors

## Common Issues & Solutions

### Issue: Functions not working
- Check environment variables are set correctly
- Check function logs in Netlify Dashboard

### Issue: BigQuery authentication fails
- Ensure GOOGLE_CLOUD_CREDENTIALS is properly formatted (single line)
- Verify service account has correct permissions

### Issue: CORS errors
- Already handled in `netlify.toml`
- If still issues, check browser console for specific errors

## Production URLs
- Frontend: `https://your-site-name.netlify.app`
- API Example: `https://your-site-name.netlify.app/api/get-teams`

## Security Notes
- Never commit `.env` or `bigquery-credentials.json`
- Use Netlify environment variables for sensitive data
- Consider restricting CORS in production

## Monitoring
- Enable Netlify Analytics (paid feature)
- Check Functions logs regularly
- Monitor BigQuery usage/costs