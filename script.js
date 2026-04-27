/* ================================================
   AI Study Summarizer — Pure Vanilla JS
   ================================================ */

"use strict";

/* ============================================================
   0. CONFIGURATION — Replace with your Google Gemini API key
   Get a free one at: https://aistudio.google.com/app/apikey
   ============================================================ */
const API_KEY = "AIzaSyB9IC_YFBH1XKkBNppLn8iL4nXFqKE0V48";

/* ============================================================
   1. COLOR PALETTE SYSTEM
   ============================================================ */
const html = document.documentElement;

const COLOR_PALETTES = [
  { key: "soft-gold",  label: "Soft Gold",  hex: "#F59E0B" },
  { key: "mustard",    label: "Mustard",     hex: "#CA8A04" },
  { key: "champagne",  label: "Champagne",   hex: "#E4C582" },
  { key: "emerald",    label: "Emerald",     hex: "#10B981" },
  { key: "violet",     label: "Violet",      hex: "#8B5CF6" },
  { key: "rose",       label: "Rose",        hex: "#F43F5E" },
  { key: "ocean",      label: "Ocean",       hex: "#0EA5E9" },
  { key: "coral",      label: "Coral",       hex: "#F97316" },
  { key: "teal",       label: "Teal",        hex: "#14B8A6" },
  { key: "pink",       label: "Pink",        hex: "#EC4899" },
];

function initTheme() {
  html.setAttribute("data-theme", "dark");
  const savedShade = localStorage.getItem("ai-study-shade") || "soft-gold";
  applyShade(savedShade);
  renderPaletteSwatches();
}

function applyShade(key) {
  html.setAttribute("data-accent", key);
  localStorage.setItem("ai-study-shade", key);
  const palette = COLOR_PALETTES.find(p => p.key === key);
  const label = document.getElementById("shadeBtnLabel");
  if (label && palette) label.textContent = palette.label;
  document.querySelectorAll(".palette-swatch").forEach(el => {
    el.classList.toggle("active", el.dataset.key === key);
  });
}

function renderPaletteSwatches() {
  const container = document.getElementById("paletteSwatches");
  if (!container) return;
  const currentKey = html.getAttribute("data-accent") || "soft-gold";
  container.innerHTML = COLOR_PALETTES.map(p => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      <button
        class="palette-swatch ${p.key === currentKey ? "active" : ""}"
        data-key="${p.key}"
        style="background:${p.hex};"
        title="${p.label}"
      ></button>
      <span class="palette-swatch-label">${p.label}</span>
    </div>
  `).join("");
  container.querySelectorAll(".palette-swatch").forEach(btn => {
    btn.addEventListener("click", () => {
      applyShade(btn.dataset.key);
      closePaletteModal();
    });
  });
}

function openPaletteModal() {
  document.getElementById("paletteOverlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closePaletteModal() {
  document.getElementById("paletteOverlay").classList.add("hidden");
  document.body.style.overflow = "";
}

// Trigger button
const shadeBtn = document.getElementById("shadeBtn");
if (shadeBtn) {
  shadeBtn.addEventListener("click", openPaletteModal);
}

// Close button inside modal
const paletteCloseBtn = document.getElementById("paletteCloseBtn");
if (paletteCloseBtn) {
  paletteCloseBtn.addEventListener("click", closePaletteModal);
}

// Click on dark backdrop to close
const paletteOverlay = document.getElementById("paletteOverlay");
if (paletteOverlay) {
  paletteOverlay.addEventListener("click", e => {
    if (e.target === paletteOverlay) closePaletteModal();
  });
}

// Escape key to close
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closePaletteModal();
});

/* ============================================================
   2. TAB NAVIGATION
   ============================================================ */
const tabBtns = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

function switchTab(tabId) {
  tabBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== `tab-${tabId}`);
    panel.classList.toggle("active", panel.id === `tab-${tabId}`);
  });
  // Scroll to top on tab switch
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Refresh history when switching to it
  if (tabId === "history") renderHistory();
}

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

/* ============================================================
   TOAST NOTIFICATION SYSTEM
   ============================================================ */
const toastContainer = document.getElementById("toastContainer");

const TOAST_ICONS = {
  success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info:    `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${TOAST_ICONS[type] || TOAST_ICONS.info}<span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-exit");
    toast.addEventListener("animationend", () => toast.remove());
  }, duration);
}

/* ============================================================
   3. SUMMARIZE TAB
   ============================================================ */

// State
let extractedText = ""; // Shared across tabs
let currentSummary = "";
let currentInputMode = "text";

// Elements
const notesInput = document.getElementById("notesInput");
const charCount = document.getElementById("charCount");
const wordCount = document.getElementById("wordCount");
const clearBtn = document.getElementById("clearBtn");
const summarizeBtn = document.getElementById("summarizeBtn");
const summarizeBtnLabel = document.getElementById("summarizeBtnLabel");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const resultState = document.getElementById("resultState");
const summaryContent = document.getElementById("summaryContent");
const copyBtnLabel = document.getElementById("copyBtnLabel");
const savePdfBtn = document.getElementById("savePdfBtn");
const listenBtn = document.getElementById("listenBtn");
const listenPlayIcon = listenBtn.querySelector(".listen-play");
const listenStopIcon = listenBtn.querySelector(".listen-stop");
const summarizeError = document.getElementById("summarizeError");
const summarizeErrorText = document.getElementById("summarizeErrorText");

