# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Reportador** is a Spanish-language marketing reporting web application that generates professional campaign reports from BigQuery data in under 3 minutes. It serves as an intelligent reporting tool for digital marketing campaigns across Facebook Ads, Google Ads, and TikTok Ads platforms.

The application eliminates manual report development by providing a visual wizard interface that allows marketing managers, agencies, and analysts to create client-ready reports without technical dependencies.

## Technology Stack & Architecture

- **Frontend**: Vue 3 with Composition API (`<script setup>` syntax)
- **Build Tool**: Vite with Vue DevTools integration
- **Data Source**: BigQuery with unified campaign data from multiple ad platforms
- **Deployment**: Netlify
- **Node Version**: ^20.19.0 || >=22.12.0

### Project Structure
```
src/
├── App.vue          # Main application component (currently placeholder)
├── main.js          # Vue app initialization
public/
├── favicon.ico      # App icon
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

## Core Application Flow (6-Step Wizard)

Based on PROJECT_CONTEXT.md, the application implements a sophisticated wizard with these steps:

1. **Platform Selection**: Choose between Facebook, Google, TikTok Ads
2. **Report Type Selection**: Simple Report, Compare Campaigns, or Compare Periods  
3. **Ad Account Selection**: Multi-select with search and status indicators
4. **Campaign Selection**: Hierarchical selection with unified vs separate report options
5. **Ad Set Selection**: Tree view with cascade selection
6. **Smart Date & Metrics Configuration**: Calendar-based date selection with drag-drop metric configuration

### Key UX Features
- Smart calendar showing only active campaign days
- Real-time data preview and validation  
- Drag & drop metric configuration
- Template system for reusable report configurations
- Multi-format export (PDF, Excel)

## BigQuery Data Architecture

The application connects to a `unified_data` table with this structure:
- **Format**: Long format (metric/value pairs)
- **Partitioning**: By date for query optimization
- **Clustering**: By team and metric
- **Platforms**: Facebook, Google Ads, TikTok consolidated

### Key Metrics Available
- **Universal**: cost, clicks, impressions  
- **Facebook-specific**: reach, frequency, video completion rates, purchases, revenue
- **TikTok-specific**: video engagement metrics, video completion with 'p_' prefix
- **Google-specific**: conversions

### Query Optimization
Always filter by date first to leverage partitioning, then use team/metric clustering for performance.

## Development Patterns

- Use Vue 3 Composition API with `<script setup>` syntax
- Path aliasing: `@/` maps to `src/` directory
- Component-based architecture following Vue 3 best practices
- Spanish language UI (based on project context)

## Business Context

Target users are marketing professionals who need to generate executive reports quickly without technical skills. The application focuses on:
- Cross-platform campaign comparison
- Period-over-period analysis  
- Visual report configuration
- Professional PDF/Excel output
- Template reusability for recurring reports

Key benefit: Reduces report generation from 3+ hours of technical work to 3 minutes of visual configuration.