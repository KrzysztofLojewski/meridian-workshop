<template>
  <div class="app" :class="{ dark: isDark, tui: isTui }">
    <header class="top-nav">
      <div class="nav-container">
        <div class="logo">
          <h1>{{ t('nav.companyName') }}</h1>
          <span class="subtitle">{{ t('nav.subtitle') }}</span>
        </div>
        <nav class="nav-tabs">
          <router-link to="/" :class="{ active: $route.path === '/' }">
            {{ t('nav.overview') }}
          </router-link>
          <router-link to="/inventory" :class="{ active: $route.path === '/inventory' }">
            {{ t('nav.inventory') }}
          </router-link>
          <router-link to="/orders" :class="{ active: $route.path === '/orders' }">
            {{ t('nav.orders') }}
          </router-link>
          <router-link to="/spending" :class="{ active: $route.path === '/spending' }">
            {{ t('nav.finance') }}
          </router-link>
          <router-link to="/demand" :class="{ active: $route.path === '/demand' }">
            {{ t('nav.demandForecast') }}
          </router-link>
          <router-link to="/reports" :class="{ active: $route.path === '/reports' }">
            {{ t('nav.reports') }}
          </router-link>
          <router-link to="/restocking" :class="{ active: $route.path === '/restocking' }">
            {{ t('nav.restocking') }}
          </router-link>
        </nav>
        <LanguageSwitcher />
        <button v-if="!isTui" class="dark-toggle" @click="toggleDark" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
        <button class="tui-toggle" @click="toggleTui" :title="isTui ? 'Disable TUI mode' : 'Enable TUI mode'">
          {{ isTui ? '[X]' : '>_' }}
        </button>
        <ProfileMenu
          @show-profile-details="showProfileDetails = true"
          @show-tasks="showTasks = true"
        />
      </div>
    </header>
    <FilterBar />
    <main class="main-content">
      <router-view />
    </main>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import { useTheme } from './composables/useTheme'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    const isDark = ref(localStorage.getItem('dark_mode') === 'true' || localStorage.getItem('tui_mode') === 'true')
    const toggleDark = () => {
      isDark.value = !isDark.value
      localStorage.setItem('dark_mode', isDark.value)
    }

    const { isTui } = useTheme()
    const toggleTui = () => {
      isTui.value = !isTui.value
      localStorage.setItem('tui_mode', isTui.value)
      // TUI uses dark colours as its base — force dark on when entering TUI
      if (isTui.value && !isDark.value) {
        isDark.value = true
        localStorage.setItem('dark_mode', 'true')
      }
    }

    // Teleported modals sit outside the .app div, so apply theme classes to body too
    const syncBodyClasses = () => {
      document.body.classList.toggle('dark', isDark.value)
      document.body.classList.toggle('tui', isTui.value)
    }
    watch([isDark, isTui], syncBodyClasses)
    onMounted(() => { loadTasks(); syncBodyClasses() })

    return {
      t,
      isDark,
      toggleDark,
      isTui,
      toggleTui,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask
    }
  }
}
</script>

<style>
:root {
  --bg-page: #f8fafc;
  --bg-surface: #ffffff;
  --bg-surface-alt: #f8fafc;
  --bg-hover: #f1f5f9;
  --border: #e2e8f0;
  --border-strong: #cbd5e1;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-body: #334155;
  --text-muted: #475569;
  --nav-active-bg: #eff6ff;
  --nav-active-color: #2563eb;
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.dark {
  --bg-page: #0f172a;
  --bg-surface: #1e293b;
  --bg-surface-alt: #0f172a;
  --bg-hover: #334155;
  --border: #334155;
  --border-strong: #475569;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-body: #cbd5e1;
  --text-muted: #94a3b8;
  --nav-active-bg: #1e3a5f;
  --nav-active-color: #60a5fa;
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tui {
  --bg-page: #000000;
  --bg-surface: #000000;
  --bg-surface-alt: #000000;
  --bg-hover: #001a00;
  --border: #00ff41;
  --border-strong: #00ff41;
  --text-primary: #00ff41;
  --text-secondary: #00aa2a;
  --text-body: #00ff41;
  --text-muted: #00aa2a;
  --nav-active-bg: #00ff41;
  --nav-active-color: #000000;
  --shadow-sm: none;
  --shadow-md: none;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--bg-page);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-primary);
}

.top-nav {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 0 2rem;
  height: 70px;
}

.nav-container > .nav-tabs {
  margin-left: auto;
  margin-right: 1rem;
}

.nav-container > .language-switcher {
  margin-right: 1rem;
}

.logo {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.logo h1 {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.025em;
}

.subtitle {
  font-size: 0.813rem;
  color: var(--text-secondary);
  font-weight: 400;
  padding-left: 0.75rem;
  border-left: 1px solid var(--border);
}

.nav-tabs {
  display: flex;
  gap: 0.25rem;
}

.nav-tabs a {
  padding: 0.625rem 1.25rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.938rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-tabs a:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.nav-tabs a.active {
  color: var(--nav-active-color);
  background: var(--nav-active-bg);
}

.nav-tabs a.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--nav-active-color);
}

.main-content {
  flex: 1;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 2rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.375rem;
  letter-spacing: -0.025em;
}

.page-header p {
  color: var(--text-secondary);
  font-size: 0.938rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--bg-surface);
  padding: 1.25rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.625rem;
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.025em;
}

.stat-card.warning .stat-value {
  color: #ea580c;
}