const micBtn = document.getElementById("micBtn");
const dictationLangBtn = document.getElementById("dictationLangBtn");

const summaryModeSelect = document.getElementById("summaryModeSelect");
const eli10Btn = document.getElementById("eli10Btn");
const chunkProgressWrap = document.getElementById("chunkProgressWrap");
const chunkProgressBar = document.getElementById("chunkProgressBar");
const chunkProgressText = document.getElementById("chunkProgressText");
const loadingText = document.getElementById("loadingText");

// --- Input Mode Toggle ---
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentInputMode = btn.dataset.mode;
    document
      .querySelectorAll(".mode-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    document
      .getElementById("textMode")
      .classList.toggle("hidden", currentInputMode !== "text");
    document
      .getElementById("pdfMode")
      .classList.toggle("hidden", currentInputMode !== "pdf");

    updateCounters();
  });
});

// --- Character / Word Counter ---
function updateCounters() {
  const text = currentInputMode === "text" ? notesInput.value : extractedText;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  charCount.textContent = chars.toLocaleString() + " chars";
  wordCount.textContent = words.toLocaleString() + " words";
  // Color feedback based on length
  charCount.classList.remove("count-good", "count-warn", "count-danger");
  if (chars === 0) return;
  if (chars < 80)       charCount.classList.add("count-warn");
  else if (chars > 15000) charCount.classList.add("count-danger");
  else                  charCount.classList.add("count-good");
}

notesInput.addEventListener("input", () => {
  updateCounters();
  autoResize(notesInput);
});

// --- Auto-resize helper ---
function autoResize(el) {
  el.style.height = "auto";
  el.style.minHeight = Math.min(el.scrollHeight, 420) + "px";
}

// Ctrl+Enter shortcut to summarize
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    const activePanel = document.querySelector(".tab-panel.active");
    if (activePanel?.id === "tab-summarize" && !summarizeBtn.disabled) {
      e.preventDefault();
      runSummarizePipeline();
    }
  }
});

// Auto-resize quizInput too
const _quizInputEl = document.getElementById("quizInput");
if (_quizInputEl) {
  _quizInputEl.addEventListener("input", () => autoResize(_quizInputEl));
}

// --- PDF Upload ---
const pdfDropzone = document.getElementById("pdfDropzone");
const pdfFileInput = document.getElementById("pdfFileInput");
const pdfBrowseBtn = document.getElementById("pdfBrowseBtn");
const pdfIdle = document.getElementById("pdfIdle");
const pdfLoaded = document.getElementById("pdfLoaded");
const pdfFilename = document.getElementById("pdfFilename");
const pdfChars = document.getElementById("pdfChars");
const pdfRemoveBtn = document.getElementById("pdfRemoveBtn");

pdfBrowseBtn.addEventListener("click", () => pdfFileInput.click());
pdfDropzone.addEventListener("click", (e) => {
  if (!e.target.closest("button")) pdfFileInput.click();
});

pdfDropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  pdfDropzone.classList.add("drag-over");
});
pdfDropzone.addEventListener("dragleave", () =>
  pdfDropzone.classList.remove("drag-over"),
);
pdfDropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  pdfDropzone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file && file.type === "application/pdf") handlePdfFile(file);
});
pdfFileInput.addEventListener("change", () => {
  if (pdfFileInput.files[0]) handlePdfFile(pdfFileInput.files[0]);
});

pdfRemoveBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  extractedText = "";
  pdfFileInput.value = "";
  pdfIdle.classList.remove("hidden");
  pdfLoaded.classList.add("hidden");
  updateCounters();
});

async function handlePdfFile(file) {
  pdfFilename.textContent = file.name;
  pdfChars.textContent = "Extracting text…";
  pdfIdle.classList.add("hidden");
  pdfLoaded.classList.remove("hidden");

  try {
    // PDF.js is loaded via CDN
    const workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    extractedText = fullText.trim();
    pdfChars.textContent = `${extractedText.length.toLocaleString()} characters extracted (${pdf.numPages} pages)`;
    updateCounters();
  } catch (err) {
    console.error("PDF extraction error:", err);
    pdfChars.textContent = "Error extracting text. Try another PDF.";
    extractedText = "";
    updateCounters();
  }
}

// --- Summarize Logic ---
function getActiveText() {
  return currentInputMode === "text"
    ? notesInput.value.trim()
    : extractedText.trim();
}

function showSummarizeError(msg) {
  summarizeErrorText.textContent = msg;
  summarizeError.classList.remove("hidden");
}
function hideSummarizeError() {
  summarizeError.classList.add("hidden");
}

