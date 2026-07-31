(() => {
  const init = () => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const revealNodes = [...document.querySelectorAll("[data-reveal]")];
    const parallaxNodes = [...document.querySelectorAll("[data-parallax]")];
    const countNodes = [...document.querySelectorAll("[data-count]")];
    const hero = document.querySelector(".hero");
    const profile = document.querySelector(".hero-profile-inner");
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

    root.classList.add("motion-ready");

    if (reducedMotion.matches) {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7%" },
    );
    revealNodes.forEach((node) => revealObserver.observe(node));

    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target;
          const target = Number(element.dataset.count || 0);
          const suffix = element.dataset.suffix || "";
          const duration = 1150;
          const started = performance.now();
          const tick = (now) => {
            const progress = clamp((now - started) / duration, 0, 1);
            element.textContent = `${Math.round(target * easeOutCubic(progress))}${suffix}`;
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          countObserver.unobserve(element);
        });
      },
      { threshold: 0.6 },
    );
    countNodes.forEach((node) => countObserver.observe(node));

    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;

    const updateMotion = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      let heroValues = null;

      if (hero && profile) {
        const heroProgress = clamp(scrollY / Math.max(hero.offsetHeight, 1), 0, 1);
        heroValues = {
          portraitX: `${pointerX * -10}px`,
          portraitY: `${pointerY * -8 + heroProgress * 34}px`,
          cardX: `${pointerX * 13}px`,
          cardY: `${pointerY * 11 - heroProgress * 28}px`,
          tiltX: `${pointerY * -1.8}deg`,
          tiltY: `${pointerX * 2.4}deg`,
          gridShift: `${scrollY * 0.09}px`,
          heroFade: `${1 - heroProgress * 0.42}`,
        };
      }

      const parallaxUpdates = parallaxNodes.map((node) => {
        if (window.innerWidth <= 800) return [node, "0px"];
        const rect = node.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > viewportHeight + 120) return null;
        const speed = Number(node.dataset.parallax || 0.08);
        const distance = rect.top + rect.height / 2 - viewportHeight / 2;
        return [node, `${clamp(distance * speed * -1, -42, 42)}px`];
      });

      if (heroValues && hero && profile) {
        profile.style.setProperty("--portrait-x", heroValues.portraitX);
        profile.style.setProperty("--portrait-y", heroValues.portraitY);
        profile.style.setProperty("--card-x", heroValues.cardX);
        profile.style.setProperty("--card-y", heroValues.cardY);
        profile.style.setProperty("--tilt-x", heroValues.tiltX);
        profile.style.setProperty("--tilt-y", heroValues.tiltY);
        hero.style.setProperty("--grid-shift", heroValues.gridShift);
        hero.style.setProperty("--hero-fade", heroValues.heroFade);
      }

      parallaxUpdates.forEach((update) => {
        if (update) update[0].style.setProperty("--parallax-y", update[1]);
      });
    };

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateMotion);
    };

    const onPointerMove = (event) => {
      if (!hero || coarsePointer.matches) return;
      const rect = hero.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientY > rect.bottom) return;
      pointerX = clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1);
      pointerY = clamp(((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2, -1, 1);
      requestUpdate();
    };

    const resetPointer = () => {
      pointerX = 0;
      pointerY = 0;
      requestUpdate();
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    hero?.addEventListener("pointermove", onPointerMove, { passive: true });
    hero?.addEventListener("pointerleave", resetPointer);
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => requestAnimationFrame(updateMotion), { timeout: 700 });
    } else {
      requestAnimationFrame(updateMotion);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
