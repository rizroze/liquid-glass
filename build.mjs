import { build } from 'esbuild'
import { writeFileSync, readFileSync } from 'fs'

// Build vanilla JS core
await build({
  entryPoints: ['core/liquid-glass.ts'],
  outfile: 'core/liquid-glass.js',
  format: 'esm',
  target: 'es2022',
  bundle: false,
  minify: false, // Keep readable — this is copy-paste code
  sourcemap: false,
})

console.log('✓ core/liquid-glass.js')

// Generate .d.ts from the TS source (simple extraction)
// For a real build, use tsc --declaration. This is a quick standalone version.
const tsSource = readFileSync('core/liquid-glass.ts', 'utf-8')

// Extract exported interfaces and the main function signature
const dtsContent = `/**
 * Liquid Glass — Real optical refraction for the web.
 * @see https://github.com/rizzytoday/liquid-glass
 * @license MIT
 */

export interface LiquidGlassOptions {
  width?: number
  height?: number
  borderRadius?: number
  scale?: number
  aberration?: [number, number, number]
  blur?: number
  border?: number
  lightness?: number
  alpha?: number
  frost?: number
  saturation?: number
  displaceBlur?: number
  filterId?: string
  fallbackFilter?: string
}

export interface LiquidGlassInstance {
  update(options: Partial<LiquidGlassOptions>): void
  destroy(): void
  filterElement: SVGSVGElement
  isActive: boolean
}

export declare const isChromium: boolean

export declare function createLiquidGlass(
  element: HTMLElement,
  options?: LiquidGlassOptions,
): LiquidGlassInstance
`

writeFileSync('core/liquid-glass.d.ts', dtsContent)
console.log('✓ core/liquid-glass.d.ts')
