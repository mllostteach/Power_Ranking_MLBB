import { db, ref, get, remove } from "./firebase.js";

const playersList = document.getElementById("playersList");

window.addEventListener("DOMContentLoaded", async () => {
    await loadPlayers();
});

async function loadPlayers() {
    playersList.innerHTML = "Đang tải...";

    try {
        const snapshot = await get(ref(db, "players"));

        if (!snapshot.exists()) {
            playersList.innerHTML = "Chưa có tuyển thủ nào.";
            return;
        }

        const data = snapshot.val();

        const items = Object.keys(data).map(key => ({ id: key, ...data[key] }));

        renderList(items);

    } catch (err) {
        console.error(err);
        playersList.innerHTML = "Lỗi khi tải dữ liệu.";
    }
}

function renderList(items) {
    playersList.innerHTML = "";

    const container = document.createElement('div');
    container.className = 'players-grid';

    items.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'space-between';
        card.style.gap = '12px';

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.alignItems = 'center';
        left.style.gap = '12px';

        const img = document.createElement('img');
        img.src = p.image || '';
        img.alt = p.name;
        img.style.width = '56px';
        img.style.height = '56px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '6px';

        const info = document.createElement('div');
        info.innerHTML = `<strong>${p.name}</strong><br><small>${p.team} — ${p.lane} — Giá: ${p.cost}</small>`;

        left.appendChild(img);
        left.appendChild(info);

        const btn = document.createElement('button');
        btn.textContent = 'XÓA';
        btn.style.background = '#ff6b6b';
        btn.style.border = 'none';
        btn.style.padding = '8px 10px';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';

        btn.addEventListener('click', async () => {
            const ok = confirm(`Xác nhận xóa ${p.name} (${p.team})?`);
            if (!ok) return;

            try {
                await remove(ref(db, `players/${p.id}`));
                alert('Đã xóa thành công');
                await loadPlayers();
            } catch (err) {
                console.error(err);
                alert('Lỗi khi xóa: ' + (err.message || err));
            }
        });

        card.appendChild(left);
        card.appendChild(btn);

        container.appendChild(card);
    });

    playersList.appendChild(container);
}
