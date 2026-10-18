/* ===== HomeStorage — Application Logic & API Client ===== */

(() => {
  'use strict';

  // ===== CONSTANTS =====
  const DB_NAME = 'homeStorageDB';
  const DB_VERSION = 1;
  const STORE_FILES = 'files';
  const STORE_NOTES = 'notes';
  const TOAST_DURATION = 2800;

  // Auto-detect API base URL (mendukung public domain/tunnel, localhost, dan file://)
  const API_BASE_URL = window.location.protocol.startsWith('http')
    ? `${window.location.origin}/api`
    : 'http://localhost:5000/api';

  // ===== DOM REFERENCES =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    // Navbar & Auth
    navbar: $('#navbar'),
    navToggle: $('#navToggle'),
    navLinks: $('#navLinks'),
    serverStatusPill: $('#serverStatusPill'),
    serverStatusDot: $('#serverStatusDot'),
    serverStatusText: $('#serverStatusText'),
    btnOpenAuth: $('#btnOpenAuth'),
    userProfileMenu: $('#userProfileMenu'),
    userAvatar: $('#userAvatar'),
    userName: $('#userName'),
    btnLogout: $('#btnLogout'),

    // Hero
    heroBadge: $('.hero-badge'),
    statFiles: $('#statFiles'),
    statSize: $('#statSize'),
    statNotes: $('#statNotes'),
    ctaUpload: $('#ctaUpload'),
    ctaStorage: $('#ctaStorage'),

    // Storage Banner & Controls
    storageModeBanner: $('#storageModeBanner'),
    modeIcon: $('#modeIcon'),
    modeTitle: $('#modeTitle'),
    modeChip: $('#modeChip'),
    modeDesc: $('#modeDesc'),
    btnSyncLocal: $('#btnSyncLocal'),
    searchInput: $('#searchInput'),
    btnExport: $('#btnExport'),
    tabFiles: $('#tabFiles'),
    tabNotes: $('#tabNotes'),
    tabFilesCount: $('#tabFilesCount'),
    tabNotesCount: $('#tabNotesCount'),
    panelFiles: $('#panelFiles'),
    panelNotes: $('#panelNotes'),

    // File upload
    dropzone: $('#dropzone'),
    fileInput: $('#fileInput'),
    fileList: $('#fileList'),

    // Notes
    noteTitle: $('#noteTitle'),
    noteContent: $('#noteContent'),
    btnSaveNote: $('#btnSaveNote'),
    noteList: $('#noteList'),

    // Auth Modal
    authModal: $('#authModal'),
    btnAuthClose: $('#btnAuthClose'),
    authModalTitle: $('#authModalTitle'),
    authModalSubtitle: $('#authModalSubtitle'),
    tabBtnLogin: $('#tabBtnLogin'),
    tabBtnRegister: $('#tabBtnRegister'),
    authAlert: $('#authAlert'),
    loginForm: $('#loginForm'),
    registerForm: $('#registerForm'),
    loginEmail: $('#loginEmail'),
    loginPassword: $('#loginPassword'),
    regName: $('#regName'),
    regEmail: $('#regEmail'),
    regPassword: $('#regPassword'),
    btnLoginSubmit: $('#btnLoginSubmit'),
    btnRegisterSubmit: $('#btnRegisterSubmit'),

    // Toast & Confirm
    toastContainer: $('#toastContainer'),
    confirmOverlay: $('#confirmOverlay'),
    confirmMessage: $('#confirmMessage'),
    confirmCancel: $('#confirmCancel'),
    confirmOk: $('#confirmOk'),
  };

  // ===== STATE =====
  let db = null;
  let currentTab = 'files';
  let isServerOnline = false;
  let currentUser = null;

  // ===== API CLIENT =====
  const api = {
    getToken() {
      return localStorage.getItem('homestorage_token');
    },

    setToken(token) {
      if (token) {
        localStorage.setItem('homestorage_token', token);
      } else {
        localStorage.removeItem('homestorage_token');
      }
    },

    getUser() {
      const stored = localStorage.getItem('homestorage_user');
      try {
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    },

    setUser(user) {
      if (user) {
        localStorage.setItem('homestorage_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('homestorage_user');
      }
    },

    getHeaders(isMultipart = false) {
      const headers = {};
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
      }
      return headers;
    },

    async request(endpoint, options = {}) {
      const url = `${API_BASE_URL}${endpoint}`;
      const isMultipart = options.body instanceof FormData;
      const headers = { ...this.getHeaders(isMultipart), ...(options.headers || {}) };

      try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 && this.getToken()) {
          // Token expired atau tidak valid
          this.logout();
          showToast('Sesi Anda telah kedaluwarsa. Silakan masuk kembali.', 'info');
          throw new Error('Sesi kedaluwarsa');
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || `HTTP ${response.status}`);
        }
        return data;
      } catch (err) {
        if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
          isServerOnline = false;
          updateServerStatusUI(false);
          throw new Error('Tidak dapat terhubung ke server backend.');
        }
        throw err;
      }
    },

    async checkHealth() {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          isServerOnline = true;
          updateServerStatusUI(true);
          return true;
        }
      } catch (e) {
        isServerOnline = false;
        updateServerStatusUI(false);
        return false;
      }
      isServerOnline = false;
      updateServerStatusUI(false);
      return false;
    },

    // Auth
    async login(email, password) {
      const res = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.data?.token) {
        this.setToken(res.data.token);
        this.setUser(res.data.user);
        currentUser = res.data.user;
      }
      return res;
    },

    async register(name, email, password) {
      const res = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (res.data?.token) {
        this.setToken(res.data.token);
        this.setUser(res.data.user);
        currentUser = res.data.user;
      }
      return res;
    },

    async getMe() {
      if (!this.getToken()) return null;
      const res = await this.request('/auth/me', { method: 'GET' });
      if (res.data?.user) {
        this.setUser(res.data.user);
        currentUser = res.data.user;
        return currentUser;
      }
      return null;
    },

    logout() {
      this.setToken(null);
      this.setUser(null);
      currentUser = null;
      updateAuthUI();
      refreshUI();
    },

    // Files
    async getFiles(query = '') {
      const q = query ? `?q=${encodeURIComponent(query)}` : '';
      const res = await this.request(`/files${q}`, { method: 'GET' });
      return res.data || [];
    },

    async uploadFiles(fileList) {
      const formData = new FormData();
      for (const file of fileList) {
        formData.append('files', file);
      }
      return await this.request('/files/upload', {
        method: 'POST',
        body: formData,
      });
    },

    async downloadFile(id, filename) {
      const token = this.getToken();
      const url = `${API_BASE_URL}/files/${id}/download`;

      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error('Gagal mengunduh file.');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    },

    async deleteFile(id) {
      return await this.request(`/files/${id}`, { method: 'DELETE' });
    },

    // Notes
    async getNotes(query = '') {
      const q = query ? `?q=${encodeURIComponent(query)}` : '';
      const res = await this.request(`/notes${q}`, { method: 'GET' });
      return res.data || [];
    },

    async createNote(title, content) {
      return await this.request('/notes', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });
    },

    async deleteNote(id) {
      return await this.request(`/notes/${id}`, { method: 'DELETE' });
    },

    // Backup
    async exportBackup() {
      const token = this.getToken();
      const res = await fetch(`${API_BASE_URL}/backup/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Gagal mengekspor data dari server.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split('T')[0];
      const a = document.createElement('a');
      a.href = url;
      a.download = `home-storage-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    async importData(payload) {
      return await this.request('/backup/import', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  };

  // Helper mode: apakah saat ini sedang dalam Cloud Mode (Login & Server Online)
  function isCloudMode() {
    return Boolean(currentUser && api.getToken() && isServerOnline);
  }

  // ===== INDEXEDDB (OFFLINE / LOCAL STORAGE) =====
  function openDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        showToast('Browser Anda tidak mendukung IndexedDB.', 'error');
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(STORE_FILES)) {
          database.createObjectStore(STORE_FILES, { keyPath: 'id', autoIncrement: true });
        }
        if (!database.objectStoreNames.contains(STORE_NOTES)) {
          database.createObjectStore(STORE_NOTES, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };

      request.onerror = (e) => {
        showToast('Gagal membuka IndexedDB lokal.', 'error');
        reject(e.target.error);
      };
    });
  }

  function dbTransaction(storeName, mode) {
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  function dbGetAll(storeName) {
    return new Promise((resolve, reject) => {
      if (!db) return resolve([]);
      const store = dbTransaction(storeName, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  function dbAdd(storeName, data) {
    return new Promise((resolve, reject) => {
      const store = dbTransaction(storeName, 'readwrite');
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function dbDelete(storeName, id) {
    return new Promise((resolve, reject) => {
      const store = dbTransaction(storeName, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ===== FILE OPERATIONS =====
  async function saveFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    if (isCloudMode()) {
      // Cloud Upload via API
      try {
        showToast(`Mengunggah ${fileList.length} file ke server...`, 'info');
        const res = await api.uploadFiles(fileList);
        showToast(res.message || `${fileList.length} file berhasil diunggah!`, 'success');
        await refreshUI();
      } catch (err) {
        console.error('API Upload error:', err);
        showToast(`Gagal mengunggah ke server: ${err.message}`, 'error');
      }
    } else {
      // Local Upload via IndexedDB
      let count = 0;
      for (const file of fileList) {
        try {
          await dbAdd(STORE_FILES, {
            name: file.name,
            type: file.type,
            size: file.size,
            blob: file,
            date: Date.now(),
          });
          count++;
        } catch (err) {
          console.error('Error saving local file:', err);
          showToast(`Gagal menyimpan "${file.name}".`, 'error');
        }
      }
      if (count > 0) {
        showToast(`${count} file disimpan di browser (Mode Lokal)!`, 'success');
        await refreshUI();
      }
    }
  }

  async function downloadFile(id, fileName) {
    if (isCloudMode()) {
      try {
        await api.downloadFile(id, fileName);
      } catch (err) {
        showToast(`Gagal mengunduh: ${err.message}`, 'error');
      }
    } else {
      try {
        const store = dbTransaction(STORE_FILES, 'readonly');
        const request = store.get(id);
        request.onsuccess = () => {
          const file = request.result;
          if (!file) return;
          const url = URL.createObjectURL(file.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        showToast('Gagal mengunduh file lokal.', 'error');
      }
    }
  }

  async function deleteFile(id) {
    if (isCloudMode()) {
      try {
        await api.deleteFile(id);
        showToast('File berhasil dihapus dari server.', 'success');
        await refreshUI();
      } catch (err) {
        showToast(`Gagal menghapus file: ${err.message}`, 'error');
      }
    } else {
      try {
        await dbDelete(STORE_FILES, id);
        showToast('File berhasil dihapus dari browser.', 'success');
        await refreshUI();
      } catch (err) {
        showToast('Gagal menghapus file lokal.', 'error');
      }
    }
  }

  // ===== NOTE OPERATIONS =====
  async function saveNote() {
    const title = dom.noteTitle.value.trim();
    const content = dom.noteContent.value.trim();

    if (!title && !content) {
      showToast('Judul atau isi catatan tidak boleh kosong.', 'error');
      return;
    }

    if (isCloudMode()) {
      try {
        await api.createNote(title || 'Tanpa Judul', content);
        dom.noteTitle.value = '';
        dom.noteContent.value = '';
        showToast('Catatan berhasil disimpan ke server!', 'success');
        await refreshUI();
      } catch (err) {
        showToast(`Gagal menyimpan catatan: ${err.message}`, 'error');
      }
    } else {
      try {
        await dbAdd(STORE_NOTES, {
          title: title || 'Tanpa Judul',
          content,
          date: Date.now(),
        });
        dom.noteTitle.value = '';
        dom.noteContent.value = '';
        showToast('Catatan disimpan di browser (Mode Lokal)!', 'success');
        await refreshUI();
      } catch (err) {
        showToast('Gagal menyimpan catatan lokal.', 'error');
      }
    }
  }

  async function copyNote(title, content) {
    try {
      const text = `${title}\n\n${content}`;
      await navigator.clipboard.writeText(text);
      showToast('Catatan berhasil disalin ke clipboard!', 'success');
    } catch (err) {
      showToast('Gagal menyalin catatan.', 'error');
    }
  }

  async function deleteNote(id) {
    if (isCloudMode()) {
      try {
        await api.deleteNote(id);
        showToast('Catatan berhasil dihapus dari server.', 'success');
        await refreshUI();
      } catch (err) {
        showToast(`Gagal menghapus catatan: ${err.message}`, 'error');
      }
    } else {
      try {
        await dbDelete(STORE_NOTES, id);
        showToast('Catatan berhasil dihapus dari browser.', 'success');
        await refreshUI();
      } catch (err) {
        showToast('Gagal menghapus catatan lokal.', 'error');
      }
    }
  }

  // ===== EXPORT =====
  async function exportAllData() {
    dom.btnExport.disabled = true;
    const originalText = dom.btnExport.innerHTML;
    dom.btnExport.innerHTML = `
      <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      Mengekspor...
    `;

    try {
      if (isCloudMode()) {
        await api.exportBackup();
        showToast('Data cloud berhasil diekspor!', 'success');
      } else {
        const files = await dbGetAll(STORE_FILES);
        const notes = await dbGetAll(STORE_NOTES);

        if (files.length === 0 && notes.length === 0) {
          showToast('Tidak ada data lokal untuk diekspor.', 'info');
          return;
        }

        const exportFiles = [];
        for (const file of files) {
          const base64 = await blobToBase64(file.blob);
          exportFiles.push({
            name: file.name,
            type: file.type,
            size: file.size,
            date: file.date,
            data: base64,
          });
        }

        const exportNotes = notes.map((n) => ({
          title: n.title,
          content: n.content,
          date: n.date,
        }));

        const backup = {
          app: 'HomeStorage',
          version: '1.1',
          exportedAt: new Date().toISOString(),
          files: exportFiles,
          notes: exportNotes,
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().split('T')[0];
        const a = document.createElement('a');
        a.href = url;
        a.download = `home-storage-backup-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Data lokal berhasil diekspor!', 'success');
      }
    } catch (err) {
      console.error('Export error:', err);
      showToast(`Gagal mengekspor data: ${err.message}`, 'error');
    } finally {
      dom.btnExport.disabled = false;
      dom.btnExport.innerHTML = originalText;
    }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // Ambil hanya base64 data jika ada prefix data URL
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  // ===== SYNC LOCAL DATA TO CLOUD =====
  async function syncLocalToCloud() {
    if (!isCloudMode()) {
      openAuthModal();
      return;
    }

    const localFiles = await dbGetAll(STORE_FILES);
    const localNotes = await dbGetAll(STORE_NOTES);

    if (localFiles.length === 0 && localNotes.length === 0) {
      showToast('Tidak ada data lokal yang perlu disinkronkan.', 'info');
      return;
    }

    const confirmed = await showConfirm(
      `Unggah ${localFiles.length} file dan ${localNotes.length} catatan lokal ke akun server Anda?`
    );
    if (!confirmed) return;

    dom.btnSyncLocal.disabled = true;
    showToast('Sedang menyinkronkan data lokal ke cloud...', 'info');

    try {
      const exportFiles = [];
      for (const file of localFiles) {
        const base64 = await blobToBase64(file.blob);
        exportFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
        });
      }

      const exportNotes = localNotes.map((n) => ({
        title: n.title,
        content: n.content,
      }));

      await api.importData({ files: exportFiles, notes: exportNotes });

      showToast('Sinkronisasi selesai! Data lokal berhasil diunggah ke server.', 'success');
      await refreshUI();
    } catch (err) {
      console.error('Sync error:', err);
      showToast(`Gagal sinkronisasi: ${err.message}`, 'error');
    } finally {
      dom.btnSyncLocal.disabled = false;
    }
  }

  // ===== UI RENDERING =====
  async function refreshUI() {
    const query = dom.searchInput.value.trim();
    let files = [];
    let notes = [];

    if (isCloudMode()) {
      try {
        files = await api.getFiles(query);
        notes = await api.getNotes(query);

        // Standarisasi properti data dari backend
        files = files.map((f) => ({
          id: f.id,
          name: f.original_name,
          size: Number(f.size),
          type: f.mime_type,
          date: new Date(f.created_at || f.createdAt).getTime(),
        }));

        notes = notes.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          date: new Date(n.created_at || n.createdAt).getTime(),
        }));
      } catch (err) {
        console.error('Error fetching cloud data:', err);
        showToast('Gagal memuat data dari server. Menampilkan penyimpanan lokal.', 'error');
        files = await dbGetAll(STORE_FILES);
        notes = await dbGetAll(STORE_NOTES);
      }
    } else {
      files = await dbGetAll(STORE_FILES);
      notes = await dbGetAll(STORE_NOTES);
    }

    updateStats(files, notes);
    renderFiles(files, query);
    renderNotes(notes, query);
    updateTabCounts(files, notes);
    updateStorageBannerUI();
  }

  function updateStats(files, notes) {
    const totalSize = files.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
    dom.statFiles.textContent = files.length;
    dom.statSize.textContent = formatSize(totalSize);
    dom.statNotes.textContent = notes.length;
  }

  function updateTabCounts(files, notes) {
    if (files.length > 0) {
      dom.tabFilesCount.textContent = files.length;
      dom.tabFilesCount.classList.add('visible');
    } else {
      dom.tabFilesCount.classList.remove('visible');
    }

    if (notes.length > 0) {
      dom.tabNotesCount.textContent = notes.length;
      dom.tabNotesCount.classList.add('visible');
    } else {
      dom.tabNotesCount.classList.remove('visible');
    }
  }

  function renderFiles(files, query = '') {
    let list = [...files];

    // Jika mode lokal, lakukan filtering dan sorting di sisi klien
    if (!isCloudMode()) {
      list.sort((a, b) => b.date - a.date);
      if (query) {
        const q = query.toLowerCase();
        list = list.filter((f) => f.name.toLowerCase().includes(q));
      }
    }

    if (list.length === 0) {
      dom.fileList.innerHTML = query
        ? createEmptyState('search', `Tidak ada file yang cocok dengan "${escapeHtml(query)}"`)
        : createEmptyState('files', 'Belum ada file tersimpan');
      return;
    }

    dom.fileList.innerHTML = list
      .map(
        (file) => `
      <div class="file-card" data-id="${file.id}">
        <div class="file-icon ${getFileIconClass(file.type)}">
          ${getFileIconSVG(file.type)}
        </div>
        <div class="file-info">
          <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
          <div class="file-meta">
            <span>${formatSize(file.size)}</span>
            <span>${formatDate(file.date)}</span>
            ${isCloudMode() ? '<span class="mode-chip chip-cloud" style="padding:0 5px;font-size:9px;">Cloud</span>' : ''}
          </div>
        </div>
        <div class="item-actions">
          <button class="action-btn action-btn-download" title="Unduh" data-action="download" data-id="${file.id}" data-name="${escapeHtml(file.name)}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button class="action-btn action-btn-delete" title="Hapus" data-action="delete-file" data-id="${file.id}" data-name="${escapeHtml(file.name)}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </div>
    `
      )
      .join('');
  }

  function renderNotes(notes, query = '') {
    let list = [...notes];

    if (!isCloudMode()) {
      list.sort((a, b) => b.date - a.date);
      if (query) {
        const q = query.toLowerCase();
        list = list.filter(
          (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
        );
      }
    }

    if (list.length === 0) {
      dom.noteList.innerHTML = query
        ? createEmptyState('search', `Tidak ada catatan yang cocok dengan "${escapeHtml(query)}"`)
        : createEmptyState('notes', 'Belum ada catatan tersimpan');
      return;
    }

    dom.noteList.innerHTML = list
      .map(
        (note) => `
      <div class="note-card" data-id="${note.id}">
        <div class="file-icon file-icon-document">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </div>
        <div class="note-info">
          <div class="note-title">${escapeHtml(note.title)}</div>
          <div class="note-meta">
            <span>${formatDate(note.date)}</span>
            ${isCloudMode() ? '<span class="mode-chip chip-cloud" style="padding:0 5px;font-size:9px;">Cloud</span>' : ''}
          </div>
          ${note.content ? `<div class="note-preview">${escapeHtml(note.content)}</div>` : ''}
        </div>
        <div class="item-actions">
          <button class="action-btn action-btn-copy" title="Salin" data-action="copy" data-title="${escapeHtml(note.title)}" data-content="${escapeHtml(note.content)}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button class="action-btn action-btn-delete" title="Hapus" data-action="delete-note" data-id="${note.id}" data-name="${escapeHtml(note.title)}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </div>
    `
      )
      .join('');
  }

  function createEmptyState(type, message) {
    const icons = {
      files: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>`,
      notes: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>`,
      search: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>`,
    };

    const descs = {
      files: 'Unggah file pertama Anda melalui area di atas.',
      notes: 'Tulis catatan pertama Anda menggunakan form di atas.',
      search: 'Coba kata kunci yang berbeda.',
    };

    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icons[type]}</div>
        <div class="empty-state-title">${message}</div>
        <div class="empty-state-desc">${descs[type]}</div>
      </div>
    `;
  }

  // ===== SERVER STATUS & AUTH UI =====
  function updateServerStatusUI(online) {
    if (online) {
      dom.serverStatusDot.className = 'status-dot status-online';
      dom.serverStatusText.textContent = 'Server Online';
    } else {
      dom.serverStatusDot.className = 'status-dot status-offline';
      dom.serverStatusText.textContent = 'Server Offline';
    }
    updateStorageBannerUI();
  }

  function updateAuthUI() {
    if (currentUser) {
      dom.btnOpenAuth.classList.add('hidden');
      dom.userProfileMenu.classList.remove('hidden');

      const initial = (currentUser.name || 'U').charAt(0).toUpperCase();
      dom.userAvatar.textContent = initial;
      dom.userName.textContent = currentUser.name || 'User';

      if (dom.heroBadge) {
        dom.heroBadge.innerHTML = `
          <span class="badge-dot" style="background:#10b981;box-shadow:0 0 8px #10b981"></span>
          Akun: ${escapeHtml(currentUser.name)} (Penyimpanan Cloud Terhubung)
        `;
      }
    } else {
      dom.btnOpenAuth.classList.remove('hidden');
      dom.userProfileMenu.classList.add('hidden');

      if (dom.heroBadge) {
        dom.heroBadge.innerHTML = `
          <span class="badge-dot"></span>
          100% tersimpan di perangkat Anda (Mode Lokal)
        `;
      }
    }
    updateStorageBannerUI();
  }

  function updateStorageBannerUI() {
    if (isCloudMode()) {
      dom.modeIcon.textContent = '☁️';
      dom.modeTitle.textContent = `Penyimpanan Cloud (${currentUser.name})`;
      dom.modeChip.textContent = 'Cloud API';
      dom.modeChip.className = 'mode-chip chip-cloud';
      dom.modeDesc.textContent =
        'File dan catatan Anda tersinkronisasi aman ke server database PostgreSQL/SQLite.';
      dom.btnSyncLocal.classList.remove('hidden');
    } else if (currentUser && !isServerOnline) {
      dom.modeIcon.textContent = '⚠️';
      dom.modeTitle.textContent = 'Server Backend Offline';
      dom.modeChip.textContent = 'Offline Mode';
      dom.modeChip.className = 'mode-chip';
      dom.modeDesc.textContent =
        'Server backend sedang tidak aktif. Beroperasi sementara menggunakan IndexedDB lokal browser.';
      dom.btnSyncLocal.classList.add('hidden');
    } else {
      dom.modeIcon.textContent = '💾';
      dom.modeTitle.textContent = 'Penyimpanan Lokal (Offline)';
      dom.modeChip.textContent = 'IndexedDB';
      dom.modeChip.className = 'mode-chip';
      dom.modeDesc.textContent =
        'Data tersimpan di browser Anda. Masuk ke akun untuk beralih ke penyimpanan server cloud.';
      dom.btnSyncLocal.classList.add('hidden');
    }
  }

  // ===== AUTH MODAL HANDLERS =====
  function openAuthModal(defaultTab = 'login') {
    switchAuthTab(defaultTab);
    clearAuthAlert();
    dom.authModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      if (defaultTab === 'login') {
        dom.loginEmail.focus();
      } else {
        dom.regName.focus();
      }
    }, 150);
  }

  function closeAuthModal() {
    dom.authModal.classList.remove('active');
    document.body.style.overflow = '';
    clearAuthAlert();
  }

  function switchAuthTab(tab) {
    if (tab === 'login') {
      dom.tabBtnLogin.classList.add('active');
      dom.tabBtnRegister.classList.remove('active');
      dom.loginForm.classList.remove('hidden');
      dom.registerForm.classList.add('hidden');
      dom.authModalTitle.textContent = 'Masuk ke Akun Anda';
      dom.authModalSubtitle.textContent = 'Akses file dan catatan Anda dengan aman dari mana saja.';
    } else {
      dom.tabBtnLogin.classList.remove('active');
      dom.tabBtnRegister.classList.add('active');
      dom.loginForm.classList.add('hidden');
      dom.registerForm.classList.remove('hidden');
      dom.authModalTitle.textContent = 'Buat Akun Baru';
      dom.authModalSubtitle.textContent =
        'Daftar untuk menikmati backup otomatis dan penyimpanan cloud.';
    }
    clearAuthAlert();
  }

  function showAuthAlert(message, type = 'error') {
    dom.authAlert.className = `auth-alert alert-${type}`;
    dom.authAlert.textContent = message;
    dom.authAlert.classList.remove('hidden');
  }

  function clearAuthAlert() {
    dom.authAlert.className = 'auth-alert hidden';
    dom.authAlert.textContent = '';
  }

  // ===== TOAST =====
  function showToast(message, type = 'success') {
    const icons = {
      success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
      <div class="toast-progress"></div>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, TOAST_DURATION);
  }

  // ===== CONFIRM DIALOG =====
  function showConfirm(message) {
    return new Promise((resolve) => {
      dom.confirmMessage.textContent = message;
      dom.confirmOverlay.classList.add('active');

      const cleanup = () => {
        dom.confirmOverlay.classList.remove('active');
      };

      dom.confirmOk.onclick = () => {
        cleanup();
        resolve(true);
      };
      dom.confirmCancel.onclick = () => {
        cleanup();
        resolve(false);
      };
      dom.confirmOverlay.onclick = (e) => {
        if (e.target === dom.confirmOverlay) {
          cleanup();
          resolve(false);
        }
      };
    });
  }

  // ===== TAB SWITCHING =====
  function switchTab(tab) {
    currentTab = tab;

    dom.tabFiles.classList.toggle('active', tab === 'files');
    dom.tabNotes.classList.toggle('active', tab === 'notes');
    dom.panelFiles.classList.toggle('active', tab === 'files');
    dom.panelNotes.classList.toggle('active', tab === 'notes');

    dom.searchInput.placeholder = tab === 'files' ? 'Cari file...' : 'Cari catatan...';
    dom.searchInput.value = '';
    refreshUI();
  }

  // ===== UTILITIES =====
  function formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
    return `${size} ${units[i]}`;
  }

  function formatDate(timestamp) {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getFileIconClass(type) {
    if (!type) return 'file-icon-default';
    if (type.startsWith('image/')) return 'file-icon-image';
    if (type.startsWith('video/')) return 'file-icon-video';
    if (type.startsWith('audio/')) return 'file-icon-audio';
    if (type === 'application/pdf') return 'file-icon-pdf';
    if (
      type.includes('zip') ||
      type.includes('rar') ||
      type.includes('7z') ||
      type.includes('tar') ||
      type.includes('compressed')
    )
      return 'file-icon-archive';
    if (type.includes('word') || type.includes('document') || type.includes('text/plain'))
      return 'file-icon-document';
    if (type.includes('sheet') || type.includes('excel') || type.includes('csv'))
      return 'file-icon-spreadsheet';
    if (
      type.includes('javascript') ||
      type.includes('json') ||
      type.includes('html') ||
      type.includes('css') ||
      type.includes('xml') ||
      type.includes('python')
    )
      return 'file-icon-code';
    return 'file-icon-default';
  }

  function getFileIconSVG(type) {
    if (!type) return fileIconSVGs.default;
    if (type.startsWith('image/')) return fileIconSVGs.image;
    if (type.startsWith('video/')) return fileIconSVGs.video;
    if (type.startsWith('audio/')) return fileIconSVGs.audio;
    if (type === 'application/pdf') return fileIconSVGs.pdf;
    if (
      type.includes('zip') ||
      type.includes('rar') ||
      type.includes('7z') ||
      type.includes('tar') ||
      type.includes('compressed')
    )
      return fileIconSVGs.archive;
    if (type.includes('word') || type.includes('document') || type.includes('text/plain'))
      return fileIconSVGs.document;
    if (type.includes('sheet') || type.includes('excel') || type.includes('csv'))
      return fileIconSVGs.spreadsheet;
    if (
      type.includes('javascript') ||
      type.includes('json') ||
      type.includes('html') ||
      type.includes('css') ||
      type.includes('xml') ||
      type.includes('python')
    )
      return fileIconSVGs.code;
    return fileIconSVGs.default;
  }

  const fileIconSVGs = {
    image: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    video: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
    audio: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    pdf: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    archive: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    document: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    spreadsheet: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
    code: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    default: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  };

  // ===== EVENT LISTENERS =====
  function setupEventListeners() {
    // -- Navbar scroll --
    window.addEventListener('scroll', () => {
      dom.navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // -- Navbar toggle (mobile) --
    dom.navToggle.addEventListener('click', () => {
      dom.navToggle.classList.toggle('active');
      dom.navLinks.classList.toggle('open');
    });

    // Close mobile nav on link click
    dom.navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        dom.navToggle.classList.remove('active');
        dom.navLinks.classList.remove('open');
      });
    });

    // -- Auth Trigger Buttons --
    dom.btnOpenAuth.addEventListener('click', () => openAuthModal('login'));
    dom.btnLogout.addEventListener('click', async () => {
      const confirmed = await showConfirm('Apakah Anda yakin ingin keluar dari akun?');
      if (confirmed) {
        api.logout();
        showToast('Anda telah keluar dari akun.', 'info');
      }
    });

    // -- Modal Tab switching & Close --
    dom.btnAuthClose.addEventListener('click', closeAuthModal);
    dom.authModal.addEventListener('click', (e) => {
      if (e.target === dom.authModal) closeAuthModal();
    });

    dom.tabBtnLogin.addEventListener('click', () => switchAuthTab('login'));
    dom.tabBtnRegister.addEventListener('click', () => switchAuthTab('register'));

    // Toggle Password Visibility
    $$('.btn-toggle-pwd').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (input) {
          const isPwd = input.type === 'password';
          input.type = isPwd ? 'text' : 'password';
          btn.style.color = isPwd ? 'var(--color-primary-light)' : 'var(--text-tertiary)';
        }
      });
    });

    // -- Login Form Submit --
    dom.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthAlert();

      const email = dom.loginEmail.value.trim();
      const password = dom.loginPassword.value;

      if (!email || !password) {
        showAuthAlert('Email dan kata sandi wajib diisi.');
        return;
      }

      dom.btnLoginSubmit.disabled = true;
      const originalText = dom.btnLoginSubmit.innerHTML;
      dom.btnLoginSubmit.innerHTML = `
        <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Memverifikasi...
      `;

      try {
        await api.login(email, password);
        closeAuthModal();
        dom.loginForm.reset();
        showToast(`Selamat datang kembali, ${currentUser.name}!`, 'success');
        updateAuthUI();
        await refreshUI();
      } catch (err) {
        showAuthAlert(err.message || 'Login gagal. Periksa kembali email dan kata sandi.');
      } finally {
        dom.btnLoginSubmit.disabled = false;
        dom.btnLoginSubmit.innerHTML = originalText;
      }
    });

    // -- Register Form Submit --
    dom.registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthAlert();

      const name = dom.regName.value.trim();
      const email = dom.regEmail.value.trim();
      const password = dom.regPassword.value;

      if (!name || !email || !password) {
        showAuthAlert('Semua kolom wajib diisi.');
        return;
      }

      if (password.length < 6) {
        showAuthAlert('Kata sandi minimal 6 karakter.');
        return;
      }

      dom.btnRegisterSubmit.disabled = true;
      const originalText = dom.btnRegisterSubmit.innerHTML;
      dom.btnRegisterSubmit.innerHTML = `
        <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Mendaftarkan...
      `;

      try {
        await api.register(name, email, password);
        closeAuthModal();
        dom.registerForm.reset();
        showToast(`Akun berhasil dibuat! Selamat datang, ${currentUser.name}!`, 'success');
        updateAuthUI();
        await refreshUI();
      } catch (err) {
        showAuthAlert(err.message || 'Registrasi gagal. Silakan coba kembali.');
      } finally {
        dom.btnRegisterSubmit.disabled = false;
        dom.btnRegisterSubmit.innerHTML = originalText;
      }
    });

    // -- Sync Local Button --
    dom.btnSyncLocal.addEventListener('click', syncLocalToCloud);

    // -- CTA Upload --
    dom.ctaUpload.addEventListener('click', () => {
      document.getElementById('storage').scrollIntoView({ behavior: 'smooth' });
      switchTab('files');
      setTimeout(() => dom.fileInput.click(), 600);
    });

    // -- Tabs --
    dom.tabFiles.addEventListener('click', () => switchTab('files'));
    dom.tabNotes.addEventListener('click', () => switchTab('notes'));

    // -- Dropzone --
    dom.dropzone.addEventListener('click', () => dom.fileInput.click());

    dom.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dom.dropzone.classList.add('dragover');
    });

    dom.dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dom.dropzone.classList.remove('dragover');
    });

    dom.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dom.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        saveFiles(e.dataTransfer.files);
      }
    });

    dom.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        saveFiles(e.target.files);
        e.target.value = ''; // Reset input agar file sama bisa diunggah ulang
      }
    });

    // -- File / Note actions (delegated) --
    dom.fileList.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const name = btn.dataset.name;

      if (action === 'download') {
        downloadFile(id, name);
      } else if (action === 'delete-file') {
        const confirmed = await showConfirm(`Hapus file "${name}"?`);
        if (confirmed) deleteFile(id);
      }
    });

    dom.noteList.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'copy') {
        const title = btn.dataset.title;
        const content = btn.dataset.content;
        copyNote(title, content);
      } else if (action === 'delete-note') {
        const name = btn.dataset.name;
        const confirmed = await showConfirm(`Hapus catatan "${name}"?`);
        if (confirmed) deleteNote(id);
      }
    });

    // -- Save note --
    dom.btnSaveNote.addEventListener('click', saveNote);

    // -- Shortcut Ctrl+Enter untuk Note --
    const handleCtrlEnter = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveNote();
      }
    };
    dom.noteContent.addEventListener('keydown', handleCtrlEnter);
    dom.noteTitle.addEventListener('keydown', handleCtrlEnter);

    // -- Search --
    let searchTimeout;
    dom.searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => refreshUI(), 250);
    });

    // -- Export --
    dom.btnExport.addEventListener('click', exportAllData);

    // -- Scroll animations --
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    $$('.animate-on-scroll').forEach((el) => observer.observe(el));
  }

  // ===== INITIALIZATION =====
  async function init() {
    try {
      // 1. Inisialisasi IndexedDB lokal
      await openDB();

      // 2. Setup semua event listeners
      setupEventListeners();

      // 3. Ping status server backend
      await api.checkHealth();

      // 4. Verifikasi sesi login pengguna yang tersimpan
      if (api.getToken()) {
        try {
          await api.getMe();
        } catch (e) {
          console.warn('Token saved in localStorage is expired or invalid:', e.message);
        }
      }

      // 5. Update tampilan Auth & Refresh UI
      updateAuthUI();
      await refreshUI();

      // 6. Polling berkala cek koneksi backend (setiap 30 detik)
      setInterval(async () => {
        const previouslyOnline = isServerOnline;
        await api.checkHealth();
        if (previouslyOnline !== isServerOnline) {
          updateStorageBannerUI();
          refreshUI();
        }
      }, 30000);
    } catch (err) {
      console.error('Initialization error:', err);
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
