import { ref } from 'vue'

const isTui = ref(localStorage.getItem('tui_mode') === 'true')

export function useTheme() {
  return { isTui }
}
