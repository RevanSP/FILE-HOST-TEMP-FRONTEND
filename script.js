const elements = {
  form: document.getElementById("uploadForm"),
  area: document.getElementById("uploadArea"),
  input: document.getElementById("fileInput"),
  info: document.getElementById("fileInfo"),
  name: document.getElementById("fileName"),
  size: document.getElementById("fileSize"),
  submit: document.getElementById("submitBtn"),
  btnText: document.getElementById("btnText"),
  uploadIcon: document.getElementById("uploadIcon"),
  loadingIcon: document.getElementById("loadingIcon"),
  result: document.getElementById("uploadResult"),
  copyButton: document.getElementById("copyButton"),
  progress: {
    container: document.getElementById("progressContainer"),
    bar: document.getElementById("progressBar"),
    text: document.getElementById("progressText"),
    status: document.getElementById("progressStatus")
  },
  historyButton: document.querySelector('[data-lucide="history"]').parentElement,
  historyModal: document.getElementById("historyModal"),
  closeModal: document.getElementById("closeModal"),
  searchInput: document.getElementById("searchInput"),
  historyTableBody: document.getElementById("historyTableBody"),
  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  currentPageSpan: document.getElementById("currentPage"),
  totalPagesSpan: document.getElementById("totalPages"),
  selectAllCheckbox: document.getElementById("selectAllCheckbox"),
  deleteSelectedButton: document.getElementById("deleteSelectedButton")
};

elements.area.addEventListener("click", e => {
  e.preventDefault();
  e.stopPropagation();
  elements.input.click();
});

elements.input.addEventListener("click", e => e.stopPropagation());

elements.area.addEventListener("dragover", e => {
  e.preventDefault();
  elements.area.classList.add("dragover");
});

elements.area.addEventListener("dragleave", e => {
  if (!elements.area.contains(e.relatedTarget)) {
    elements.area.classList.remove("dragover");
  }
});

elements.area.addEventListener("drop", e => {
  e.preventDefault();
  elements.area.classList.remove("dragover");
  const files = e.dataTransfer.files;
  if (files.length) {
    elements.input.files = files;
    displayFileInfo(files[0]);
  }
});

const updateButtonState = (isValid) => {
  elements.submit.disabled = !isValid;
  elements.submit.setAttribute('aria-disabled', !isValid);
  if (!isValid) {
    elements.submit.style.pointerEvents = 'none';
    elements.submit.style.opacity = '0.5';
  } else {
    elements.submit.style.pointerEvents = 'auto';
    elements.submit.style.opacity = '1';
  }
};

elements.input.addEventListener("change", e => {
  if (e.target.files.length) {
    const file = e.target.files[0];
    displayFileInfo(file);
    updateButtonState(true);
  } else {
    updateButtonState(false);
    elements.info.classList.add("hidden");
  }
});

const displayFileInfo = file => {
  elements.name.textContent = file.name;
  elements.size.textContent = formatFileSize(file.size);
  elements.info.classList.remove("hidden");
  elements.area.classList.add("success-glow");
  setTimeout(() => elements.area.classList.remove("success-glow"), 2000);
};

const formatFileSize = bytes => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const updateProgress = (percent, status) => {
  elements.progress.bar.style.width = `${percent}%`;
  elements.progress.text.textContent = `${percent}%`;
  elements.progress.status.textContent = status;
  if (percent === 100) {
    elements.btnText.textContent = "COMPLETED !";
  }
};

const setLoadingState = isLoading => {
  elements.submit.disabled = isLoading;
  elements.btnText.textContent = "PROCESSING ...";
  elements.uploadIcon.classList.toggle("hidden", isLoading);
  elements.loadingIcon.classList.toggle("hidden", !isLoading);
  elements.progress.container.classList.toggle("hidden", !isLoading);
  if (isLoading) updateProgress(0, "Preparing upload...");
};

elements.result.addEventListener("input", () => {
  elements.copyButton.disabled = !elements.result.value;
});

let currentPage = 1;
const itemsPerPage = 10;
let filteredHistory = [];
let selectedItems = new Set();

const saveToHistory = (url) => {
  const history = getHistory();
  const newItem = {
    url,
    timestamp: Date.now(),
    expiresAt: Date.now() + (3 * 60 * 60 * 1000)
  };
  history.unshift(newItem);
  localStorage.setItem('uploadHistory', JSON.stringify(history));
};

const getHistory = () => {
  const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
  return history.filter(item => item.expiresAt > Date.now());
};

