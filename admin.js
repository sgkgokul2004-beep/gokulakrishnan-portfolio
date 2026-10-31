const STORAGE_KEY = "gokulakrishnanPortfolioDraft";
const FONT_OPTIONS = ["Space Grotesk", "DM Sans", "Manrope", "Montserrat", "Lora", "Playfair Display", "Cormorant Garamond", "Source Sans 3"];
const viewDetails = {
  profile: ["Profile", "Your portfolio name, story, contact information, and hero image."],
  snapshot: ["Highlights", "Edit the quick statistics shown between the hero and experience sections."],
  experience: ["Experience", "Add roles, internships, durations, and concise responsibility notes."],
  education: ["Education", "Keep your qualifications and institution history current."],
  project: ["Project", "Shape the featured project, its images, description, and link."],
  skills: ["Skills", "Organize people skills, technical skills, and languages into groups."],
  certificates: ["Certificates", "Add certificates and attach a PDF or image to each entry."],
  appearance: ["Appearance", "Tune the display type, body font, and portfolio colors."]
};

let defaults;
let content;
let activeView = "profile";
let saveTimer;
const panelContent = document.querySelector("#panel-content");
const form = document.querySelector("#editor-form");
const toast = document.querySelector("#toast");

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const clone = (value) => JSON.parse(JSON.stringify(value));
const getPath = (object, path) => path.split(".").reduce((value, key) => value?.[/^\d+$/.test(key) ? Number(key) : key], object);
const setPath = (object, path, value) => {
  const keys = path.split(".");
  const finalKey = keys.pop();
  const target = keys.reduce((current, key) => current[/^\d+$/.test(key) ? Number(key) : key], object);
  target[/^\d+$/.test(finalKey) ? Number(finalKey) : finalKey] = value;
};

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("is-visible"), 3000);
}

function saveDraft(showMessage = false) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    document.querySelector("#save-state").textContent = "Saved in this browser";
    if (showMessage) showToast("Draft saved on this device.");
  } catch {
    document.querySelector("#save-state").textContent = "Storage full";
    showToast("Browser storage is full. Export your JSON before adding more files.", true);
  }
}

function scheduleSave() {
  document.querySelector("#save-state").textContent = "Saving changes…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveDraft(), 450);
}

function field(label, path, options = {}) {
  const { type = "text", hint = "", placeholder = "", span = false, value: override, list = false } = options;
  const value = override ?? getPath(content, path) ?? "";
  const inputValue = Array.isArray(value) ? value.join("\n") : value;
  const classes = `field${span ? " span-two" : ""}`;
  const hintMarkup = hint ? `<small class="field-hint">${escapeHtml(hint)}</small>` : "";
  const attrs = `data-path="${escapeHtml(path)}"${list ? " data-list=\"true\"" : ""}`;
  if (type === "textarea") return `<div class="${classes}"><label for="${escapeHtml(path)}">${escapeHtml(label)}</label><textarea id="${escapeHtml(path)}" ${attrs} placeholder="${escapeHtml(placeholder)}">${escapeHtml(inputValue)}</textarea>${hintMarkup}</div>`;
  return `<div class="${classes}"><label for="${escapeHtml(path)}">${escapeHtml(label)}</label><input id="${escapeHtml(path)}" type="${escapeHtml(type)}" ${attrs} value="${escapeHtml(inputValue)}" placeholder="${escapeHtml(placeholder)}" />${hintMarkup}</div>`;
}

function imageUpload(label, path, hint = "JPG, PNG, or WebP. Images are optimized before saving.") {
  const value = getPath(content, path) || "";
  const preview = value ? `<div class="upload-preview"><img src="${escapeHtml(value)}" alt="Current image preview" /><span>Current image</span></div>` : "";
  return `<div class="field span-two"><span class="field-label">${escapeHtml(label)}</span><div class="file-field"><input type="file" accept="image/*" data-upload="${escapeHtml(path)}" data-kind="image" aria-label="Upload ${escapeHtml(label)}" /></div>${hint ? `<small class="field-hint">${escapeHtml(hint)}</small>` : ""}${preview}</div>`;
}

