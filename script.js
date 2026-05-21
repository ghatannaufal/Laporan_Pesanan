/* =============================================
   CopyCenter Hub — script.js
   Dashboard Logic, Dummy Data, UI Interactions
   ============================================= */

'use strict';

// ======================================================
//  DATA STORE — semua pesanan tersimpan di sini
// ======================================================
let orders = [
  {
    id: 'CCH-001',
    customer: 'Rina Agustina',
    file: 'skripsi_bab1-3.pdf',
    paper: 'A4',
    type: 'bw',
    pages: 80,
    binding: 'biasa',
    total: 85000,   // 80 x 1000 + 5000 jilid
    status: 'Sudah Diambil',
    date: '2025-05-10'
  },
  {
    id: 'CCH-002',
    customer: 'Daffa Ramadhan',
    file: 'laporan_magang.docx',
    paper: 'A4',
    type: 'color',
    pages: 45,
    binding: 'tidak',
    total: 90000,   // 45 x 2000
    status: 'Selesai',
    date: '2025-05-12'
  },
  {
    id: 'CCH-003',
    customer: 'Siti Nuraini',
    file: 'proposal_PKM.pdf',
    paper: 'A4',
    type: 'bw',
    pages: 25,
    binding: 'biasa',
    total: 30000,   // 25 x 1000 + 5000 jilid
    status: 'Dicetak',
    date: '2025-05-14'
  },
  {
    id: 'CCH-004',
    customer: 'Bagas Pratama',
    file: 'presentasi_seminar.pdf',
    paper: 'A3',
    type: 'color',
    pages: 20,
    binding: 'tidak',
    total: 40000,   // 20 x 2000
    status: 'Diproses',
    date: '2025-05-15'
  },
  {
    id: 'CCH-005',
    customer: 'Layla Kusuma',
    file: 'tugas_akhir_layla.pdf',
    paper: 'F4',
    type: 'bw',
    pages: 120,
    binding: 'biasa',
    total: 125000,  // 120 x 1000 + 5000 jilid
    status: 'Sudah Diambil',
    date: '2025-05-08'
  },
  {
    id: 'CCH-006',
    customer: 'Hendra Wijaya',
    file: 'brosur_perusahaan.pdf',
    paper: 'A4',
    type: 'color',
    pages: 10,
    binding: 'tidak',
    total: 20000,   // 10 x 2000
    status: 'Selesai',
    date: '2025-05-13'
  },
  {
    id: 'CCH-007',
    customer: 'Mega Cantika',
    file: 'modul_pelatihan.docx',
    paper: 'A4',
    type: 'bw',
    pages: 60,
    binding: 'biasa',
    total: 65000,   // 60 x 1000 + 5000 jilid
    status: 'Diproses',
    date: '2025-05-15'
  },
  {
    id: 'CCH-008',
    customer: 'Rizky Firmansyah',
    file: 'undangan_wisuda.pdf',
    paper: 'Letter',
    type: 'color',
    pages: 5,
    binding: 'tidak',
    total: 10000,   // 5 x 2000
    status: 'Dicetak',
    date: '2025-05-14'
  }
];

// Counter ID urutan berikutnya
let nextId = 9;

// ID pesanan yang sedang diedit statusnya
let editingOrderId = null;

// ======================================================
//  INISIALISASI
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
  setCurrentDate();
  setupNavigation();
  setupSidebar();
  setupDarkMode();
  setupUploadZone();
  calcPrice();
  renderAll();
});

// ======================================================
//  TANGGAL HARI INI
// ======================================================
function setCurrentDate() {
  const el = document.getElementById('currentDate');
  if (!el) return;
  const now = new Date();
  const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  el.textContent = now.toLocaleDateString('id-ID', options);
}

// ======================================================
//  NAVIGASI HALAMAN
// ======================================================
function setupNavigation() {
  // Klik nav-item di sidebar
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  // Klik "Lihat Semua" di dashboard
  document.querySelectorAll('[data-page]').forEach(el => {
    if (el.tagName === 'A' && !el.classList.contains('nav-item')) {
      el.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(el.dataset.page);
      });
    }
  });
}

function navigateTo(page) {
  // Sembunyikan semua section
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  // Nonaktifkan semua nav-item
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Mapping page => section id dan title
  const map = {
    'dashboard': { sectionId: 'pageDashboard', title: 'Dashboard' },
    'new-order': { sectionId: 'pageNewOrder', title: 'Pesanan Baru' },
    'orders':    { sectionId: 'pageOrders',    title: 'Riwayat Pesanan' }
  };

  const target = map[page];
  if (!target) return;

  document.getElementById(target.sectionId).classList.add('active');
  document.getElementById('pageTitle').textContent = target.title;

  // Aktifkan nav-item yang sesuai
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  // Tutup sidebar di mobile
  closeMobileSidebar();

  // Re-render supaya data selalu fresh
  renderAll();
}

