import { useEffect, useState } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

/**
 * PageTransition — wraps lazy-loaded pages with a smooth fade-in animation.
 * Respects prefers-reduced-motion automatically via the animate-fade-in CSS class.
 *
 * Usage:
 * ```tsx
 * <PageTransition>
 *   <MyPage />
 * </PageTransition>
 * ```
 */
export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Small delay to ensure DOM is ready, then trigger animation
    const timer = requestAnimationFrame(() => {
      setVisible(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <div
      className={`${className} ${visible ? 'animate-fade-in' : 'opacity-0'}`}
    >
      {children}
    </div>
  )
}
