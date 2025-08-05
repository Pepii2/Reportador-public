/# Project Context

Reportador
Reportes de Marketing Digital Inteligentes

🎯 ¿Qué es Reportador?
Una aplicación web que genera reportes profesionales de campañas de marketing desde BigQuery en menos de 3 minutos, eliminando el desarrollo manual y el consumo de recursos técnicos.

⚡ Características Principales
Selección Inteligente de Fechas

Calendario que solo muestra días donde las campañas estuvieron activas
Preview de métricas en tiempo real antes de generar
Validación automática de disponibilidad de datos

Comparaciones Avanzadas

Campañas vs Campañas: Rendimiento lado a lado
Períodos vs Períodos: Misma campaña en diferentes fechas
Reportes Unificados: Múltiples campañas en un solo documento

Configuración Visual

Métricas drag & drop para personalizar columnas
Templates reutilizables con lógica temporal
Export a PDF profesional y Excel


📊 Para Quién

Marketing Managers: Reportes ejecutivos sin depender de desarrollo
Agencias: Reportes client-ready en minutos, no horas
Analistas: Comparaciones complejas sin SQL manual


🚀 Beneficio Principal
Antes: 3+ horas de desarrollo + recursos técnicos + posibles errores
Después: 3 minutos de configuración visual + PDF listo para compartir
## Project Description
Flujo Principal Actualizado
Paso 1: Selección de Plataforma
Mantiene diseño actual
Paso 2: Tipo de Reporte

Cards con opciones:

📊 "Reporte Simple"
⚖️ "Comparar Campañas"
📅 "Comparar Períodos"



Paso 3: Selección de Ad Accounts
Mantiene funcionalidad actual
Paso 4A: Selección de Campañas (Reporte Simple)

UI Mejorada: Checkboxes múltiples con nueva funcionalidad
Nueva Opción: Toggle al final de la lista

🔄 "Unificar campañas" → Un solo reporte consolidado
📋 "Reportes separados" → Un PDF por cada campaña seleccionada


Preview: Contador dinámico "3 campañas → 1 reporte unificado" o "3 campañas → 3 reportes separados"

Paso 4B: Comparar Campañas

UI: Dos selectores lado a lado "Campaña A" vs "Campaña B"
Restricción: Solo una campaña por lado (no múltiples)

Paso 4C: Comparar Períodos

UI: Un selector de campaña única
Siguiente: Directo a selección de períodos duales

Paso 5: Selección de AdSets

Para Unificadas: Lista consolidada de todos los adsets de campañas seleccionadas
Para Separadas: Agrupación por campaña con expand/collapse
Para Comparaciones: Según corresponda al tipo

NUEVO: Paso 6 - Selector de Fechas Inteligente
Layout Principal

Calendario Visual: Ocupando 70% de la pantalla
Panel Lateral: 30% con información contextual y controles

Estados del Calendario

🟢 Verde: Campaña activa + preview de métricas en hover
🔴 Rojo: Campaña inactiva (no clickeable, con patrón diagonal)
⚪ Gris: Fuera de rango de existencia
🔵 Azul: Días seleccionados por usuario
⚠️ Amarillo con warning: Días con datos limitados

Panel Lateral - Información Contextual
📊 RESUMEN DE CAMPAÑA
┌─────────────────────────────────────┐
│ "Summer Sale 2024"                  │
│ Activa: 15 May - 30 Jun (45 días)   │
│ Datos disponibles: 42 días          │
│ Pausas detectadas: 3-5 May, 20 May  │
└─────────────────────────────────────┘

📈 PREVIEW DE SELECCIÓN
┌─────────────────────────────────────┐
│ 🗓 12 días seleccionados             │
│ 📊 ~15,247 impresiones              │
│ 💰 ~$2,340 spend                   │
│ 🎯 ~847 clics                      │
│ ⚡ Datos completos: 12/12 días      │
└─────────────────────────────────────┘
Controles Inteligentes