// ======================================================
//  SIDEBAR MOBILE
// ======================================================
function setupSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });

  overlay.addEventListener('click', () => closeMobileSidebar());
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

// ======================================================
//  DARK / LIGHT MODE
// ======================================================
function setupDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  const icon = document.getElementById('darkModeIcon');
  const label = document.getElementById('darkModeLabel');
  const html = document.documentElement;

  // Load saved preference
  const saved = localStorage.getItem('cc-theme') || 'dark';
  html.setAttribute('data-theme', saved);
  updateDarkModeUI(saved === 'dark', icon, label);

  toggle.addEventListener('click', e => {
    e.preventDefault();
    const isDark = html.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('cc-theme', newTheme);
    updateDarkModeUI(!isDark, icon, label);
    showToast('info', `Mode ${newTheme === 'dark' ? 'gelap' : 'terang'} diaktifkan`);
  });
}

function updateDarkModeUI(isDark, icon, label) {
  icon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
  label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

// ======================================================
//  UPLOAD ZONE
// ======================================================
function setupUploadZone() {
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const preview = document.getElementById('filePreview');
  const fileName = document.getElementById('fileName');
  const removeBtn = document.getElementById('removeFile');

  // Klik zone => trigger file input
  zone.addEventListener('click', () => fileInput.click());

  // File dipilih
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      showFilePreview(fileInput.files[0], zone, preview, fileName);
    }
  });

  // Drag and drop
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && isValidFile(file)) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      showFilePreview(file, zone, preview, fileName);
    } else {
      showToast('error', 'Format file tidak valid. Gunakan PDF, DOC, atau DOCX.');
    }
  });

  // Hapus file
  removeBtn.addEventListener('click', () => {
    fileInput.value = '';
    zone.style.display = 'block';
    preview.style.display = 'none';
    fileName.textContent = '—';
  });
}

function isValidFile(file) {
  const allowed = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  return allowed.includes(file.type) || /\.(pdf|doc|docx)$/i.test(file.name);
}

function showFilePreview(file, zone, preview, fileName) {
  if (!isValidFile(file)) {
    showToast('error', 'Format file tidak valid. Gunakan PDF, DOC, atau DOCX.');
    return;
  }
  zone.style.display = 'none';
  preview.style.display = 'flex';
  fileName.textContent = file.name;
  document.getElementById('fileError').style.display = 'none';
}

// ======================================================
//  HITUNG HARGA OTOMATIS
// ======================================================
function calcPrice() {
  const pages = parseInt(document.getElementById('pageCount')?.value) || 0;
  const type = document.getElementById('printType')?.value || 'bw';
  const binding = document.getElementById('bindingType')?.value || 'tidak';

  // Tampilkan/sembunyikan input harga spiral
  const spiralWrap = document.getElementById('spiralPriceWrap');
  if (spiralWrap) spiralWrap.style.display = binding === 'spiral' ? 'block' : 'none';

  const pricePerPage = type === 'color' ? 2000 : 1000;
  const printTotal = pages * pricePerPage;

  let bindingCost = 0;
  let bindingLabel = 'Rp 0';
  if (binding === 'biasa') {
    bindingCost = 5000;
    bindingLabel = 'Rp 5.000';
  } else if (binding === 'spiral') {
    const spiralVal = parseInt(document.getElementById('spiralPrice')?.value) || 0;
    bindingCost = spiralVal;
    bindingLabel = spiralVal > 0 ? `Rp ${spiralVal.toLocaleString('id-ID')}` : '(belum diisi)';
  }

  const total = printTotal + bindingCost;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('previewPages', `${pages} hal`);
  setEl('previewPrice', `Rp ${pricePerPage.toLocaleString('id-ID')}`);
  setEl('previewPrintTotal', `Rp ${printTotal.toLocaleString('id-ID')}`);
  setEl('previewBinding', bindingLabel);
  setEl('previewTotal', `Rp ${total.toLocaleString('id-ID')}`);
}