const formatTimeLeft = (expiresAt) => {
  const now = Date.now();
  const timeLeft = expiresAt - now;
  const hours = Math.floor(timeLeft / (60 * 60 * 1000));
  const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}h ${minutes}m`;
};

const deleteFromHistory = (url) => {
  const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
  const updatedHistory = history.filter(item => item.url !== url);
  localStorage.setItem('uploadHistory', JSON.stringify(updatedHistory));
  renderHistory();
};

const deleteSelectedFromHistory = () => {
  const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
  const updatedHistory = history.filter(item => !selectedItems.has(item.url));
  localStorage.setItem('uploadHistory', JSON.stringify(updatedHistory));
  selectedItems.clear();
  renderHistory();
};

const toggleSelectAll = (checked) => {
  const checkboxes = document.querySelectorAll('.item-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = checked;
    const url = checkbox.dataset.url;
    if (checked) {
      selectedItems.add(url);
    } else {
      selectedItems.delete(url);
    }
  });
  updateDeleteSelectedButton();
};

const toggleItemSelection = (url, checked) => {
  if (checked) {
    selectedItems.add(url);
  } else {
    selectedItems.delete(url);
  }
  updateDeleteSelectedButton();

  const checkboxes = document.querySelectorAll('.item-checkbox');
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  elements.selectAllCheckbox.checked = allChecked;
};

const updateDeleteSelectedButton = () => {
  elements.deleteSelectedButton.disabled = selectedItems.size === 0;
  elements.deleteSelectedButton.classList.toggle('opacity-50', selectedItems.size === 0);
};

const renderHistory = () => {
  const history = getHistory();
  const searchTerm = elements.searchInput.value.toLowerCase();

  filteredHistory = history.filter(item =>
    item.url.toLowerCase().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredHistory.slice(start, end);

  if (history.length === 0) {
    elements.historyTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="py-8 text-center">
          <div class="flex flex-col items-center gap-2 text-white/60">
            <i data-lucide="inbox" class="h-12 w-12"></i>
            <p class="text-sm">No upload history yet</p>
            <p class="text-xs">Your uploaded files will appear here</p>
          </div>
        </td>
      </tr>
    `;
    currentPage = 1;
  } else if (filteredHistory.length === 0) {
    elements.historyTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="py-8 text-center">
          <div class="flex flex-col items-center gap-2 text-white/60">
            <i data-lucide="search-x" class="h-12 w-12"></i>
            <p class="text-sm">No results found</p>
            <p class="text-xs">Try different search terms</p>
          </div>
        </td>
      </tr>
    `;
    currentPage = 1;
  } else {
    elements.historyTableBody.innerHTML = pageItems.map(item => `
      <tr class="border-b border-white/10 hover:bg-white/5">
        <td class="py-3 px-4">
          <input type="checkbox" class="item-checkbox glass2 border-white/20" data-url="${item.url}" ${selectedItems.has(item.url) ? 'checked' : ''}>
        </td>
        <td class="py-3 px-4">
          <span class="truncate max-w-[300px] block">${item.url}</span>
        </td>
        <td class="py-3 px-4">${formatTimeLeft(item.expiresAt)}</td>
        <td class="py-3 px-4">
          <div class="flex items-center justify-end gap-2">
            <button class="copy-link glass px-2 py-2 rounded-lg text-xs glass2 hover:bg-white/20 border border-white/20 text-white font-semibold transition flex items-center gap-1" data-url="${item.url}">
              <i data-lucide="copy" class="h-4 w-4"></i>
            </button>
            <a href="${item.url}" target="_blank" class="glass px-2 py-2 rounded-lg text-xs glass2 hover:bg-white/20 border border-white/20 text-white font-semibold transition flex items-center gap-1">
              <i data-lucide="external-link" class="h-4 w-4"></i>
            </a>
            <button class="delete-link glass px-2 py-2 rounded-lg text-xs glass2 hover:bg-white/20 border border-white/20 text-white font-semibold transition flex items-center gap-1" data-url="${item.url}">
              <i data-lucide="trash-2" class="h-4 w-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  elements.currentPageSpan.textContent = currentPage;
  elements.totalPagesSpan.textContent = totalPages || 1;
  elements.prevPage.disabled = currentPage === 1 || filteredHistory.length === 0;
  elements.nextPage.disabled = currentPage === totalPages || filteredHistory.length === 0;

  elements.prevPage.classList.toggle('opacity-50', elements.prevPage.disabled);
  elements.nextPage.classList.toggle('opacity-50', elements.nextPage.disabled);

  document.querySelectorAll('.item-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      toggleItemSelection(e.target.dataset.url, e.target.checked);
    });
  });

  lucide.createIcons();
};

elements.historyButton.addEventListener('click', () => {
  elements.historyModal.classList.remove('hidden');
  elements.historyModal.offsetHeight;
  elements.historyModal.classList.add('flex');
  elements.historyModal.classList.remove('opacity-0');
  elements.historyModal.querySelector('.glass').classList.remove('scale-95');
  renderHistory();
});

elements.closeModal.addEventListener('click', () => {
  elements.historyModal.classList.add('opacity-0');
  elements.historyModal.querySelector('.glass').classList.add('scale-95');
  setTimeout(() => {
    elements.historyModal.classList.add('hidden');
    elements.historyModal.classList.remove('flex');
  }, 300);
});