Shortcuts:

"Todos los días activos" (auto-filtra rojos)
"Última semana completa"
"Mejor semana" (mayor volumen)


Validación en Tiempo Real:

Al seleccionar rango con días rojos: "⚠️ 3 días inactivos filtrados automáticamente"
Contador se actualiza instantáneamente



Para Comparar Períodos

Dos calendarios side-by-side
Validación Automática:

Períodos equivalentes: "Período A: 7 días → Período B debe ser 7 días"
No solapamiento: Días ya usados en A aparecen tenue en B
Sugerencias automáticas: "Semana equivalente mes anterior" (auto-selecciona)



NUEVO: Paso 7 - Configuración de Métricas Drag & Drop
Layout de Tres Columnas
Columna 1: Métricas Disponibles (30%)
📊 PERFORMANCE
┌─────────────────┐
│ [CTR]          │ ← Casillas arrastrables
│ [CPC]          │
│ [CPM]          │  
│ [ROAS]         │
└─────────────────┘

📈 VOLUMEN  
┌─────────────────┐
│ [Impressions]  │
│ [Clicks]       │
│ [Conversions]  │
└─────────────────┘

💰 COSTOS
┌─────────────────┐
│ [Spend]        │
│ [Cost per Result] │
└─────────────────┘
Columna 2: Configuración del Reporte (40%)
🏗 TU REPORTE
┌─────────────────────────────────┐
│ Arrastra métricas aquí          │
│                                 │
│ [Impressions] [🔄] [❌]         │ ← Reordenable
│ [Clicks] [🔄] [❌]              │
│ [Spend] [🔄] [❌]               │
│                                 │
│ + Zona de drop activa           │
└─────────────────────────────────┘
Columna 3: Preview en Tiempo Real (30%)
📋 PREVIEW
┌─────────────────────────────────┐
│ Campaign | Impressions | Clicks │
│ Summer   |    1,247   |   84   │
│ Q4 Lead  |      892   |   23   │
│                                 │
│ ⚡ Estimado: 1,340 filas        │
│ 📄 Tamaño PDF: ~45 páginas     │
└─────────────────────────────────┘
Micro-interacciones

Drag feedback: Casilla se eleva, zona de drop se resalta
Reordenamiento: Drag vertical dentro de la columna configuración
Auto-preview: Actualización instantánea al agregar/quitar métricas
Validación: Mínimo 3 métricas requeridas, máximo 15 para PDF legible

Paso 8: Generación y Preview Final
Resumen Ejecutivo
📋 RESUMEN DE TU REPORTE
┌─────────────────────────────────────────────────┐
│ Tipo: Comparar Períodos                         │
│ Campaña: "Summer Sale 2024"                     │
│ Período A: 1-7 Jun (7 días activos)            │
│ Período B: 1-7 May (7 días activos)            │
│ Métricas: 6 seleccionadas                       │
│ Estimado: 847 filas → PDF de ~23 páginas       │
└─────────────────────────────────────────────────┘
Opciones de Generación

PDF Ejecutivo: Con gráficos comparativos automáticos
PDF Detallado: Solo tablas de datos
Excel: Para análisis posterior

Templates Inteligentes

Auto-sugerencia de nombre: "Comparación Summer Sale Jun vs May"
Guardar lógica: "Comparar [campaña] últimos 7 días vs 7 días hace 1 mes"

Casos Especiales UX
Multiple Campañas Unificadas

Preview combinado: Muestra métricas agregadas de todas las campañas
Fechas inteligentes: Solo muestra días donde AL MENOS una campaña estuvo activa
Advertencia: "Campaign X no tiene datos en 3 de los días seleccionados"

Reportes Separados

Preview múltiple: Mini-previews por cada campaña
Validación individual: Cada campaña valida sus propias fechas
Generación: "Generando 3 PDFs... (1/3 completado)"
## Technology Stack
<!-- List the main technologies, frameworks, and languages you plan to use -->
- Frontend: 
- Backend: 
- Database: 
- Other tools: 

