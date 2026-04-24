<template>
  <div class="restocking">
    <div class="page-header">
      <div class="header-row">
        <div>
          <h2>{{ t('restocking.title') }}</h2>
          <p>{{ t('restocking.description') }}</p>
        </div>
        <div class="budget-control">
          <label class="budget-label">{{ t('restocking.budgetCeiling') }}</label>
          <div class="budget-input-wrapper">
            <span class="budget-prefix">$</span>
            <input
              v-model.number="budget"
              type="number"
              min="0"
              step="1000"
              class="budget-input"
              placeholder="No limit"
              @change="saveBudget"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Summary bar -->
    <div class="summary-bar" v-if="!loading && !error">
      <div class="summary-item">
        <span class="summary-label">{{ t('restocking.itemsToRestock') }}</span>
        <span class="summary-value">{{ recommendations.length }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">{{ t('restocking.withinBudget') }}</span>
        <span class="summary-value">{{ withinBudgetCount }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">{{ t('restocking.totalCost') }}</span>
        <span class="summary-value">{{ formatCurrency(withinBudgetCost) }}</span>
      </div>
      <div class="summary-item" v-if="budget">
        <span class="summary-label">{{ t('restocking.budgetRemaining') }}</span>
        <span class="summary-value" :class="budgetRemaining < 0 ? 'negative' : 'positive'">
          {{ formatCurrency(budgetRemaining) }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading recommendations...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="recommendations.length === 0" class="empty-state">
      <div class="empty-icon">✓</div>
      <h3>{{ t('restocking.allStocked') }}</h3>
      <p>{{ t('restocking.allStockedDesc') }}</p>
    </div>
    <div v-else class="card">
      <div class="table-container">
        <table class="restock-table">
          <thead>
            <tr>
              <th @click="sortBy('priority')" class="sortable">
                Priority <span class="sort-icon">{{ sortIcon('priority') }}</span>
              </th>
              <th @click="sortBy('sku')" class="sortable">
                SKU <span class="sort-icon">{{ sortIcon('sku') }}</span>
              </th>
              <th>Name</th>
              <th @click="sortBy('category')" class="sortable">
                Category <span class="sort-icon">{{ sortIcon('category') }}</span>
              </th>
              <th @click="sortBy('warehouse')" class="sortable">
                Warehouse <span class="sort-icon">{{ sortIcon('warehouse') }}</span>
              </th>
              <th @click="sortBy('quantity_on_hand')" class="sortable right">
                On Hand <span class="sort-icon">{{ sortIcon('quantity_on_hand') }}</span>
              </th>
              <th class="right">Reorder Pt.</th>
              <th @click="sortBy('order_quantity')" class="sortable right">
                Order Qty <span class="sort-icon">{{ sortIcon('order_quantity') }}</span>
              </th>
              <th class="right">Unit Cost</th>
              <th @click="sortBy('total_cost')" class="sortable right">
                Total Cost <span class="sort-icon">{{ sortIcon('total_cost') }}</span>
              </th>
              <th>Trend</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="rec in sortedRecommendations"
              :key="rec.id"
              :class="{ 'over-budget-row': rec.over_budget }"
            >
              <td>
                <span :class="priorityClass(rec.priority)">{{ rec.priority }}</span>
              </td>
              <td class="sku">{{ rec.sku }}</td>
              <td>{{ rec.name }}</td>
              <td>{{ rec.category }}</td>
              <td>{{ rec.warehouse }}</td>
              <td class="right">{{ rec.quantity_on_hand }}</td>
              <td class="right">{{ rec.reorder_point }}</td>
              <td class="right bold">{{ rec.order_quantity }}</td>
              <td class="right">{{ formatCurrency(rec.unit_cost) }}</td>
              <td class="right bold">
                {{ formatCurrency(rec.total_cost) }}
                <span v-if="rec.over_budget" class="over-budget-tag">over budget</span>
              </td>
              <td>
                <span :class="trendClass(rec.trend)">{{ rec.trend }}</span>
              </td>
              <td>
                <button
                  v-if="!rec.over_budget"
                  class="order-btn"
                  @click="placeOrder(rec)"
                  :disabled="orderedSkus.has(rec.sku)"
                >
                  {{ orderedSkus.has(rec.sku) ? '✓ Ordered' : 'Add to order' }}
                </button>
                <span v-else class="over-budget-text">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useFilters } from '../composables/useFilters'
import { useI18n } from '../composables/useI18n'

export default {
  name: 'Restocking',
  setup() {
    const { t } = useI18n()
    const { selectedLocation, selectedCategory, getCurrentFilters } = useFilters()

    const loading = ref(true)
    const error = ref(null)
    const recommendations = ref([])
    const budget = ref(null)
    const orderedSkus = ref(new Set())
    const sortKey = ref('priority')
    const sortDir = ref('asc')

    const priorityOrder = { critical: 0, high: 1, medium: 2 }

    const sortedRecommendations = computed(() => {
      return [...recommendations.value].sort((a, b) => {
        let aVal = a[sortKey.value]
        let bVal = b[sortKey.value]
        if (sortKey.value === 'priority') {
          aVal = priorityOrder[aVal] ?? 3
          bVal = priorityOrder[bVal] ?? 3
        }
        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()
        if (aVal < bVal) return sortDir.value === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDir.value === 'asc' ? 1 : -1
        return 0
      })
    })

    const withinBudgetCount = computed(() => recommendations.value.filter(r => !r.over_budget).length)
    const withinBudgetCost = computed(() => recommendations.value.filter(r => !r.over_budget).reduce((s, r) => s + r.total_cost, 0))
    const budgetRemaining = computed(() => budget.value ? budget.value - withinBudgetCost.value : 0)

    const loadData = async () => {
      try {
        loading.value = true
        error.value = null
        const filters = getCurrentFilters()
        const params = new URLSearchParams()
        if (filters.warehouse && filters.warehouse !== 'all') params.append('warehouse', filters.warehouse)
        if (filters.category && filters.category !== 'all') params.append('category', filters.category)
        if (budget.value) params.append('budget', budget.value)
        const qs = params.toString() ? '?' + params.toString() : ''
        const res = await fetch(`http://localhost:8001/api/restocking/recommendations${qs}`)
        recommendations.value = await res.json()
      } catch (err) {
        error.value = 'Failed to load recommendations: ' + err.message
      } finally {
        loading.value = false
      }
    }

    const saveBudget = () => {
      if (budget.value) {
        localStorage.setItem('restocking_budget', budget.value)
      } else {
        localStorage.removeItem('restocking_budget')
      }
      loadData()
    }

    const sortBy = (key) => {
      if (sortKey.value === key) {
        sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortKey.value = key
        sortDir.value = 'asc'
      }
    }

    const sortIcon = (key) => {
      if (sortKey.value !== key) return '↕'
      return sortDir.value === 'asc' ? '↑' : '↓'
    }

    const placeOrder = (rec) => {
      orderedSkus.value = new Set([...orderedSkus.value, rec.sku])
    }

    const formatCurrency = (num) =>
      '$' + Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    const priorityClass = (p) => ({
      critical: 'badge danger',
      high: 'badge warning',
      medium: 'badge info'
    }[p] || 'badge')

    const trendClass = (t) => ({
      increasing: 'trend increasing',
      stable: 'trend stable',
      decreasing: 'trend decreasing',
      unknown: 'trend unknown'
    }[t] || 'trend unknown')

    watch([selectedLocation, selectedCategory], loadData)

    onMounted(() => {
      const saved = localStorage.getItem('restocking_budget')
      if (saved) budget.value = Number(saved)
      loadData()
    })

    return {
      t,
      loading, error, recommendations, budget, orderedSkus,
      sortKey, sortDir, sortedRecommendations,
      withinBudgetCount, withinBudgetCost, budgetRemaining,
      loadData, saveBudget, sortBy, sortIcon, placeOrder,
      formatCurrency, priorityClass, trendClass
    }
  }
}
</script>

<style scoped>
.restocking { padding: 0; }

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.budget-control {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 200px;
}

.budget-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.budget-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.budget-prefix {
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-right: 1px solid #cbd5e1;
  color: #64748b;
  font-weight: 600;
}

.budget-input {
  border: none;
  outline: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  width: 100%;
  color: #0f172a;
}

.summary-bar {
  display: flex;
  gap: 2rem;
  background: white;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.summary-value.positive { color: #16a34a; }
.summary-value.negative { color: #dc2626; }

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.restock-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.restock-table th {
  background: #f8fafc;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.restock-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.restock-table th.sortable:hover { background: #f1f5f9; }

.restock-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.restock-table tr:hover { background: #f8fafc; }

.restock-table tr.over-budget-row { opacity: 0.45; }

.right { text-align: right; }
.bold { font-weight: 600; }
.sku { font-family: monospace; font-size: 0.8rem; color: #475569; }
.sort-icon { font-size: 0.7rem; color: #94a3b8; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.badge.danger  { background: #fee2e2; color: #991b1b; }
.badge.warning { background: #fef3c7; color: #92400e; }
.badge.info    { background: #dbeafe; color: #1e40af; }

.trend {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.trend.increasing { color: #dc2626; }
.trend.stable     { color: #64748b; }
.trend.decreasing { color: #16a34a; }
.trend.unknown    { color: #94a3b8; }

.order-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.order-btn:hover:not(:disabled) { background: #2563eb; }
.order-btn:disabled { background: #16a34a; cursor: default; }

.over-budget-tag {
  display: block;
  font-size: 0.7rem;
  color: #dc2626;
  font-weight: 500;
  margin-top: 2px;
}

.over-budget-text { color: #94a3b8; }

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.empty-icon {
  font-size: 3rem;
  color: #16a34a;
  margin-bottom: 1rem;
}

.empty-state h3 { color: #0f172a; margin-bottom: 0.5rem; }
.empty-state p  { color: #64748b; }

.loading { text-align: center; padding: 3rem; color: #64748b; }
.error { background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 8px; }
</style>

<style>
.dark .restocking .card { background: #1e293b; }
.dark .restocking .summary-bar { background: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
.dark .restocking .summary-label { color: #94a3b8; }
.dark .restocking .summary-value { color: #f1f5f9; }
.dark .restocking .budget-label  { color: #94a3b8; }
.dark .restocking .budget-input-wrapper { background: #0f172a; border-color: #475569; }
.dark .restocking .budget-prefix  { background: #1e293b; border-color: #475569; color: #94a3b8; }
.dark .restocking .budget-input   { background: #0f172a; color: #f1f5f9; }
.dark .restocking .restock-table th { background: #0f172a; color: #94a3b8; border-color: #334155; }
.dark .restocking .restock-table td { color: #cbd5e1; border-color: #334155; }
.dark .restocking .restock-table tr:hover { background: #334155; }
.dark .restocking .empty-state { background: #1e293b; }
.dark .restocking .empty-state h3 { color: #f1f5f9; }
.dark .restocking .empty-state p  { color: #94a3b8; }
.dark .restocking .trend.stable   { color: #94a3b8; }
</style>

<style>
.dark .restocking .sku             { color: #94a3b8 !important; }
.dark .restocking td               { color: #cbd5e1 !important; }
.dark .restocking td strong        { color: #f1f5f9 !important; }
.dark .restocking .restock-table th.sortable:hover { background: #334155 !important; }
.dark .restocking .restock-table tr:hover          { background: #334155 !important; }
.dark .restocking .over-budget-tag { color: #f87171 !important; }
.dark .restocking .over-budget-text { color: #64748b !important; }
</style>
