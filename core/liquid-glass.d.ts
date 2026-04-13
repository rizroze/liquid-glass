/**
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