## Architecture Overview
1. Paso a Paso del Aspecto Lógico del Proyecto
Arquitectura de Datos
Paso 1: Conexión a BigQuery

Establecer conexión autenticada con BigQuery
Definir esquemas de tablas para cada plataforma (Facebook Ads, Google Ads, TikTok Ads)
Implementar pool de conexiones para optimizar performance

Paso 2: Jerarquía de Consultas Progresivas

Consulta Base: Seleccionar plataforma → obtener Ad Accounts disponibles
Consulta Nivel 2: Filtrar por Ad Accounts seleccionados → obtener Campaign IDs (aplicar filtro de fecha aquí)
Consulta Nivel 3: Filtrar por Campaigns → obtener Ad Sets
Consulta Final: Con jerarquía completa → obtener todas las métricas solicitadas

Paso 3: Optimización de Consultas

Implementar filtrado temporal desde consulta nivel 2 para reducir volumen de datos
Usar consultas preparadas para evitar SQL injection
Implementar caché temporal para consultas repetitivas
Paginación en resultados grandes

Paso 4: Procesamiento de Datos

Validación de integridad de datos recibidos
Normalización de métricas entre plataformas
Cálculos derivados (ROAS, CTR, etc.)
Formateo según configuración del usuario

Paso 5: Generación de Reportes

Compilar datos según selecciones del usuario
Exportar a formatos múltiples (CSV, Excel, PDF)
Guardar configuración como template reutilizable

2. Paso a Paso del Aspecto UX del Proyecto
Flujo de Usuario (Wizard de 6 Pasos)
Paso 1: Selección de Plataforma

UI: Cards visuales con logos de plataformas
UX: Selección única, descripción breve de cada plataforma
Estado: Botón "Siguiente" se activa solo tras selección
Feedback: Highlighting visual de la plataforma seleccionada

Paso 2: Selección de Ad Accounts

UI: Lista con checkboxes múltiples + buscador
UX:

"Seleccionar todos/Deseleccionar todos"
Indicadores de estado (activo/inactivo) con colores
Contador de seleccionados


Loading: Spinner mientras consulta BigQuery
Validation: Mínimo 1 account seleccionado

Paso 3: Selección de Campañas

UI: Lista jerárquica agrupada por Ad Account
UX:

Expand/collapse por account
Filtros: status, tipo de campaña
"Seleccionar todas las activas" shortcut
Breadcrumb visual de selecciones


Auto-load: Se ejecuta automáticamente al seleccionar accounts

Paso 4: Selección de Ad Sets

UI: Vista de árbol expandible (Account > Campaign > Ad Sets)
UX:

Selección en cascada (campaign selecciona todos sus ad sets)
Checkboxes tri-state (checked/unchecked/indeterminate)
Filtros por performance, budget, status
Contador total de ad sets seleccionados



Paso 5: Configuración de Métricas y Fechas

UI: Layout de dos columnas
UX Métricas:

Drag & drop para reordenar columnas
Checkboxes agrupados por categoría
Preview de estructura del reporte


UX Fechas:

Date picker con rangos predefinidos
Validación de rangos lógicos
Estimador de volumen de datos



Paso 6: Previsualización y Generación

UI: Resumen ejecutivo + preview de datos
UX:

Resumen de todas las selecciones
Estimado de filas resultado
Opción "Guardar como template"
Botón CTA prominente "Generar Reporte"



Consideraciones UX Adicionales

Progress indicator: Stepper visual mostrando paso actual
Estado persistente: localStorage para mantener selecciones
Error handling: Mensajes claros para errores de conexión/datos
Responsive design: Adaptable a móvil/tablet
Accessibility: ARIA labels, navegación por teclado

ecuentemente los usuarios necesitan reportes en tiempo real vs. datos del día anterior?


## Key Requirements
<!-- List the main functional and non-functional requirements -->

