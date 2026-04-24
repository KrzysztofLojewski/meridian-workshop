<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="close">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ t('profileDetails.title') }}</h3>
            <button class="close-button" @click="close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="profile-section">
              <div class="avatar-section">
                <div class="avatar-xl">
                  {{ getInitials(currentUser.name) }}
                </div>
                <h4 class="profile-name">{{ currentUser.name }}</h4>
                <p class="profile-job-title">{{ currentUser.jobTitle }}</p>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">{{ t('profileDetails.email') }}</div>
                  <div class="info-value">{{ currentUser.email }}</div>
                </div>

                <div class="info-item">
                  <div class="info-label">{{ t('profileDetails.department') }}</div>
                  <div class="info-value">{{ currentUser.department }}</div>
                </div>

                <div class="info-item">
                  <div class="info-label">{{ t('profileDetails.location') }}</div>
                  <div class="info-value">{{ currentUser.location }}</div>
                </div>

                <div class="info-item">
                  <div class="info-label">{{ t('profileDetails.phone') }}</div>
                  <div class="info-value">{{ currentUser.phone }}</div>
                </div>

                <div class="info-item">
                  <div class="info-label">{{ t('profileDetails.joinDate') }}</div>
                  <div class="info-value">{{ formatDate(currentUser.joinDate) }}</div>
                </div>

                <div class="info-item">
                  <div class="info-label">{{ t('profileDetails.employeeId') }}</div>
                  <div class="info-value">CC-{{ currentUser.id.toString().padStart(5, '0') }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="close">{{ t('profileDetails.close') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useAuth } from '../composables/useAuth'
import { useI18n } from '../composables/useI18n'

const { currentUser, getInitials } = useAuth()
const { t, currentLocale } = useI18n()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const locale = currentLocale.value === 'ja' ? 'ja-JP' : 'en-US'
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
}

.close-button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.close-button:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.profile-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.avatar-xl {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 2rem;
  letter-spacing: 0.025em;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.profile-job-title {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.813rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.info-value {
  font-size: 0.938rem;
  color: #0f172a;
  font-weight: 500;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-secondary:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

/* Modal transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}
</style>

<style>
.dark .modal-overlay { background: rgba(0,0,0,0.7); }
.dark .modal-content, .dark .modal-panel { background: #1e293b !important; border-color: #334155; }
.dark .modal-header  { border-bottom-color: #334155; }
.dark .modal-footer  { border-top-color: #334155; }
.dark .modal-title, .dark .modal-header h2, .dark .modal-header h3 { color: #f1f5f9 !important; }
.dark .modal-body label, .dark .detail-label { color: #94a3b8 !important; }
.dark .modal-body p, .dark .detail-value, .dark .modal-body span { color: #cbd5e1 !important; }
.dark .info-row, .dark .detail-row { border-bottom-color: #334155 !important; }
.dark .info-value, .dark .field-value { color: #f1f5f9 !important; background: #0f172a !important; }
.dark .modal-body input, .dark .modal-body select, .dark .modal-body textarea {
  background: #0f172a !important; color: #f1f5f9 !important; border-color: #475569 !important;
}
.dark .modal-body input::placeholder { color: #64748b !important; }
.dark .task-item { background: #0f172a !important; border-color: #334155 !important; }
.dark .task-title { color: #f1f5f9 !important; }
.dark .task-meta  { color: #94a3b8 !important; }
.dark .empty-tasks { color: #94a3b8 !important; }
.dark .section-heading { color: #94a3b8 !important; border-bottom-color: #334155 !important; }
</style>

<style>
.dark .modal-backdrop               { background: rgba(0,0,0,0.75) !important; }
.dark .modal-panel, .dark .modal-box { background: #1e293b !important; }
.dark .modal-header                 { background: #1e293b !important; border-bottom-color: #334155 !important; }
.dark .modal-header h2,
.dark .modal-header h3              { color: #f1f5f9 !important; }
.dark .detail-section               { border-bottom-color: #334155 !important; }
.dark .detail-section h4            { color: #94a3b8 !important; }
.dark .detail-row                   { border-bottom-color: #334155 !important; }
.dark .detail-label                 { color: #94a3b8 !important; }
.dark .detail-value                 { color: #f1f5f9 !important; }
.dark .info-grid .info-item         { background: #0f172a !important; }
.dark .info-item-label              { color: #94a3b8 !important; }
.dark .info-item-value              { color: #f1f5f9 !important; }
.dark .close-btn                    { color: #94a3b8 !important; }
.dark .close-btn:hover              { background: #334155 !important; color: #f1f5f9 !important; }
.dark .modal-footer                 { border-top-color: #334155 !important; background: #1e293b !important; }
</style>

<style>
.tui .modal-backdrop, .tui .modal-overlay { background: rgba(0,0,0,0.9) !important; }
.tui .modal-content, .tui .modal-panel, .tui .modal-box { background: #000000 !important; border: 1px solid #00ff41 !important; border-radius: 0 !important; }
.tui .modal-header  { background: #000000 !important; border-bottom-color: #00ff41 !important; }
.tui .modal-footer  { background: #000000 !important; border-top-color: #00ff41 !important; }
.tui .modal-header h2, .tui .modal-header h3, .tui .modal-title { color: #00ff41 !important; }
.tui .detail-section { border-bottom-color: #00ff41 !important; }
.tui .detail-section h4 { color: #00aa2a !important; }
.tui .detail-row    { border-bottom-color: #00ff41 !important; }
.tui .detail-label, .tui .modal-body label { color: #00aa2a !important; }
.tui .detail-value, .tui .modal-body p, .tui .modal-body span { color: #00ff41 !important; }
.tui .info-grid .info-item { background: #000000 !important; border: 1px solid #00ff41 !important; border-radius: 0 !important; }
.tui .info-item-label { color: #00aa2a !important; }
.tui .info-item-value { color: #00ff41 !important; }
.tui .info-value, .tui .field-value { color: #00ff41 !important; background: #000000 !important; border-color: #00ff41 !important; border-radius: 0 !important; }
.tui .close-btn, .tui .modal-close-btn { color: #00aa2a !important; border-radius: 0 !important; }
.tui .close-btn:hover, .tui .modal-close-btn:hover { background: #00ff41 !important; color: #000000 !important; }
.tui .modal-body input, .tui .modal-body select, .tui .modal-body textarea {
  background: #000000 !important; color: #00ff41 !important; border-color: #00ff41 !important; border-radius: 0 !important;
}
.tui .modal-body input::placeholder { color: #00aa2a !important; }
.tui .section-heading { color: #00aa2a !important; border-bottom-color: #00ff41 !important; }
</style>