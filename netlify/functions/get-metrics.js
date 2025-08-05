import { successResponse, errorResponse, validationError } from './utils/response.js';

const METRIC_DEFINITIONS = {
  universal: [
    { id: 'cost', name: 'Costo', category: 'spend', format: 'currency', available: ['facebook', 'google', 'tiktok'] },
    { id: 'impressions', name: 'Impresiones', category: 'reach', format: 'number', available: ['facebook', 'google', 'tiktok'] },
    { id: 'clicks', name: 'Clics', category: 'engagement', format: 'number', available: ['facebook', 'google', 'tiktok'] },
    { id: 'ctr', name: 'CTR', category: 'engagement', format: 'percentage', calculated: true, formula: 'clicks/impressions*100', available: ['facebook', 'google', 'tiktok'] },
    { id: 'cpm', name: 'CPM', category: 'efficiency', format: 'currency', calculated: true, formula: 'cost/impressions*1000', available: ['facebook', 'google', 'tiktok'] },
    { id: 'cpc', name: 'CPC', category: 'efficiency', format: 'currency', calculated: true, formula: 'cost/clicks', available: ['facebook', 'google', 'tiktok'] }
  ],
  facebook: [
    { id: 'reach', name: 'Alcance', category: 'reach', format: 'number' },
    { id: 'frequency', name: 'Frecuencia', category: 'reach', format: 'decimal' },
    { id: 'video_views', name: 'Reproducciones de Video', category: 'video', format: 'number' },
    { id: 'video_views_25', name: 'Video 25%', category: 'video', format: 'number' },
    { id: 'video_views_50', name: 'Video 50%', category: 'video', format: 'number' },
    { id: 'video_views_75', name: 'Video 75%', category: 'video', format: 'number' },
    { id: 'video_views_100', name: 'Video 100%', category: 'video', format: 'number' },
    { id: 'inline_link_clicks', name: 'Clics en Enlaces', category: 'engagement', format: 'number' },
    { id: 'inline_post_engagement', name: 'Interacción en Posts', category: 'engagement', format: 'number' },
    { id: 'purchases', name: 'Compras', category: 'conversions', format: 'number' },
    { id: 'revenue', name: 'Ingresos', category: 'conversions', format: 'currency' },
    { id: 'roas', name: 'ROAS', category: 'efficiency', format: 'decimal', calculated: true, formula: 'revenue/cost' }
  ],
  google: [
    { id: 'conversions', name: 'Conversiones', category: 'conversions', format: 'number' },
    { id: 'conversions_value', name: 'Valor de Conversiones', category: 'conversions', format: 'currency' },
    { id: 'impression_share', name: 'Cuota de Impresiones', category: 'reach', format: 'percentage' },
    { id: 'is_lost_by_rank', name: 'Perdido por Ranking', category: 'reach', format: 'percentage' },
    { id: 'is_lost_by_budget', name: 'Perdido por Presupuesto', category: 'reach', format: 'percentage' },
    { id: 'is_top', name: 'Impresiones Superiores', category: 'reach', format: 'percentage' },
    { id: 'is_absolute_top', name: 'Impresiones Top Absoluto', category: 'reach', format: 'percentage' },
    { id: 'video_views', name: 'Vistas de Video', category: 'video', format: 'number' },
    { id: 'conversion_rate', name: 'Tasa de Conversión', category: 'conversions', format: 'percentage', calculated: true, formula: 'conversions/clicks*100' },
    { id: 'cost_per_conversion', name: 'Costo por Conversión', category: 'efficiency', format: 'currency', calculated: true, formula: 'cost/conversions' }
  ],
  tiktok: [
    { id: 'video_play_actions', name: 'Reproducciones de Video', category: 'video', format: 'number' },
    { id: 'video_watched_2_s', name: 'Videos vistos 2s', category: 'video', format: 'number' },
    { id: 'video_views_p_25', name: 'Video 25%', category: 'video', format: 'number' },
    { id: 'video_views_p_50', name: 'Video 50%', category: 'video', format: 'number' },
    { id: 'video_views_p_75', name: 'Video 75%', category: 'video', format: 'number' },
    { id: 'video_views_p_100', name: 'Video 100%', category: 'video', format: 'number' },
    { id: 'purchases', name: 'Compras', category: 'conversions', format: 'number' },
    { id: 'purchases_value', name: 'Valor de Compras', category: 'conversions', format: 'currency' }
  ]
};

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return successResponse({});
  }

  try {
    const { platform } = event.queryStringParameters || {};
    
    if (!platform) {
      return validationError('Platform parameter is required');
    }

    const platformMetrics = METRIC_DEFINITIONS[platform] || [];
    const universalMetrics = METRIC_DEFINITIONS.universal.filter(m => 
      m.available.includes(platform)
    );

    const categories = [
      { id: 'spend', name: 'Gasto', icon: 'currency' },
      { id: 'reach', name: 'Alcance', icon: 'users' },
      { id: 'engagement', name: 'Interacción', icon: 'click' },
      { id: 'video', name: 'Video', icon: 'video' },
      { id: 'conversions', name: 'Conversiones', icon: 'chart' },
      { id: 'efficiency', name: 'Eficiencia', icon: 'trending' }
    ];

    const allMetrics = [...universalMetrics, ...platformMetrics];
    
    const metricsByCategory = categories.map(category => ({
      ...category,
      metrics: allMetrics.filter(m => m.category === category.id)
    })).filter(cat => cat.metrics.length > 0);

    return successResponse({
      platform,
      categories: metricsByCategory,
      totalMetrics: allMetrics.length,
      defaultMetrics: ['cost', 'impressions', 'clicks', 'ctr', 'cpm']
    });
  } catch (error) {
    return errorResponse(error);
  }
};