.stat-card.success .stat-value {
  color: #059669;
}

.stat-card.danger .stat-value {
  color: #dc2626;
}

.stat-card.info .stat-value {
  color: #2563eb;
}

.card {
  background: var(--bg-surface);
  border-radius: 10px;
  padding: 1.25rem;
  border: 1px solid var(--border);
  margin-bottom: 1.25rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--border);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.025em;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: var(--bg-surface-alt);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--border);
  color: var(--text-body);
  font-size: 0.875rem;
}

tbody tr {
  transition: background-color 0.15s ease;
}

tbody tr:hover {
  background: var(--bg-hover);
}

.badge {
  display: inline-block;
  padding: 0.313rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge.success {
  background: #d1fae5;
  color: #065f46;
}

.badge.warning {
  background: #fed7aa;
  color: #92400e;
}

.badge.danger {
  background: #fecaca;
  color: #991b1b;
}

.badge.info {
  background: #dbeafe;
  color: #1e40af;
}

.badge.increasing {
  background: #d1fae5;
  color: #065f46;
}

.badge.decreasing {
  background: #fecaca;
  color: #991b1b;
}

.badge.stable {
  background: #e0e7ff;
  color: #3730a3;
}

.badge.high {
  background: #fecaca;
  color: #991b1b;
}

.badge.medium {
  background: #fed7aa;
  color: #92400e;
}

.badge.low {
  background: #dbeafe;
  color: #1e40af;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  font-size: 0.938rem;
}

.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-size: 0.938rem;
}

.dark-toggle {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 1rem;
  cursor: pointer;
  margin-right: 0.5rem;
  transition: background 0.2s;
}

.dark-toggle:hover {
  background: var(--bg-hover);
}

.tui-toggle {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 0.875rem;
  font-family: 'Courier New', Courier, monospace;
  cursor: pointer;
  margin-right: 0.5rem;
  transition: background 0.2s;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.tui-toggle:hover {
  background: var(--bg-hover);
}
</style>

<style>
/* ── TUI structural overrides ─────────────────────────────── */
.tui, .tui * { font-family: 'Courier New', Courier, monospace !important; }

/* Nav */
.tui .top-nav    { background: #000000 !important; border-bottom: 1px solid #00ff41 !important; box-shadow: none !important; }
.tui .logo h1    { color: #00ff41 !important; }
.tui .subtitle   { color: #00aa2a !important; border-left-color: #00ff41 !important; }
.tui .nav-tabs a { border-radius: 0 !important; color: #00aa2a !important; }
.tui .nav-tabs a:hover  { background: #001a00 !important; color: #00ff41 !important; }
.tui .nav-tabs a.active { background: #00ff41 !important; color: #000000 !important; border-radius: 0 !important; }
.tui .nav-tabs a.active::after { display: none !important; }
.tui .dark-toggle { border-radius: 0 !important; border-color: #00ff41 !important; color: #00ff41 !important; }
.tui .dark-toggle:hover { background: #001a00 !important; }
.tui .tui-toggle  { border-radius: 0 !important; border-color: #00ff41 !important; color: #00ff41 !important; background: #000000 !important; }
.tui .tui-toggle:hover  { background: #00ff41 !important; color: #000000 !important; }

/* Cards */
.tui .card       { background: #000000 !important; border: 1px solid #00ff41 !important; border-radius: 0 !important; box-shadow: none !important; }
.tui .card-header { border-bottom-color: #00ff41 !important; }
.tui .card-title  { color: #00ff41 !important; }

/* Stat cards */
.tui .stat-card  { background: #000000 !important; border: 1px solid #00ff41 !important; border-radius: 0 !important; box-shadow: none !important; }
.tui .stat-card:hover { box-shadow: none !important; border-color: #00ff41 !important; }
.tui .stat-label { color: #00aa2a !important; }
.tui .stat-value,
.tui .stat-card.warning .stat-value,
.tui .stat-card.success .stat-value,
.tui .stat-card.danger .stat-value,
.tui .stat-card.info .stat-value { color: #00ff41 !important; }

/* Tables */
.tui thead       { background: #000000 !important; border-color: #00ff41 !important; }
.tui th          { color: #00aa2a !important; }
.tui td          { color: #00ff41 !important; border-color: #00ff41 !important; }
.tui tbody tr:hover { background: #001a00 !important; }

/* Badges */
.tui .badge      { background: #000000 !important; color: #00ff41 !important; border: 1px solid #00ff41 !important; border-radius: 0 !important; }

/* Page headers */
.tui .page-header h2 { color: #00ff41 !important; }
.tui .page-header p  { color: #00aa2a !important; }

/* Loading / error */
.tui .loading { color: #00aa2a !important; }
.tui .error   { background: #000000 !important; border-color: #00ff41 !important; color: #00ff41 !important; }

/* Native browser tooltips (title=) — can't be styled, but custom tooltip elements */
.tui [data-tooltip]::after,
.tui .tooltip,
.tui .chart-tooltip,
.tui .hover-label {
  background: #000000 !important;
  color: #00ff41 !important;
  border: 1px solid #00ff41 !important;
  border-radius: 0 !important;
  font-family: 'Courier New', Courier, monospace !important;
  box-shadow: none !important;
}

/* Bar chart track fills */
.tui .kpi-progress-bar  { background: #001a00 !important; }
.tui .kpi-progress      { background: #00ff41 !important; border-radius: 0 !important; }
.tui .kpi-progress.success { background: #00ff41 !important; }
</style>
