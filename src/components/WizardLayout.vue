<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { wizardStore } from '@/stores/wizardStore'

// Report generation states
const isGeneratingReport = ref(false)
const generationError = ref(null)

const router = useRouter()
const route = useRoute()
const currentStepComponent = ref(null)

const steps = [
  { step: 0, name: 'TIM', title: 'Equipo', route: 'TeamSelection' },
  { step: 1, name: 'platform', title: 'Plataforma', route: 'PlatformSelection' },
  { step: 2, name: 'report-type', title: 'Tipo de Reporte', route: 'ReportTypeSelection' },
  { step: 3, name: 'ad-accounts', title: 'Ad Accounts', route: 'AdAccountSelection' },
  { step: 4, name: 'campaigns', title: 'Campañas', route: 'CampaignSelection' },
  // Skip step 5 (Ad Sets) as it's now automatic
  { step: 6, name: 'configuration', title: 'Configuración', route: 'DateMetricsConfiguration' }
]

const currentStep = computed(() => {
  return route.meta?.step || 0
})

const canGoNext = computed(() => {
  switch (currentStep.value) {
    case 0: return wizardStore.selectedTeam !== null
    case 1: return wizardStore.selectedPlatform !== null
    case 2: return wizardStore.reportType !== null
    case 3: return wizardStore.selectedAdAccounts.length > 0
    case 4: return wizardStore.selectedCampaigns.length > 0
    // Skip step 5 validation as ad sets are auto-selected
    case 6: return wizardStore.selectedMetrics.length >= 3
    default: return false
  }
})

const canGoPrev = computed(() => {
  return currentStep.value > 0
})

const canPreview = computed(() => {
  return currentStepComponent.value?.canGeneratePreview?.value && currentStepComponent.value?.selectedMetrics?.value?.length > 0
})

const isGeneratingPreview = computed(() => {
  return currentStepComponent.value?.isGeneratingPreview?.value || false
})

const goToStep = (step) => {
  if (wizardStore.canGoToStep(step)) {
    const targetStep = steps.find(s => s.step === step)
    if (targetStep) {
      router.push({ name: targetStep.route })
    }
  }
}

const goNext = () => {
  if (canGoNext.value && currentStep.value < 6) {
    // Skip from step 4 (campaigns) directly to step 6 (configuration)
    const targetStepNumber = currentStep.value === 4 ? 6 : currentStep.value + 1
    const nextStep = steps.find(s => s.step === targetStepNumber)
    if (nextStep) {
      router.push({ name: nextStep.route })
    }
  }
}

const goPrev = () => {
  if (canGoPrev.value) {
    // Skip from step 6 (configuration) directly to step 4 (campaigns)
    const targetStepNumber = currentStep.value === 6 ? 4 : currentStep.value - 1
    const prevStep = steps.find(s => s.step === targetStepNumber)
    if (prevStep) {
      router.push({ name: prevStep.route })
    }
  }
}

const resetWizard = () => {
  wizardStore.reset()
  router.push({ name: 'TeamSelection' })
}

const triggerPreview = async () => {
  if (currentStepComponent.value?.generatePreview) {
    await currentStepComponent.value.generatePreview()
  }
}

const generateReportPDF = async () => {
  if (!wizardStore.isReadyForGeneration()) {
    generationError.value = wizardStore.getStepValidationMessage(6)
    return
  }
  
  // Navigate to report view instead of generating PDF
  router.push({ name: 'ReportView' })
}

const generateReport = async () => {
  if (!wizardStore.isReadyForGeneration()) {
    generationError.value = wizardStore.getStepValidationMessage(6)
    return
  }
  
  isGeneratingReport.value = true
  generationError.value = null
  
  try {
    const response = await wizardStore.generateReport()
    console.log('✅ Report generated successfully')
    alert(`✅ Reporte generado exitosamente con ${response.data?.length || 0} filas`)
  } catch (error) {
    console.error('❌ Report generation failed:', error)
    generationError.value = error.message || 'Error al generar el reporte'
    alert(`❌ Error: ${generationError.value}`)
  } finally {
    isGeneratingReport.value = false
  }
}
</script>