Sobre Funcionalidad:
4. ¿Los usuarios necesitan comparar datos entre diferentes plataformas en un mismo reporte?
5. ¿Planeas incluir funcionalidades de alertas automáticas cuando ciertas métricas superen thresholds?
6. ¿Los reportes necesitan incluir visualizaciones (gráficos) o solo datos tabulares?
Sobre Experiencia de Usuario:
7. ¿Los usuarios típicamente generan reportes similares repetidamente? (esto justificaría más el sistema de templates)
8. ¿Necesitas diferentes niveles de acceso? (admin puede ver todas las cuentas, usuario solo las suyas)
9. ¿Los reportes se compartirán con stakeholders externos que no usan la plataforma?
Sobre Integración:
10. ¿Este reportador se integrará con otras herramientas internas existentes?
11. ¿Necesitas APIs para que otros sistemas consuman estos reportes?
¿Cuáles de estos aspectos consideras más críticos para tu caso de uso específico?

## Development Environment Setup
<!-- Describe how to set up the development environment -->

My pc, local run , VUE framework and bigquery functions
## Build and Deployment
<!-- Describe build processes, testing, and deployment procedures -->
Deployment on netlify

## External Dependencies
<!-- List any external APIs, services, or third-party integrations -->

Bigquery structured as follows:

# Unified Campaign Table - Complete Documentation
Table Purpose
The unified_data table consolidates campaign performance data from Facebook, Google, and TikTok into a single, normalized structure. It transforms platform-specific data formats into a consistent long format for cross-platform analysis and reporting.
Table Schema
sqlCREATE TABLE unified_data (
  date DATE,                    -- Campaign performance date
  campaign STRING,              -- Campaign name
  account STRING,               -- Platform account ID (matches clients_master.accounts.id)
  account_name STRING,          -- Human-readable account name
  platform STRING,              -- Advertising platform (facebook, google, tiktok)
  team STRING,                  -- Team name (from clients_master join)
  metric STRING,                -- Performance metric name
  value FLOAT64,                -- Metric value
  last_updated TIMESTAMP        -- Record creation timestamp
)
PARTITION BY date
CLUSTER BY team, metric;
Data Architecture

Long format design: Each row represents one metric value for a specific campaign/account/date
Date partitioned: Optimized for time-based queries
Clustered by team and metric: Fast filtering on these dimensions
Cross-platform normalization: Different platform APIs unified into consistent structure
Platform identification: Explicit platform labeling eliminates need for joins
Daily refresh: Automated population via scheduled queries

