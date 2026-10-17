import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: ReactNode;
  /** Seconds to wait before animating (use index * 0.07 to stagger a row of cards). */
  delay?: number;
  /** How far the content travels up while fading in, in px. */
  y?: number;
  className?: string;
}

/**
 * Fades and lifts its children into place the first time they scroll into view.
 * Only opacity and transform are animated. Does nothing for people who prefer reduced motion.
 */
const Reveal = ({ children, delay = 0, y = 24, className }: RevealProps) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
