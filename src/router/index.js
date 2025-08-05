import { createRouter, createWebHistory } from 'vue-router'
import WizardLayout from '@/components/WizardLayout.vue'
import TeamSelection from '@/components/wizard/TeamSelection.vue'
import PlatformSelection from '@/views/wizard/PlatformSelection.vue'
import ReportTypeSelection from '@/views/wizard/ReportTypeSelection.vue'
import AdAccountSelection from '@/views/wizard/AdAccountSelection.vue'
import CampaignSelection from '@/views/wizard/CampaignSelection.vue'
import DateMetricsConfiguration from '@/views/wizard/DateMetricsConfiguration.vue'
import DataInspector from '@/views/DataInspector.vue'
import ReportView from '@/views/ReportView.vue'

const routes = [
  {
    path: '/',
    redirect: '/wizard/team'
  },
  {
    path: '/wizard',
    component: WizardLayout,
    children: [
      {
        path: 'team',
        name: 'TeamSelection',
        component: TeamSelection,
        meta: { step: 0, title: 'Selección de Equipo' }
      },
      {
        path: 'platform',
        name: 'PlatformSelection',
        component: PlatformSelection,
        meta: { step: 1, title: 'Selección de Plataforma' }
      },
      {
        path: 'report-type',
        name: 'ReportTypeSelection', 
        component: ReportTypeSelection,
        meta: { step: 2, title: 'Tipo de Reporte' }
      },
      {
        path: 'ad-accounts',
        name: 'AdAccountSelection',
        component: AdAccountSelection,
        meta: { step: 3, title: 'Selección de Ad Accounts' }
      },
      {
        path: 'campaigns',
        name: 'CampaignSelection',
        component: CampaignSelection,
        meta: { step: 4, title: 'Selección de Campañas' }
      },
      {
        path: 'ad-sets',
        redirect: '/wizard/configuration'
      },
      {
        path: 'configuration',
        name: 'DateMetricsConfiguration',
        component: DateMetricsConfiguration,
        meta: { step: 6, title: 'Configuración de Fechas y Métricas' }
      }
    ]
  },
  {
    path: '/data-inspector',
    name: 'DataInspector',
    component: DataInspector,
    meta: { title: 'BigQuery Data Inspector' }
  },
  {
    path: '/report',
    name: 'ReportView',
    component: ReportView,
    meta: { title: 'Reporte de Marketing Digital' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard to ensure steps are completed in order
router.beforeEach((to, from, next) => {
  // Only check wizard routes
  if (!to.path.startsWith('/wizard')) {
    next()
    return
  }

  // Import wizardStore here to avoid circular dependency
  import('@/stores/wizardStore').then(({ wizardStore }) => {
    const currentStep = to.meta?.step
    
    // Check if user can access this step
    if (currentStep !== undefined && currentStep > 0) {
      // Check previous steps are completed
      if (currentStep === 1 && !wizardStore.selectedTeam) {
        console.warn('Redirecting to team selection - no team selected')
        next('/wizard/team')
        return
      }
      if (currentStep === 2 && !wizardStore.selectedPlatform) {
        console.warn('Redirecting to platform selection - no platform selected')
        next('/wizard/platform')
        return
      }
      if (currentStep === 3 && !wizardStore.reportType) {
        console.warn('Redirecting to report type - no report type selected')
        next('/wizard/report-type')
        return
      }
      if (currentStep === 4 && wizardStore.selectedAdAccounts.length === 0) {
        console.warn('Redirecting to ad accounts - no accounts selected')
        next('/wizard/ad-accounts')
        return
      }
      if (currentStep === 6 && wizardStore.selectedCampaigns.length === 0) {
        console.warn('Redirecting to campaigns - no campaigns selected')
        next('/wizard/campaigns')
        return
      }
    }
    
    next()
  })
})

export default router