function setOutputState(state) {
  emptyState.classList.toggle("hidden", state !== "empty");
  loadingState.classList.toggle("hidden", state !== "loading");
  resultState.classList.toggle("hidden", state !== "result");
  copyBtn.disabled = state !== "result";
  savePdfBtn.disabled = state !== "result";
  listenBtn.disabled = state !== "result";
  
  const testMeWrap = document.getElementById("testMeWrap");
  if (testMeWrap) testMeWrap.classList.toggle("hidden", state !== "result");
}

function bindSmartGlossaryTooltips() {
  const tooltip = document.getElementById("glossaryTooltip");
  if (!tooltip) return;

  document.querySelectorAll(".smart-term").forEach((el) => {
    el.addEventListener("mouseenter", (e) => {
      const def = el.getAttribute("data-def");
      const term = el.textContent;
      tooltip.innerHTML = `<span class="tooltip-title">${term}</span><span>${def}</span>`;
      tooltip.classList.remove("hidden");
      // Add a slight delay for smooth visual before visible class
      requestAnimationFrame(() => {
        tooltip.classList.add("visible");
      });
    });

    el.addEventListener("mousemove", (e) => {
      const offset = 15;
      let left = e.clientX + offset;
      let top = e.clientY + offset;

      if (left + tooltip.offsetWidth > window.innerWidth) {
        left = window.innerWidth - tooltip.offsetWidth - 10;
      }
      if (top + tooltip.offsetHeight > window.innerHeight) {
        top = e.clientY - tooltip.offsetHeight - offset;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    });

    el.addEventListener("mouseleave", () => {
      tooltip.classList.remove("visible");
      setTimeout(() => {
        if (!tooltip.classList.contains("visible")) {
          tooltip.classList.add("hidden");
        }
      }, 200);
    });
  });
}

function renderSummary(text) {
  // 1. Extract Mermaid graph if present
  let mermaidCode = "";
  const mermaidMatch = text.match(/```mermaid\n([\s\S]*?)```/i) || text.match(/```\n(graph TD[\s\S]*?)```/i) || text.match(/```\n(mindmap[\s\S]*?)```/i);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1].trim();
    text = text.replace(mermaidMatch[0], "");
    text = text.replace(/##\s*Mind\s*Map/i, ""); // Clean up heading
  }

  // 2. Parse Glossary Table dynamically
  const glossaryMap = new Map();
  const tableRowRegex = /\|\s*(.*?)\s*\|\s*(.*?)\s*\|/g;
  let match;
  while ((match = tableRowRegex.exec(text)) !== null) {
    const term = match[1].replace(/\*/g, "").trim();
    const def = match[2].trim();
    if (term.toLowerCase() !== "term" && term.length > 2 && !term.includes("---")) {
      glossaryMap.set(term, def);
    }
  }
  const listRegex = /[\-\*]\s*\*\*(.*?)\*\*\s*[:-]\s*(.*)/g;
  while ((match = listRegex.exec(text)) !== null) {
    const term = match[1].trim();
    const def = match[2].trim();
    if (term.length > 2) {
      glossaryMap.set(term, def);
    }
  }

  let highlightedText = text.replace(/\*\*(.*?)\*\*/g, '<span class="highlight">$1</span>');

  // Strip Glossary Table heading if we found terms
  if (glossaryMap.size > 0) {
    highlightedText = highlightedText.replace(/##\s*Glossary\s*Table/gi, "");
  }

  // 3. Auto-link smart terms
  if (glossaryMap.size > 0) {
    const terms = Array.from(glossaryMap.keys()).sort((a, b) => b.length - a.length);
    terms.forEach((term) => {
      const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?![^<]*>)\\b(${safeTerm})\\b`, "gi");
      const definition = escapeHtml(glossaryMap.get(term));
      highlightedText = highlightedText.replace(regex, `<span class="smart-term" data-def="${definition}">$1</span>`);
    });
  }

  // 4. Render Markdown lines
  const lines = highlightedText.split("\n").filter((l) => l.trim());
  let html = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("* ")) {
      const content = trimmed.replace(/^[•\-\*]\s*/, "");
      html += `<div class="bullet-item"><div class="bullet-dot"></div><span>${content}</span></div>`;
    } else if (trimmed.startsWith("#")) {
      const content = trimmed.replace(/^#+\s*/, "");
      html += `<p style="font-weight:700;color:var(--text);margin-top:14px;margin-bottom:6px;font-size:1.1em;">${content}</p>`;
    } else if (trimmed.startsWith(">")) {
      const content = trimmed.replace(/^>\s*/, "");
      html += `<div style="border-left: 4px solid var(--accent); background: var(--surface-hover); padding: 12px 16px; margin: 12px 0; border-radius: 6px; color: var(--text-muted);"><p style="margin:0;">${content}</p></div>`;
    } else if (trimmed.startsWith("|")) {
      // Don't render ANY raw markdown table rows if we successfully extracted glossary pairs
      if (glossaryMap.size > 0) continue;
      html += `<p>${trimmed}</p>`;
    } else if (trimmed) {
      // If we extracted a glossary, ignore stray table-related dashes like |---|---|
      if (glossaryMap.size > 0 && /^[|\s\-]+$/.test(trimmed)) continue;
      html += `<p>${trimmed}</p>`;
    }
  }
  
  summaryContent.innerHTML = html;

  // 5. Render Mermaid Interactive Map
  const mindMapCard = document.getElementById("mindMapCard");
  const mindMapContainer = document.getElementById("mindMapContainer");
  if (mermaidCode && typeof mermaid !== "undefined") {
    mindMapCard.classList.remove("hidden");
    mindMapContainer.innerHTML = "";
    
    // Create a new div with textContent to avoid HTML escape corruption
    const mDiv = document.createElement("div");
    mDiv.className = "mermaid";
    mDiv.textContent = mermaidCode;
    mindMapContainer.appendChild(mDiv);

    setTimeout(async () => {
      try {
        await mermaid.run({ nodes: [mDiv] });
      } catch (e) {
        console.warn("Mermaid parsing failed", e);
        mindMapContainer.innerHTML = "<p style='color:var(--text-dim)'>Could not generate a valid interactive map from the AI output. The generated graph syntax was invalid.</p>";
      }
    }, 50);
  } else if (mindMapCard) {
    mindMapCard.classList.add("hidden");
    if (mindMapContainer) mindMapContainer.innerHTML = "";
  }

  // 6. Bind Hover Tooltips
  bindSmartGlossaryTooltips();
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- Core API Wrapper ---  
async function callGeminiApi(
  systemPrompt,
  userText,
  forceJson = false,
  maxTokens = 8192,
) {
  const reqBody = {
    contents: [{ parts: [{ text: `${systemPrompt}\n\nNotes:\n${userText}` }] }],
    generationConfig: { maxOutputTokens: maxTokens },
  };
  if (forceJson) reqBody.generationConfig.responseMimeType = "application/json";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "API request failed.");
  return data.candidates[0].content.parts[0].text.trim();
}

// --- Text Chunking Engine ---
async function processInChunks(text, systemPrompt, updateProgress) {
  const CHAR_LIMIT = 4000;
  let chunks = [];
  for (let i = 0; i < text.length; i += CHAR_LIMIT) {
    chunks.push(text.substring(i, i + CHAR_LIMIT));
  }

  if (chunks.length <= 1) {
    updateProgress(1, 1);
    return await callGeminiApi(systemPrompt, chunks[0]);
  }

  let chunkSummaries = [];
  for (let i = 0; i < chunks.length; i++) {
    const prompt = `${systemPrompt}\n(Summarize this specific section):`;
    const res = await callGeminiApi(prompt, chunks[i]);
    chunkSummaries.push(res);
    updateProgress(i + 1, chunks.length);
  }

  updateProgress(chunks.length, chunks.length, "Finalizing combination...");
  const combinedText = chunkSummaries.join("\n\n---\n\n");
  const finalPrompt = `Combine and refine these partial summaries into one cohesive, beautifully structured final output following the original instructions exactly. Ensure fluid transitions and no repetition:`;
  return await callGeminiApi(systemPrompt + "\n\n" + finalPrompt, combinedText);
}

const SUMMARY_PROMPT = `
You are an expert academic tutor. Your goal is to transform complex study materials into highly structured, easy-to-understand summaries.

STRICT FORMATTING RULES:
1. Use Markdown for all formatting.
2. Structure: 
   - Start with a "# Main Objective" (One sentence).
   - Use "## Key Concepts" with bullet points for the core ideas.
   - Use "## Glossary Table" detailing exactly 5 critical terms defined clearly formatted as a markdown table (| Term | Definition |).
   - End with "## Mind Map" and provide a markdown mermaid code block (\`\`\`mermaid\ngraph TD...\n\`\`\`) mapping the architectural relationships of the core concepts you just explained. Validate your graph syntax. Ensure all node labels with spaces or special characters are enclosed in double quotes (e.g., A["Node Label"]).
3. Tone: Professional, encouraging, and clear.
4. Language: Always respond in the SAME language as the input text (Arabic for Arabic, English for English).
5. Professionalism: DO NOT use ANY emojis in the output. Maintain a strict, sleek academic aesthetic.
`;

function getSummaryPrompt(mode) {
  const base = SUMMARY_PROMPT;
  switch (mode) {
    case "short":
      return (
        base +
        `\n\nAdditionally: Summarize briefly and concisely. Focus only on the absolute most important takeaways.`
      );
    case "detailed":
      return (
        base +
        `\n\nAdditionally: Provide a highly detailed, comprehensive summary. Capture all key concepts, secondary details, examples, and nuances. Use "•" for each bullet point to maintain readability.`
      );
    case "bullet":
      return (
        base + `\n\nAdditionally: Summarize strictly in quick, easily scannable bullet points for the Detailed Breakdown.`
      );
    case "simple":
      return (
        base +
        `\n\nAdditionally: Explain the material in very simple terms for beginners. Avoid jargon where possible, but if jargon must be used, explain it simply.`
      );
    default:
      return base + `\n\nAdditionally: Provide a clear, cohesive summary.`;
  }
}

async function runSummarizePipeline(promptOverride = null) {
  const text = getActiveText();
  hideSummarizeError();

  if (!text) {
    showSummarizeError("Please enter some text or upload a PDF first.");
    return;
  }

  setOutputState("loading");
  summarizeBtnLabel.textContent = "Analyzing…";
  summarizeBtn.disabled = true;
  eli10Btn.disabled = true;
  summaryModeSelect.disabled = true;
  chunkProgressWrap.classList.remove("hidden");
  chunkProgressBar.style.width = "0%";
  chunkProgressText.textContent = "Starting...";
  loadingText.textContent = "Extracting key insights…";

  try {
    const systemPrompt =
      promptOverride || getSummaryPrompt(summaryModeSelect.value);

    currentSummary = await processInChunks(
      text,
      systemPrompt,
      (current, total, msg) => {
        chunkProgressBar.style.width = `${(current / total) * 100}%`;
        chunkProgressText.textContent =
          msg || `Processing chunk ${current} of ${total}...`;
      },
    );

    renderSummary(currentSummary);
    setOutputState("result");

    saveToHistory({
      inputPreview: text.substring(0, 100) + (text.length > 100 ? "…" : ""),
      summary: currentSummary,
      wordCount: currentSummary.trim().split(/\s+/).length,
    });
  } catch (err) {
    setOutputState("empty");
    showSummarizeError(
      err.message || "Something went wrong. Please try again.",
    );
  } finally {
    summarizeBtnLabel.textContent = "Summarize";
    summarizeBtn.disabled = false;
    eli10Btn.disabled = false;
    summaryModeSelect.disabled = false;
    chunkProgressWrap.classList.add("hidden");
  }
}

summarizeBtn.addEventListener("click", () => runSummarizePipeline());
eli10Btn.addEventListener("click", () => {
  const eli10Prompt = `You are explaining complex topics to a 10-year-old. Explain the following study notes in a very simple, fun, and engaging way as if the reader is 10 years old. Use analogies they would understand. Wrap highly important fun keywords in **asterisks**. Use "#" for fun headings.`;
  runSummarizePipeline(eli10Prompt);
});

// --- Speech-to-Text Dictation ---
let isRecording = false;
let recognition = null;
let currentDictationLang = "en-US";

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  
  dictationLangBtn.addEventListener("click", () => {
    if (currentDictationLang === "en-US") {
      currentDictationLang = "ar-SA";
      dictationLangBtn.textContent = "AR";
    } else {
      currentDictationLang = "en-US";
      dictationLangBtn.textContent = "EN";
    }
    if (isRecording) {
      recognition.stop();
      setTimeout(() => recognition.start(), 300);
    }
  });

  micBtn.addEventListener("click", () => {
    if (!isRecording) {
      recognition.lang = currentDictationLang;
      recognition.start();
      isRecording = true;
      micBtn.classList.add("recording");
    } else {
      recognition.stop();
      isRecording = false;
      micBtn.classList.remove("recording");
    }
  });

  let finalTranscript = "";
  recognition.onstart = () => {
    finalTranscript = notesInput.value;
    if (finalTranscript && !finalTranscript.endsWith(" ") && !finalTranscript.endsWith("\n")) {
      finalTranscript += " ";
    }
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    notesInput.value = finalTranscript + interimTranscript;
    updateCounters();
  };

  recognition.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    isRecording = false;
    micBtn.classList.remove("recording");
  };

  recognition.onend = () => {
    if (isRecording) {
      isRecording = false;
      micBtn.classList.remove("recording");
    }
  };
} else {
  micBtn.style.display = "none";
  dictationLangBtn.style.display = "none";
}

// --- Text-to-Speech Playback ---
let isPlaying = false;

listenBtn.addEventListener("click", () => {
  if (isPlaying) {
    window.speechSynthesis.cancel();
    resetListenButton();
    return;
  }
  
  if (!currentSummary) return;

  const utterance = new SpeechSynthesisUtterance(currentSummary);
  const isArabic = /[\u0600-\u06FF]/.test(currentSummary);
  utterance.lang = isArabic ? "ar-SA" : "en-US";
  
  utterance.onend = resetListenButton;
  utterance.onerror = resetListenButton;
  
  window.speechSynthesis.speak(utterance);
  
  isPlaying = true;
  listenBtn.classList.add("playing");
  listenPlayIcon.classList.add("hidden");
  listenStopIcon.classList.remove("hidden");
  listenBtn.querySelector("span").textContent = "Stop";
});

function resetListenButton() {
  isPlaying = false;
  listenBtn.classList.remove("playing");
  listenPlayIcon.classList.remove("hidden");
  listenStopIcon.classList.add("hidden");
  listenBtn.querySelector("span").textContent = "Listen";
}

// Ensure speech stops if tab is switched
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      resetListenButton();
    }
  });
});

