let total = 0;
let target = 0;

document.addEventListener("DOMContentLoaded", () => {
  total = parseInt(localStorage.getItem('total')) || 0;
  target = parseInt(localStorage.getItem('target')) || 0;

  document.getElementById('totalAmount').innerText = `💵 ${formatNumber(total)}`;
  document.getElementById('targetInput').value = target ? formatNumber(target) : '';
  updateProgress();
  loadHistory();
  loadImage();

  document.getElementById('imageInput').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      localStorage.setItem('image', e.target.result);
      loadImage();
    };
    reader.readAsDataURL(file);
  });
});

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatNumberInput(input) {
  let val = input.value.replace(/\D/g, '');
  input.value = formatNumber(val);
}

function save() {
  let amountStr = document.getElementById('amount').value.replace(/\./g, '');
  let amount = parseInt(amountStr);
  let type = document.getElementById('type').value;
  let note = document.getElementById('note').value.trim();
  let manualDate = document.getElementById('manualDate').value;

  if (isNaN(amount)) return;

  if (type === 'add') {
    total += amount;
  } else {
    total -= amount;
  }

  localStorage.setItem('total', total);
  document.getElementById('totalAmount').innerText = `💵 ${formatNumber(total)}`;
  document.getElementById('amount').value = '';
  document.getElementById('note').value = '';
  document.getElementById('manualDate').value = '';
  updateProgress();

  const now = new Date();
  const selectedDate = manualDate ? new Date(`${manualDate}T${now.toTimeString().slice(0, 8)}`) : now;

  const usedDate = selectedDate.toISOString().split('T')[0];
  const usedTime = selectedDate.toLocaleString('id-ID');

  addHistory(type, amount, note, usedDate, usedTime);
}


function saveTarget() {
  let targetStr = document.getElementById('targetInput').value.replace(/\./g, '');
  target = parseInt(targetStr) || 0;
  localStorage.setItem('target', target);
  updateProgress();
}

function updateProgress() {
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  if (target <= 0) {
    progressBar.style.width = '0%';
    progressText.innerText = '📊 Belum ada target';
    return;
  }

  const percent = Math.min((total / target) * 100, 100);
  progressBar.style.width = percent + '%';
  progressText.innerText = `📊 ${percent.toFixed(1)}% tercapai`;
  if (percent >= 100 && !localStorage.getItem('completed')) {
    Swal.fire({
      title: "🎉 Selamat!",
      text: "Target tabunganmu telah tercapai!",
      icon: "success"
    });
    localStorage.setItem('completed', 'true');
  }
}

function autoUpdateTarget() {
  let input = document.getElementById('targetInput').value.replace(/\./g, '');
  target = parseInt(input) || 0;
  localStorage.setItem('target', target);
  updateProgress();
}

function autoUpdateProgressPreview() {
  let amountStr = document.getElementById('amount').value.replace(/\./g, '');
  let amount = parseInt(amountStr);
  let type = document.getElementById('type').value;
  if (isNaN(amount)) {
    updateProgress();
    return;
  }

  let previewTotal = type === 'add' ? total + amount : total - amount;
  const percent = target > 0 ? Math.min((previewTotal / target) * 100, 100) : 0;
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  progressBar.style.width = percent + '%';
  progressText.innerText = `📊 ${percent.toFixed(1)}% tercapai`;
}

function addHistory(type, amount, note = '', date = '', time = '') {
  let history = JSON.parse(localStorage.getItem('history')) || [];

  const entry = {
    type: type === 'add' ? '➕ Tambah' : '➖ Ambil',
    amount: formatNumber(amount),
    note,
    time: time || new Date().toLocaleString('id-ID'),
    date: date || new Date().toISOString().split('T')[0]
  };

  history.unshift(entry);
  localStorage.setItem('history', JSON.stringify(history));
  loadHistory();
}


