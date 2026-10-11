import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sprite } from "@/components/Sprite";
import { compactProjects, fullProjects } from "@/content/projects";
import MotionRuntime from "@/motion/MotionRuntime";
import { compactScenes, fullScenes } from "@/scenes";
import { cssVars } from "@/scenes/grid";

// Fully static (spec §14): without SCENE_LAB=1 there are no params, so every path 404s and no function is made.
export const dynamicParams = false;
export const metadata: Metadata = { robots: { index: false, follow: false } };

const WIDTHS = [820, 600, 358];

function labIds(): string[] {
  return [...fullProjects, ...compactProjects].map((p) => p.slug);
}

export function generateStaticParams() {
  return process.env.SCENE_LAB === "1" ? labIds().map((id) => ({ id })) : [];
}

export default async function SceneLab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const full = fullProjects.find((p) => p.slug === id);
  const compact = compactProjects.find((p) => p.slug === id);
  if (!full && !compact) notFound();
  const render = () => {
    if (full) {
      const Scene = fullScenes[full.slug];
      return <Scene project={full} />;
    }
    const Scene = compactScenes[compact!.slug];
    return <Scene project={compact!} />;
  };
  return (
    <main className="lab" style={cssVars({ "--tint": `var(--color-tint-${id})` })}>
      <Sprite />
      {WIDTHS.map((w) => (
        <div key={w} className="lab-frame" style={{ width: w }}>
          {render()}
        </div>
      ))}
      <MotionRuntime />
    </main>
  );
}
