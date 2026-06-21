import { db, ref, get, update } from './firebase.js';

let players = [];
let currentId = null;
let roster = [];

async function load() {
  try {
    const snapshot = await get(ref(db, 'players'));
    const container = document.getElementById('playersList');
    container.innerHTML = '';
    if (!snapshot.exists()) {
      container.textContent = 'Không có dữ liệu player';
      return;
    }
    const data = snapshot.val();
    players = Object.keys(data).map(k => ({ id: k, ...data[k] }));

    players.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'player-list-btn';
      btn.style.display = 'flex';
      btn.style.justifyContent = 'space-between';
      btn.style.alignItems = 'center';
      const left = document.createElement('span');
      left.textContent = p.name || p.id;
      const right = document.createElement('span');
      right.textContent = 'Giá: ' + (p.cost || '-');
      right.style.opacity = 0.8;
      btn.appendChild(left);
      btn.appendChild(right);
      btn.addEventListener('click', () => openEditor(p));
      container.appendChild(btn);
    });

    renderCostStats();
  } catch (e) {
    console.error(e);
    document.getElementById('playersList').textContent = 'Lỗi load dữ liệu';
  }
}

function openEditor(p) {
  currentId = p.id;
  document.getElementById('editName').textContent = p.name || p.id;
  document.getElementById('inpCost').value = p.cost || '';
  document.getElementById('inpSkill').value = p.skill || 0;
  document.getElementById('inpClutch').value = p.clutch || 0;
  document.getElementById('inpSynergy').value = p.synergy || 0;
  document.getElementById('editor').style.display = 'block';
  document.getElementById('noSelection').style.display = 'none';
}

async function saveChanges() {
  if (!currentId) return alert('Chưa chọn người chơi');
  const cost = Number(document.getElementById('inpCost').value) || null;
  const skill = Number(document.getElementById('inpSkill').value) || 0;
  const clutch = Number(document.getElementById('inpClutch').value) || 0;
  const synergy = Number(document.getElementById('inpSynergy').value) || 0;

  try {
    const payload = { skill, clutch, synergy };
    if (cost !== null) payload.cost = cost;
    await update(ref(db, `players/${currentId}`), payload);
    alert('Lưu thành công');
    // refresh list
    await load();
    // close editor
    closeEditor();
  } catch (e) {
    console.error(e);
    alert('Lỗi khi lưu');
  }
}

function renderCostStats() {
  const tbody = document.querySelector('#costStats tbody');
  tbody.innerHTML = '';
  for (let c = 1; c <= 5; c++) {
    const group = players.filter(p => Number(p.cost) === c);
    const count = group.length;
    const avg = { skill: 0, clutch: 0, synergy: 0 };
    if (count > 0) {
      group.forEach(p => {
        avg.skill += Number(p.skill) || 0;
        avg.clutch += Number(p.clutch) || 0;
        avg.synergy += Number(p.synergy) || 0;
      });
      avg.skill = (avg.skill / count).toFixed(2);
      avg.clutch = (avg.clutch / count).toFixed(2);
      avg.synergy = (avg.synergy / count).toFixed(2);
    } else {
      avg.skill = avg.clutch = avg.synergy = '-';
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c}</td><td>${count}</td><td>${avg.skill}</td><td>${avg.clutch}</td><td>${avg.synergy}</td>`;
    tbody.appendChild(tr);
  }
}

function renderRoster() {
  const box = document.getElementById('rosterList');
  box.innerHTML = '';
  if (!roster.length) {
    box.innerHTML = `<div style="color:var(--text-secondary)">Chưa có thành viên</div>`;
    return;
  }
  roster.forEach((id, idx) => {
    const p = players.find(x => x.id === id) || { name: id };
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    const left = document.createElement('div');
    left.textContent = `${idx+1}. ${p.name || p.id} (Giá: ${p.cost||'-'})`;
    const rm = document.createElement('button');
    rm.textContent = 'Xoá';
    rm.addEventListener('click', () => {
      roster = roster.filter(x => x !== id);
      renderRoster();
    });
    row.appendChild(left);
    row.appendChild(rm);
    box.appendChild(row);
  });
}

function toggleAddToRoster() {
  if (!currentId) return alert('Chưa chọn người chơi');
  if (roster.includes(currentId)) {
    roster = roster.filter(x => x !== currentId);
  } else {
    if (roster.length >= 5) return alert('Đội hình tối đa 5 người');
    roster.push(currentId);
  }
  renderRoster();
}

function closeEditor() {
  currentId = null;
  document.getElementById('editor').style.display = 'none';
  document.getElementById('noSelection').style.display = 'block';
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('saveBtn').addEventListener('click', saveChanges);
  document.getElementById('cancelBtn').addEventListener('click', closeEditor);
  document.getElementById('addRosterBtn').addEventListener('click', toggleAddToRoster);
  load();
});
