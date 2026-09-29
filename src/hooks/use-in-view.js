import { useEffect, useRef, useState } from "react"

export function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        if (options.triggerOnce) {
          observer.disconnect()
        }
      } else {
        if (!options.triggerOnce) {
          setIsInView(false)
        }
      }
    }, options)

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [options.triggerOnce, options.root, options.rootMargin, options.threshold])

  return { ref, isInView }
}