function fileUpload(label, path, options = {}) {
  const { accept = ".pdf,image/*", namePath = "", mimePath = "", hint = "PDF or image. Files are stored in the local draft and included in JSON export." } = options;
  const value = getPath(content, path) || "";
  const fileName = namePath ? getPath(content, namePath) : "";
  const preview = value ? `<div class="upload-preview"><a href="${escapeHtml(value)}" target="_blank" rel="noopener">${escapeHtml(fileName || "View current file")}</a></div>` : "";
  return `<div class="field span-two"><span class="field-label">${escapeHtml(label)}</span><div class="file-field"><input type="file" accept="${escapeHtml(accept)}" data-upload="${escapeHtml(path)}" data-kind="file" data-name-path="${escapeHtml(namePath)}" data-mime-path="${escapeHtml(mimePath)}" aria-label="Upload ${escapeHtml(label)}" /></div><small class="field-hint">${escapeHtml(hint)}</small>${preview}</div>`;
}

function card(title, index, fields, removeButton = "") {
  return `<article class="repeater-card"><div class="card-topline"><h3>${escapeHtml(title)}</h3><div><span class="card-index">${String(index + 1).padStart(2, "0")}</span>${removeButton}</div></div><div class="field-grid">${fields}</div></article>`;
}

function panelProfile() {
  return `<div class="panel-heading"><h2>Identity & contact</h2><p>These details appear across your header, contact section, and browser title.</p></div>
    <section class="editor-card"><div class="field-grid">
      ${field("Portfolio / browser title", "siteTitle")}
      ${field("Display name", "profile.name")}
      ${field("Professional headline", "profile.role", { span: true })}
      ${field("Short introduction", "profile.summary", { type: "textarea", span: true })}
      ${field("Location", "profile.location", { type: "textarea", span: true, hint: "Use a new line to control how your location is displayed." })}
      ${field("Availability label", "profile.availability")}
      ${field("Email address", "profile.email", { type: "email" })}
      ${field("Phone number", "profile.phone", { type: "tel" })}
      ${field("Hero image URL", "profile.heroImage", { type: "url", span: true, hint: "Paste a direct image URL, or upload an image below." })}
      ${imageUpload("Upload hero image", "profile.heroImage")}
      ${field("Hero image caption", "profile.heroCaption", { span: true })}
      ${field("Resume file URL", "resume.url", { span: true, hint: "The included resume is already linked. Upload a new PDF below to replace it." })}
      ${fileUpload("Upload resume PDF", "resume.dataUrl", { accept: ".pdf,application/pdf", namePath: "resume.fileName", mimePath: "resume.mimeType", hint: "PDF only. Keep the file under 2 MB for reliable browser storage." })}
    </div></section>`;
}

function panelExperience() {
  const entries = content.experience.map((item, index) => card(item.role || `Experience ${index + 1}`, index, `
    ${field("Role", `experience.${index}.role`)}
    ${field("Company", `experience.${index}.company`)}
    ${field("Category / type", `experience.${index}.category`)}
    ${field("Duration", `experience.${index}.duration`)}
    ${field("Highlights", `experience.${index}.details`, { type: "textarea", list: true, span: true, hint: "Use one responsibility per line." })}
  `, `<button class="remove-button" type="button" data-remove="experience" data-index="${index}">Remove</button>`)).join("");
  return `<div class="panel-heading"><h2>Experience timeline</h2><p>Add or remove roles. Each entry is reflected in the public experience section.</p></div>
    <div class="field-grid editor-card">${field("Section heading", "sectionCopy.experienceTitle", { type: "textarea", span: true })}${field("Section introduction", "sectionCopy.experienceIntro", { type: "textarea", span: true })}</div>
    <div class="repeater">${entries || `<div class="empty-state"><strong>No experience yet</strong>Add your first role to build the timeline.</div>`}</div>
    <button class="add-button" type="button" data-add="experience"><span>＋</span> Add experience</button>`;
}

function panelSnapshot() {
  const entries = content.metrics.map((item, index) => card(item.label || `Highlight ${index + 1}`, index, `
    ${field("Value", `metrics.${index}.value`)}
    ${field("Unit", `metrics.${index}.unit`)}
    ${field("Label", `metrics.${index}.label`, { span: true })}
  `, `<button class="remove-button" type="button" data-remove="metrics" data-index="${index}">Remove</button>`)).join("");
  return `<div class="panel-heading"><h2>Career highlights</h2><p>Use a few compact numbers or short facts that help people scan your experience.</p></div>
    <div class="field-grid editor-card">${field("Snapshot headline", "sectionCopy.snapshotTitle", { type: "textarea", span: true })}</div>
    <div class="repeater">${entries || `<div class="empty-state"><strong>No highlights yet</strong>Add a short metric or project count.</div>`}</div>
    <button class="add-button" type="button" data-add="metrics"><span>＋</span> Add highlight</button>`;
}

