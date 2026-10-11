import { site } from "@/content/site";
import { Icon } from "./Icon";

// The mobile menu is a native popover: toggling, Escape and light dismiss need no React state.
// The motion engine closes it after a link tap (Task 1.5).
export function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav-bar">
        <a className="wordmark" href="#top">
          {site.name}
        </a>
        <nav id="nav-menu" className="nav-menu" popover="auto" aria-label={site.labels.primaryNav}>
          {site.nav.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a className="btn btn-primary btn-sm" href={`mailto:${site.email}`}>
          {site.labels.email}
        </a>
        <button className="nav-toggle" type="button" popoverTarget="nav-menu" aria-label={site.labels.openMenu}>
          <Icon name="list" />
        </button>
      </div>
    </header>
  );
}