// ======================================================
//  SUBMIT PESANAN
// ======================================================
function submitOrder() {
  // Validasi form
  const name = document.getElementById('custName').value.trim();
  const fileInput = document.getElementById('fileInput');
  const pages = parseInt(document.getElementById('pageCount').value);
  const paper = document.getElementById('paperSize').value;
  const type = document.getElementById('printType').value;

  let hasError = false;

  // Nama
  const nameError = document.querySelector('#custName + .invalid-msg') ||
                    document.getElementById('custName').nextElementSibling;
  if (!name) {
    showInvalidMsg('custName', true);
    hasError = true;
  } else {
    showInvalidMsg('custName', false);
  }

  // File
  const fileError = document.getElementById('fileError');
  const fileMissing = !fileInput.files || fileInput.files.length === 0;
  if (fileMissing) {
    fileError.style.display = 'block';
    hasError = true;
  } else {
    fileError.style.display = 'none';
  }

  // Halaman
  if (!pages || pages < 1) {
    showInvalidMsg('pageCount', true);
    hasError = true;
  } else {
    showInvalidMsg('pageCount', false);
  }

  // Validasi harga spiral
  const binding = document.getElementById('bindingType').value;
  const spiralError = document.getElementById('spiralError');
  let spiralPrice = 0;
  if (binding === 'spiral') {
    spiralPrice = parseInt(document.getElementById('spiralPrice').value) || 0;
    if (spiralPrice < 12000 || spiralPrice > 35000) {
      spiralError.style.display = 'block';
      hasError = true;
    } else {
      spiralError.style.display = 'none';
    }
  } else if (spiralError) {
    spiralError.style.display = 'none';
  }

  if (hasError) {
    showToast('error', 'Lengkapi form sebelum membuat pesanan.');
    return;
  }

  // Hitung harga
  const pricePerPage = type === 'color' ? 2000 : 1000;
  let bindingCost = 0;
  if (binding === 'biasa') bindingCost = 5000;
  else if (binding === 'spiral') bindingCost = spiralPrice;
  const total = (pages * pricePerPage) + bindingCost;
  const fileName = fileInput.files[0].name;

  // Buat pesanan baru
  const newOrder = {
    id: `CCH-${String(nextId).padStart(3, '0')}`,
    customer: name,
    file: fileName,
    paper,
    type,
    pages,
    binding,
    bindingCost,
    total,
    status: 'Diproses',
    date: new Date().toISOString().split('T')[0]
  };

  nextId++;
  orders.unshift(newOrder); // tambah di depan

  // Reset form
  resetForm();

  // Render ulang
  renderAll();

  // Notifikasi
  showToast('success', `Pesanan ${newOrder.id} berhasil dibuat untuk ${name}!`);

  // Redirect ke dashboard
  navigateTo('dashboard');
}

function showInvalidMsg(inputId, show) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let msg = input.closest('.input-icon-wrap')?.nextElementSibling;
  if (!msg) msg = input.nextElementSibling;
  if (msg && msg.classList.contains('invalid-msg')) {
    msg.style.display = show ? 'block' : 'none';
  }
}

// ======================================================
//  RESET FORM
// ======================================================
function resetForm() {
  document.getElementById('custName').value = '';
  document.getElementById('pageCount').value = '';
  document.getElementById('orderNotes').value = '';
  document.getElementById('paperSize').value = 'A4';
  document.getElementById('printType').value = 'bw';
  document.getElementById('bindingType').value = 'tidak';
  const spEl = document.getElementById('spiralPrice');
  if (spEl) spEl.value = '';
  const spWrap = document.getElementById('spiralPriceWrap');
  if (spWrap) spWrap.style.display = 'none';

  // Reset file
  document.getElementById('fileInput').value = '';
  document.getElementById('uploadZone').style.display = 'block';
  document.getElementById('filePreview').style.display = 'none';
  document.getElementById('fileName').textContent = '—';
  document.getElementById('fileError').style.display = 'none';

  // Hide error messages
  document.querySelectorAll('.invalid-msg').forEach(m => m.style.display = 'none');

  calcPrice();
}

// ======================================================
//  FILTER PESANAN (halaman riwayat)
// ======================================================
function filterOrders() {
  renderOrdersTable();
}

// ======================================================
//  STATUS MODAL
// ======================================================
function openStatusModal(orderId) {
  editingOrderId = orderId;
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('modalOrderId').textContent = orderId;
  document.getElementById('modalStatus').value = order.status;

  const modal = new bootstrap.Modal(document.getElementById('statusModal'));
  modal.show();
}

function saveStatus() {
  if (!editingOrderId) return;
  const newStatus = document.getElementById('modalStatus').value;
  const order = orders.find(o => o.id === editingOrderId);
  if (!order) return;

  order.status = newStatus;

  // Tutup modal
  bootstrap.Modal.getInstance(document.getElementById('statusModal')).hide();

  // Render ulang
  renderAll();

  showToast('success', `Status pesanan ${editingOrderId} diubah ke "${newStatus}"`);
  editingOrderId = null;
}

// ======================================================
//  RENDER SEMUA
// ======================================================
function renderAll() {
  renderStats();
  renderDashboardTable();
  renderOrdersTable();
}

// ======================================================
//  RENDER STATISTIK
// ======================================================
function renderStats() {
  const totalOrders = orders.length;
  const uniqueCustomers = new Set(orders.map(o => o.customer)).size;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pending = orders.filter(o => o.status === 'Diproses' || o.status === 'Dicetak').length;

  animateNumber('statTotal', totalOrders);
  animateNumber('statCustomers', uniqueCustomers);
  document.getElementById('statRevenue').textContent = `Rp ${totalRevenue.toLocaleString('id-ID')}`;
  animateNumber('statPending', pending);
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const diff = target - start;
  const steps = 20;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round(start + (diff * step / steps));
    if (step >= steps) {
      clearInterval(timer);
      el.textContent = target;
    }
  }, 25);
}

