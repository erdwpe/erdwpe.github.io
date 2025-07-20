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
  if (isNaN(amount)) return;

  if (type === 'add') {
    total += amount;
  } else {
    total -= amount;
  }

  localStorage.setItem('total', total);
  document.getElementById('totalAmount').innerText = `💵 ${formatNumber(total)}`;
  document.getElementById('amount').value = '';
  updateProgress();
  addHistory(type, amount);
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

function addHistory(type, amount) {
  let history = JSON.parse(localStorage.getItem('history')) || [];
  const timestamp = new Date().toLocaleString('id-ID');
  const entry = {
    type: type === 'add' ? '➕ Tambah' : '➖ Ambil',
    amount: formatNumber(amount),
    time: timestamp
  };
  history.unshift(entry);
  localStorage.setItem('history', JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  let history = JSON.parse(localStorage.getItem('history')) || [];
  const tbody = document.querySelector('#historyTable tbody');
  tbody.innerHTML = '';
  history.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.type}</td>
      <td>💵 ${item.amount}</td>
      <td>${item.time}</td>
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

  Swal.fire({
    title: "Edit Jumlah",
    html: `
      <input id="swal-amount" class="swal2-input" inputmode="numeric" pattern="[0-9]*" value="${item.amount.replace(/\./g, '')}">
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
      const inputVal = Swal.getPopup().querySelector("#swal-amount").value.replace(/\./g, '');
      if (!inputVal || isNaN(inputVal)) {
        Swal.showValidationMessage("Masukkan angka yang valid!");
      }
      return inputVal;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const newAmount = parseInt(result.value);
      const oldAmount = parseInt(item.amount.replace(/\./g, ''));
      const delta = newAmount - oldAmount;

      // Update total berdasarkan tipe transaksi
      if (item.type.includes('Tambah')) {
        total += delta;
      } else {
        total -= delta;
      }

      localStorage.setItem('total', total);
      document.getElementById('totalAmount').innerText = `💵 ${formatNumber(total)}`;
      updateProgress();

      // Update data di histori
      item.amount = formatNumber(newAmount);
      item.time = new Date().toLocaleString('id-ID'); // 🔄 Update waktu sekarang
      history[index] = item;

      localStorage.setItem('history', JSON.stringify(history));
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
      imageInput.style.display = 'block'; // Tampilkan kembali input file
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
  