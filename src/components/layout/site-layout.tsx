import type { ReactNode } from "react";
import { AudioLines } from "lucide-react";
import { ThemeSelector } from "@/components/theme-selector/theme-selector";
export function SiteLayout({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "site-shell site-shell-compact" : "site-shell"}>
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
        <span className="footer-sources">
          <a href="https://musicbrainz.org/" target="_blank" rel="noreferrer">
            MusicBrainz ↗
          </a>
          <a
            href="https://www.theaudiodb.com/"
            target="_blank"
            rel="noreferrer"
          >
            TheAudioDB ↗
          </a>
          <a
            href="https://coverartarchive.org/"
            target="_blank"
            rel="noreferrer"
          >
            Cover Art Archive ↗
          </a>
        </span>
      </footer>
    </div>
  );
}
