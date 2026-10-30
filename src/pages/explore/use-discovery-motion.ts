import { useReducedMotion } from "motion/react";
export function useDiscoveryMotion() {
  const reduced = useReducedMotion();
  return {
    initial: reduced ? (false as const) : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: reduced ? 0 : 0.45 },
  };
}
