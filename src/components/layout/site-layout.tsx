import type { ReactNode } from "react";
import { AudioLines } from "lucide-react";
import { ThemeSelector } from "@/components/theme-selector/theme-selector";
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        Ir al contenido
      </a>
      <header className="site-header">
        <a className="wordmark" href="#">
          <AudioLines aria-hidden="true" />
          MusiKit
        </a>
        <ThemeSelector />
      </header>
      <main id="main">{children}</main>
      <footer>
        <span>MusiKit · Seguí tu curiosidad.</span>
        <a href="https://musicbrainz.org/" target="_blank" rel="noreferrer">
          Datos de MusicBrainz ↗
        </a>
      </footer>
    </div>
  );
}