// ======================================================
//  RENDER TABEL DASHBOARD (5 terbaru)
// ======================================================
function renderDashboardTable() {
  const tbody = document.getElementById('dashboardTableBody');
  if (!tbody) return;

  const recent = orders.slice(0, 5);
  tbody.innerHTML = recent.map(o => `
    <tr>
      <td><span class="order-id">${o.id}</span></td>
      <td>
        <div class="customer-cell">
          <div class="avatar-sm">${o.customer.charAt(0)}</div>
          ${o.customer}
        </div>
      </td>
      <td><span class="file-name" title="${o.file}">${o.file}</span></td>
      <td>
        <span class="${o.type === 'color' ? 'print-color' : 'print-bw'}">
          ${o.type === 'color' ? '🎨 Warna' : '⬛ Hitam Putih'}
        </span>
        ${o.binding === 'biasa' ? '<br><span style="font-size:11px;color:var(--text-muted)"><i class="bi bi-journal-bookmark-fill"></i> Dijilid</span>' : ''}
      </td>
      <td class="mono">Rp ${o.total.toLocaleString('id-ID')}</td>
      <td>${badgeHTML(o.status)}</td>
    </tr>
  `).join('');
}

// ======================================================
//  RENDER TABEL RIWAYAT PESANAN (dengan filter)
// ======================================================
function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  const emptyState = document.getElementById('emptyState');
  if (!tbody) return;

  const search = (document.getElementById('tableSearch')?.value || '').toLowerCase();
  const filterStatus = document.getElementById('statusFilter')?.value || '';

  const filtered = orders.filter(o => {
    const matchSearch = o.customer.toLowerCase().includes(search) ||
                        o.id.toLowerCase().includes(search) ||
                        o.file.toLowerCase().includes(search);
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td><span class="order-id">${o.id}</span></td>
      <td>
        <div class="customer-cell">
          <div class="avatar-sm">${o.customer.charAt(0)}</div>
          <div>
            <div>${o.customer}</div>
            <div style="font-size:11px;color:var(--text-muted)">${o.date}</div>
          </div>
        </div>
      </td>
      <td><span class="file-name" title="${o.file}">${o.file}</span></td>
      <td style="color:var(--text-secondary);font-size:13px">${o.paper}</td>
      <td>
        <span class="${o.type === 'color' ? 'print-color' : 'print-bw'}">
          ${o.type === 'color' ? '🎨 Warna' : '⬛ H/P'}
        </span>
      </td>
      <td style="text-align:center">${o.pages}</td>
      <td style="text-align:center;font-size:12px">${o.binding === 'biasa' ? '<span style="color:var(--indigo)">📒 Biasa</span>' : o.binding === 'spiral' ? '<span style="color:var(--teal)">🌀 Spiral</span>' : '<span style="color:var(--text-muted)">—</span>'}</td>
      <td class="mono" style="font-weight:600">Rp ${o.total.toLocaleString('id-ID')}</td>
      <td>${badgeHTML(o.status)}</td>
      <td>
        <button class="btn-action" onclick="openStatusModal('${o.id}')" title="Ubah Status">
          <i class="bi bi-pencil-square"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// ======================================================
//  HELPER: STATUS BADGE
// ======================================================
function badgeHTML(status) {
  const map = {
    'Diproses':     { cls: 'badge-process', icon: 'bi-hourglass-split',  label: 'Diproses' },
    'Dicetak':      { cls: 'badge-print',   icon: 'bi-printer-fill',     label: 'Dicetak' },
    'Selesai':      { cls: 'badge-done',    icon: 'bi-check-circle-fill', label: 'Selesai' },
    'Sudah Diambil':{ cls: 'badge-taken',   icon: 'bi-bag-check-fill',   label: 'Sudah Diambil' }
  };
  const s = map[status] || map['Diproses'];
  return `<span class="badge-status ${s.cls}"><i class="bi ${s.icon}"></i>${s.label}</span>`;
}

// ======================================================
//  TOAST NOTIFICATION
// ======================================================
function showToast(type, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const iconMap = {
    success: 'bi-check-circle-fill',
    error:   'bi-x-circle-fill',
    info:    'bi-info-circle-fill',
    warning: 'bi-exclamation-triangle-fill'
  };

  const toast = document.createElement('div');
  toast.className = `cc-toast toast-${type}`;
  toast.innerHTML = `
    <i class="bi ${iconMap[type] || iconMap.info}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remove setelah 3.5 detik
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}