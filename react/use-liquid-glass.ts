import { useEffect, useRef, useState } from 'react'
import {
  createLiquidGlass,
  type LiquidGlassOptions,
  type LiquidGlassInstance,
} from '../core/liquid-glass'

/**
 * React hook for the liquid glass displacement effect.
 *
 * @example
 * ```tsx
 * const navRef = useRef<HTMLDivElement>(null)
 * const { isActive } = useLiquidGlass(navRef, { borderRadius: 24 })
 * return <nav ref={navRef}>...</nav>
 * ```
 */
export function useLiquidGlass(
  ref: React.RefObject<HTMLElement | null>,
  options: LiquidGlassOptions = {},
): { isActive: boolean } {
  const [isActive, setIsActive] = useState(false)
  const instanceRef = useRef<LiquidGlassInstance | null>(null)

  // Create/destroy on mount
  useEffect(() => {
    if (!ref.current) return
    const instance = createLiquidGlass(ref.current, options)
    instanceRef.current = instance
    setIsActive(instance.isActive)
    return () => {
      instance.destroy()
      instanceRef.current = null
    }
    // Only re-create if the element ref changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current])

  // Forward option updates without re-creating
  useEffect(() => {
    instanceRef.current?.update(options)
  }, [
    options.width,
    options.height,
    options.borderRadius,
    options.scale,
    options.blur,
    options.border,
    options.lightness,
    options.alpha,
    options.frost,
    options.saturation,
    options.displaceBlur,
    options.aberration?.[0],
    options.aberration?.[1],
    options.aberration?.[2],
  ])

  return { isActive }
}
