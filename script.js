/* =============================================
   CopyCenter Hub — script.js
   Versi Firebase Firestore
   ============================================= */

// ======================================================
//  IMPORT FIREBASE
//  Ganti firebaseConfig di bawah dengan milikmu!
// ======================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ======================================================
//  ⚙️  FIREBASE CONFIG — ISI DENGAN MILIKMU
//  Salin dari: Firebase Console → Project Settings → Web App
// ======================================================
const firebaseConfig = {
  apiKey:            "AIzaSyAGkAxz77xSLxIHiYDRhSkIALDIswKhCms",
  authDomain:        "alesha-perdana-photocopy.firebaseapp.com",
  projectId:         "alesha-perdana-photocopy",
  storageBucket:     "alesha-perdana-photocopy.firebasestorage.app",
  messagingSenderId: "142560220810",
  appId:             "1:142560220810:web:f1bc9a20321988ce787f73"
};

// Inisialisasi Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ======================================================
//  STATE APLIKASI
// ======================================================
let orders        = [];   // data pesanan dari Firestore
let nextIdNum     = 1;    // counter ID lokal (CCH-001, dst.)
let editingDocId  = null; // docId Firestore pesanan yang sedang diedit
let editingOrderId = null;// ID pesanan (CCH-xxx) yang sedang diedit
let unsubscribe   = null; // fungsi berhenti listen Firestore

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
  showLoadingState();
  listenToOrders(); // mulai realtime listener ke Firestore
});