<template>
  <div class="wizard-layout">
    <!-- Header -->
    <header class="wizard-header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <h1>📊 Reportador</h1>
            <p>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAs</p>
          </div>
          <button @click="resetWizard" class="btn btn-outline">
            🔄 Reiniciar
          </button>
        </div>
      </div>
    </header>

    <!-- Stepper -->
    <div class="wizard-stepper">
      <div class="container">
        <div class="stepper">
          <div 
            v-for="step in steps" 
            :key="step.step"
            class="step"
            :class="{
              'step-active': step.step === currentStep,
              'step-completed': step.step < currentStep,
              'step-accessible': wizardStore.canGoToStep(step.step)
            }"
            @click="goToStep(step.step)"
          >
            <div class="step-circle">
              <span v-if="step.step < currentStep">✓</span>
              <span v-else>{{ step.step }}</span>
            </div>
            <div class="step-content">
              <div class="step-title">{{ step.title }}</div>
            </div>
            <div v-if="step.step < steps.length" class="step-connector"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="wizard-main">
      <div class="wizard-content">
        <router-view ref="currentStepComponent" />
      </div>
    </main>

    <!-- Navigation Footer -->
    <footer class="wizard-footer">
      <div class="container">
        <div class="navigation-buttons">
          <button 
            @click="goPrev" 
            :disabled="!canGoPrev"
            class="btn btn-secondary"
          >
            ← Anterior
          </button>
          
          <div class="step-indicator">
            Paso {{ currentStep === 6 ? 5 : currentStep + 1 }} de 5
          </div>
          
          <button 
            @click="goNext" 
            :disabled="!canGoNext"
            class="btn btn-primary"
            v-if="currentStep < 6"
          >
            Siguiente →
          </button>
          
          <div class="report-actions" v-else>
            <button 
              @click="triggerPreview"
              :disabled="!canPreview"
              class="btn btn-outline"
              v-if="currentStep === 6"
            >
              <span v-if="isGeneratingPreview">⏳ Generando...</span>
              <span v-else>👀 Vista Previa</span>
            </button>
            <button 
              @click="generateReportPDF"
              :disabled="!canGoNext"
              class="btn btn-primary"
            >
              📊 Ver Reporte
            </button>
          </div>
        </div>
      </div>
    </footer>

    <!-- Error Modal or Toast -->
    <div v-if="generationError" class="error-toast">
      <div class="error-content">
        <span class="error-icon">❌</span>
        <span class="error-message">{{ generationError }}</span>
        <button @click="generationError = null" class="close-btn">×</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizard-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.wizard-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.logo p {
  font-size: 0.875rem;
  color: #64748b;
}

/* Stepper */
.wizard-stepper {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 2rem 0;
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  cursor: pointer;
  min-width: 120px;
}

.step-accessible:hover .step-circle {
  background-color: #e2e8f0;
}

.step-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.step-active .step-circle {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.step-completed .step-circle {
  background-color: #10b981;
  color: white;
  border-color: #10b981;
}

.step-title {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  text-align: center;
}

.step-active .step-title {
  color: #3b82f6;
  font-weight: 600;
}

.step-completed .step-title {
  color: #10b981;
}

.step-connector {
  position: absolute;
  top: 1.25rem;
  left: calc(100% - 1.25rem);
  width: 6rem;
  height: 2px;
  background-color: #e2e8f0;
  z-index: -1;
}

.step-completed .step-connector {
  background-color: #10b981;
}

/* Main Content */
.wizard-main {
  flex: 1;
  padding: 2rem 0 6rem 0;
}

.wizard-content {
  width: 100%;
  height: 100%;
  max-width: 1900px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Footer */
.wizard-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 1.5rem 0;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-indicator {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .stepper {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .step {
    min-width: auto;
    flex: 1;
  }
  
  .step-connector {
    display: none;
  }
  
  .navigation-buttons {
    flex-direction: column;
    gap: 1rem;
  }
  
  .step-indicator {
    order: -1;
  }
}

/* Report Actions */
.report-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Error Toast */
.error-toast {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-width: 400px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  color: #dc2626;
}

.error-message {
  color: #991b1b;
  flex: 1;
  font-size: 0.875rem;
}

.close-btn {
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background-color: #fca5a5;
  border-radius: 50%;
}
</style>