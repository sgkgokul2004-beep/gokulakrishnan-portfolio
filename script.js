const STORAGE_KEY = "gokulakrishnanPortfolioDraft";
const COLOR_MODE_KEY = "gokulakrishnanColorMode";
const DRAFT_PREVIEW = new URLSearchParams(window.location.search).get("draft") === "1";
const ALLOWED_FONTS = new Set(["Space Grotesk", "DM Sans", "Manrope", "Montserrat", "Lora", "Playfair Display", "Cormorant Garamond", "Source Sans 3"]);
let publishedPortfolio;

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const safeImage = (value) => /^(https?:\/\/|data:image\/(?:jpeg|png|webp|gif);base64,|assets\/|\.\/|\/)/i.test(String(value || "")) ? String(value) : "";
const safeHref = (value) => /^(https?:\/\/|mailto:|tel:|data:application\/pdf;base64,|data:image\/(?:jpeg|png|webp|gif);base64,|assets\/|\.\/|\/|#)/i.test(String(value || "")) ? String(value) : "#";
const lines = (value) => String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const accentLines = (value) => {
  const parts = lines(value);
  if (!parts.length) return "";
  return [...parts.slice(0, -1).map(escapeHtml), `<em>${escapeHtml(parts.at(-1))}</em>`].join("<br />");
};
const normalLines = (value) => lines(value).map(escapeHtml).join("<br />");
const hexColor = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : fallback;

function renderMetrics(metrics) {
  return (metrics || []).map((metric) => `<div class="snapshot-stat"><strong>${escapeHtml(metric.value)}${metric.unit ? `<span> ${escapeHtml(metric.unit)}</span>` : ""}</strong><span>${escapeHtml(metric.label)}</span></div>`).join("");
}

function renderExperience(items) {
  return (items || []).map((item, index) => `<article class="experience-item reveal">
    <div class="experience-date"><span class="date-marker"></span><span class="mono-label">${escapeHtml(item.duration || "")}</span></div>
    <div class="experience-main"><p class="role-type">${escapeHtml(item.category || "EXPERIENCE")}</p><h3>${escapeHtml(item.role || "")}</h3><p class="company">${escapeHtml(item.company || "")}</p><ul class="detail-list">${(item.details || []).filter(Boolean).map((detail) => `<li>${escapeHtml(detail)}</li>`).join("")}</ul></div>
    <span class="experience-number">${String(index + 1).padStart(2, "0")}</span>
  </article>`).join("");
}

function renderSkills(groups) {
  return (groups || []).map((group, index) => `<div class="skill-group ${index === 2 ? "language-group" : ""} reveal">
    <span class="skill-index">${escapeHtml(group.label || "SKILLS")}</span><h3>${escapeHtml(group.heading || "")}</h3>
    <ul>${(group.items || []).filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  </div>`).join("");
}

function renderSkillsMarquee(groups) {
  const marks = [
    [/python/i, "Py"], [/excel/i, "Xl"], [/c programming/i, "C"], [/embedded/i, "HW"],
    [/internet of things|\biot\b/i, "IoT"], [/customer/i, "CS"], [/communication/i, "Com"],
    [/teamwork/i, "Team"], [/time management/i, "TM"], [/problem.solving/i, "PS"],
    [/tamil/i, "Ta"], [/english/i, "En"]
  ];
  const skills = (groups || []).flatMap((group) => (group.items || []).filter(Boolean));
  const renderItems = () => skills.map((skill) => {
    const mark = marks.find(([pattern]) => pattern.test(skill))?.[1] || skill.trim().slice(0, 2).toUpperCase();
    return `<span class="skills-marquee-item" role="listitem"><span class="skills-marquee-mark" aria-hidden="true">${escapeHtml(mark)}</span><span>${escapeHtml(skill)}</span></span>`;
  }).join("");
  const items = renderItems();
  return `<div class="skills-showcase">
    <div class="skills-showcase-heading"><span class="eyebrow"><span class="status-dot"></span> SKILLS IN MOTION</span><button class="marquee-toggle" type="button" aria-label="Pause skills ticker" aria-pressed="false"><span class="marquee-control-icon" aria-hidden="true"></span><span class="marquee-toggle-label">Pause</span></button></div>
    <div class="skills-marquee" aria-label="Portfolio skills">
      <div class="skills-marquee-track"><div class="skills-marquee-group" role="list">${items}</div><div class="skills-marquee-group skills-marquee-copy" role="list" aria-hidden="true">${items}</div></div>
    </div>
  </div>`;
}

function renderEducation(items) {
  return (items || []).map((item) => `<article class="education-item reveal"><span class="education-year">${escapeHtml(item.year || "")}</span><div><h3>${escapeHtml(item.qualification || "")}</h3><p>${escapeHtml(item.institution || "")}</p></div><span class="education-mark" aria-hidden="true">↗</span></article>`).join("");
}

function renderCertificates(items) {
  const visible = (items || []).filter((item) => item.name || item.fileData || item.url);
  if (!visible.length) return "";
  return `<section class="section page-wrap certificate-section" id="certificates" aria-labelledby="certificates-title">
    <div class="section-heading"><div><p class="eyebrow">06 — CREDENTIALS</p><h2 id="certificates-title">Learning, <em>recognized.</em></h2></div><p class="section-intro">Certificates and supporting credentials.</p></div>
    <div class="certificate-grid">${visible.map((item) => {
      const file = item.fileData || "";
      const image = file && item.mimeType?.startsWith("image/");
      const href = safeHref(file || item.url);
      const preview = image ? `<img src="${escapeHtml(safeImage(file))}" alt="${escapeHtml(item.name || "Certificate")}" loading="lazy" />` : `<span class="certificate-file-mark">PDF</span>`;
      return `<article class="certificate-card reveal"><a class="certificate-preview" href="${escapeHtml(href)}" target="_blank" rel="noopener">${preview}<span class="certificate-open" aria-hidden="true">↗</span></a><div class="certificate-info"><p class="eyebrow">${escapeHtml(item.date || "CERTIFICATE")}</p><h3>${escapeHtml(item.name || "Certificate")}</h3><p>${escapeHtml(item.issuer || "")}</p>${item.url ? `<a class="certificate-verify" href="${escapeHtml(safeHref(item.url))}" target="_blank" rel="noopener">Verify credential ↗</a>` : ""}</div></article>`;
    }).join("")}</div>
  </section>`;
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty("--paper", hexColor(theme.paper, "#f4f3ed"));
  root.style.setProperty("--ink", hexColor(theme.ink, "#1c2826"));
  root.style.setProperty("--green", hexColor(theme.green, "#164b3c"));
  root.style.setProperty("--orange", hexColor(theme.accent, "#e56c43"));
  root.style.setProperty("--lime", hexColor(theme.lime, "#d8eb79"));
  const display = ALLOWED_FONTS.has(theme.displayFont) ? theme.displayFont : "Space Grotesk";
  const body = ALLOWED_FONTS.has(theme.bodyFont) ? theme.bodyFont : "DM Sans";
  const customName = /^[a-zA-Z0-9 _-]{1,60}$/.test(theme.customFontName || "") ? theme.customFontName : "";
  root.style.setProperty("--font-display", `"${customName || display}", "Trebuchet MS", sans-serif`);
  root.style.setProperty("--font-body", `"${body}", "Segoe UI", sans-serif`);
  const fontNames = [...new Set([display, body])].map((font) => `family=${encodeURIComponent(font).replace(/%20/g, "+")}:wght@400;500;600;700`).join("&");
  let fontLink = document.querySelector("#portfolio-fonts");
  if (!fontLink) {
    fontLink = document.createElement("link");
    fontLink.id = "portfolio-fonts";
    fontLink.rel = "stylesheet";
    document.head.append(fontLink);
  }
  fontLink.href = `https://fonts.googleapis.com/css2?${fontNames}&display=swap`;
  if (/^data:font\/woff2;base64,[A-Za-z0-9+/=]+$/.test(theme.customFontData || "") && customName) {
    let style = document.querySelector("#custom-portfolio-font");
    if (!style) {
      style = document.createElement("style");
      style.id = "custom-portfolio-font";
      document.head.append(style);
    }
    style.textContent = `@font-face{font-family:"${customName}";src:url(${theme.customFontData}) format("woff2");font-display:swap}`;
  }
}

function renderPortfolio(data) {
  const profile = data.profile || {};
  const copy = data.sectionCopy || {};
  const project = data.project || {};
  const heroImageAlt = profile.heroImageAlt || "Portfolio profile image";
  const nameParts = String(profile.name || data.siteTitle || "Portfolio").trim().split(/\s+/);
  const accentName = nameParts.pop() || "";
  const fullName = nameParts.length ? `${nameParts.map(escapeHtml).join(" ")} <span>${escapeHtml(accentName)}</span>` : escapeHtml(accentName);
  const certificateNav = (data.certificates || []).some((item) => item.name || item.fileData || item.url) ? `<a href="#certificates">Certificates</a>` : "";
  const heroImage = safeImage(profile.heroImage);
  const projectImage = safeImage(project.image);
  const resumeHref = safeHref(data.resume?.dataUrl || data.resume?.url || "#");
  const emailHref = `mailto:${encodeURIComponent(profile.email || "")}`;
  const phoneHref = `tel:${String(profile.phone || "").replace(/[^\d+]/g, "")}`;
  document.title = `${data.siteTitle || profile.name || "Portfolio"} | Portfolio`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = data.metaDescription || "Personal portfolio.";
  applyTheme(data.theme || {});

  document.body.innerHTML = `<a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <a class="wordmark" href="#top" aria-label="${escapeHtml(profile.name || "Portfolio")}, home"><span class="wordmark-mark">${escapeHtml((profile.name || "G").trim().charAt(0) || "G")}</span><span>${escapeHtml(profile.name || "Portfolio")}</span></a>
      <nav class="primary-nav" id="primary-nav" aria-label="Main navigation"><a href="#experience">Experience</a><a href="#project">Project</a>${certificateNav}<a href="#education">Education</a><a href="#contact">Contact</a></nav>
      <div class="header-actions">
        <button class="theme-toggle" type="button" aria-label="Switch to dark mode" aria-pressed="false">
          <span class="theme-icon" aria-hidden="true">
            <svg class="icon-moon" viewBox="0 0 24 24"><path d="M20.2 15.4A8.4 8.4 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" /></svg>
            <svg class="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
          </span>
          <span class="theme-label">Dark</span>
        </button>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Open navigation"><span></span><span></span></button>
        <a class="header-resume" href="${escapeHtml(resumeHref)}" download="${escapeHtml(data.resume?.fileName || "Resume.pdf")}"><span>Resume</span><span class="arrow-icon" aria-hidden="true">↗</span></a>
      </div>
    </header>
    <span class="sr-only" id="portfolio-status" aria-live="polite"></span>
    <main id="main">
      <section class="hero page-wrap" id="top" aria-labelledby="hero-title">
        <div class="hero-copy reveal"><p class="eyebrow"><span class="status-dot"></span>${escapeHtml(profile.role || "Portfolio")}</p><h1 id="hero-title">${fullName}</h1><p class="hero-intro">${normalLines(profile.summary)}</p>
          <div class="hero-actions"><a class="button button-dark" href="#experience">Explore my work <span aria-hidden="true">↓</span></a><a class="text-link" href="${escapeHtml(emailHref)}">Let's connect <span aria-hidden="true">↗</span></a></div>
          <div class="hero-meta"><span class="mono-label">BASED IN</span><span>${normalLines(profile.location)}</span></div>
        </div>
        <div class="hero-visual reveal"><img class="hero-photo" src="${escapeHtml(heroImage)}" alt="${escapeHtml(heroImageAlt)}" fetchpriority="high" /><div class="visual-caption">“${escapeHtml(profile.heroCaption || "Curious by nature. Professional by design.")}”</div></div>
        <div class="hero-bottomline"><span>${escapeHtml(profile.availability || "OPEN TO OPPORTUNITIES").toUpperCase()}</span><span class="scroll-cue">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></span></div>
      </section>
      <section class="snapshot" aria-label="Career snapshot"><div class="snapshot-inner page-wrap"><div class="snapshot-heading"><span class="eyebrow">A QUICK SNAPSHOT</span><p>${normalLines(copy.snapshotTitle || "Learning by doing, building with purpose.")}</p></div>${renderMetrics(data.metrics)}</div></section>
      <section class="section page-wrap" id="experience" aria-labelledby="experience-title"><div class="section-heading"><div><p class="eyebrow">01 — EXPERIENCE</p><h2 id="experience-title">${accentLines(copy.experienceTitle || "Work that builds\ntrust.")}</h2></div><p class="section-intro">${escapeHtml(copy.experienceIntro || "")}</p></div><div class="experience-list">${renderExperience(data.experience)}</div></section>
      <section class="project-section" id="project" aria-labelledby="project-title"><div class="project-layout page-wrap"><div class="project-image reveal" role="img" aria-label="${escapeHtml(project.imageCaption || "Connected electronic sensor board")}"><img src="${escapeHtml(projectImage)}" alt="Sensor and circuit board for an IoT monitoring system" loading="lazy" /><span class="image-note">${escapeHtml(project.imageCaption || "SENSING / ANALYSIS / ALERT").toUpperCase()}</span></div><div class="project-copy reveal"><p class="eyebrow">02 — ${escapeHtml(copy.projectEyebrow || "FEATURED PROJECT")}</p><p class="project-kicker">${escapeHtml(project.kicker || "IoT · MACHINE LEARNING")}</p><h2 id="project-title">${accentLines(copy.projectTitle || "A quieter way\nto watch over\nsleep.")}</h2><h3>${escapeHtml(project.title || "")}</h3><p class="project-description">${escapeHtml(project.description || "")}</p><div class="project-flow" aria-label="Project workflow"><span>01 <b>Sense</b></span><i aria-hidden="true"></i><span>02 <b>Analyze</b></span><i aria-hidden="true"></i><span>03 <b>Alert</b></span></div><p class="project-footnote">${escapeHtml(project.note || "")}</p>${project.link ? `<a class="text-link project-link" href="${escapeHtml(safeHref(project.link))}" target="_blank" rel="noopener">View project <span aria-hidden="true">↗</span></a>` : ""}</div></div></section>
      ${renderCertificates(data.certificates)}
      <section class="section page-wrap capability-section" aria-labelledby="capabilities-title"><div class="section-heading compact-heading"><div><p class="eyebrow">03 — CAPABILITIES</p><h2 id="capabilities-title">${accentLines(copy.skillsTitle || "A mix of people\nskills and systems.")}</h2></div><p class="section-intro">${escapeHtml(copy.skillsIntro || "")}</p></div>${renderSkillsMarquee(data.skillGroups)}<div class="skills-grid">${renderSkills(data.skillGroups)}</div></section>
      <section class="education-section" id="education" aria-labelledby="education-title"><div class="education-inner page-wrap"><div class="education-title"><p class="eyebrow">04 — EDUCATION</p><h2 id="education-title">${accentLines(copy.educationTitle || "Built on a\nstrong base.")}</h2></div><div class="education-list">${renderEducation(data.education)}</div></div></section>
      <section class="contact-section page-wrap" id="contact" aria-labelledby="contact-title"><div class="contact-topline"><p class="eyebrow">05 — CONTACT</p><span class="contact-coordinate">${escapeHtml(profile.location || "").toUpperCase()}</span></div><div class="contact-main"><h2 id="contact-title">${accentLines(copy.contactTitle || "Let's make\nsomething work.")}</h2><p>${escapeHtml(copy.contactMessage || "")}</p></div><div class="contact-links"><a href="${escapeHtml(emailHref)}"><span class="contact-type">EMAIL</span><span>${escapeHtml(profile.email || "")}</span><span class="contact-arrow" aria-hidden="true">↗</span></a><a href="${escapeHtml(phoneHref)}"><span class="contact-type">PHONE</span><span>${escapeHtml(profile.phone || "")}</span><span class="contact-arrow" aria-hidden="true">↗</span></a><a href="${escapeHtml(resumeHref)}" download="${escapeHtml(data.resume?.fileName || "Resume.pdf")}"><span class="contact-type">RESUME</span><span>Download PDF</span><span class="contact-arrow" aria-hidden="true">↓</span></a></div></section>
    </main>
    <footer class="site-footer page-wrap"><a class="footer-mark" href="#top">${escapeHtml((profile.name || "G").trim().charAt(0) || "G")}<span>.</span></a><span>© <span>${new Date().getFullYear()}</span> ${escapeHtml(profile.name || "")}</span><span>Made with curiosity in the Nilgiris.</span><a class="back-top" href="#top">BACK TO TOP <span aria-hidden="true">↑</span></a><a class="admin-link" href="admin.html">Edit portfolio</a></footer>`;

  const themeToggle = document.querySelector(".theme-toggle");
  const themeLabel = themeToggle.querySelector(".theme-label");
  const portfolioStatus = document.querySelector("#portfolio-status");
  const setColorMode = (mode, persist = false) => {
    const colorMode = mode === "dark" ? "dark" : "light";
    document.documentElement.dataset.colorMode = colorMode;
    themeToggle.setAttribute("aria-pressed", String(colorMode === "dark"));
    themeToggle.setAttribute("aria-label", `Switch to ${colorMode === "dark" ? "light" : "dark"} mode`);
    themeLabel.textContent = colorMode === "dark" ? "Light" : "Dark";
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = colorMode === "dark" ? "#111a17" : "#f5f6f1";
    if (persist) {
      try {
        localStorage.setItem(COLOR_MODE_KEY, colorMode);
      } catch {
        if (portfolioStatus) portfolioStatus.textContent = "Theme changed, but this preference could not be saved.";
      }
    }
  };
  setColorMode(document.documentElement.dataset.colorMode);
  themeToggle.addEventListener("click", () => {
    const nextMode = document.documentElement.dataset.colorMode === "dark" ? "light" : "dark";
    setColorMode(nextMode, true);
  });

  const marquee = document.querySelector(".skills-marquee");
  const marqueeToggle = document.querySelector(".marquee-toggle");
  marqueeToggle.addEventListener("click", () => {
    const paused = marqueeToggle.getAttribute("aria-pressed") !== "true";
    marqueeToggle.setAttribute("aria-pressed", String(paused));
    marqueeToggle.setAttribute("aria-label", `${paused ? "Resume" : "Pause"} skills ticker`);
    marqueeToggle.querySelector(".marquee-toggle-label").textContent = paused ? "Resume" : "Pause";
    marquee.classList.toggle("is-paused", paused);
  });

  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector(".primary-nav");
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    menuToggle.setAttribute("aria-label", expanded ? "Open navigation" : "Close navigation");
    primaryNav.classList.toggle("is-open", !expanded);
  });
  primaryNav.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    primaryNav.classList.remove("is-open");
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }), { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
  } else {
    document.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
  }
}