// --- Clear ---
clearBtn.addEventListener("click", () => {
  notesInput.value = "";
  extractedText = "";
  pdfFileInput.value = "";
  pdfIdle.classList.remove("hidden");
  pdfLoaded.classList.add("hidden");
  currentSummary = "";
  setOutputState("empty");
  hideSummarizeError();
  updateCounters();
});

// --- Copy Summary ---
copyBtn.addEventListener("click", async () => {
  if (!currentSummary) return;
  try {
    await navigator.clipboard.writeText(currentSummary);
    showToast("Summary copied to clipboard!", "success");

    // Confetti
    if (typeof confetti === "function") {
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
    }
  } catch (e) {
    showToast("Copy failed — please try again.", "error");
  }
});

// --- Save PDF ---
savePdfBtn.addEventListener("click", () => {
  if (!currentSummary) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Title
  doc.setFontSize(22);
  doc.setTextColor(99, 102, 241); // Accent indigo
  doc.text("AI Study Summary", 20, 22);

  // Date
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 160);
  doc.text(new Date().toLocaleString(), 20, 30);

  // Divider
  doc.setDrawColor(99, 102, 241);
  doc.line(20, 33, 190, 33);

  // Content
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 40);
  const lines = doc.splitTextToSize(currentSummary, 170);
  let y = 42;
  for (const line of lines) {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 20, y);
    y += 7;
  }

  doc.save("ai-study-summary.pdf");
});

