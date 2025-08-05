<script setup>
import { ref, computed } from 'vue'
import { wizardStore } from '@/stores/wizardStore'

const reportTypes = [
  {
    id: 'simple',
    name: 'Reporte Simple',
    icon: '📊',
    description: 'Genera reportes de una o múltiples campañas en un período específico',
    features: [
      'Selección múltiple de campañas',
      'Métricas personalizables',
      'Exportación a PDF y Excel',
      'Opción de reportes unificados o separados'
    ],
    useCase: 'Ideal para análisis de rendimiento general y reportes ejecutivos',
    color: '#3b82f6',
    available: true
  },
  {
    id: 'compare-campaigns',
    name: 'Comparar Campañas',
    icon: '⚖️',
    description: 'Compara el rendimiento de dos campañas lado a lado',
    features: [
      'Comparación directa entre 2 campañas',
      'Métricas de rendimiento relativo',
      'Gráficos comparativos automáticos',
      'Análisis de diferencias porcentuales'
    ],
    useCase: 'Perfect para A/B testing y optimización de campañas',
    color: '#10b981',
    available: false,
    comingSoonText: 'Próximamente'
  },
  {
    id: 'compare-periods',
    name: 'Comparar Períodos',
    icon: '📅',
    description: 'Analiza el rendimiento de una campaña en diferentes períodos de tiempo',
    features: [
      'Selección de períodos equivalentes',
      'Análisis de tendencias temporales',
      'Detección automática de mejoras/declives',
      'Sugerencias de períodos similares'
    ],
    useCase: 'Excelente para análisis de estacionalidad y evolución temporal',
    color: '#f59e0b',
    available: false,
    comingSoonText: 'Próximamente'
  }
]

const selectedType = ref(wizardStore.reportType || null)

const selectReportType = (type) => {
  if (!type.available) return
  selectedType.value = type.id
  wizardStore.setReportType(type.id)
}

const selectedReportType = computed(() => {
  return reportTypes.find(type => type.id === selectedType.value)
})
</script>

<template>
  <div class="report-type-selection">
    <div class="step-header">
      <h2>¿Qué tipo de reporte necesitas?</h2>
      <p>Selecciona el tipo de análisis que mejor se adapte a tus objetivos</p>
    </div>

    <div class="report-types-grid">
      <div 
        v-for="reportType in reportTypes"
        :key="reportType.id"
        class="report-type-card"
        :class="{ 
          'card-selected': selectedType === reportType.id,
          'card-hover': reportType.available,
          'card-disabled': !reportType.available
        }"
        @click="selectReportType(reportType)"
      >
        <div class="report-type-header">
          <div class="report-type-icon" :style="{ color: reportType.color }">
            {{ reportType.icon }}
          </div>
          <div class="selection-indicator">
            <div 
              v-if="reportType.available"
              class="radio-button"
              :class="{ 'radio-selected': selectedType === reportType.id }"
            ></div>
            <div v-else class="coming-soon-badge">
              🚀 {{ reportType.comingSoonText }}
            </div>
          </div>
        </div>

        <div class="report-type-content">
          <h3>{{ reportType.name }}</h3>
          <p class="report-type-description">{{ reportType.description }}</p>

          <div class="report-type-features">
            <h4>Características:</h4>
            <ul>
              <li v-for="feature in reportType.features" :key="feature">
                <span class="feature-check">✓</span>
                {{ feature }}
              </li>
            </ul>
          </div>

          <div class="report-type-use-case">
            <div class="use-case-badge" :style="{ backgroundColor: reportType.color + '20', color: reportType.color }">
              💡 {{ reportType.useCase }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedReportType" class="selection-summary">
      <div class="summary-card" :style="{ borderColor: selectedReportType.color + '40' }">
        <div class="summary-header" :style="{ color: selectedReportType.color }">
          <span class="summary-icon">{{ selectedReportType.icon }}</span>
          <h3>{{ selectedReportType.name }} Seleccionado</h3>
        </div>
        <div class="summary-content">
          <p>{{ selectedReportType.description }}</p>
          <div class="workflow-preview">
            <h4>Próximos pasos:</h4>
            <div class="workflow-steps">
              <div class="workflow-step">
                <span class="step-number">1</span>
                <span>Seleccionar Ad Accounts</span>
              </div>
              <div class="workflow-step">
                <span class="step-number">2</span>
                <span v-if="selectedType === 'simple'">Elegir campañas (unificadas o separadas)</span>
                <span v-else-if="selectedType === 'compare-campaigns'">Seleccionar 2 campañas para comparar</span>
                <span v-else>Elegir una campaña y períodos a comparar</span>
              </div>
              <div class="workflow-step">
                <span class="step-number">3</span>
                <span>Configurar métricas y fechas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-type-selection {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.step-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.step-header p {
  font-size: 1.125rem;
  color: #64748b;
}

.report-types-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.report-type-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.report-type-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.report-type-card.card-selected {
  border-color: var(--selected-color, #3b82f6);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.report-type-card.card-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f9fafb;
}

.report-type-card.card-disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: #e2e8f0;
}

.report-type-card.card-disabled .report-type-description,
.report-type-card.card-disabled .report-type-features,
.report-type-card.card-disabled .use-case-badge {
  opacity: 0.7;
}

.report-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.report-type-icon {
  font-size: 2.5rem;
}

.radio-button {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
}

.radio-selected {
  border-color: #3b82f6;
  background-color: #3b82f6;
}

.radio-selected::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background-color: white;
  border-radius: 50%;
}

.coming-soon-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.report-type-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.report-type-content h3 {
  font-size: 1.375rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.report-type-description {
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.report-type-features {
  margin-bottom: 1.5rem;
  flex: 1;
}

.report-type-features h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.report-type-features ul {
  list-style: none;
  padding: 0;
}

.report-type-features li {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.feature-check {
  color: #10b981;
  font-weight: 600;
  margin-right: 0.5rem;
}

.use-case-badge {
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
}

.selection-summary {
  margin-top: 2rem;
}

.summary-card {
  background: white;
  border: 2px solid;
  border-radius: 1rem;
  padding: 1.5rem;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.summary-icon {
  font-size: 1.5rem;
}

.summary-header h3 {
  font-weight: 600;
  font-size: 1.25rem;
}

.summary-content p {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.workflow-preview h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.workflow-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.workflow-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background-color: #f1f5f9;
  color: #475569;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.75rem;
}

/* Responsive */
@media (max-width: 1200px) {
  .report-types-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .report-types-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .report-types-grid {
    grid-template-columns: 1fr;
  }
  
  .workflow-steps {
    gap: 0.5rem;
  }
  
  .workflow-step {
    font-size: 0.8rem;
  }
}
</style>