function panelEducation() {
  const entries = content.education.map((item, index) => card(item.qualification || `Education ${index + 1}`, index, `
    ${field("Qualification", `education.${index}.qualification`)}
    ${field("Year", `education.${index}.year`, { type: "text" })}
    ${field("Institution", `education.${index}.institution`, { span: true })}
  `, `<button class="remove-button" type="button" data-remove="education" data-index="${index}">Remove</button>`)).join("");
  return `<div class="panel-heading"><h2>Education history</h2><p>Keep qualifications and institutions in a clear, newest-first order.</p></div>
    <div class="field-grid editor-card">${field("Section heading", "sectionCopy.educationTitle", { type: "textarea", span: true })}</div>
    <div class="repeater">${entries || `<div class="empty-state"><strong>No education added</strong>Add your qualifications here.</div>`}</div>
    <button class="add-button" type="button" data-add="education"><span>＋</span> Add education</button>`;
}

function panelProject() {
  return `<div class="panel-heading"><h2>Featured project</h2><p>Tell the story of one project with an image, the problem, and what you built.</p></div>
    <section class="editor-card"><div class="field-grid">
      ${field("Section label", "sectionCopy.projectEyebrow")}
      ${field("Project category", "project.kicker")}
      ${field("Project title", "project.title", { type: "textarea", span: true })}
      ${field("Large display heading", "sectionCopy.projectTitle", { type: "textarea", span: true, hint: "Use a new line to control the visual line breaks." })}
      ${field("Project description", "project.description", { type: "textarea", span: true })}
      ${field("Additional note", "project.note", { type: "textarea", span: true })}
      ${field("Project URL", "project.link", { type: "url", span: true })}
      ${field("Project image URL", "project.image", { type: "url", span: true })}
      ${imageUpload("Upload project image", "project.image")}
      ${field("Image caption", "project.imageCaption", { span: true })}
    </div></section>`;
}

function panelSkills() {
  const groups = content.skillGroups.map((item, index) => card(item.heading || `Skill group ${index + 1}`, index, `
    ${field("Group label", `skillGroups.${index}.label`)}
    ${field("Group heading", `skillGroups.${index}.heading`)}
    ${field("Skills / languages", `skillGroups.${index}.items`, { type: "textarea", list: true, span: true, hint: "Use one item per line." })}
  `, `<button class="remove-button" type="button" data-remove="skillGroups" data-index="${index}">Remove</button>`)).join("");
  return `<div class="panel-heading"><h2>Skill groups</h2><p>Separate technical, people, and language skills into groups.</p></div>
    <div class="field-grid editor-card">${field("Section heading", "sectionCopy.skillsTitle", { type: "textarea", span: true })}${field("Section introduction", "sectionCopy.skillsIntro", { type: "textarea", span: true })}</div>
    <div class="repeater">${groups || `<div class="empty-state"><strong>No skill groups</strong>Add a group to show your capabilities.</div>`}</div>
    <button class="add-button" type="button" data-add="skillGroups"><span>＋</span> Add skill group</button>`;
}

function panelCertificates() {
  const certificates = content.certificates.map((item, index) => card(item.name || `Certificate ${index + 1}`, index, `
    ${field("Certificate name", `certificates.${index}.name`)}
    ${field("Issuer", `certificates.${index}.issuer`)}
    ${field("Date", `certificates.${index}.date`, { type: "text" })}
    ${field("Verification link", `certificates.${index}.url`, { type: "url" })}
    ${fileUpload("Certificate file", `certificates.${index}.fileData`, { namePath: `certificates.${index}.fileName`, mimePath: `certificates.${index}.mimeType`, hint: "PDF or image, up to 2 MB per file." })}
  `, `<button class="remove-button" type="button" data-remove="certificates" data-index="${index}">Remove</button>`)).join("");
  return `<div class="panel-heading"><h2>Certificates & credentials</h2><p>Upload a PDF or image, then add its name, issuer, and date. Empty certificates stay hidden on the portfolio.</p></div>
    <div class="repeater">${certificates || `<div class="empty-state"><strong>No certificates added</strong>Add credentials when you are ready.</div>`}</div>
    <button class="add-button" type="button" data-add="certificates"><span>＋</span> Add certificate</button>`;
}