// --- Test Me Now Integration ---
const testMeBtn = document.getElementById("testMeBtn");
if (testMeBtn) {
  testMeBtn.addEventListener("click", () => {
    switchTab("quiz");
    document.getElementById("quizInput").value = currentSummary;
    document.getElementById("generateQuizBtn").click();
  });
}

/* ============================================================
   4. QUIZ TAB
   ============================================================ */
let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let answered = false;

const quizInput = document.getElementById("quizInput");
const questionCountSlider = document.getElementById("questionCount");
const questionCountLabel = document.getElementById("questionCountLabel");
const generateQuizBtn = document.getElementById("generateQuizBtn");
const quizBtnLabel = document.getElementById("quizBtnLabel");
const quizError = document.getElementById("quizError");
const quizErrorText = document.getElementById("quizErrorText");
const quizSetup = document.getElementById("quizSetup");
const quizGame = document.getElementById("quizGame");
const quizResults = document.getElementById("quizResults");

const quizQuestion = document.getElementById("quizQuestion");
const quizOptions = document.getElementById("quizOptions");
const questionNum = document.getElementById("questionNum");
const questionTotal = document.getElementById("questionTotal");
const quizScore = document.getElementById("quizScore");
const quizProgressBar = document.getElementById("quizProgressBar");
const quizNextBtn = document.getElementById("quizNextBtn");
const answerFeedback = document.getElementById("answerFeedback");
const feedbackText = document.getElementById("feedbackText");