async function initializePortfolio() {
  try {
    const response = await fetch("portfolio.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load portfolio content.");
    publishedPortfolio = await response.json();
    let data = publishedPortfolio;
    if (DRAFT_PREVIEW) {
      try {
        data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || publishedPortfolio;
      } catch {
        data = publishedPortfolio;
      }
    }
    renderPortfolio(data);
  } catch (error) {
    document.body.innerHTML = `<main class="page-wrap" style="padding:64px 0"><h1>Portfolio content unavailable</h1><p>${escapeHtml(error.message)} Start the local preview server and open this page over HTTP.</p></main>`;
  }
}

window.addEventListener("storage", (event) => {
  if (!DRAFT_PREVIEW || event.key !== STORAGE_KEY || !publishedPortfolio) return;
  try {
    const updatedPortfolio = event.newValue ? JSON.parse(event.newValue) : publishedPortfolio;
    if (!updatedPortfolio || typeof updatedPortfolio !== "object") {
      throw new Error("The updated portfolio draft is not valid JSON.");
    }
    const scrollPosition = { x: window.scrollX, y: window.scrollY };
    renderPortfolio(updatedPortfolio);
    requestAnimationFrame(() => window.scrollTo(scrollPosition.x, scrollPosition.y));
    const portfolioStatus = document.querySelector("#portfolio-status");
    if (portfolioStatus) portfolioStatus.textContent = "Portfolio preview updated from the editor.";
  } catch (error) {
    console.error("Could not apply the portfolio editor update.", error);
    const portfolioStatus = document.querySelector("#portfolio-status");
    if (portfolioStatus) portfolioStatus.textContent = "The portfolio preview could not apply the latest editor update.";
  }
});

