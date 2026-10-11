import { site } from "@/content/site";
import { ExtLink } from "./ExtLink";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-row">
        <p>{site.labels.footer}</p>
        <div className="footer-links">
          {site.socials.map((s) => (
            <ExtLink key={s.href} href={s.href}>
              {s.label}
            </ExtLink>
          ))}
          <a href="#top">{site.labels.backToTop}</a>
        </div>
      </div>
    </footer>
  );
}