function panelAppearance() {
  const fontOptions = FONT_OPTIONS.map((font) => `<option value="${escapeHtml(font)}" ${content.theme.displayFont === font ? "selected" : ""}>${escapeHtml(font)}</option>`).join("");
  const bodyOptions = FONT_OPTIONS.map((font) => `<option value="${escapeHtml(font)}" ${content.theme.bodyFont === font ? "selected" : ""}>${escapeHtml(font)}</option>`).join("");
  const colorField = (label, path) => `<div class="field"><label for="${escapeHtml(path)}">${escapeHtml(label)}</label><div class="color-field"><input id="${escapeHtml(path)}" type="color" data-path="${escapeHtml(path)}" value="${escapeHtml(getPath(content, path) || "#ffffff")}" /><span class="color-value">${escapeHtml(getPath(content, path))}</span></div></div>`;
  return `<div class="panel-heading"><h2>Visual direction</h2><p>Control the display type and core palette. Changes update the portfolio preview.</p></div>
    <section class="editor-card"><div class="field-grid">
      <div class="field"><label for="theme.displayFont">Display font</label><select id="theme.displayFont" data-path="theme.displayFont">${fontOptions}</select></div>
      <div class="field"><label for="theme.bodyFont">Body font</label><select id="theme.bodyFont" data-path="theme.bodyFont">${bodyOptions}</select></div>
      ${colorField("Page background", "theme.paper")}
      ${colorField("Main text", "theme.ink")}
      ${colorField("Deep green", "theme.green")}
      ${colorField("Accent", "theme.accent")}
      ${colorField("Lime highlight", "theme.lime")}
      ${field("Custom font name", "theme.customFontName", { hint: "Optional. Upload a WOFF2 font file below." })}
      ${fileUpload("Custom font file", "theme.customFontData", { accept: ".woff2,font/woff2", namePath: "theme.customFontFileName", mimePath: "theme.customFontMime", hint: "Optional WOFF2 file, up to 500 KB. Use a font you have rights to use." })}
    </div></section>
    <div class="panel-heading"><h2>Section details</h2><p>Adjust supporting copy used throughout the portfolio.</p></div>
    <section class="editor-card"><div class="field-grid">
      ${field("Contact heading", "sectionCopy.contactTitle", { type: "textarea", span: true })}
      ${field("Contact message", "sectionCopy.contactMessage", { type: "textarea", span: true })}
      ${field("Browser description", "metaDescription", { type: "textarea", span: true })}
    </div></section>
    <section class="editor-card"><div class="card-topline"><div><h3>Reset local draft</h3><small class="field-hint">Remove browser-only changes and restore the published portfolio.json.</small></div></div><button class="quiet-button" type="button" data-action="reset">Reset to published content</button></section>`;
}

const panels = { profile: panelProfile, snapshot: panelSnapshot, experience: panelExperience, education: panelEducation, project: panelProject, skills: panelSkills, certificates: panelCertificates, appearance: panelAppearance };