// Use current notes from summarize tab
document.getElementById("useCurrentNotesBtn").addEventListener("click", () => {
  const text = currentInputMode === "text" ? notesInput.value : extractedText;
  quizInput.value = text;
});

// Sync slider fill track gradient and label
function syncSlider(slider) {
  const min = +slider.min || 1;
  const max = +slider.max || 10;
  const val = +slider.value;
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty("--pct", pct + "%");
}

questionCountSlider.addEventListener("input", () => {
  questionCountLabel.textContent = questionCountSlider.value;
  syncSlider(questionCountSlider);
});

// Apply on first load
syncSlider(questionCountSlider);

const QUIZ_PROMPT_TEMPLATE = `You are an expert examiner. Generate a high-quality quiz based on the provided text.

RULES:
1. Create exactly {{COUNT}} questions.
2. Mix of types: Conceptual (why/how) and Factual (what/when).
3. Format: You MUST return the response as a valid JSON array of objects.
   Example: 
   [
     {
       "question": "What is the primary function of...?",
       "options": ["Option A", "Option B", "Option C", "Option D"],
       "answer": 0,
       "explanation": "Option A is correct because..."
     }
   ]
4. Difficulty: Progressive (starting easy, ending with a challenge).
5. Language: Same language as the input text.`;

generateQuizBtn.addEventListener("click", async () => {
  const text = quizInput.value.trim();
  quizError.classList.add("hidden");

  if (!text) {
    quizErrorText.textContent = "Please enter some study notes first.";
    quizError.classList.remove("hidden");
    return;
  }

  quizBtnLabel.textContent = "Generating…";
  generateQuizBtn.disabled = true;

  try {
    const count = parseInt(questionCountSlider.value);
    const systemPrompt = QUIZ_PROMPT_TEMPLATE.replace('{{COUNT}}', count);

    let raw = await callGeminiApi(systemPrompt, text, true, 4000);
    raw = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0)
      throw new Error("No questions returned. Try with more detailed notes.");

    quizQuestions = parsed;
    startQuizGame();
  } catch (err) {
    quizErrorText.textContent = err.message;
    quizError.classList.remove("hidden");
  } finally {
    quizBtnLabel.textContent = "Generate Quiz";
    generateQuizBtn.disabled = false;
  }
});

function startQuizGame() {
  currentQuestionIndex = 0;
  score = 0;
  quizScore.textContent = "0";
  quizSetup.classList.add("hidden");
  quizResults.classList.add("hidden");
  quizGame.classList.remove("hidden");
  showQuestion(0);
}

