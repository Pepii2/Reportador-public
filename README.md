# Reportador - Marketing Report Generator

Professional marketing report generator that creates comprehensive campaign reports from BigQuery data in under 3 minutes.

## Features

- 📊 Multi-platform support (Facebook, Google Ads, TikTok)
- 📈 Visual report configuration wizard
- 📄 PDF and Excel export
- 🎨 Customizable report templates
- 🔄 Real-time data from BigQuery

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in your BigQuery credentials.

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Deployment

See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for deployment instructions.

## Tech Stack

- Vue 3 + Vite
- Netlify Functions
- Google BigQuery
- jsPDF & XLSX for exports
