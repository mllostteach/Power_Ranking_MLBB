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
}

export function hideResultModal() {
    const resultModal = document.getElementById('resultModal');
    if (resultModal) resultModal.classList.add('hidden');
}

export default showResultModal;