let refreshInProgress = false;
async function refreshPublishedPortfolio() {
  if (refreshInProgress || document.visibilityState === "hidden") return;
  refreshInProgress = true;
  try {
    const response = await fetch(`portfolio.json?refresh=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not refresh published portfolio content (HTTP ${response.status}).`);
    const updatedPortfolio = await response.json();
    if (JSON.stringify(updatedPortfolio) === JSON.stringify(publishedPortfolio)) return;
    publishedPortfolio = updatedPortfolio;
    if (!DRAFT_PREVIEW) {
      const scrollPosition = { x: window.scrollX, y: window.scrollY };
      renderPortfolio(publishedPortfolio);
      requestAnimationFrame(() => window.scrollTo(scrollPosition.x, scrollPosition.y));
      const portfolioStatus = document.querySelector("#portfolio-status");
      if (portfolioStatus) portfolioStatus.textContent = "Portfolio updated with the latest published content.";
    }
  } catch (error) {
    console.error("Could not refresh the published portfolio.", error);
    const portfolioStatus = document.querySelector("#portfolio-status");
    if (portfolioStatus) portfolioStatus.textContent = "The latest portfolio update could not be loaded. Check your connection.";
  } finally {
    refreshInProgress = false;
  }
}

initializePortfolio().then(() => {
  window.setInterval(refreshPublishedPortfolio, 30000);
  document.addEventListener("visibilitychange", refreshPublishedPortfolio);
});