elements.searchInput.addEventListener('input', () => {
  currentPage = 1;
  renderHistory();
});

elements.prevPage.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderHistory();
  }
});

elements.nextPage.addEventListener('click', () => {
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderHistory();
  }
});

elements.historyTableBody.addEventListener('click', (e) => {
  if (e.target.closest('.copy-link')) {
    const url = e.target.closest('.copy-link').dataset.url;
    const button = e.target.closest('.copy-link');

    copyToClipboard(url);

    button.innerHTML = `<i data-lucide="check" class="h-4 w-4"></i>`;
    lucide.createIcons();

    setTimeout(() => {
      button.innerHTML = `<i data-lucide="copy" class="h-4 w-4"></i>`;
      lucide.createIcons();
    }, 3000);
  } else if (e.target.closest('.delete-link')) {
    const url = e.target.closest('.delete-link').dataset.url;
    const button = e.target.closest('.delete-link');

    button.innerHTML = `<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i>`;
    lucide.createIcons();

    setTimeout(() => {
      deleteFromHistory(url);
    }, 300);
  }
});

const showResult = (type, message, url = null) => {
  if (type === "success" && url) {
    elements.result.value = url;
    elements.result.classList.remove("hidden");
    elements.copyButton.disabled = false;
    saveToHistory(url);
  } else {
    elements.result.value = message;
    elements.result.classList.remove("hidden");
    elements.copyButton.disabled = true;
    if (type === "error") {
      elements.area.classList.add("error-glow");
      setTimeout(() => elements.area.classList.remove("error-glow"), 3000);
    }
  }
};

elements.copyButton.addEventListener("click", (e) => {
  e.preventDefault();
  const text = elements.result.value;
  if (text) {
    copyToClipboard(text);
  }
});

const copyToClipboard = async text => {
  try {
    await navigator.clipboard.writeText(text);
    const icon = document.getElementById("copyIcon");
    const existingSvg = icon.querySelector("svg");
    if (existingSvg) {
      existingSvg.remove();
    }
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    setTimeout(() => {
      const checkSvg = icon.querySelector("svg");
      if (checkSvg) {
        checkSvg.remove();
      }
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
    }, 3000);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    const icon = document.getElementById("copyIcon");
    const existingSvg = icon.querySelector("svg");
    if (existingSvg) {
      existingSvg.remove();
    }
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    setTimeout(() => {
      const checkSvg = icon.querySelector("svg");
      if (checkSvg) {
        checkSvg.remove();
      }
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
    }, 3000);
  }
};

const resetForm = () => {
  elements.input.value = '';
  elements.info.classList.add("hidden");
  elements.submit.disabled = true;
  elements.btnText.textContent = "UPLOAD";
  elements.uploadIcon.classList.remove("hidden");
  elements.loadingIcon.classList.add("hidden");
  elements.progress.container.classList.add("hidden");
  elements.area.classList.remove("success-glow");
  updateButtonState(false);
};

elements.form.addEventListener("submit", e => {
  e.preventDefault();
  const file = elements.input.files[0];

  if (!file) {
    showResult("error", "Silakan pilih file terlebih dahulu");
    updateButtonState(false);
    return;
  }

  const formData = new FormData();
  formData.append("files[]", file);
  setLoadingState(true);
  elements.result.innerHTML = "";

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener("progress", e => {
    if (e.lengthComputable) {
      updateProgress(Math.round((e.loaded / e.total) * 100), "Uploading...");
    }
  });

  xhr.addEventListener("load", () => {
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.success && data.files?.[0]?.url) {
          updateProgress(100, "Upload complete !");
          setTimeout(() => {
            showResult("success", "File berhasil diunggah!", data.files[0].url);
            resetForm();
          }, 500);
        } else {
          showResult("error", data.description || "Gagal mengunggah file");
          updateButtonState(false);
          resetForm();
          console.error("Upload failed:", data);
        }
      } catch (error) {
        showResult("error", "Invalid response from server");
        updateButtonState(false);
        resetForm();
        console.error("Parse error:", error);
      }
    } else {
      try {
        const data = JSON.parse(xhr.responseText);
        showResult("error", data.description || `Upload failed with status: ${xhr.status}`);
        updateButtonState(false);
        resetForm();
      } catch (error) {
        showResult("error", `Upload failed with status: ${xhr.status}`);
        updateButtonState(false);
        resetForm();
      }
    }
  });

  xhr.addEventListener("error", () => {
    showResult("error", "Network error occurred");
    updateButtonState(false);
    resetForm();
  });

  xhr.open("POST", "/upload");
  xhr.send(formData);
});

elements.selectAllCheckbox.addEventListener('change', (e) => {
  toggleSelectAll(e.target.checked);
});

elements.deleteSelectedButton.addEventListener('click', () => {
  if (selectedItems.size > 0) {
    deleteSelectedFromHistory();
  }
});