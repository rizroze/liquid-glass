import { createLiquidGlass, isChromium } from '../core/liquid-glass'
import type { LiquidGlassOptions } from '../core/liquid-glass'

// ---- Defaults ----

const DEFAULTS: Required<
  Pick<
    LiquidGlassOptions,
    | 'scale'
    | 'borderRadius'
    | 'blur'
    | 'border'
    | 'lightness'
    | 'alpha'
    | 'frost'
    | 'saturation'
    | 'width'
    | 'height'
  >
> & { aberR: number; aberG: number; aberB: number } = {
  scale: -180,
  borderRadius: 50,
  blur: 11,
  border: 0.07,
  lightness: 50,
  alpha: 0.93,
  frost: 0,
  saturation: 1,
  width: 400,
  height: 80,
  aberR: 0,
  aberG: 10,
  aberB: 20,
}

// ---- Elements ----

const glassEl = document.getElementById('glass') as HTMLElement
const configBody = document.getElementById('config-body') as HTMLElement
const configPanel = document.getElementById('config') as HTMLElement
const toggleBtn = document.getElementById('toggle-panel') as HTMLButtonElement
const resetBtn = document.getElementById('reset') as HTMLButtonElement
const browserNotice = document.getElementById('browser-notice') as HTMLElement

// ---- Browser notice ----

if (!isChromium) {
  browserNotice.style.display = 'block'
}

// ---- Init glass ----

const glass = createLiquidGlass(glassEl, {
  width: DEFAULTS.width,
  height: DEFAULTS.height,
  borderRadius: DEFAULTS.borderRadius,
  scale: DEFAULTS.scale,
  aberration: [DEFAULTS.aberR, DEFAULTS.aberG, DEFAULTS.aberB],
  blur: DEFAULTS.blur,
  border: DEFAULTS.border,
  lightness: DEFAULTS.lightness,
  alpha: DEFAULTS.alpha,
  frost: DEFAULTS.frost,
  saturation: DEFAULTS.saturation,
})

// ---- Config panel toggle ----

function togglePanel() {
  configPanel.classList.toggle('collapsed')
}

toggleBtn.addEventListener('click', togglePanel)
document.querySelector('.config-header')!.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('.config-toggle')) return
  togglePanel()
})

// ---- Advanced toggle ----

const advancedToggle = document.getElementById('toggle-advanced') as HTMLButtonElement
const advancedBody = document.getElementById('advanced-body') as HTMLElement

advancedToggle.addEventListener('click', () => {
  const isOpen = advancedBody.classList.toggle('open')
  advancedToggle.classList.toggle('open', isOpen)
  advancedToggle.textContent = isOpen ? 'Advanced \u2212' : 'Advanced'
})

// ---- Sliders ----

type SliderKey = keyof typeof DEFAULTS

const sliders: { key: SliderKey; input: HTMLInputElement; display: HTMLElement }[] = []

for (const key of Object.keys(DEFAULTS) as SliderKey[]) {
  const input = document.getElementById(`opt-${key}`) as HTMLInputElement | null
  const display = document.getElementById(`val-${key}`) as HTMLElement | null
  if (input && display) {
    sliders.push({ key, input, display })
  }
}

function readSliders(): LiquidGlassOptions & { width: number; height: number } {
  const vals: Record<string, number> = {}
  for (const s of sliders) {
    vals[s.key] = parseFloat(s.input.value)
  }
  return {
    scale: vals.scale,
    borderRadius: vals.borderRadius,
    blur: vals.blur,
    border: vals.border,
    lightness: vals.lightness,
    alpha: vals.alpha,
    frost: vals.frost,
    saturation: vals.saturation,
    width: vals.width,
    height: vals.height,
    aberration: [vals.aberR ?? 0, vals.aberG ?? 10, vals.aberB ?? 20],
  }
}

function syncDisplays() {
  for (const s of sliders) {
    s.display.textContent = s.input.value
  }
}

function applySliders() {
  syncDisplays()
  const opts = readSliders()
  // Resize the element itself
  glassEl.style.width = `${opts.width}px`
  glassEl.style.height = `${opts.height}px`
  glassEl.style.borderRadius = `${opts.borderRadius}px`
  glass.update(opts)
}

for (const s of sliders) {
  s.input.addEventListener('input', applySliders)
}

// ---- Reset ----

resetBtn.addEventListener('click', () => {
  for (const s of sliders) {
    s.input.value = String(DEFAULTS[s.key])
  }
  applySliders()
})

// ---- Drag ----

let isDragging = false
let dragOffsetX = 0
let dragOffsetY = 0

glassEl.addEventListener('pointerdown', (e) => {
  isDragging = true
  const rect = glassEl.getBoundingClientRect()
  dragOffsetX = e.clientX - rect.left - rect.width / 2
  dragOffsetY = e.clientY - rect.top - rect.height / 2
  glassEl.setPointerCapture(e.pointerId)
  glassEl.style.cursor = 'grabbing'
})

window.addEventListener('pointermove', (e) => {
  if (!isDragging) return
  const x = e.clientX - dragOffsetX
  const y = e.clientY - dragOffsetY
  glassEl.style.left = `${x}px`
  glassEl.style.top = `${y}px`
  glassEl.style.transform = 'translate(-50%, -50%)'
})

window.addEventListener('pointerup', () => {
  if (!isDragging) return
  isDragging = false
  glassEl.style.cursor = 'grab'
})

// ---- Copy button ----

const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement
const codeText = document.querySelector('.code-snippet code')!.textContent ?? ''

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(codeText).then(() => {
    copyBtn.textContent = 'Copied'
    copyBtn.classList.add('copied')
    setTimeout(() => {
      copyBtn.textContent = 'Copy'
      copyBtn.classList.remove('copied')
    }, 2000)
  })
})

// ---- Initial sync ----
syncDisplays()