Available Fields
Core Dimensions
FieldTypeDescriptionExampledateDATECampaign performance date2025-07-29campaignSTRINGCampaign name from platform"AR_Purchase_Rmkt_TikTok_Video"accountSTRINGPlatform account identifier"204962684277968"account_nameSTRINGHuman-readable account name"Flux IT"platformSTRINGAdvertising platform"facebook", "google", "tiktok"teamSTRINGTeam managing the account"TimBeta"last_updatedTIMESTAMPWhen record was created2025-07-30 08:15:23 UTC
Metric Dimension
FieldTypeDescriptionmetricSTRINGPerformance metric name (see available metrics below)valueFLOAT64Numeric value for the metric
Available Metrics
🔥 Universal Metrics (All Platforms)
Core performance indicators available across Facebook, Google, and TikTok
MetricDescriptionUnitPlatform CoveragecostCampaign spend/investmentCurrency unitsFacebook, Google, TikTokclicksUser clicks/interactionsCountFacebook, Google, TikTokimpressionsAd views/displaysCountFacebook, Google, TikTok
📱 Facebook-Specific Metrics
Rich engagement and social interaction data
Reach & Frequency
MetricDescriptionUnitreachUnique users who saw adsCountfrequencyAverage times user saw adRatio
Engagement Metrics
MetricDescriptionUnitinline_link_clicksClicks on ad linksCountinline_post_engagementTotal post interactions (likes, comments, shares)Count
Video Metrics (Facebook Format)
MetricDescriptionUnitvideo_viewsTotal video viewsCountvideo_views_25Videos watched to 25% completionCountvideo_views_50Videos watched to 50% completionCountvideo_views_75Videos watched to 75% completionCountvideo_views_100Videos watched to 100% completionCount
Conversion Metrics (Facebook)
MetricDescriptionUnitpurchasesPurchase conversionsCountrevenueRevenue attributed to campaignsCurrency units
🎵 TikTok-Specific Metrics
Video-first platform engagement indicators
Video Engagement
MetricDescriptionUnitvideo_viewsTotal video views (TikTok format)Countvideo_play_actionsVideo play button clicksCountvideo_watched_2_sVideos watched for 2+ secondsCount
Video Completion (TikTok Format)
MetricDescriptionUnitvideo_views_p_25Videos watched to 25% completionCountvideo_views_p_50Videos watched to 50% completionCountvideo_views_p_75Videos watched to 75% completionCountvideo_views_p_100Videos watched to 100% completionCount
Conversion Metrics (TikTok)
MetricDescriptionUnitpurchasesPurchase conversionsCountpurchases_valueRevenue from purchasesCurrency units
🔍 Google-Specific Metrics
Search and display advertising performance
MetricDescriptionUnitconversionsConversion actions completedCount
Data Sources & Population
Source Routines

Facebook: facebook_ads_airbyte.campaign_basic_stats(account_ids_param, start_date_param)
Google: google_ads.campaign_basic_stats(customer_ids_param, start_date_param)
TikTok: tiktok_ads_fivetran.ad_basic_stats(customer_ids_param, start_date_param) (aggregated to campaign level)

Population Process

Platform-specific CTEs extract and transform data from each advertising platform
Account filtering uses clients_master.accounts to determine which accounts to process per platform
Data transformation converts wide format (multiple metric columns) to long format (metric/value pairs)
Platform identification adds explicit platform labels ('facebook', 'google', 'tiktok')
Union operation combines all platforms into single dataset
Team assignment joins with clients_master.accounts to add team information
Data insertion populates the unified table with normalized structure

Daily Transformation Flow
Facebook API → campaign_basic_stats() → facebook_transformed CTE
Google API → campaign_basic_stats() → google_transformed CTE  
TikTok API → ad_basic_stats() → tiktok_aggregated → tiktok_transformed CTE
                                     ↓
                              all_platforms CTE (UNION ALL)
                                     ↓
                              unpivoted CTE (metrics → rows)
                                     ↓
                              Final INSERT (+ team join)
Query Optimization Guidelines
Performance Best Practices
sql-- ✅ GOOD: Filter by date first (leverages partitioning)
SELECT * FROM unified_data 
WHERE date >= '2025-07-01'
  AND team = 'TimBeta'
  AND platform = 'facebook'
  AND metric = 'cost';

-- ✅ GOOD: Use clustered fields in WHERE clause
SELECT * FROM unified_data 
WHERE team IN ('TeamA', 'TeamB')
  AND metric IN ('cost', 'clicks')
  AND platform = 'tiktok';

-- ✅ GOOD: Platform-specific analysis without joins
SELECT platform, SUM(value) as total_cost
FROM unified_data
WHERE metric = 'cost' AND date >= '2025-07-01'
GROUP BY platform;

-- ❌ AVOID: Scanning entire table without date filter
SELECT * FROM unified_data 
WHERE campaign LIKE '%Brand%';
Common Query Patterns
Convert Long Format to Wide Format
sqlSELECT 
  date, campaign, account_name, platform, team,
  SUM(CASE WHEN metric = 'cost' THEN value END) as cost,
  SUM(CASE WHEN metric = 'clicks' THEN value END) as clicks,
  SUM(CASE WHEN metric = 'impressions' THEN value END) as impressions
