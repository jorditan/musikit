import { motion } from "motion/react";
import { Search, GitBranch, Sparkles } from "lucide-react";
import { useDiscoveryMotion } from "./use-discovery-motion";
const steps = [
  {
    icon: Search,
    title: "Elegí un comienzo",
    description: "Buscá una canción, un solista o una banda.",
  },
  {
    icon: GitBranch,
    title: "Seguí las conexiones",
    description:
      "El próximo paso: descubrir versiones y colaboraciones documentadas.",
  },
  {
    icon: Sparkles,
    title: "Encontrá algo inesperado",
    description: "Dejá que un descubrimiento te lleve a otro.",
  },
];
export function HowItWorks() {
  const reveal = useDiscoveryMotion();
  return (
    <motion.section
      {...reveal}
      className="discovery"
      id="como-funciona"
      aria-labelledby="discovery-title"
      tabIndex={-1}
    >
      <p className="eyebrow">UN DESCUBRIMIENTO LLEVA A OTRO</p>
      <h2 id="discovery-title">Seguí el hilo.</h2>
      <div className="steps">
        {steps.map(({ icon: Icon, title, description }, index) => (
          <article key={title}>
            <span>0{index + 1} /</span>
            <Icon aria-hidden="true" />
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </motion.section>
  );
}