function loadHistory() {
  let history = JSON.parse(localStorage.getItem('history')) || [];
  const tbody = document.querySelector('#historyTable tbody');
  const filterDate = document.getElementById('filterDate')?.value;

  tbody.innerHTML = '';
  history.forEach((item, index) => {
    if (filterDate && item.date !== filterDate) return;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.type}</td>
      <td>💵 ${item.amount}</td>
      <td>${item.time}<br><small>${item.note || ''}</small></td>
      <td>
        <button class="history-action-button edit" onclick="editHistory(${index})">📝</button>
        <button class="history-action-button delete" onclick="deleteHistory(${index})">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);
  });

}
function editHistory(index) {
  let history = JSON.parse(localStorage.getItem('history')) || [];
  const item = history[index];
  const initialAmount = item.amount.replace(/\./g, '');
  const initialNote = item.note || '';

  Swal.fire({
    title: "Edit Transaksi",
    html: `
      <label style="display:block; text-align:left; font-size:14px; margin-bottom:4px;">✍️ Ubah Nominal Uang</label>
      <input id="swal-amount" class="swal2-input" inputmode="numeric" pattern="[0-9]*" value="${initialAmount}">
      <label style="display:block; text-align:left; font-size:14px; margin-top:10px; margin-bottom:4px;">🗒️ Ubah Catatan</label>
      <input id="swal-note" class="swal2-input" placeholder="Catatan (opsional)" value="${initialNote}">
    `,
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    didOpen: () => {
      const input = Swal.getPopup().querySelector("#swal-amount");
      input.addEventListener("input", () => {
        let raw = input.value.replace(/\D/g, '');
        input.value = formatNumber(raw);
      });
    },
    preConfirm: () => {
      const inputAmount = Swal.getPopup().querySelector("#swal-amount").value.replace(/\./g, '');
      const inputNote = Swal.getPopup().querySelector("#swal-note").value.trim();

      if (!inputAmount || isNaN(inputAmount)) {
        Swal.showValidationMessage("Masukkan jumlah yang valid!");
      }

      return {
        amount: parseInt(inputAmount),
        note: inputNote
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const newAmount = result.value.amount;
      const newNote = result.value.note;
      const oldAmount = parseInt(item.amount.replace(/\./g, ''));
      const delta = newAmount - oldAmount;

      if (item.type.includes('Tambah')) {
        total += delta;
      } else {
        total -= delta;
      }

      item.amount = formatNumber(newAmount);
      item.note = newNote;
      item.time = new Date().toLocaleString('id-ID');
      item.date = new Date().toISOString().split('T')[0];

      localStorage.setItem('total', total);
      localStorage.setItem('history', JSON.stringify(history));

      document.getElementById('totalAmount').innerText = `💵 ${formatNumber(total)}`;
      updateProgress();
      loadHistory();
    }
  });
}


function deleteHistory(index) {
  let history = JSON.parse(localStorage.getItem('history')) || [];
  const item = history[index];
  const amount = parseInt(item.amount.replace(/\./g, ''));

  Swal.fire({
    title: 'Hapus Transaksi?',
    text: `Yakin ingin menghapus transaksi ini?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      // Update total
      if (item.type.includes('Tambah')) {
        total -= amount;
      } else {
        total += amount;
      }

      localStorage.setItem('total', total);
      document.getElementById('totalAmount').innerText = `💵 ${formatNumber(total)}`;
      updateProgress();

      // Hapus dari history
      history.splice(index, 1);
      localStorage.setItem('history', JSON.stringify(history));
      loadHistory();
    }
  });
}

function loadImage() {
    const imgData = localStorage.getItem('image');
    const preview = document.getElementById('preview');
    const imageInput = document.getElementById('imageInput');
  
    if (imgData) {
      preview.innerHTML = `<img id="previewImage" src="${imgData}" style="max-width:100%; border-radius:10px; cursor:pointer;">`;
      imageInput.style.display = 'none'; // Sembunyikan input file
  
      // Tambahkan event click untuk full preview
      const img = document.getElementById('previewImage');
      img.addEventListener('click', () => toggleImagePreview(imgData));
    } else {
      preview.innerHTML = '';
// Tetap tampilkan tombol ganti gambar, tapi sembunyikan input file
imageInput.style.display = 'none'; // tetap disembunyikan, tapi tombol disediakan
    }
  }
  
  // Fungsi untuk fullscreen preview
  function toggleImagePreview(src) {
    const existing = document.getElementById("fullPreview");
    if (existing) {
      existing.remove();
    } else {
      const overlay = document.createElement("div");
      overlay.id = "fullPreview";
      overlay.style.position = "fixed";
      overlay.style.top = 0;
      overlay.style.left = 0;
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.background = "rgba(0,0,0,0.85)";
      overlay.style.display = "flex";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.zIndex = 9999;
      overlay.style.cursor = "zoom-out";
      overlay.innerHTML = `<img src="${src}" style="max-width:90%; max-height:90%; border-radius:20px; box-shadow: 0 0 20px white;">`;
      overlay.addEventListener("click", () => overlay.remove());
      document.body.appendChild(overlay);
    }
  }
  function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
  
    document.getElementById(id).classList.add('active');
    document.querySelector(`.tab-button[onclick="showTab('${id}')"]`).classList.add('active');
  }
  

  function resetAll() {
    Swal.fire({
      title: "Yakin ingin mereset semuanya?",
      text: "Semua data tabungan, target, gambar, dan riwayat akan dihapus!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6"
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        total = 0;
        target = 0;
        document.getElementById('amount').value = '';
        document.getElementById('targetInput').value = '';
        document.getElementById('totalAmount').innerText = '💵 0';
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressText').innerText = '📊 0% tercapai';
        document.querySelector('#historyTable tbody').innerHTML = '';
        
        // Reset dan tampilkan input file
        document.getElementById('preview').innerHTML = '';
        document.getElementById('imageInput').value = '';
        document.getElementById('imageInput').style.display = 'block';
  
        Swal.fire({
          title: 'Berhasil!',
          text: 'Semua data telah direset.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }
  function triggerImageChange() {
    document.getElementById('imageInput').click();
  }
  