function renderPanel() {
  const [title, description] = viewDetails[activeView];
  document.querySelector("#panel-title").textContent = title;
  document.querySelector("#panel-description").textContent = description;
  panelContent.innerHTML = panels[activeView]();
  document.querySelectorAll(".studio-nav-item").forEach((button) => {
    const active = button.dataset.view === activeView;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function processImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a supported image."));
      image.onload = () => {
        const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function setInputValue(target, value) {
  const path = target.dataset.path;
  if (!path) return;
  const parsed = target.dataset.list === "true" ? value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) : value;
  setPath(content, path, parsed);
  scheduleSave();
}

async function handleUpload(input) {
  const file = input.files?.[0];
  if (!file) return;
  const path = input.dataset.upload;
  const kind = input.dataset.kind;
    if (file.size > 2 * 1024 * 1024) {
    showToast("Choose a file smaller than 2 MB.", true);
    input.value = "";
    return;
  }
  if (kind === "image" && !file.type.startsWith("image/")) {
    showToast("Choose an image file.", true);
    return;
  }
    if (path === "resume.dataUrl" && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Choose a PDF resume.", true);
      input.value = "";
      return;
    }
    if (path.startsWith("certificates.") && kind === "file" && !file.type.startsWith("image/") && file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      showToast("Choose a PDF or image certificate.", true);
      input.value = "";
      return;
    }
    if (path === "theme.customFontData" && !/\.woff2$/i.test(file.name)) {
      showToast("Choose a WOFF2 font file.", true);
      input.value = "";
      return;
    }
  if (path === "theme.customFontData" && file.size > 500 * 1024) {
    showToast("Custom fonts must be smaller than 500 KB.", true);
    return;
  }
  try {
      let data = kind === "image" ? await processImage(file) : await readFile(file);
      if (path === "theme.customFontData") data = data.replace(/^data:[^;]+;/, "data:font/woff2;");
    setPath(content, path, data);
    if (input.dataset.namePath) setPath(content, input.dataset.namePath, file.name);
    if (input.dataset.mimePath) setPath(content, input.dataset.mimePath, file.type || "application/octet-stream");
    renderPanel();
    scheduleSave();
    showToast(`${file.name} added to the draft.`);
  } catch (error) {
    showToast(error.message || "Upload failed.", true);
  }
}

function addItem(collection) {
  const newItems = {
    experience: { category: "Role type", role: "New role", company: "Company", duration: "", details: [""] },
    metrics: { value: "", unit: "", label: "New highlight" },
    education: { year: "", qualification: "Qualification", institution: "Institution" },
    skillGroups: { label: "D / Skills", heading: "New skill group", items: [] },
    certificates: { name: "New certificate", issuer: "", date: "", url: "", fileData: "", fileName: "", mimeType: "" }
  };
  content[collection].push(newItems[collection]);
  renderPanel();
  scheduleSave();
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "portfolio.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Exported portfolio.json. Replace the project file to publish it.");
}

async function importJson(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || typeof parsed !== "object" || !parsed.profile || !Array.isArray(parsed.experience) || !Array.isArray(parsed.education)) {
      throw new Error("This file doesn't look like portfolio content JSON.");
    }
    content = parsed;
    renderPanel();
    scheduleSave();
    showToast("Content imported. Save or preview the updated draft.");
  } catch (error) {
    showToast(error.message || "Could not import that JSON file.", true);
  }
}

async function resetDraft() {
  if (!confirm("Reset this browser to the published portfolio.json? Local edits will be removed.")) return;
  localStorage.removeItem(STORAGE_KEY);
  const response = await fetch(`portfolio.json?reload=${Date.now()}`, { cache: "no-store" });
  defaults = await response.json();
  content = clone(defaults);
  renderPanel();
  showToast("Local draft reset to published content.");
  document.querySelector("#save-state").textContent = "Using published content";
}

form.addEventListener("input", (event) => {
  if (event.target.matches("[data-path]")) setInputValue(event.target, event.target.value);
  if (event.target.type === "color") event.target.nextElementSibling.textContent = event.target.value;
});
form.addEventListener("change", (event) => {
  if (event.target.matches("[data-upload]")) handleUpload(event.target);
  else if (event.target.matches("[data-path]")) setInputValue(event.target, event.target.value);
});
form.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) addItem(addButton.dataset.add);
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    const collection = removeButton.dataset.remove;
    content[collection].splice(Number(removeButton.dataset.index), 1);
    renderPanel();
    scheduleSave();
  }
  if (event.target.closest('[data-action="reset"]')) resetDraft();
});

document.querySelector(".studio-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  activeView = button.dataset.view;
  renderPanel();
  document.querySelector(".editor-content").scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelector("#save-button").addEventListener("click", () => {
  clearTimeout(saveTimer);
  saveDraft(true);
});
document.querySelector("#export-button").addEventListener("click", downloadJson);
document.querySelector("#import-button").addEventListener("click", () => document.querySelector("#import-file").click());
document.querySelector("#import-file").addEventListener("change", (event) => {
  if (event.target.files?.[0]) importJson(event.target.files[0]);
  event.target.value = "";
});

async function initialize() {
  try {
    const response = await fetch("portfolio.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load portfolio.json. Open this site through the local preview server.");
    defaults = await response.json();
    try {
      content = JSON.parse(localStorage.getItem(STORAGE_KEY)) || clone(defaults);
    } catch {
      content = clone(defaults);
    }
    renderPanel();
  } catch (error) {
    panelContent.innerHTML = `<div class="empty-state"><strong>Portfolio content unavailable</strong>${escapeHtml(error.message)}</div>`;
    showToast(error.message, true);
  }
}

initialize();
