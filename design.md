# UI/UX Design & Principles

**Version:** 1.1 (Revised)  
**Date:** 2026-10-09

---

## 1. UI/UX Principles
1.  **Content-First:** The chat and the generated artifacts are the core value. Use generous whitespace and clean typography.
2.  **State Transparency:** Always communicate what the system is doing (loading, streaming, errors).
3.  **Strict Safe Previews:** Artifacts must be viewed safely. The viewer uses strict isolation so users trust that viewing an HTML artifact won't execute malicious scripts or break their application layout.
4.  **Graceful Degradation:** Clearly indicate fallbacks to the local model.
5.  **Aesthetics:** Modern, premium look. Dark mode by default, subtle micro-animations.

---

## 2. Information Architecture
### Global Layout
1.  **Left Sidebar (250px):** Session Management & Global Controls
2.  **Main Chat Area (Flexible):** The conversation interface
3.  **Right Sidebar (45-50% width):** Artifact Viewer

### Artifact Viewer Details
-   **Header:** Artifact Title, Toggle (Preview / Source), Copy Button, Close Button
-   **Body (Critical Security):** Sandboxed iframe for HTML (`sandbox=""` - explicitly omitting `allow-scripts` and `allow-same-origin`) to guarantee no JS execution.

---

## 3. Key Interaction States
*(Standard UI interaction states remain unchanged: Initial Load, Sending/Receiving Message, Artifact Generation, Provider Switch, Error)*

---

## 4. Responsive Behavior
*   **Desktop (>1024px):** Full 3-column layout. Sidebar is persistent.
*   **Tablet (768px - 1024px):** Artifact viewer overlays the chat area. Sidebar becomes a drawer.
*   **Mobile (<768px):** Single column. Sidebar is hidden behind a menu icon. Artifacts open in a modal overlay.

---

## 5. Accessibility Considerations (a11y)
*   **Semantic HTML:** Use proper tags.
*   **Keyboard Navigation:** All elements focusable. Artifact Viewer can be closed with `Escape`.
*   **Screen Readers:** `aria-live="polite"` for messages. Iframe has a descriptive `title`.

---

## 6. Design System & Aesthetics (Tailwind/CSS)
*   **Colors (Dark Mode):** Background: `#0f1115`, Surface: `#181b21`, Primary: `#3b82f6`, Text: `#f8fafc`.
*   **Typography:** Modern sans-serif (`Inter`).
*   **Micro-animations:** Slide up and fade in for messages; slide in for artifact viewer.
