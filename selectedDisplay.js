// Hiển thị danh sách đội đã chọn và xử lý bỏ chọn
export function renderSelectedPlayersUI(selectedPlayers, selectionOrder, gold, selectedContainerId = 'selectedPlayers', goldElId = 'gold', onDeselect) {
    const selectedContainer = document.getElementById(selectedContainerId);
    const goldEl = document.getElementById(goldElId);
    if (!selectedContainer) return;

    selectedContainer.innerHTML = '';

    // hiển thị theo thứ tự role
    selectionOrder.forEach(lane => {
        const player = selectedPlayers[lane];
        if (!player) return;

        const div = document.createElement('div');
        div.className = 'selected-card';
        div.innerHTML = `
            <h3>${player.name}</h3>
            <p>${player.team}</p>
            <p>Giá: ${player.cost}</p>
        `;

        // click để bỏ chọn và gọi callback xử lý
        div.addEventListener('click', () => {
            if (typeof onDeselect === 'function') onDeselect(lane, player);
        });

        selectedContainer.appendChild(div);
    });

    if (goldEl) goldEl.textContent = gold;
}

export default renderSelectedPlayersUI;
