/* Génie Civil Pro — interactions et calculs */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = "http://www.w3.org/2000/svg";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svgEl = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  const fmt = (n, d = 1) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------------- Nav, progress, menu ---------------- */
  const nav = $(".nav");
  const bar = $(".progress span");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    nav.classList.toggle("hide", y > lastY && y > 300 && !$(".nav-links").classList.contains("open"));
    lastY = y;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const burger = $(".burger");
  const links = $(".nav-links");
  burger.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  $$(".nav-links a").forEach(a => a.addEventListener("click", () => {
    links.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }));
  $("#year").textContent = new Date().getFullYear();

  /* ---------------- Reveal + counters ---------------- */
  const countUp = el => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    if (reduce) { el.textContent = target.toLocaleString("fr-FR") + suffix; return; }
    const t0 = performance.now();
    const dur = 1600;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * e).toLocaleString("fr-FR") + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      $$("[data-count]", en.target).forEach(countUp);
      if (en.target.matches("[data-count]")) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  $$(".reveal, .hero-facts b").forEach(el => io.observe(el));

  /* ---------------- 3D book tilt ---------------- */
  $$("[data-tilt]").forEach(book => {
    const stage = book.closest(".book-stage");
    stage.addEventListener("pointermove", e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      book.style.setProperty("--ry", `${-24 + x * 34}deg`);
      book.style.setProperty("--rx", `${6 - y * 16}deg`);
    });
    stage.addEventListener("pointerleave", () => {
      book.style.setProperty("--ry", "-24deg");
      book.style.setProperty("--rx", "6deg");
    });
  });

  /* ================================================================
     FIG. 01 — Poutre isostatique : q réparti + P mobile
     RA = qL/2 + P(L−a)/L ; M(x) = RA·x − q·x²/2 − P·⟨x−a⟩
     Déformée : EI·v'' = −M, v(0) = v(L) = 0 (intégration numérique)
     ================================================================ */
  const beam = (() => {
    const svg = $("#beam");
    if (!svg) return;
    const X0 = 60, X1 = 580, L = 6, Y = 150, AX = 300;
    const q = 12, P = 40;
    const sx = (X1 - X0) / L;
    const mScale = 0.78;           // px par kN·m
    const N = 120;
    let a = 3;

    // q arrows
    const qG = $("#qArrows");
    const nArrows = 13;
    for (let i = 0; i < nArrows; i++) {
      const x = X0 + (i * (X1 - X0)) / (nArrows - 1);
      const l = svgEl("line", { x1: x, x2: x, y1: 72, y2: 140, "marker-end": "url(#arr)" }, qG);
      if (!reduce) {
        l.style.opacity = 0;
        l.animate([{ transform: "translateY(-30px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
          { duration: 600, delay: 600 + i * 45, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
      }
    }
    $("#qLine").setAttribute("d", `M${X0} 72 H${X1}`);
    const qLabel = $("#qLabel");
    qLabel.setAttribute("x", X0); qLabel.setAttribute("y", 62); qLabel.setAttribute("text-anchor", "start");

    // supports
    $("#supA").setAttribute("transform", `translate(${X0} ${Y + 6})`);
    $("#supB").setAttribute("transform", `translate(${X1} ${Y + 6})`);

    // P group geometry
    const pG = $("#pLoad");
    $(".p-text", pG).setAttribute("y", 14);
    $(".p-knob", pG).setAttribute("cy", 30);
    const pArrow = $(".p-arrow", pG);
    pArrow.setAttribute("y1", 36); pArrow.setAttribute("y2", 138);

    const els = {
      beam: $("#beamPath"), ghost: $("#beamShadow"),
      mPath: $("#mPath"), mFill: $("#mFill"),
      mMaxLine: $("#mMaxLine"), mMaxDot: $("#mMaxDot"), mMaxText: $("#mMaxText"),
      rA: $("#rA"), rB: $("#rB"), rAt: $("#rAt"), rBt: $("#rBt"),
    };
    els.ghost.setAttribute("d", `M${X0} ${Y} H${X1}`);

    const compute = () => {
      const RA = (q * L) / 2 + (P * (L - a)) / L;
      const RB = (q * L) / 2 + (P * a) / L;
      const xs = [], M = [];
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * L;
        xs.push(x);
        M.push(RA * x - (q * x * x) / 2 - (x > a ? P * (x - a) : 0));
      }
      // double integration of −M
      const dx = L / N;
      const th = [0], v = [0];
      for (let i = 1; i <= N; i++) th.push(th[i - 1] - (M[i - 1] + M[i]) / 2 * dx);
      for (let i = 1; i <= N; i++) v.push(v[i - 1] + (th[i - 1] + th[i]) / 2 * dx);
      const c = v[N] / L; // remove linear part so v(L)=0
      for (let i = 0; i <= N; i++) v[i] -= c * xs[i];
      return { RA, RB, xs, M, v };
    };

    const render = () => {
      const { RA, RB, xs, M, v } = compute();
      // deflection (scaled for visibility; v is negative = downward)
      const vMin = Math.min(...v);
      const defScale = 0.07;       // ≈ 27 px de flèche pour P à mi-portée
      let dB = "", dM = `M${X0} ${AX}`;
      let iMax = 0;
      xs.forEach((x, i) => {
        const px = X0 + x * sx;
        const py = Y - v[i] * defScale;
        dB += (i ? "L" : "M") + px.toFixed(1) + " " + py.toFixed(1);
        dM += `L${px.toFixed(1)} ${(AX + M[i] * mScale).toFixed(1)}`;
        if (M[i] > M[iMax]) iMax = i;
      });
      els.beam.setAttribute("d", dB);
      els.mPath.setAttribute("d", dM + `L${X1} ${AX}`);
      els.mFill.setAttribute("d", dM + `L${X1} ${AX}Z`);

      const mx = X0 + xs[iMax] * sx, my = AX + M[iMax] * mScale;
      els.mMaxDot.setAttribute("cx", mx); els.mMaxDot.setAttribute("cy", my);
      els.mMaxLine.setAttribute("x1", mx); els.mMaxLine.setAttribute("x2", mx);
      els.mMaxLine.setAttribute("y1", AX - 4); els.mMaxLine.setAttribute("y2", my);
      els.mMaxText.setAttribute("x", Math.min(Math.max(mx, 130), 510));
      els.mMaxText.setAttribute("y", AX - 12);
      els.mMaxText.textContent = `Mmax = ${fmt(M[iMax])} kN·m  (x = ${fmt(xs[iMax], 2)} m)`;

      // reactions (arrow length ∝ R)
      const rLen = R => 14 + R * 0.45;
      [[els.rA, els.rAt, X0, RA, "RA"], [els.rB, els.rBt, X1, RB, "RB"]].forEach(([ln, tx, x, R, name]) => {
        const yb = 252;
        ln.setAttribute("x1", x); ln.setAttribute("x2", x);
        ln.setAttribute("y1", yb); ln.setAttribute("y2", yb - rLen(R));
        tx.setAttribute("x", x); tx.setAttribute("y", yb + 18);
        tx.textContent = `${name} = ${fmt(R)} kN`;
      });

      const px = X0 + a * sx;
      const pyBeam = Y - v[Math.round((a / L) * N)] * defScale;
      pG.setAttribute("transform", `translate(${px.toFixed(1)} ${(pyBeam - Y).toFixed(1)})`);
      pG.setAttribute("aria-valuenow", a.toFixed(2));
      pG.setAttribute("aria-valuetext", `a = ${fmt(a, 2)} m`);
    };

    // drag
    let userControlled = false, dragging = false;
    const toA = e => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      a = Math.min(L - 0.05, Math.max(0.05, (p.x - X0) / sx));
      render();
    };
    pG.addEventListener("pointerdown", e => {
      dragging = userControlled = true;
      pG.classList.add("dragging");
      pG.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    pG.addEventListener("pointermove", e => dragging && toA(e));
    const stop = () => { dragging = false; pG.classList.remove("dragging"); };
    pG.addEventListener("pointerup", stop);
    pG.addEventListener("pointercancel", stop);
    // clicking anywhere on the beam band moves P too
    svg.addEventListener("pointerdown", e => {
      if (e.target.closest("#pLoad")) return;
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      if (p.y < 200 && p.x > X0 - 10 && p.x < X1 + 10) { userControlled = true; toA(e); }
    });
    pG.addEventListener("keydown", e => {
      const step = e.shiftKey ? 0.5 : 0.1;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") a -= step;
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") a += step;
      else if (e.key === "Home") a = 0.05;
      else if (e.key === "End") a = L - 0.05;
      else return;
      userControlled = true;
      a = Math.min(L - 0.05, Math.max(0.05, a));
      render();
      e.preventDefault();
    });

    // idle animation: P travels back and forth until the user takes over
    render();
    if (!reduce) {
      const t0 = performance.now();
      let visible = true;
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(svg);
      const loop = t => {
        if (!userControlled && visible) {
          a = L / 2 + Math.sin((t - t0) / 1700) * (L * 0.36);
          render();
        }
        if (!userControlled) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  })();

  /* ================================================================
     FIG. 02 — Coupe béton armé pilotée par le défilement
     ================================================================ */
  $$(".draw").forEach(p => {
    try { p.style.setProperty("--len", Math.ceil(p.getTotalLength())); } catch (_) { /* hidden */ }
  });
  const rcFig = $("#rcSection");
  if (rcFig) {
    const steps = $$(".rc-steps li");
    const setStep = n => {
      rcFig.className = rcFig.className.replace(/\bs-\d\b/g, "").trim() + ` s-${n}`;
      steps.forEach(li => li.classList.toggle("active", +li.dataset.step === n));
    };
    setStep(1);
    if (reduce) setStep(5);
    else {
      const stepIO = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) setStep(+en.target.dataset.step); });
      }, { rootMargin: "-45% 0px -45% 0px" });
      steps.forEach(li => stepIO.observe(li));
    }
  }

  /* ================================================================
     FIG. 03 — Élévation : cadres + fissuration
     ================================================================ */
  const elev = $("#elevation");
  if (elev) {
    const sG = $("#stirrups");
    const xs = [];
    for (let x = 80; x <= 300; x += 22) xs.push(x);
    for (let x = 340; x <= 660; x += 44) xs.push(x);
    for (let x = 700; x <= 920; x += 22) xs.push(x);
    xs.forEach((x, i) => {
      const l = svgEl("line", { x1: x, x2: x, y1: 58, y2: 152 }, sG);
      l.style.transitionDelay = `${0.6 + i * 0.03}s`;
    });

    const cG = $("#cracks");
    const jag = (pts) => "M" + pts.map(p => p.map(n => n.toFixed(1)).join(" ")).join(" L");
    const rnd = (s => () => (s = (s * 9301 + 49297) % 233280) / 233280)(7);
    // flexural cracks: vertical-ish from the bottom fibre near mid-span
    [400, 445, 490, 535, 580, 620].forEach((x, i) => {
      const h = 40 + (1 - Math.abs(x - 510) / 140) * 30;
      const pts = [[x, 160]];
      for (let k = 1; k <= 4; k++) pts.push([x + (rnd() - 0.5) * 8, 160 - (h * k) / 4]);
      const p = svgEl("path", { d: jag(pts) }, cG);
      p.style.transitionDelay = `${1.6 + i * 0.12}s`;
    });
    // shear cracks: ~45° near supports, rising toward mid-span
    const shear = (x0, dir, i) => {
      const pts = [[x0, 158]];
      for (let k = 1; k <= 5; k++) pts.push([x0 + dir * k * 15 + (rnd() - 0.5) * 6, 158 - k * 16 + (rnd() - 0.5) * 4]);
      const p = svgEl("path", { d: jag(pts) }, cG);
      p.style.transitionDelay = `${2.3 + i * 0.15}s`;
    };
    [120, 175, 230].forEach((x, i) => shear(x, 1, i));
    [880, 825, 770].forEach((x, i) => shear(x, -1, i));

    new IntersectionObserver(([en], obs) => {
      if (!en.isIntersecting) return;
      elev.classList.add("in", "cracked");
      obs.disconnect();
    }, { threshold: 0.35 }).observe(elev);
  }

  /* ================================================================
     Programme — treillis Pratt, 12 nœuds = 12 chapitres
     ================================================================ */
  const truss = $("#truss");
  if (truss) {
    const yb = 210, yt = 70, x0 = 60, w = 880, n = 6;
    const B = [...Array(n + 1)].map((_, i) => [x0 + (w * i) / n, yb]);
    const T = [...Array(n + 1)].map((_, i) => [x0 + (w * i) / n, yt]);
    const members = [];
    const add = (p, q, type) => members.push({ p, q, type });
    for (let i = 0; i < n; i++) add(B[i], B[i + 1], "tension");                  // membrure inf.
    for (let i = 1; i < n - 1; i++) add(T[i], T[i + 1], "compression");          // membrure sup.
    add(B[0], T[1], "compression"); add(B[n], T[n - 1], "compression");           // montants d'about
    for (let i = 1; i < n; i++) add(T[i], B[i], "compression");                   // montants
    for (let i = 1; i < n - 1; i++) i < n / 2 ? add(T[i], B[i + 1], "tension") : add(T[i + 1], B[i], "tension"); // diagonales

    // sort members left → right for a progressive "assembly"
    members.sort((m1, m2) => (m1.p[0] + m1.q[0]) - (m2.p[0] + m2.q[0]));
    const mG = svgEl("g", {}, truss);
    const lines = members.map(m => {
      const l = svgEl("line", { x1: m.p[0], y1: m.p[1], x2: m.q[0], y2: m.q[1], class: `member ${m.type}` }, mG);
      l.style.setProperty("--len", Math.hypot(m.q[0] - m.p[0], m.q[1] - m.p[1]).toFixed(0));
      return l;
    });

    // supports
    svgEl("path", { d: `M${B[0][0]} ${yb + 6} l-14 22 h28 z`, class: "sup" }, truss);
    svgEl("path", { d: `M${B[n][0]} ${yb + 6} l-14 18 h28 z`, class: "sup" }, truss);
    svgEl("circle", { cx: B[n][0] - 7, cy: yb + 29, r: 4, class: "sup" }, truss);
    svgEl("circle", { cx: B[n][0] + 7, cy: yb + 29, r: 4, class: "sup" }, truss);

    // nodes in chapter order
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const order = [B[0]];
    for (let i = 1; i < n; i++) order.push(T[i], B[i]);
    order.push(B[n]);
    const nodes = order.map((p, i) => {
      const g = svgEl("g", { opacity: 0 }, truss);
      svgEl("circle", { cx: p[0], cy: p[1], r: 7, class: "node" }, g);
      const top = p[1] === yt;
      svgEl("text", { x: p[0], y: top ? p[1] - 18 : p[1] + 30 + (i === 0 || i === order.length - 1 ? 22 : 0), "text-anchor": "middle", class: "node-label" }, g).textContent = roman[i];
      return g;
    });
    svgEl("text", { x: 60, y: 22, class: "legend", fill: "#ff6a1a" }, truss).textContent = "━ compression";
    svgEl("text", { x: 210, y: 22, class: "legend", fill: "#8fb3d9" }, truss).textContent = "━ traction";

    const build = () => {
      lines.forEach((l, i) => {
        if (reduce) { l.classList.add("on"); l.style.animationDuration = "0s"; return; }
        setTimeout(() => l.classList.add("on"), i * 90);
      });
      nodes.forEach((g, i) => {
        if (reduce) { g.setAttribute("opacity", 1); return; }
        g.animate([{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "scale(1)" }],
          { duration: 500, delay: 300 + i * 150, fill: "forwards", easing: "cubic-bezier(.3,1.6,.5,1)" });
        g.style.transformBox = "fill-box"; g.style.transformOrigin = "center";
      });
    };
    new IntersectionObserver(([en], obs) => {
      if (en.isIntersecting) { build(); obs.disconnect(); }
    }, { threshold: 0.3 }).observe(truss);
  }
})();
