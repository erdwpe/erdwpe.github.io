// js/app.js — fixed: single utils, theme, tabs, transactions, goals with automatic allocation from balance
(() => {
  /* ---------------- THEME & TABS ---------------- */
  const THEME_KEY = 'web_tabungan_theme';
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  const viewTransactions = document.getElementById('view-transactions');
  const viewGoals = document.getElementById('view-goals');

  function sunIconSvg() {
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.414 1.414M17.657 17.657l1.414 1.414M2 12h2M20 12h2M4.93 19.07l1.414-1.414M17.657 6.343l1.414-1.414" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  }
  function moonIconSvg() {
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function applyTheme(mode) {
    if (mode === 'dark') body.classList.add('dark');
    else body.classList.remove('dark');
    const isDark = body.classList.contains('dark');
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      themeToggle.innerHTML = isDark ? sunIconSvg() : moonIconSvg();
    }
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) applyTheme(saved);
    else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(body.classList.contains('dark') ? 'light' : 'dark');
    });
  }
  initTheme();

  // Tabs
  function switchTo(target) {
    tabButtons.forEach(btn => {
      const is = btn.dataset.target === target;
      btn.classList.toggle('active', is);
      btn.setAttribute('aria-selected', is ? 'true' : 'false');
    });
    if (target === 'transactions') {
      if (viewTransactions) viewTransactions.classList.add('active-view');
      if (viewGoals) viewGoals.classList.remove('active-view');
      if (viewGoals) viewGoals.setAttribute('aria-hidden', 'true');
      if (viewTransactions) viewTransactions.setAttribute('aria-hidden', 'false');
    } else {
      if (viewGoals) viewGoals.classList.add('active-view');
      if (viewTransactions) viewTransactions.classList.remove('active-view');
      if (viewTransactions) viewTransactions.setAttribute('aria-hidden', 'true');
      if (viewGoals) viewGoals.setAttribute('aria-hidden', 'false');
    }
  }
  tabButtons.forEach(btn => btn.addEventListener('click', () => switchTo(btn.dataset.target)));

  /* ---------------- SHARED UTILS (single definitions) ---------------- */
  const formatNumberDigits = (digitsStr) => { if (!digitsStr) return ''; return digitsStr.replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
  const formatNumberInput = (value) => { const digits = (value||'').toString().replace(/[^0-9]/g, ''); return formatNumberDigits(digits); };
  const parseFormattedNumber = (str) => { if (!str) return 0; return Number(String(str).replace(/\./g, "")) || 0; };
  const formatRp = (num) => { const n = Number(num) || 0; return 'Rp ' + n.toLocaleString('id-ID'); };
  const todayISO = () => { const d = new Date(); return d.toISOString().slice(0,10); };
  const id = () => Math.random().toString(36).slice(2,9);
  const escapeHtml = (s) => { if (!s) return ''; return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); };

  /* ---------------- TRANSACTIONS LOGIC ---------------- */
  const form = document.getElementById('tx-form');
  const typeEl = document.getElementById('tx-type');
  const catEl = document.getElementById('tx-category');
  const amtEl = document.getElementById('tx-amount');
  const dateEl = document.getElementById('tx-date');
  const noteEl = document.getElementById('tx-note');
  const clearFormBtn = document.getElementById('clear-form');

  const balanceEl = document.getElementById('balance');
  const incomeEl = document.getElementById('total-income');
  const expenseEl = document.getElementById('total-expense');
  const filterMonth = document.getElementById('filter-month');

  const txTableBody = document.querySelector('#tx-table tbody');
  const noTxEl = document.getElementById('no-tx');

  const exportBtn = document.getElementById('export-json');
  const importFile = document.getElementById('import-file');
  const resetBtn = document.getElementById('reset-data');

  const STORAGE_KEY = 'web_tabungan_v3';
  const DRAFT_KEY = 'web_tabungan_v3_draft';

  // load data
  let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  // restore draft
  const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
  if (draft.type && typeEl) typeEl.value = draft.type;
  if (draft.category && catEl) catEl.value = draft.category;
  if (draft.amount && amtEl) amtEl.value = formatNumberInput(draft.amount);
  if (draft.date && dateEl) dateEl.value = draft.date;
  else if (dateEl && !dateEl.value) dateEl.value = todayISO();
  if (draft.note && noteEl) noteEl.value = draft.note;

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  function saveDraft() {
    const toSave = {
      type: typeEl ? typeEl.value : '',
      category: catEl ? catEl.value : '',
      amount: amtEl ? amtEl.value : '',
      date: dateEl ? dateEl.value : '',
      note: noteEl ? noteEl.value : ''
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(toSave));
  }
  function clearDraft() { localStorage.removeItem(DRAFT_KEY); }

  function addTransaction(tx) { data.push(tx); data.sort((a,b)=> new Date(b.date)-new Date(a.date)); save(); render(); }
  function updateTransaction(idv,newTx){ const idx = data.findIndex(t=>t.id===idv); if(idx>=0){ data[idx] = {...data[idx], ...newTx}; save(); render(); } }
  function deleteTransaction(idv){ data = data.filter(t => t.id !== idv); save(); render(); }

  function visibleData(){ const v = filterMonth ? filterMonth.value : ''; if(!v) return data; return data.filter(t=>t.date.startsWith(v)); }
  function totals(list){ let inc=0,exp=0; list.forEach(t=>{ if(t.type==='income') inc+=Number(t.amount); else exp+=Number(t.amount); }); return {income:inc, expense:exp, balance: inc - exp}; }

  /* ---------------- GOALS DATA ---------------- */
  const GOALS_KEY = 'web_tabungan_goals_v1';
  const goalForm = document.getElementById('goal-form');
  const goalName = document.getElementById('goal-name');
  const goalTarget = document.getElementById('goal-target');
  const goalDate = document.getElementById('goal-date');
  const goalsListEl = document.getElementById('goals-list');
  const noGoalEl = document.getElementById('no-goal');

  let goals = JSON.parse(localStorage.getItem(GOALS_KEY) || '[]');
  function saveGoals() { localStorage.setItem(GOALS_KEY, JSON.stringify(goals)); }

  // Allocation helper: distribute available balance (net) to goals in order
  function allocateBalanceToGoals(netBalance, goalsArr) {
    // returns array of objects { id, allocatedFromBalance, computedSaved }
    let avail = Math.max(0, Math.round(netBalance)); // cannot allocate negative
    const result = [];
    // sort by dueDate (earlier first) then by original order
    const ordered = [...goalsArr].sort((a,b) => {
      const da = a.dueDate || '9999-12-31';
      const db = b.dueDate || '9999-12-31';
      if (da === db) return 0;
      return da < db ? -1 : 1;
    });
    for (const g of ordered) {
      const remainingNeeded = Math.max(0, g.target - (g.saved || 0));
      const allocate = Math.min(remainingNeeded, avail);
      const computedSaved = (g.saved || 0) + allocate;
      result.push({ id: g.id, allocate, computedSaved });
      avail -= allocate;
      if (avail <= 0) avail = 0;
    }
    return result;
  }

  /* ---------------- RENDER FUNCTIONS ---------------- */
  function renderGoalsUI() {
    // compute current net balance from transactions
    const totalsAll = totals(data);
    const net = totalsAll.balance; // income - expense
    // render goals list
    if (!goals || goals.length === 0) {
      if (noGoalEl) noGoalEl.style.display = 'block';
      if (goalsListEl) goalsListEl.innerHTML = '';
      return;
    }
    if (noGoalEl) noGoalEl.style.display = 'none';
    if (!goalsListEl) return;

    // compute allocations
    const allocs = allocateBalanceToGoals(net, goals);
    // map by id
    const allocById = {};
    allocs.forEach(a => { allocById[a.id] = a; });

    goalsListEl.innerHTML = '';
    // keep same ordering as stored (or sort by dueDate)
    const displayOrder = [...goals].sort((a,b) => {
      const da = a.dueDate || '9999-12-31';
      const db = b.dueDate || '9999-12-31';
      if (da === db) return 0;
      return da < db ? -1 : 1;
    });

    for (const g of displayOrder) {
      const alloc = allocById[g.id] || { allocate: 0, computedSaved: g.saved || 0 };
      const computedSaved = alloc.computedSaved;
      const percent = g.target ? Math.min(100, Math.round((computedSaved / g.target) * 100)) : 0;
      const remaining = Math.max(0, g.target - computedSaved);

      const goalCard = document.createElement('div');
      goalCard.className = 'goal-card';
      goalCard.innerHTML = `
        <div class="goal-top">
          <div>
            <div class="goal-name">${escapeHtml(g.name)}</div>
            <div class="goal-meta">${g.dueDate ? 'Target: ' + g.dueDate : ''} ${g.note ? ' • ' + escapeHtml(g.note) : ''}</div>
          </div>
          <div style="text-align:right">
            <div class="goal-meta">Target: ${formatRp(g.target)}</div>
            <div class="goal-meta">Terkumpul: ${formatRp(computedSaved)} ${alloc.allocate ? `<small style="color:var(--muted)"> ( +${formatRp(alloc.allocate)} dari saldo )</small>` : ''}</div>
            <div class="goal-meta" style="margin-top:4px;">Sisa: ${formatRp(remaining)}</div>
          </div>
        </div>
        <div class="goal-row">
          <div style="flex:1;margin-right:12px">
            <div class="progress" aria-hidden>
              <div class="progress-fill" style="width:${percent}%"></div>
            </div>
            <div style="margin-top:6px;font-weight:700">${percent}%</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;min-width:120px">
            <button class="small deposit" data-id="${g.id}">Tambahkan</button>
            <div style="display:flex;gap:6px;">
              <button class="small edit-goal" data-id="${g.id}">Edit</button>
              <button class="small del-goal" data-id="${g.id}">Hapus</button>
            </div>
          </div>
        </div>
      `;
      goalsListEl.appendChild(goalCard);
    }
  }

  function render(){
    // TRANSACTIONS summary & table
    const list = visibleData();
    const allTotals = totals(list);
    if (balanceEl) balanceEl.textContent = formatRp(allTotals.balance);
    if (incomeEl) incomeEl.textContent = formatRp(allTotals.income);
    if (expenseEl) expenseEl.textContent = formatRp(allTotals.expense);
    if (incomeEl) incomeEl.className = 'row-value positive';
    if (expenseEl) expenseEl.className = 'row-value negative';

    if (!txTableBody) return;
    txTableBody.innerHTML = '';
    if(list.length===0){ if (noTxEl) noTxEl.style.display='block'; const table = document.getElementById('tx-table'); if(table) table.style.display='none'; }
    else {
      if (noTxEl) noTxEl.style.display='none';
      const table = document.getElementById('tx-table'); if(table) table.style.display='table';
      list.forEach(tx=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(tx.date)}</td>
          <td class="tx-type-${tx.type}">${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
          <td>${escapeHtml(tx.category)}</td>
          <td>${formatRp(tx.amount)}</td>
          <td>${escapeHtml(tx.note || '')}</td>
          <td>
            <button class="small edit" data-id="${tx.id}" title="Edit transaksi">Edit</button>
            <button class="small del" data-id="${tx.id}" title="Hapus transaksi">Hapus</button>
          </td>
        `;
        txTableBody.appendChild(tr);
      });
    }

    // GOALS render (keadaan dinamis berdasarkan saldo sekarang)
    renderGoalsUI();
  }

  /* ---------------- EVENTS: transactions ---------------- */
  // Realtime formatting with caret preservation for amount input
  if (amtEl) {
    amtEl.addEventListener('input', (e) => {
      const original = amtEl.value;
      const selectionStart = amtEl.selectionStart;
      const digitsOnly = original.replace(/[^0-9]/g, '');
      let digitsBeforeCaret = original.slice(0, selectionStart).replace(/[^0-9]/g, '').length;
      const formatted = formatNumberDigits(digitsOnly);
      let newPos = formatted.length;
      if (digitsBeforeCaret === 0) newPos = 0;
      else {
        let digitCount = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) digitCount++;
          if (digitCount >= digitsBeforeCaret) { newPos = i+1; break; }
        }
      }
      amtEl.value = formatted;
      try { amtEl.setSelectionRange(newPos, newPos); } catch (err) { amtEl.selectionStart = amtEl.selectionEnd = amtEl.value.length; }
      saveDraft();
    });
  }
  [catEl, typeEl, dateEl, noteEl].forEach(el => { if (el) el.addEventListener('input', saveDraft); });

  // Submit transaction
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const amt = parseFormattedNumber(amtEl ? amtEl.value : '');
      if (!amt || amt <= 0) { Swal.fire({ icon:'warning', title:'Jumlah tidak valid', text:'Masukkan jumlah yang valid.' }); return; }
      const tx = { id: id(), type: typeEl ? typeEl.value : 'expense', category: catEl ? catEl.value.trim() || 'Lainnya' : 'Lainnya', amount: Math.round(amt), date: dateEl ? dateEl.value || todayISO() : todayISO(), note: noteEl ? noteEl.value.trim() : '' };
      addTransaction(tx);
      form.reset();
      if (dateEl) dateEl.value = todayISO();
      clearDraft();
      Swal.fire({ icon:'success', title:'Tersimpan', timer:800, showConfirmButton:false });
    });
  }
  if (clearFormBtn) clearFormBtn.addEventListener('click', ()=>{ if (form) form.reset(); if (dateEl) dateEl.value = todayISO(); clearDraft(); });

  // Table edit/delete for transactions using Swal
  if (txTableBody) {
    txTableBody.addEventListener('click', async (e) => {
      const btn = e.target;
      if (btn.matches('button.edit')) {
        const idv = btn.dataset.id;
        const tx = data.find(t => t.id === idv);
        if (!tx) return;

        const html = `
          <div style="display:grid;gap:10px">
            <label style="font-size:0.9rem;color:var(--muted);display:block">Jumlah (Rp)</label>
            <input id="swal-amt" class="swal2-input" placeholder="100.000" value="${formatNumberDigits(String(tx.amount))}">
            <label style="font-size:0.9rem;color:var(--muted);display:block">Kategori</label>
            <input id="swal-cat" class="swal2-input" placeholder="Kategori" value="${escapeHtml(tx.category)}">
            <label style="font-size:0.9rem;color:var(--muted);display:block">Tanggal</label>
            <input id="swal-date" class="swal2-input" type="date" value="${tx.date}">
            <label style="font-size:0.9rem;color:var(--muted);display:block">Catatan</label>
            <input id="swal-note" class="swal2-input" placeholder="Catatan" value="${escapeHtml(tx.note || '')}">
          </div>
        `;
        const { value: result } = await Swal.fire({
          title: 'Ubah transaksi',
          html,
          focusConfirm: false,
          showCancelButton: true,
          preConfirm: () => {
            const amtVal = document.getElementById('swal-amt').value;
            const catVal = document.getElementById('swal-cat').value;
            const dateVal = document.getElementById('swal-date').value;
            const noteVal = document.getElementById('swal-note').value;
            const parsedAmt = parseFormattedNumber(amtVal);
            if (!parsedAmt || parsedAmt <= 0) { Swal.showValidationMessage('Masukkan jumlah yang valid (>0).'); return false; }
            return { amount: Math.round(parsedAmt), category: catVal.trim() || tx.category, date: dateVal || tx.date, note: noteVal || '' };
          },
          didOpen: () => {
            const inp = document.getElementById('swal-amt');
            if (!inp) return;
            inp.addEventListener('input', () => {
              const digits = inp.value.replace(/[^0-9]/g, '');
              inp.value = formatNumberDigits(digits);
              inp.selectionStart = inp.selectionEnd = inp.value.length;
            });
          }
        });

        if (result) {
          updateTransaction(idv, { amount: result.amount, category: result.category, date: result.date, note: result.note });
          Swal.fire({ icon:'success', title:'Diubah', timer:700, showConfirmButton:false });
        }
      } else if (btn.matches('button.del')) {
        const idv = btn.dataset.id;
        const tx = data.find(t => t.id === idv);
        if (!tx) return;
        const conf = await Swal.fire({
          title: 'Hapus transaksi?',
          html: `<b>${escapeHtml(tx.category)}</b><br>${tx.date} — ${formatRp(tx.amount)}`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Hapus',
          cancelButtonText: 'Batal',
          confirmButtonColor: '#ef4444'
        });
        if (conf.isConfirmed) { deleteTransaction(idv); Swal.fire({ icon:'success', title:'Terhapus', timer:700, showConfirmButton:false }); }
      }
    });
  }
  if (filterMonth) filterMonth.addEventListener('change', render);

  // Export / Import / Reset
  if (exportBtn) exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `web_tabungan_backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  });

  if (importFile) importFile.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const parsed = JSON.parse(txt);
      if (!Array.isArray(parsed)) throw new Error('Format tidak valid (harus array)');
      const ok = parsed.every(it => it.id && it.type && it.amount != null && it.date);
      if (!ok) throw new Error('Format data salah');
      const proceed = await Swal.fire({ title:'Import data?', text:'Import akan menimpa data saat ini. Lanjutkan?', icon:'question', showCancelButton:true });
      if (!proceed.isConfirmed) return;
      data = parsed; save(); render(); importFile.value = ''; Swal.fire({ icon:'success', title:'Diimport', timer:800, showConfirmButton:false });
    } catch (err) { Swal.fire({ icon:'error', title:'Gagal import', text: err.message }); }
  });

  if (resetBtn) resetBtn.addEventListener('click', async () => {
    const conf = await Swal.fire({ title:'Reset semua data?', text:'Semua transaksi akan dihapus permanen.', icon:'warning', showCancelButton:true, confirmButtonColor:'#ef4444' });
    if (conf.isConfirmed) { data = []; save(); render(); Swal.fire({ icon:'success', title:'Direset', timer:800, showConfirmButton:false }); }
  });

  /* ---------------- GOALS EVENTS ---------------- */
  function parseTargetInput(val) { return parseFormattedNumber(val); }

  if (goalForm) {
    goalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = goalName ? goalName.value.trim() : '';
      const target = goalTarget ? parseTargetInput(goalTarget.value) : 0;
      const due = goalDate ? goalDate.value : '';
      if (!name) { Swal.fire({ icon:'warning', title:'Nama kosong', text:'Masukkan nama tujuan.' }); return; }
      if (!target || target <= 0) { Swal.fire({ icon:'warning', title:'Target tidak valid', text:'Masukkan target yang valid.' }); return; }
      const newGoal = { id: id(), name, target: Math.round(target), saved: 0, dueDate: due || null, note: '' };
      goals.push(newGoal);
      saveGoals();
      goalForm.reset();
      Swal.fire({ icon:'success', title:'Tujuan ditambahkan', timer:800, showConfirmButton:false });
      switchTo('goals');
      render(); // ensure UI updates and "Belum ada tujuan" disappears
    });
  }

  if (goalTarget) {
    goalTarget.addEventListener('input', (e) => {
      const original = goalTarget.value;
      const digits = original.replace(/[^0-9]/g, '');
      goalTarget.value = formatNumberDigits(digits);
    });
  }

  if (goalsListEl) {
    goalsListEl.addEventListener('click', async (e) => {
      const btn = e.target;
      const idv = btn.dataset.id;
      if (!idv) return;
      const goalIdx = goals.findIndex(g => g.id === idv);
      if (goalIdx === -1) return;
      const goal = goals[goalIdx];

      if (btn.matches('.deposit')) {
        const { value } = await Swal.fire({
          title: `Tambahkan ke "${escapeHtml(goal.name)}"`,
          html: `<input id="swal-dep" class="swal2-input" placeholder="Masukkan jumlah (mis. 100.000)">`,
          showCancelButton: true,
          preConfirm: () => {
            const v = document.getElementById('swal-dep').value;
            const amt = parseFormattedNumber(v);
            if (!amt || amt <= 0) { Swal.showValidationMessage('Masukkan jumlah yang valid (>0).'); return false; }
            return amt;
          },
          didOpen: () => {
            const inp = document.getElementById('swal-dep');
            if (!inp) return;
            inp.addEventListener('input', () => {
              const digits = inp.value.replace(/[^0-9]/g, '');
              inp.value = formatNumberDigits(digits);
              inp.selectionStart = inp.selectionEnd = inp.value.length;
            });
          }
        });
        if (value) {
          goals[goalIdx].saved = Math.round((goals[goalIdx].saved || 0) + value);
          if (goals[goalIdx].saved > goals[goalIdx].target) goals[goalIdx].saved = goals[goalIdx].target;
          saveGoals();
          render();
          Swal.fire({ icon:'success', title:'Berhasil ditambahkan', timer:800, showConfirmButton:false });
        }
      } else if (btn.matches('.edit-goal')) {
        const html = `
          <div style="display:grid;gap:10px">
            <label style="font-size:0.9rem;color:var(--muted);display:block">Nama tujuan</label>
            <input id="swal-name" class="swal2-input" value="${escapeHtml(goal.name)}">
            <label style="font-size:0.9rem;color:var(--muted);display:block">Target (Rp)</label>
            <input id="swal-target" class="swal2-input" value="${formatNumberDigits(String(goal.target))}">
            <label style="font-size:0.9rem;color:var(--muted);display:block">Tanggal target</label>
            <input id="swal-date" class="swal2-input" type="date" value="${goal.dueDate || ''}">
            <label style="font-size:0.9rem;color:var(--muted);display:block">Catatan</label>
            <input id="swal-note" class="swal2-input" value="${escapeHtml(goal.note || '')}">
          </div>
        `;
        const { value: result } = await Swal.fire({
          title: 'Edit tujuan tabungan',
          html,
          focusConfirm: false,
          showCancelButton: true,
          preConfirm: () => {
            const name = document.getElementById('swal-name').value.trim();
            const targetStr = document.getElementById('swal-target').value;
            const datev = document.getElementById('swal-date').value;
            const notev = document.getElementById('swal-note').value;
            const targetVal = parseFormattedNumber(targetStr);
            if (!name) { Swal.showValidationMessage('Nama tujuan tidak boleh kosong.'); return false; }
            if (!targetVal || targetVal <= 0) { Swal.showValidationMessage('Target harus angka > 0.'); return false; }
            return { name, target: Math.round(targetVal), dueDate: datev||null, note: notev||'' };
          },
          didOpen: () => {
            const inp = document.getElementById('swal-target');
            if (!inp) return;
            inp.addEventListener('input', () => {
              const digits = inp.value.replace(/[^0-9]/g, '');
              inp.value = formatNumberDigits(digits);
              inp.selectionStart = inp.selectionEnd = inp.value.length;
            });
          }
        });
        if (result) {
          goals[goalIdx].name = result.name;
          goals[goalIdx].target = result.target;
          goals[goalIdx].dueDate = result.dueDate;
          goals[goalIdx].note = result.note;
          if (goals[goalIdx].saved > goals[goalIdx].target) goals[goalIdx].saved = goals[goalIdx].target;
          saveGoals();
          render();
          Swal.fire({ icon:'success', title:'Tujuan diperbarui', timer:700, showConfirmButton:false });
        }
      } else if (btn.matches('.del-goal')) {
        const conf = await Swal.fire({
          title: 'Hapus tujuan?',
          html: `<b>${escapeHtml(goal.name)}</b><br>Target: ${formatRp(goal.target)} • Terkumpul: ${formatRp(goal.saved)}`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Hapus',
          cancelButtonText: 'Batal',
          confirmButtonColor: '#ef4444'
        });
        if (conf.isConfirmed) {
          goals = goals.filter(g => g.id !== idv);
          saveGoals();
          render();
          Swal.fire({ icon:'success', title:'Terhapus', timer:700, showConfirmButton:false });
        }
      }
    });
  }

  /* ---------------- INITIAL RENDER ---------------- */
  render();

})();
