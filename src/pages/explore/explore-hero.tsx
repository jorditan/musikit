import { motion, useReducedMotion } from "motion/react";

export function ExploreHero({ compact }: { compact: boolean }) {
  const reducedMotion = useReducedMotion();
  const transition = {
    duration: reducedMotion ? 0 : 0.45,
    ease: "easeOut" as const,
  };

  return (
    <motion.section
      layout={!reducedMotion}
      transition={transition}
      className={compact ? "explore-hero compact" : "explore-hero"}
      aria-labelledby="hero-title"
    >
      <motion.div
        className="hero-kicker"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={transition}
      >
        <span>EL UNIVERSO MUSICAL, SIN LÍNEAS RECTAS.</span>
        <span>VOL. 001 / EXPLORAR</span>
      </motion.div>
      <div className="hero-composition">
        <motion.h1
          layout={!reducedMotion}
          id="hero-title"
          initial={reducedMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
        >
          TODO ESTÁ
          <br />
          <em>CONECTADO.</em>
        </motion.h1>
        {!compact && (
          <motion.div
            className="record-art"
            aria-hidden="true"
            initial={reducedMotion ? false : { opacity: 0, y: 16, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: 9 }}
            transition={{ ...transition, delay: reducedMotion ? 0 : 0.15 }}
          >
            <motion.div
              className="record-disc"
              animate={{ rotate: reducedMotion ? 0 : 360 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 45, repeat: Infinity, ease: "linear" }
              }
            >
              <span>
                MK
                <br />
                33⅓
              </span>
            </motion.div>
            <span className="record-arrow">↗</span>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
