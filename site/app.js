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

  /* ---------------- Livre 3D : la forme suit la vraie couverture ---------------- */
  $$(".book").forEach(book => {
    const img = $(".book-front img", book);
    if (!img) return;
    const apply = () => {
      const ar = img.naturalWidth / img.naturalHeight;
      // bannière large ou image illisible : on garde la couverture dessinée
      if (!ar || ar > 1.15) { img.remove(); return; }
      book.style.setProperty("--ar", Math.max(0.62, Math.min(1, ar)).toFixed(3));
    };
    if (img.complete) apply(); else img.addEventListener("load", apply, { once: true });
  });

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
      // double intégration de EI·v'' = +M (M > 0 = fibre inférieure tendue, v > 0 vers le haut) :
      // la poutre chargée fléchit donc vers le BAS (v < 0).
      const dx = L / N;
      const th = [0], v = [0];
      for (let i = 1; i <= N; i++) th.push(th[i - 1] + (M[i - 1] + M[i]) / 2 * dx);
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

/* =====================================================================
   Contenu piloté par config.js : réseaux sociaux, vidéos, contact
   ===================================================================== */
(() => {
  "use strict";
  const C = window.SITE || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const socials = C.socials || {};
  const videos = (C.videos || []).filter(v => v && v.lien);
  const waNum = (C.whatsapp || "").replace(/\D/g, "");
  const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---- éléments conditionnels (data-needs="videos" | "facebook|youtube" ...) ---- */
  const has = key => key === "videos" ? videos.length > 0 : key === "email" ? !!C.email : key === "telephone" ? !!C.telephone : !!socials[key];
  $$("[data-needs]").forEach(el => {
    const ok = el.dataset.needs.split("|").some(has);
    el.hidden = !ok;
    if (!ok && el.tagName === "A") el.remove();
  });

  /* ---- renumérote les sections visibles (§ 01, § 02...) ---- */
  let n = 0;
  $$(".section .kicker").forEach(k => {
    if (k.closest("[hidden]") || !/^§ \d\d/.test(k.textContent)) return;
    k.textContent = k.textContent.replace(/^§ \d\d/, `§ ${String(++n).padStart(2, "0")}`);
  });

  /* ---- réseaux sociaux ---- */
  const ICONS = {
    facebook: ['Facebook', '<path d="M14 8h3V4h-3c-3 0-4.5 1.9-4.5 4.6V11H7v4h2.5v7h4.2v-7h3l.6-4h-3.6V8.9c0-.6.3-.9.9-.9z"/>'],
    youtube: ['YouTube', '<rect x="1.5" y="5" width="21" height="14" rx="4"/><path d="M10 9.2v5.6l4.8-2.8z" fill="var(--bg)"/>'],
    tiktok: ['TikTok', '<path d="M16.2 2.5c.4 2.4 1.9 3.9 4.3 4.1v3.3c-1.6 0-3-.5-4.3-1.3v6.6a6.3 6.3 0 1 1-6.3-6.3h.4v3.3a3.1 3.1 0 1 0 2.6 3V2.5z"/>'],
    instagram: ['Instagram', '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.6" r="1.3"/>'],
    linkedin: ['LinkedIn', '<rect x="2" y="2" width="20" height="20" rx="3"/><g fill="var(--bg)"><rect x="5.8" y="9.6" width="2.8" height="8.4"/><circle cx="7.2" cy="6.6" r="1.6"/><path d="M10.8 9.6h2.7v1.2c.5-.8 1.5-1.4 2.8-1.4 2.3 0 3 1.5 3 3.6V18h-2.8v-4.5c0-1.1-.3-1.8-1.3-1.8-1.1 0-1.6.8-1.6 1.9V18h-2.8z"/></g>'],
    telegram: ['Telegram', '<path d="M21.5 3.5 2.6 10.8c-1 .4-1 1.4 0 1.7l4.8 1.5 1.8 5.6c.2.7.9.8 1.4.4l2.7-2.2 4.9 3.6c.7.5 1.5.1 1.7-.7l3.1-15.6c.2-1-.6-1.6-1.5-1.1zM9.3 13.6l8.6-5.4-6.9 6.4-.3 3.1z"/>'],
    x: ['X', '<path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.5z"/>'],
    threads: ['Threads', '<path d="M16.7 11.2c-.1-.1-.2-.1-.3-.2-.2-3-1.8-4.7-4.6-4.7-1.7 0-3.1.7-4 2l1.6 1.1c.6-.9 1.6-1.2 2.4-1.2 1.4 0 2.3.6 2.5 2-.6-.1-1.3-.2-2-.2-2.5.1-4.1 1.6-4 3.6.1 2 1.9 3.3 4.1 3.2 1.6-.1 3-.8 3.7-2.6.4-.9.6-1.8.5-2.5.9.6 1.4 1.3 1.6 2.1.4 1.4-.1 3-1.4 4.3-1.2 1.2-2.7 1.8-4.8 1.8-2.4 0-4.2-.8-5.4-2.3C5.5 16.3 5 14.4 5 12s.5-4.3 1.6-5.8C7.8 4.8 9.6 4 12 4s4.3.8 5.5 2.3c.6.7 1 1.6 1.3 2.6l1.9-.5c-.3-1.3-.9-2.4-1.7-3.4C17.4 3.1 15 2 12 2 9 2 6.6 3 5 5 3.7 6.9 3 9.2 3 12s.7 5.1 2 6.9C6.6 20.9 9 22 12 22c2.6 0 4.6-.8 6.2-2.4 2-2 2-4.6 1.4-6.4-.4-1.2-1.4-2.4-2.9-3zm-4.6 4.5c-1 .1-2-.4-2-1.3 0-.7.5-1.5 2.1-1.6.7 0 1.4.1 2 .2-.2 2.2-1.2 2.6-2.1 2.7z"/>'],
    pinterest: ['Pinterest', '<path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.2-.8 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.8 0-2.5-1.8-4.3-4.4-4.3-3 0-4.8 2.3-4.8 4.6 0 .9.4 1.9.8 2.4.1.1.1.2.1.3l-.3 1.2c0 .2-.2.3-.4.2-1.3-.6-2.2-2.6-2.2-4.2 0-3.4 2.5-6.6 7.2-6.6 3.8 0 6.7 2.7 6.7 6.3 0 3.7-2.4 6.8-5.6 6.8-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.2 1-.9 2.2-1.4 2.9A10 10 0 1 0 12 2z"/>'],
    whatsapp: ['WhatsApp', '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.6 14.1c-.2.7-1.4 1.3-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 2c.1.1.1.3 0 .5-.4.9-.9.9-.6 1.4a7.5 7.5 0 0 0 3.5 3.1c.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.8.9c.3.1.4.2.5.3 0 .1 0 .6-.3 1.4z"/>'],
  };
  const links = Object.entries(socials).filter(([, url]) => url);
  if (waNum) links.push(["whatsapp", `https://wa.me/${waNum}`]);
  const socialHTML = links.map(([k, url]) => {
    const [label, path] = ICONS[k] || [k, '<circle cx="12" cy="12" r="9"/>'];
    return `<a class="social" href="${esc(url)}" target="_blank" rel="noopener" aria-label="${label}" title="${label}"><svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg><span>${label}</span></a>`;
  }).join("");
  $$(".socials").forEach(el => { el.innerHTML = socialHTML; });
  $$(".js-fb").forEach(a => socials.facebook && (a.href = socials.facebook));
  $$(".js-yt").forEach(a => socials.youtube && (a.href = socials.youtube));

  const more = $(".video-more");
  if (more && !more.hidden) {
    more.innerHTML = [
      socials.youtube && `<a class="link" href="${esc(socials.youtube)}" target="_blank" rel="noopener">Toutes les vidéos sur YouTube →</a>`,
      socials.facebook && `<a class="link" href="${esc(socials.facebook)}" target="_blank" rel="noopener">Suivre la page Facebook →</a>`,
    ].filter(Boolean).join("");
  }

  /* ---- vidéos : vignette légère, le lecteur ne se charge qu'au clic ---- */
  const parse = url => {
    let m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
    if (m) return { kind: "youtube", id: m[1],
      thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`,
      embed: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0` };
    if (/facebook\.com|fb\.watch/.test(url)) return { kind: "facebook",
      embed: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true` };
    return { kind: "link" };
  };
  const grid = $(".video-grid");
  const filters = $(".video-filters");
  if (grid && videos.length) {
    grid.innerHTML = videos.map((v, i) => {
      const p = parse(v.lien);
      const poster = p.thumb
        ? `<img src="${p.thumb}" alt="" loading="lazy">`
        : `<div class="v-poster" aria-hidden="true"><svg viewBox="0 0 160 90"><path d="M20 40h120M20 40Q80 72 140 40"/><path d="M20 40l-8 12h16zM140 40l-8 12h16z"/></svg></div>`;
      return `<article class="video-card reveal in" data-cat="${esc(v.categorie || "Autres")}">
        <button class="v-media" type="button" data-i="${i}" aria-label="Lire la vidéo : ${esc(v.titre)}">
          ${poster}
          <span class="v-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
          ${v.duree ? `<span class="v-dur mono">${esc(v.duree)}</span>` : ""}
          <span class="v-src mono">${p.kind === "facebook" ? "Facebook" : p.kind === "youtube" ? "YouTube" : "Vidéo"}</span>
        </button>
        <div class="v-body"><p class="mono kicker">${esc(v.categorie || "Vidéo")}</p><h3>${esc(v.titre)}</h3></div>
      </article>`;
    }).join("");

    grid.addEventListener("click", e => {
      const btn = e.target.closest(".v-media");
      if (!btn) return;
      const v = videos[+btn.dataset.i];
      const p = parse(v.lien);
      if (!p.embed) { window.open(v.lien, "_blank", "noopener"); return; }
      const frame = document.createElement("iframe");
      frame.src = p.embed;
      frame.title = v.titre;
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      const box = Object.assign(document.createElement("div"), { className: "v-media v-playing" });
      box.appendChild(frame);
      btn.replaceWith(box);
    });

    const cats = [...new Set(videos.map(v => v.categorie || "Autres"))];
    if (cats.length > 1) {
      filters.innerHTML = ["Toutes", ...cats].map((c, i) =>
        `<button type="button" role="tab" aria-selected="${i === 0}" class="chip mono" data-cat="${esc(c)}">${esc(c)} <small>${i === 0 ? videos.length : videos.filter(v => (v.categorie || "Autres") === c).length}</small></button>`).join("");
      filters.addEventListener("click", e => {
        const b = e.target.closest(".chip");
        if (!b) return;
        $$(".chip", filters).forEach(x => x.setAttribute("aria-selected", x === b));
        $$(".video-card", grid).forEach(card => {
          card.hidden = b.dataset.cat !== "Toutes" && card.dataset.cat !== b.dataset.cat;
        });
      });
    } else filters.hidden = true;
  }

  /* ---- contact ---- */
  $$(".js-email").forEach(a => { if (C.email) { a.href = `mailto:${C.email}`; a.textContent = C.email; } });
  $$(".js-tel").forEach(a => { if (C.telephone) { a.href = "tel:" + C.telephone.replace(/[^\d+]/g, ""); a.textContent = C.telephone; } });
  $$(".js-wa").forEach(a => { if (waNum) a.href = `https://wa.me/${waNum}`; });

  const form = $("#contactForm");
  if (form) {
    const status = $(".form-status", form);
    const say = (msg, ok) => { status.textContent = msg; status.className = `form-status mono ${ok ? "ok" : "err"}`; };
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      if (d._honey) return;                                   // robot
      const bad = [...form.querySelectorAll("[required]")].find(f => !f.value.trim() || !f.checkValidity());
      form.querySelectorAll("[required]").forEach(f => f.classList.toggle("invalid", !f.value.trim() || !f.checkValidity()));
      if (bad) { say("Merci de remplir les champs obligatoires (un email valide est nécessaire).", false); bad.focus(); return; }

      const text = `${d.sujet} — ${d.nom} (${d.profil})\n\n${d.message}\n\nRépondre à : ${d.email}`;
      if (C.email) {
        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true; say("Envoi en cours…", true);
        try {
          const r = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(C.email)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ _subject: `Génie Civil Pro — ${d.sujet}`, _template: "table", _replyto: d.email,
              Nom: d.nom, Email: d.email, Profil: d.profil, Sujet: d.sujet, Message: d.message }),
          });
          if (!r.ok) throw new Error(r.status);
          form.reset();
          say("Message envoyé. Merci ! Tu recevras une réponse par email.", true);
        } catch (_) {
          say("L'envoi a échoué. Ta messagerie va s'ouvrir pour envoyer le message.", false);
          location.href = `mailto:${C.email}?subject=${encodeURIComponent("Génie Civil Pro — " + d.sujet)}&body=${encodeURIComponent(text)}`;
        } finally { btn.disabled = false; }
      } else if (waNum) {
        window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
        say("WhatsApp s'ouvre avec ton message, il ne reste qu'à l'envoyer.", true);
      }
    });
  }
})();

/* =====================================================================
   Consentement à la mesure d'audience (Metricool). Rien ne se charge avant "Accepter".
   Le signal "Global Privacy Control" du navigateur est respecté comme un refus.
   ===================================================================== */
(() => {
  "use strict";
  const KEY = "gcp-consent";
  const box = document.getElementById("consent");
  const read = () => { try { return localStorage.getItem(KEY); } catch (_) { return null; } };
  const write = v => { try { localStorage.setItem(KEY, v); } catch (_) { /* navigation privée */ } };
  let loaded = false;
  const load = () => {
    const src = document.getElementById("metricool-tracker");
    if (loaded || !src) return;
    loaded = true;
    const s = document.createElement("script");
    s.textContent = src.textContent;
    document.head.appendChild(s);
  };
  const apply = () => {
    const v = navigator.globalPrivacyControl ? "no" : read();
    if (v === "yes") { load(); if (box) box.hidden = true; }
    else if (v === "no") { if (box) box.hidden = true; }
    else if (box) box.hidden = false;
  };
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-consent]");
    if (b) { write(b.dataset.consent); apply(); return; }
    if (e.target.closest("[data-consent-open]") && box) box.hidden = false;
  });
  apply();
})();
