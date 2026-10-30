import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./use-theme";
const options = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const;
export function ThemeSelector() {
  const { theme, choose } = useTheme();
  return (
    <div className="theme-selector" role="group" aria-label="Apariencia">
      {options.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="icon"
          title={label}
          aria-label={`Tema ${label.toLowerCase()}`}
          aria-pressed={theme === value}
          onClick={() => choose(value)}
        >
          <Icon aria-hidden="true" />
        </Button>
      ))}
    </div>
  );
}