FROM unified_data
WHERE date >= '2025-07-01'
GROUP BY date, campaign, account_name, platform, team;
Time Series Analysis
sqlSELECT 
  date,
  platform,
  metric,
  SUM(value) as daily_total
FROM unified_data
WHERE metric = 'cost'
  AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date, platform, metric
ORDER BY date, platform;
Cross-Platform Comparison (Direct)
sql-- Direct platform comparison without joins
SELECT 
  platform,
  metric,
  SUM(value) as total_value
FROM unified_data
WHERE date >= '2025-07-01'
  AND metric IN ('cost', 'clicks', 'impressions')
GROUP BY platform, metric
ORDER BY platform, metric;
Platform-Specific Analysis Examples
Facebook Video Funnel Analysis
sqlSELECT 
  campaign,
  account_name,
  SUM(CASE WHEN metric = 'video_views' THEN value END) as total_views,
  SUM(CASE WHEN metric = 'video_views_100' THEN value END) as complete_views,
  SUM(CASE WHEN metric = 'video_views_100' THEN value END) / 
  SUM(CASE WHEN metric = 'video_views' THEN value END) * 100 as completion_rate
FROM unified_data
WHERE platform = 'facebook'
  AND metric LIKE 'video_views%'
  AND metric NOT LIKE '%_p_%'  -- Exclude TikTok format
GROUP BY campaign, account_name;
TikTok Engagement Analysis
sqlSELECT 
  campaign,
  account_name,
  SUM(CASE WHEN metric = 'video_play_actions' THEN value END) as play_actions,
  SUM(CASE WHEN metric = 'video_watched_2_s' THEN value END) as watched_2s,
  SUM(CASE WHEN metric = 'video_views_p_100' THEN value END) as completed
FROM unified_data
WHERE platform = 'tiktok'
  AND metric IN ('video_play_actions', 'video_watched_2_s', 'video_views_p_100')
GROUP BY campaign, account_name;
Cross-Platform Cost Efficiency
sqlSELECT 
  platform,
  SUM(CASE WHEN metric = 'cost' THEN value END) / 
  SUM(CASE WHEN metric = 'clicks' THEN value END) as cost_per_click,
  SUM(CASE WHEN metric = 'cost' THEN value END) / 
  SUM(CASE WHEN metric = 'impressions' THEN value END) * 1000 as cpm
FROM unified_data
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  AND metric IN ('cost', 'clicks', 'impressions')
GROUP BY platform
ORDER BY cost_per_click;
Data Quality & Characteristics
Metric Availability by Platform

Universal availability: cost, clicks, impressions
Facebook-rich metrics: Detailed engagement and video completion data
TikTok video focus: Video-specific engagement metrics with 'p_' prefix for percentages
Google minimal: Primarily cost, clicks, impressions, conversions

Data Filtering Rules

Zero values excluded: Metrics with zero values are not stored to reduce table size
Null values excluded: Missing or null metrics are not inserted
Team requirement: Only accounts with assigned teams are included in final output

Platform-Specific Notes

TikTok aggregation: Ad-level data is summed to campaign level during processing
Video metrics: Facebook uses video_views_X format, TikTok uses video_views_p_X format
Currency consistency: All cost/revenue values in same currency units per account
Date consistency: All dates in consistent timezone (typically UTC)

Integration & Usage
Downstream Applications

BI Dashboards: Direct querying for real-time reporting
Scheduled Reports: Automated daily/weekly performance summaries
Data Exports: CSV/Excel generation for client deliverables
API Endpoints: Serve campaign data to applications
Alert Systems: Monitor performance thresholds and anomalies

Related Tables

clients_master.accounts: Account metadata, team assignments, platform identification
Source platform tables: Raw data from Facebook, Google, TikTok APIs
Custom aggregation tables: Pre-computed summaries for frequent queries

This unified structure enables comprehensive multi-platform campaign analysis while maintaining query performance and data consistency across all advertising platforms.