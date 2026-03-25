import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface FadeInProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function FadeIn({ children, delay = 0, className = "" }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function SlideIn({ children, delay = 0, direction = "left", className = "" }: FadeInProps & { direction?: "left" | "right" | "up" | "down" }) {
  const getInitialY = () => {
    if (direction === "up") return 20;
    if (direction === "down") return -20;
    return 0;
  }
  
  const getInitialX = () => {
    if (direction === "left") return -20;
    if (direction === "right") return 20;
    return 0;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: getInitialX(), y: getInitialY() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "circOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
