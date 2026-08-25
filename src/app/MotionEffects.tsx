"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const revealDefaults = {
  autoAlpha: 0,
  y: 34,
};

export default function MotionEffects() {
  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      return;
    }

    const context = gsap.context(() => {
      const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      heroTimeline
        .from(".site-header > *", {
          autoAlpha: 0,
          y: -14,
          duration: 0.55,
          stagger: 0.07,
          clearProps: "all",
        })
        .from(
          ".hero-copy > *",
          {
            autoAlpha: 0,
            y: 30,
            duration: 0.75,
            stagger: 0.09,
            clearProps: "all",
          },
          "-=0.2",
        )
        .from(
          ".dossier-card",
          {
            autoAlpha: 0,
            x: 34,
            scale: 0.975,
            duration: 0.9,
            clearProps: "all",
          },
          "-=0.65",
        )
        .from(
          ".trace-label",
          {
            autoAlpha: 0,
            x: -16,
            duration: 0.5,
            clearProps: "all",
          },
          "-=0.3",
        )
        .fromTo(
          ".trace-route path",
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" },
          "<",
        )
        .from(
          ".trace-step",
          {
            autoAlpha: 0,
            y: 12,
            duration: 0.45,
            stagger: 0.1,
            clearProps: "all",
          },
          "-=0.5",
        );

      gsap.utils.toArray<HTMLElement>(".section-heading").forEach((heading) => {
        gsap.from(heading.children, {
          ...revealDefaults,
          duration: 0.75,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "all",
          scrollTrigger: {
            trigger: heading,
            start: "top 88%",
            once: true,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>(".project").forEach((project) => {
        const copy = project.querySelector(".project-copy");
        const visual = project.querySelector(".project-visual");
        const timeline = gsap.timeline({
          defaults: { ease: "power3.out", clearProps: "all" },
          scrollTrigger: {
            trigger: project,
            start: "top 82%",
            once: true,
          },
        });

        if (copy) {
          timeline.from(copy, { autoAlpha: 0, y: 36, duration: 0.75 });
        }
        if (visual) {
          timeline.from(visual, { autoAlpha: 0, y: 28, scale: 0.985, duration: 0.85 }, "-=0.52");
        }
      });

      const groups = [
        ".project-pair .project-small",
        ".more-work article",
        ".capability-grid article",
        ".timeline article",
        ".about-section > *",
        ".contact-section > *",
      ];

      groups.forEach((selector) => {
        ScrollTrigger.batch(selector, {
          start: "top 90%",
          once: true,
          onEnter: (elements) => {
            gsap.from(elements, {
              ...revealDefaults,
              duration: 0.72,
              stagger: 0.1,
              ease: "power3.out",
              clearProps: "all",
            });
          },
        });
      });

      gsap.from(".skills-table", {
        autoAlpha: 0,
        y: 24,
        duration: 0.7,
        ease: "power3.out",
        clearProps: "all",
        scrollTrigger: {
          trigger: ".skills-table",
          start: "top 90%",
          once: true,
        },
      });
    });

    return () => context.revert();
  }, []);

  return null;
}