// ======================================================
//  LOADING STATE (saat pertama kali buka)
// ======================================================
function showLoadingState() {
  const bodies = ['dashboardTableBody', 'ordersTableBody'];
  bodies.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center;padding:32px;color:var(--text-muted)">
          <i class="bi bi-arrow-repeat" style="font-size:20px;display:block;margin-bottom:8px;animation:spin 1s linear infinite"></i>
          Memuat data dari Firestore...
        </td>
      </tr>`;
  });
}

// ======================================================
//  REALTIME LISTENER — onSnapshot Firestore
//  Auto-update setiap kali data berubah di database
// ======================================================
function listenToOrders() {
  // Hentikan listener lama kalau ada
  if (unsubscribe) unsubscribe();

  const q = query(
    collection(db, 'pesanan'),
    orderBy('createdAt', 'desc')
  );

  unsubscribe = onSnapshot(q,
    (snapshot) => {
      // Map dokumen Firestore ke array lokal
      orders = snapshot.docs.map(docSnap => ({
        docId: docSnap.id,       // ID dokumen Firestore (untuk update/delete)
        ...docSnap.data(),
        // Konversi Firestore Timestamp ke string tanggal
        date: docSnap.data().createdAt
          ? docSnap.data().createdAt.toDate().toLocaleDateString('id-ID')
          : docSnap.data().date || '—'
      }));

      // Hitung nextIdNum dari data yang sudah ada
      if (orders.length > 0) {
        const nums = orders
          .map(o => parseInt(o.id?.replace('CCH-', '')) || 0)
          .filter(n => !isNaN(n));
        nextIdNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      }

      renderAll();
    },
    (error) => {
      console.error('Firestore error:', error);
      showToast('error', 'Gagal memuat data. Cek koneksi & konfigurasi Firebase.');
      // Tampilkan pesan error di tabel
      ['dashboardTableBody', 'ordersTableBody'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `
          <tr>
            <td colspan="10" style="text-align:center;padding:32px;color:#ef4444">
              <i class="bi bi-exclamation-triangle-fill" style="font-size:20px;display:block;margin-bottom:8px"></i>
              Gagal terhubung ke Firestore.<br>
              <small style="color:var(--text-muted)">Pastikan firebaseConfig sudah diisi dengan benar.</small>
            </td>
          </tr>`;
      });
    }
  );
}

// ======================================================
//  TANGGAL HARI INI
// ======================================================
function setCurrentDate() {
  const el = document.getElementById('currentDate');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

// ======================================================
//  NAVIGASI HALAMAN
// ======================================================
function setupNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  document.querySelectorAll('a[data-page]:not(.nav-item)').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(el.dataset.page);
    });
  });
}

function navigateTo(page) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const map = {
    'dashboard': { sectionId: 'pageDashboard', title: 'Dashboard' },
    'new-order': { sectionId: 'pageNewOrder',  title: 'Pesanan Baru' },
    'orders':    { sectionId: 'pageOrders',    title: 'Riwayat Pesanan' }
  };

  const target = map[page];
  if (!target) return;

  document.getElementById(target.sectionId).classList.add('active');
  document.getElementById('pageTitle').textContent = target.title;

  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  closeMobileSidebar();
}

// ======================================================
//  SIDEBAR MOBILE
// ======================================================
function setupSidebar() {
  const toggle  = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay.addEventListener('click', closeMobileSidebar);
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
  const icon   = document.getElementById('darkModeIcon');
  const label  = document.getElementById('darkModeLabel');
  const html   = document.documentElement;

  const saved = localStorage.getItem('cc-theme') || 'dark';
  html.setAttribute('data-theme', saved);
  updateDarkModeUI(saved === 'dark', icon, label);

  toggle.addEventListener('click', e => {
    e.preventDefault();
    const isDark   = html.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('cc-theme', newTheme);
    updateDarkModeUI(!isDark, icon, label);
    showToast('info', `Mode ${newTheme === 'dark' ? 'gelap' : 'terang'} diaktifkan`);
  });
}

function updateDarkModeUI(isDark, icon, label) {
  icon.className    = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
  label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

// ======================================================
//  UPLOAD ZONE
// ======================================================
function setupUploadZone() {
  const zone      = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const preview   = document.getElementById('filePreview');
  const fileNameEl= document.getElementById('fileName');
  const removeBtn = document.getElementById('removeFile');

  zone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) showFilePreview(fileInput.files[0]);
  });

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
      showFilePreview(file);
    } else {
      showToast('error', 'Format tidak valid. Gunakan PDF, DOC, atau DOCX.');
    }
  });

  removeBtn.addEventListener('click', () => {
    fileInput.value = '';
    zone.style.display    = 'block';
    preview.style.display = 'none';
    fileNameEl.textContent = '—';
  });
}

function isValidFile(file) {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  return allowed.includes(file.type) || /\.(pdf|doc|docx)$/i.test(file.name);
}

function showFilePreview(file) {
  if (!isValidFile(file)) {
    showToast('error', 'Format tidak valid. Gunakan PDF, DOC, atau DOCX.');
    return;
  }
  document.getElementById('uploadZone').style.display    = 'none';
  document.getElementById('filePreview').style.display   = 'flex';
  document.getElementById('fileName').textContent        = file.name;
  document.getElementById('fileError').style.display     = 'none';
}

// ======================================================
//  HITUNG HARGA OTOMATIS
// ======================================================
function calcPrice() {
  const pages   = parseInt(document.getElementById('pageCount')?.value) || 0;
  const type    = document.getElementById('printType')?.value || 'bw';
  const binding = document.getElementById('bindingType')?.value || 'tidak';

  // Tampilkan/sembunyikan input harga spiral
  const spiralWrap = document.getElementById('spiralPriceWrap');
  if (spiralWrap) spiralWrap.style.display = binding === 'spiral' ? 'block' : 'none';

  const pricePerPage = type === 'color' ? 2000 : 1000;
  const printTotal   = pages * pricePerPage;

  let bindingCost  = 0;
  let bindingLabel = 'Rp 0';
  if (binding === 'biasa') {
    bindingCost  = 5000;
    bindingLabel = 'Rp 5.000';
  } else if (binding === 'spiral') {
    const spiralVal = parseInt(document.getElementById('spiralPrice')?.value) || 0;
    bindingCost     = spiralVal;
    bindingLabel    = spiralVal > 0 ? `Rp ${spiralVal.toLocaleString('id-ID')}` : '(belum diisi)';
  }

  const total = printTotal + bindingCost;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('previewPages',      `${pages} hal`);
  setEl('previewPrice',      `Rp ${pricePerPage.toLocaleString('id-ID')}`);
  setEl('previewPrintTotal', `Rp ${printTotal.toLocaleString('id-ID')}`);
  setEl('previewBinding',    bindingLabel);
  setEl('previewTotal',      `Rp ${total.toLocaleString('id-ID')}`);
}

// Expose ke HTML (onclick=)
window.calcPrice = calcPrice;

// ======================================================
//  SUBMIT PESANAN → SIMPAN KE FIRESTORE
// ======================================================
async function submitOrder() {
  // ---- Validasi ----
  const name      = document.getElementById('custName').value.trim();
  const fileInput = document.getElementById('fileInput');
  const pages     = parseInt(document.getElementById('pageCount').value);
  const paper     = document.getElementById('paperSize').value;
  const type      = document.getElementById('printType').value;
  const binding   = document.getElementById('bindingType').value;

  let hasError = false;

  if (!name) { showInvalidMsg('custName', true); hasError = true; }
  else        { showInvalidMsg('custName', false); }

  const fileMissing = !fileInput.files || fileInput.files.length === 0;
  document.getElementById('fileError').style.display = fileMissing ? 'block' : 'none';
  if (fileMissing) hasError = true;

  if (!pages || pages < 1) { showInvalidMsg('pageCount', true); hasError = true; }
  else                      { showInvalidMsg('pageCount', false); }

  // Validasi spiral
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

  // ---- Hitung harga ----
  const pricePerPage = type === 'color' ? 2000 : 1000;
  let bindingCost = 0;
  if (binding === 'biasa')  bindingCost = 5000;
  if (binding === 'spiral') bindingCost = spiralPrice;
  const total    = (pages * pricePerPage) + bindingCost;
  const fileName = fileInput.files[0].name;
  const orderId  = `CCH-${String(nextIdNum).padStart(3, '0')}`;

  // ---- Simpan ke Firestore ----
  const newOrder = {
    id:          orderId,
    customer:    name,
    file:        fileName,
    paper,
    type,
    pages,
    binding,
    bindingCost,
    total,
    status:      'Diproses',
    date:        new Date().toLocaleDateString('id-ID'),
    createdAt:   serverTimestamp()
  };

  // Disable tombol saat loading
  const btn = document.querySelector('[onclick="submitOrder()"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Menyimpan...'; }

  try {
    await addDoc(collection(db, 'pesanan'), newOrder);

    showToast('success', `✅ Pesanan ${orderId} berhasil disimpan!`);
    resetForm();
    navigateTo('dashboard');
    // onSnapshot otomatis memperbarui tampilan — tidak perlu renderAll() manual

  } catch (err) {
    console.error('Gagal simpan:', err);
    showToast('error', 'Gagal menyimpan ke Firestore. Cek koneksi internet.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check2-circle"></i> Buat Pesanan'; }
  }
}
window.submitOrder = submitOrder;

function showInvalidMsg(inputId, show) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let msg = input.closest('.input-icon-wrap')?.nextElementSibling;
  if (!msg) msg = input.nextElementSibling;
  if (msg?.classList.contains('invalid-msg')) {
    msg.style.display = show ? 'block' : 'none';
  }
}

// ======================================================
//  RESET FORM
// ======================================================
function resetForm() {
  document.getElementById('custName').value    = '';
  document.getElementById('pageCount').value   = '';
  document.getElementById('orderNotes').value  = '';
  document.getElementById('paperSize').value   = 'A4';
  document.getElementById('printType').value   = 'bw';
  document.getElementById('bindingType').value = 'tidak';

  const spEl   = document.getElementById('spiralPrice');
  const spWrap = document.getElementById('spiralPriceWrap');
  if (spEl)   spEl.value = '';
  if (spWrap) spWrap.style.display = 'none';

  document.getElementById('fileInput').value          = '';
  document.getElementById('uploadZone').style.display = 'block';
  document.getElementById('filePreview').style.display= 'none';
  document.getElementById('fileName').textContent     = '—';
  document.getElementById('fileError').style.display  = 'none';

  document.querySelectorAll('.invalid-msg').forEach(m => m.style.display = 'none');
  calcPrice();
}
window.resetForm = resetForm;

// ======================================================
//  FILTER PESANAN
// ======================================================
function filterOrders() { renderOrdersTable(); }
window.filterOrders = filterOrders;

// ======================================================
//  STATUS MODAL — BUKA
// ======================================================
function openStatusModal(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  editingOrderId = orderId;
  editingDocId   = order.docId;

  document.getElementById('modalOrderId').textContent = orderId;
  document.getElementById('modalStatus').value        = order.status;

  new bootstrap.Modal(document.getElementById('statusModal')).show();
}
window.openStatusModal = openStatusModal;

// ======================================================
//  STATUS MODAL — SIMPAN KE FIRESTORE
// ======================================================
async function saveStatus() {
  if (!editingDocId) return;

  const newStatus = document.getElementById('modalStatus').value;
  const saveBtn   = document.querySelector('#statusModal .cc-btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Menyimpan...'; }

  try {
    await updateDoc(doc(db, 'pesanan', editingDocId), { status: newStatus });

    bootstrap.Modal.getInstance(document.getElementById('statusModal')).hide();
    showToast('success', `Status "${editingOrderId}" diubah ke "${newStatus}"`);
    // onSnapshot otomatis update tabel

  } catch (err) {
    console.error('Gagal update status:', err);
    showToast('error', 'Gagal mengubah status. Coba lagi.');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="bi bi-check2"></i> Simpan'; }
    editingDocId   = null;
    editingOrderId = null;
  }
}
window.saveStatus = saveStatus;

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
  const totalOrders    = orders.length;
  const uniqueCustomers= new Set(orders.map(o => o.customer)).size;
  const totalRevenue   = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pending        = orders.filter(o => o.status === 'Diproses' || o.status === 'Dicetak').length;

  animateNumber('statTotal',     totalOrders);
  animateNumber('statCustomers', uniqueCustomers);
  animateNumber('statPending',   pending);
  document.getElementById('statRevenue').textContent = `Rp ${totalRevenue.toLocaleString('id-ID')}`;
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const diff  = target - start;
  const steps = 20;
  let step    = 0;
  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round(start + (diff * step / steps));
    if (step >= steps) { clearInterval(timer); el.textContent = target; }
  }, 25);
}

// ======================================================
//  RENDER TABEL DASHBOARD (5 terbaru)
// ======================================================
function renderDashboardTable() {
  const tbody = document.getElementById('dashboardTableBody');
  if (!tbody) return;

  const recent = orders.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted)">
      <i class="bi bi-inbox" style="font-size:24px;display:block;margin-bottom:8px"></i>Belum ada pesanan.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(o => `
    <tr>
      <td><span class="order-id">${o.id}</span></td>
      <td>
        <div class="customer-cell">
          <div class="avatar-sm">${(o.customer || '?').charAt(0)}</div>
          ${o.customer}
        </div>
      </td>
      <td><span class="file-name" title="${o.file}">${o.file}</span></td>
      <td>
        <span class="${o.type === 'color' ? 'print-color' : 'print-bw'}">
          ${o.type === 'color' ? '🎨 Warna' : '⬛ Hitam Putih'}
        </span>
        ${o.binding === 'biasa'  ? '<br><span style="font-size:11px;color:var(--text-muted)"><i class="bi bi-journal-bookmark-fill"></i> Jilid Biasa</span>'  : ''}
        ${o.binding === 'spiral' ? '<br><span style="font-size:11px;color:var(--teal)"><i class="bi bi-hurricane"></i> Jilid Spiral</span>' : ''}
      </td>
      <td class="mono">Rp ${(o.total || 0).toLocaleString('id-ID')}</td>
      <td>${badgeHTML(o.status)}</td>
    </tr>
  `).join('');
}

// ======================================================
//  RENDER TABEL RIWAYAT PESANAN
// ======================================================
function renderOrdersTable() {
  const tbody      = document.getElementById('ordersTableBody');
  const emptyState = document.getElementById('emptyState');
  if (!tbody) return;

  const search       = (document.getElementById('tableSearch')?.value || '').toLowerCase();
  const filterStatus = document.getElementById('statusFilter')?.value || '';

  const filtered = orders.filter(o => {
    const matchSearch = (o.customer || '').toLowerCase().includes(search)
                     || (o.id       || '').toLowerCase().includes(search)
                     || (o.file     || '').toLowerCase().includes(search);
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
          <div class="avatar-sm">${(o.customer || '?').charAt(0)}</div>
          <div>
            <div>${o.customer}</div>
            <div style="font-size:11px;color:var(--text-muted)">${o.date || '—'}</div>
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
      <td style="text-align:center;font-size:12px">
        ${o.binding === 'biasa'  ? '<span style="color:var(--indigo)">📒 Biasa</span>'  :
          o.binding === 'spiral' ? '<span style="color:var(--teal)">🌀 Spiral</span>'   :
          '<span style="color:var(--text-muted)">—</span>'}
      </td>
      <td class="mono" style="font-weight:600">Rp ${(o.total || 0).toLocaleString('id-ID')}</td>
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
    'Diproses':      { cls: 'badge-process', icon: 'bi-hourglass-split',   label: 'Diproses' },
    'Dicetak':       { cls: 'badge-print',   icon: 'bi-printer-fill',      label: 'Dicetak' },
    'Selesai':       { cls: 'badge-done',    icon: 'bi-check-circle-fill', label: 'Selesai' },
    'Sudah Diambil': { cls: 'badge-taken',   icon: 'bi-bag-check-fill',    label: 'Sudah Diambil' }
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

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}