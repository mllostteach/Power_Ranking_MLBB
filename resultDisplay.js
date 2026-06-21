// Hiển thị modal kết quả và quản lý nội dung kết quả
export function showResultModal(title, roster) {
    const resultModal = document.getElementById('resultModal');
    const resultTitle = document.getElementById('resultTitle');
    const resultRoster = document.getElementById('resultRoster');

    if (resultTitle) resultTitle.textContent = title || '';

    if (resultRoster) {
        resultRoster.innerHTML = '';
        (roster || []).forEach(p => {
            const el = document.createElement('div');
            el.textContent = `${p.name} (${p.team}) - Giá: ${p.cost}`;
            resultRoster.appendChild(el);
        });
    }

    if (resultModal) resultModal.classList.remove('hidden');
    // scroll to result area for user
    try {
        if (resultModal && resultModal.scrollIntoView) {
            resultModal.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            const tournamentScreen = document.getElementById('tournamentScreen');
            if (tournamentScreen && tournamentScreen.scrollIntoView) tournamentScreen.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } catch (e) {
        // ignore
    }
}

export function hideResultModal() {
    const resultModal = document.getElementById('resultModal');
    if (resultModal) resultModal.classList.add('hidden');
}

export default showResultModal;
