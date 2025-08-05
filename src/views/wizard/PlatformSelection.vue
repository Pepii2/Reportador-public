<script setup>
import { ref } from 'vue'
import { wizardStore } from '@/stores/wizardStore'

const platforms = [
  {
    id: 'facebook',
    name: 'Facebook Ads',
    description: 'Reportes de campañas de Facebook e Instagram',
    icon: '📘',
    color: '#1877f2',
    features: ['Alcance y frecuencia', 'Métricas de video', 'Engagement detallado', 'ROI por campaña']
  },
  {
    id: 'google',
    name: 'Google Ads', 
    description: 'Reportes de campañas de Google Ads y Display',
    icon: '🔍',
    color: '#4285f4',
    features: ['Búsqueda y display', 'Conversiones', 'Palabras clave', 'Audiencias']
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'Reportes de campañas de TikTok for Business',
    icon: '🎵',
    color: '#ff0050',
    features: ['Video engagement', 'Métricas de reproducción', 'Audiencias Gen Z', 'Conversiones mobile']
  }
]

const selectedPlatform = ref(wizardStore.selectedPlatform?.id || null)

const selectPlatform = (platform) => {
  selectedPlatform.value = platform.id
  wizardStore.setSelectedPlatform(platform)
}
</script>

<template>
  <div class="platform-selection">
    <div class="step-header">
      <h2>Selecciona tu Plataforma Publicitaria</h2>
      <p>Elige la plataforma desde la cual quieres generar reportes de tus campañas</p>
    </div>

    <div class="platforms-grid">
      <div 
        v-for="platform in platforms"
        :key="platform.id"
        class="platform-card"
        :class="{ 
          'card-selected': selectedPlatform === platform.id,
          'card-hover': true
        }"
        @click="selectPlatform(platform)"
      >
        <div class="platform-header">
          <div class="platform-icon" :style="{ color: platform.color }">
            {{ platform.icon }}
          </div>
          <div class="platform-info">
            <h3>{{ platform.name }}</h3>
            <p>{{ platform.description }}</p>
          </div>
          <div class="selection-indicator">
            <div 
              class="radio-button"
              :class="{ 'radio-selected': selectedPlatform === platform.id }"
            ></div>
          </div>
        </div>

        <div class="platform-features">
          <h4>Características incluidas:</h4>
          <ul>
            <li v-for="feature in platform.features" :key="feature">
              <span class="feature-check">✓</span>
              {{ feature }}
            </li>
          </ul>
        </div>

        <div class="platform-footer">
          <div class="platform-badge" :style="{ backgroundColor: platform.color }">
            Disponible
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedPlatform" class="selection-summary">
      <div class="summary-card">
        <div class="summary-content">
          <h3>✅ Plataforma Seleccionada</h3>
          <p>
            Has seleccionado <strong>{{ platforms.find(p => p.id === selectedPlatform)?.name }}</strong>
            para generar tus reportes.
          </p>
          <div class="next-step-hint">
            <span>💡</span>
            <span>A continuación podrás elegir el tipo de reporte que deseas crear.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.platform-selection {
  max-width: 900px;
  margin: 0 auto;
}

.step-header {
  text-align: center;
  margin-bottom: 3rem;
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

.platforms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.platform-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.platform-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.1);
}

.platform-card.card-selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.platform-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.platform-icon {
  font-size: 2.5rem;
  margin-right: 1rem;
  flex-shrink: 0;
}

.platform-info {
  flex: 1;
  margin-right: 1rem;
}

.platform-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.platform-info p {
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.4;
}

.selection-indicator {
  flex-shrink: 0;
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

.platform-features {
  margin-bottom: 1.5rem;
}

.platform-features h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.platform-features ul {
  list-style: none;
  padding: 0;
}

.platform-features li {
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

.platform-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.platform-badge {
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.selection-summary {
  margin-top: 2rem;
}

.summary-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #7dd3fc;
  border-radius: 1rem;
  padding: 1.5rem;
}

.summary-content h3 {
  color: #0c4a6e;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.summary-content p {
  color: #075985;
  margin-bottom: 1rem;
}

.next-step-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #0369a1;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .platforms-grid {
    grid-template-columns: 1fr;
  }
  
  .platform-header {
    flex-direction: column;
    text-align: center;
  }
  
  .platform-icon {
    margin-right: 0;
    margin-bottom: 1rem;
  }
  
  .platform-info {
    margin-right: 0;
    margin-bottom: 1rem;
  }
}
</style>