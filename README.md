# 🧠 Premium Study Summarizer - AI-Powered Learning Assistant

**Premium Study Summarizer** is a modern, sleek, and fully responsive Web Application designed to help students and professionals digest complex information quickly. Powered by the Google Gemini API, it transforms raw study notes and PDFs into highly structured summaries, visual mind maps, and interactive quizzes—all wrapped in a beautiful glassmorphic interface.

## 🌟 Key Features

* **✦ AI-Powered Summaries:** Instantly convert long texts into structured, scannable bullet points, complete with auto-generated glossary tables.
* **📄 PDF Support:** Upload PDF documents directly; text extraction happens securely within your browser using PDF.js.
* **🎯 Interactive Quizzes:** Automatically generate custom multiple-choice quizzes based on your specific study materials to test your retention.
* **🗺️ Dynamic Mind Maps:** Visualize the architectural relationships of core concepts with auto-generated, interactive Mermaid.js charts.
* **🗣️ Dictation & Playback:** Speak your notes into the app using Speech-to-Text, and listen to the final summaries via integrated Text-to-Speech.
* **🎨 Customizable UI:** A sleek dark-mode default with a built-in color palette picker to customize your accent colors.
* **💾 Local History & PDF Export:** Your past summaries are saved to your device's local storage for privacy, and can be exported as cleanly formatted PDFs.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Custom properties, Flexbox/Grid, Glassmorphism)
* **Logic:** Vanilla JavaScript (ES6+)
* **AI Engine:** Google Gemini API (gemini-2.5-flash)
* **Libraries:** PDF.js (Extraction), jsPDF (Export), Mermaid.js (Diagrams), Canvas Confetti (UX)
* **Storage:** Browser `localStorage` API
* **Typography:** Google Fonts (Inter)

## 📱 Installation (PWA)

* **On Mobile:** Open the site in Chrome or Safari and click "Add to Home Screen".
* **On Desktop:** Click the install icon in the browser address bar.

## 📁 Project Structure

```text
├── index.html       # Main application structure, UI shell & modals
├── style.css        # Custom UI components, glassmorphism & responsive themes
└── script.js        # Core app logic, Gemini API integration & state management