function showQuestion(index) {
  answered = false;
  quizNextBtn.disabled = true;
  answerFeedback.classList.add("hidden");
  answerFeedback.className = "answer-feedback hidden";

  const q = quizQuestions[index];
  const total = quizQuestions.length;

  questionNum.textContent = `Question ${index + 1}`;
  questionTotal.textContent = `of ${total}`;
  quizProgressBar.style.width = `${(index / total) * 100}%`;
  quizQuestion.textContent = q.question;

  const letters = ["A", "B", "C", "D"];
  quizOptions.innerHTML = "";
  q.options.forEach((option, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${escapeHtml(option)}</span>`;
    // Fallback to q.correctIndex just in case the AI uses the old format
    const correctAns = q.answer !== undefined ? q.answer : q.correctIndex;
    btn.addEventListener("click", () => handleAnswer(i, correctAns));
    quizOptions.appendChild(btn);
  });
}

function handleAnswer(selected, correct) {
  if (answered) return;
  answered = true;
  quizNextBtn.disabled = false;

  const optionBtns = quizOptions.querySelectorAll(".option-btn");

  optionBtns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === correct) btn.classList.add("correct");
    else if (i === selected && i !== correct) btn.classList.add("wrong");
  });

  const q = quizQuestions[currentQuestionIndex];
  const explanationHtml = q.explanation ? `<div style="margin-top:8px;font-size:0.95em;opacity:0.9;"><strong>Explanation:</strong> ${escapeHtml(q.explanation)}</div>` : "";

  if (selected === correct) {
    score++;
    quizScore.textContent = score;
    answerFeedback.classList.remove("hidden", "wrong-fb");
    answerFeedback.classList.add("correct-fb");
    feedbackText.innerHTML = `✓ Correct! Well done.${explanationHtml}`;
  } else {
    answerFeedback.classList.remove("hidden", "correct-fb");
    answerFeedback.classList.add("wrong-fb");
    feedbackText.innerHTML = `✗ The correct answer was: <strong>${escapeHtml(q.options[correct])}</strong>${explanationHtml}`;
  }
}

quizNextBtn.addEventListener("click", () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < quizQuestions.length) {
    showQuestion(currentQuestionIndex);
  } else {
    showResults();
  }
});

document.getElementById("quizBackBtn").addEventListener("click", () => {
  quizGame.classList.add("hidden");
  quizSetup.classList.remove("hidden");
});

function showResults() {
  quizProgressBar.style.width = "100%";
  quizGame.classList.add("hidden");
  quizResults.classList.remove("hidden");

  const total = quizQuestions.length;
  const pct = Math.round((score / total) * 100);

  document.getElementById("resultsScore").textContent =
    `${score} / ${total} correct`;

  let iconSvg, title, msg;
  if (pct === 100) {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" class="results-svg" stroke="currentColor" stroke-width="2" style="width:64px;height:64px;stroke:var(--accent);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    title = "Perfect Score!";
    msg = "Outstanding! You've mastered this material.";
  } else if (pct >= 70) {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" class="results-svg" stroke="currentColor" stroke-width="2" style="width:64px;height:64px;stroke:var(--accent);"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
    title = "Great Job!";
    msg = "You know your stuff! Review the ones you missed.";
  } else if (pct >= 40) {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" class="results-svg" stroke="currentColor" stroke-width="2" style="width:64px;height:64px;stroke:var(--accent);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    title = "Keep Studying!";
    msg = "Good effort! A little more review will help.";
  } else {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" class="results-svg" stroke="currentColor" stroke-width="2" style="width:64px;height:64px;stroke:var(--accent);"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    title = "Don't Give Up!";
    msg = "Review your notes and try again — you'll improve!";
  }

  document.getElementById("resultsIcon").innerHTML = iconSvg;
  document.getElementById("resultsTitle").textContent = title;
  document.getElementById("resultsMessage").textContent = msg;
}

document.getElementById("quizRetryBtn").addEventListener("click", () => {
  startQuizGame();
});
document.getElementById("quizNewBtn").addEventListener("click", () => {
  quizResults.classList.add("hidden");
  quizSetup.classList.remove("hidden");
});

/* ============================================================
   5. HISTORY TAB
   ============================================================ */
const HISTORY_KEY = "ai-study-summaries-history";
const MAX_HISTORY = 10;

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function saveToHistory({ inputPreview, summary, wordCount }) {
  const history = getHistory();
  const entry = {
    id: Date.now(),
    date: new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    inputPreview,
    summary,
    wordCount,
  };
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
  saveHistory(history);
}

function renderHistory(searchTerm = "") {
  let history = getHistory();
  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  
  clearHistoryBtn.style.display = history.length ? "" : "none";

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    history = history.filter(h => 
      (h.inputPreview && h.inputPreview.toLowerCase().includes(term)) || 
      (h.summary && h.summary.toLowerCase().includes(term))
    );
  }

  if (!history.length) {
    if (searchTerm) {
      historyList.innerHTML = `
        <div class="history-empty" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px; height:32px; margin: 0 auto 10px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>No matches found for "${escapeHtml(searchTerm)}"</p>
        </div>`;
    } else {
      historyList.innerHTML = `
        <div class="history-empty" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:40px; height:40px; margin: 0 auto 10px; color: var(--accent);"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
          <p>No summaries yet. Generate your first one on the Summarize tab!</p>
        </div>`;
    }
    return;
  }

  historyList.innerHTML = history
    .map(
      (entry) => `
    <div class="history-item" data-id="${entry.id}">
      <div class="history-item-header" data-toggle="history-${entry.id}">
        <div class="history-item-meta">
          <span class="history-date">${entry.date}</span>
          <span class="history-preview">${escapeHtml(entry.inputPreview)}</span>
        </div>
        <div class="history-badges">
          <span class="history-badge">${entry.wordCount} words</span>
        </div>
        <div class="history-actions">
          <button class="btn-ghost icon-btn history-copy-btn" data-id="${entry.id}" title="Copy summary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="btn-ghost icon-btn danger history-delete-btn" data-id="${entry.id}" title="Delete">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
          <span class="history-chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </div>
      </div>
      <div class="history-body">
        <pre class="history-summary">${escapeHtml(entry.summary)}</pre>
      </div>
    </div>
  `,
    )
    .join("");

  // Toggle expand
  historyList.querySelectorAll(".history-item-header").forEach((header) => {
    header.addEventListener("click", (e) => {
      if (
        e.target.closest(".history-copy-btn") ||
        e.target.closest(".history-delete-btn")
      )
        return;
      const item = header.closest(".history-item");
      item.classList.toggle("expanded");
    });
  });

  // Copy buttons
  historyList.querySelectorAll(".history-copy-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const entry = getHistory().find((h) => h.id == btn.dataset.id);
      if (!entry) return;
      await navigator.clipboard.writeText(entry.summary);
      btn.title = "Copied!";
      setTimeout(() => (btn.title = "Copy summary"), 2000);
    });
  });

  // Delete buttons
  historyList.querySelectorAll(".history-delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const updated = getHistory().filter((h) => h.id != btn.dataset.id);
      saveHistory(updated);
      renderHistory();
    });
  });
}

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  if (confirm("Clear all history? This cannot be undone.")) {
    saveHistory([]);
    document.getElementById("historySearchInput").value = "";
    renderHistory();
  }
});

const historySearchInput = document.getElementById("historySearchInput");
if (historySearchInput) {
  historySearchInput.addEventListener("input", (e) => {
    renderHistory(e.target.value);
  });
}

/* ============================================================
   7. ABOUT / FAQ TAB
   ============================================================ */
const faqs = [
  {
    q: "What is AI Study Summarizer?",
    a: "It's a free AI-powered tool that transforms your study notes, textbook chapters, or lecture transcripts into concise bullet-point summaries — so you can study smarter, not harder.",
  },
  {
    q: "How does it work?",
    a: "Paste your text or upload a PDF, then click Summarize. The app sends your content to an AI model that extracts the most important concepts and returns a clear, structured summary.",
  },
  {
    q: "Is my data private?",
    a: "Your text is sent to the AI to generate a summary and is not stored permanently. Summaries are saved locally in your browser's localStorage for the History feature — only you can see them.",
  },
  {
    q: "Can I upload PDFs?",
    a: "Yes! Switch to PDF Upload mode on the Summarize tab, then drag & drop or browse for a PDF file. The app extracts all text client-side before summarizing.",
  },
  {
    q: "How do I generate a quiz?",
    a: "Go to the Quiz tab, paste your study notes (or use the 'Use current notes' shortcut), choose how many questions you want with the slider, and click Generate Quiz.",
  },
  {
    q: "How do I download my summary?",
    a: "After a summary is generated, click the 'Save PDF' button. A professionally formatted PDF with your summary will be downloaded immediately.",
  },
  {
    q: "What is the History tab?",
    a: "The History tab stores your last 10 summaries locally in your browser. You can expand any entry to read the full summary, copy it, or delete it.",
  },
];

function initFaq() {
  const faqList = document.getElementById("faqList");
  faqList.innerHTML = faqs
    .map(
      (faq, i) => `
    <div class="faq-item" id="faq-${i}">
      <button class="faq-question" data-faq="${i}">
        <span>${faq.q}</span>
        <span class="faq-chevron">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </button>
      <div class="faq-answer">${faq.a}</div>
    </div>
  `,
    )
    .join("");

  faqList.addEventListener("click", (e) => {
    const btn = e.target.closest(".faq-question");
    if (!btn) return;
    const item = document.getElementById(`faq-${btn.dataset.faq}`);
    const isOpen = item.classList.contains("open");
    // Close all
    faqList
      .querySelectorAll(".faq-item")
      .forEach((el) => el.classList.remove("open"));
    // Open clicked if it wasn't open
    if (!isOpen) item.classList.add("open");
  });
}

/* ============================================================
   8. INIT
   ============================================================ */
initTheme();
initFaq();
updateCounters();
