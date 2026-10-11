import { site } from "@/content/site";
import type { Project } from "@/content/types";
import { ExtLink } from "./ExtLink";
import { Icon } from "./Icon";

export function ProjectLinks({ project }: { project: Project }) {
  if (project.status === "private-client") return <p className="link-row note">{site.labels.privateClient}</p>;
  if (project.status === "private-product") return <p className="link-row note">{site.labels.privateProduct}</p>;
  if (project.links.length === 0) return null;
  return (
    <div className="link-row">
      {project.links.map((link) => {
        const body = (
          <>
            {link.label}
            <Icon name={link.kind === "download" ? "download" : "arrow-up-right"} />
          </>
        );
        return link.href.startsWith("/") ? (
          <a key={link.href} href={link.href} className="text-link">
            {body}
          </a>
        ) : (
          <ExtLink key={link.href} href={link.href} className="text-link">
            {body}
          </ExtLink>
        );
      })}
    </div>
  );
}
