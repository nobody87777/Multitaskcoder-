// MultitaskCoder
// Module: Modal Popup

let activeConfirmCallback = null;

/**
 * Creates the global modal container.
 */
export function createModal() {
  const modalEl = document.createElement("div");
  modalEl.id = "appModal";
  modalEl.setAttribute("role", "dialog");
  modalEl.setAttribute("aria-modal", "true");
  modalEl.setAttribute("aria-labelledby", "modalTitle");
  modalEl.setAttribute("aria-describedby", "modalDesc");
  modalEl.className = "fixed inset-0 z-50 bg-black/80 backdrop-blur-md hidden items-center justify-center p-4";
  modalEl.innerHTML = `
    <div class="glass-card border border-purple-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative animate-[fadeInScale_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]">
      <div class="flex justify-between items-center">
        <h3 id="modalTitle" class="text-base font-bold">Feature</h3>
        <button id="modalCloseBtn" aria-label="Close modal dialog" class="w-8 h-8 rounded-full sub-card flex items-center justify-center opacity-75 hover:opacity-100 hover:rotate-90 transition-all cursor-pointer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div id="modalDesc" class="text-xs opacity-85 leading-relaxed space-y-2"></div>
      <div class="pt-2 flex space-x-2" id="modalActions">
        <button id="modalActionBtn" class="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-xs text-white shadow-lg glow-btn active:scale-[0.98] transition-transform cursor-pointer">Got it</button>
      </div>
    </div>
  `;

  const closeBtn = modalEl.querySelector("#modalCloseBtn");
  const actionBtn = modalEl.querySelector("#modalActionBtn");

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (actionBtn) {
    actionBtn.addEventListener("click", () => {
      if (typeof activeConfirmCallback === "function") {
        activeConfirmCallback();
      }
      closeModal();
    });
  }

  // Click outside to close
  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) closeModal();
  });

  // ESC key to close
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalEl.classList.contains("hidden")) {
      closeModal();
    }
  });

  return modalEl;
}

/**
 * Opens the interactive modal with given title, content, button text, and callback.
 */
export function openModal(title, desc, buttonText = "Got it", onConfirm = null) {
  const modal = document.getElementById("appModal");
  if (!modal) return;

  const titleEl = document.getElementById("modalTitle");
  const descEl = document.getElementById("modalDesc");
  const actionBtn = document.getElementById("modalActionBtn");

  if (titleEl) titleEl.innerText = title;
  if (descEl) {
    if (typeof desc === "string" && (desc.startsWith("<") || desc.includes("<br>"))) {
      descEl.innerHTML = desc;
    } else {
      descEl.innerText = desc;
    }
  }
  if (actionBtn) actionBtn.innerText = buttonText;

  activeConfirmCallback = onConfirm;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

/**
 * Closes the interactive modal.
 */
export function closeModal() {
  const modal = document.getElementById("appModal");
  if (!modal) return;

  modal.classList.remove("flex");
  modal.classList.add("hidden");
  activeConfirmCallback = null;
}
