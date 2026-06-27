import { db, ref, set, get, remove, update, child } from './firebase.js';

const phaseSelect = document.getElementById('phaseSelect');
const questionText = document.getElementById('questionText');
const questionPoints = document.getElementById('questionPoints');
const correctAnswer = document.getElementById('correctAnswer');
const optionsText = document.getElementById('optionsText');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const wildcardList = document.getElementById('wildcardList');
const mainList = document.getElementById('mainList');
const topScorersList = document.getElementById('topScorersList');
const editQuestionPanel = document.getElementById('editQuestionPanel');
const editQuestionText = document.getElementById('editQuestionText');
const editQuestionPoints = document.getElementById('editQuestionPoints');
const editCorrectAnswer = document.getElementById('editCorrectAnswer');
const editOptionsText = document.getElementById('editOptionsText');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const openWildcardBtn = document.getElementById('openWildcardBtn');
const closeWildcardBtn = document.getElementById('closeWildcardBtn');
const openMainBtn = document.getElementById('openMainBtn');
const closeMainBtn = document.getElementById('closeMainBtn');
const finalizeBtn = document.getElementById('finalizeBtn');

let questions = { wildcard: [], mainStage: [] };
let status = { wildcard: { open: false }, mainStage: { open: false } };
let answers = { wildcard: {}, mainStage: {} };
let editingTarget = null;

async function loadData() {
  const [questionsSnapshot, statusSnapshot, answersSnapshot, usersSnapshot] = await Promise.all([
    get(ref(db, 'pickEm/questions')),
    get(ref(db, 'pickEm/status')),
    get(ref(db, 'pickEm/answers')),
    get(ref(db, 'pickEm/users'))
  ]);

  questions = { wildcard: [], mainStage: [] };
  if (questionsSnapshot.exists()) {
    const raw = questionsSnapshot.val();
    questions.wildcard = Object.entries(raw.wildcard || {}).map(([id, item]) => ({ id, ...item }));
    questions.mainStage = Object.entries(raw.mainStage || {}).map(([id, item]) => ({ id, ...item }));
  }
  if (statusSnapshot.exists()) {
    status = statusSnapshot.val();
  }
  if (answersSnapshot.exists()) {
    answers = answersSnapshot.val();
  }

  let users = [];
  if (usersSnapshot.exists()) {
    users = Object.entries(usersSnapshot.val()).map(([id, user]) => ({ id, ...user }));
  }
  renderTopScorers(users);
  render();
}

function renderTopScorers(users) {
  const sorted = [...users].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  if (!sorted.length) {
    topScorersList.innerHTML = '<div class="hint">Chưa có người chơi nào.</div>';
    return;
  }

  topScorersList.innerHTML = sorted.slice(0, 5).map((user, index) => `
    <div class="question-item">
      <strong>#${index + 1} ${user.fbName || user.gameId || 'Người chơi'}</strong>
      <div class="hint">${user.gameId || ''} • ${user.server || ''}</div>
      <div class="hint">Điểm hiện tại: ${user.score || 0}</div>
    </div>
  `).join('');
}

function render() {
  wildcardList.innerHTML = '';
  mainList.innerHTML = '';

  const renderSection = (container, items, phase) => {
    if (!items.length) {
      container.innerHTML = '<div class="hint">Chưa có câu hỏi.</div>';
      return;
    }

    items.forEach((question) => {
      const item = document.createElement('div');
      item.className = 'question-item';
      item.innerHTML = `
        <strong>${question.text}</strong>
        <div class="hint">Điểm: ${question.points || 0}</div>
        <div class="hint">Đáp án: ${question.correctAnswer || 'Chưa có'}</div>
        <div class="hint">Lựa chọn: ${question.options.join(', ')}</div>
        <div class="inline-actions">
          <button class="btn secondary" data-action="edit" data-phase="${phase}" data-id="${question.id}">Sửa</button>
          <button class="btn" data-action="delete" data-phase="${phase}" data-id="${question.id}">Xóa</button>
        </div>
      `;
      container.appendChild(item);
    });
  };

  renderSection(wildcardList, questions.wildcard, 'wildcard');
  renderSection(mainList, questions.mainStage, 'mainStage');
}

async function addQuestion() {
  const phase = phaseSelect.value;
  const text = questionText.value.trim();
  const points = Number(questionPoints.value) || 0;
  const correct = correctAnswer.value.trim();
  const options = optionsText.value.split(';').map((item) => item.trim()).filter(Boolean);

  if (!text || !options.length || !correct) {
    alert('Vui lòng nhập đủ thông tin câu hỏi, đáp án và danh sách lựa chọn.');
    return;
  }

  if (phase === 'mainStage') {
    const wildcardSnapshot = await get(ref(db, 'pickEm/questions/wildcard'));
    if (!wildcardSnapshot.exists() || Object.keys(wildcardSnapshot.val() || {}).length === 0) {
      alert('Chỉ có thể tạo câu hỏi Main Stage sau khi đã có ít nhất một câu hỏi Wildcard.');
      return;
    }
  }

  const newQuestionRef = ref(db, `pickEm/questions/${phase}`);
  const list = await get(newQuestionRef);
  const id = `q${(list.exists() ? Object.keys(list.val() || {}).length : 0) + 1}`;

  await set(ref(db, `pickEm/questions/${phase}/${id}`), { text, points, correctAnswer: correct, options });
  questionText.value = '';
  questionPoints.value = '5';
  correctAnswer.value = '';
  optionsText.value = '';
  await loadData();
}

function openEditForm(phase, id) {
  const question = questions[phase].find((item) => item.id === id);
  if (!question) return;
  editingTarget = { phase, id };
  editQuestionText.value = question.text || '';
  editQuestionPoints.value = question.points || 0;
  editCorrectAnswer.value = question.correctAnswer || '';
  editOptionsText.value = (question.options || []).join('; ');
  editQuestionPanel.classList.remove('hidden');
}

async function saveEditQuestion() {
  if (!editingTarget) return;
  const question = questions[editingTarget.phase].find((item) => item.id === editingTarget.id);
  if (!question) return;

  const payload = {
    text: editQuestionText.value.trim(),
    points: Number(editQuestionPoints.value) || 0,
    correctAnswer: editCorrectAnswer.value.trim(),
    options: editOptionsText.value.split(';').map((item) => item.trim()).filter(Boolean)
  };

  await set(ref(db, `pickEm/questions/${editingTarget.phase}/${editingTarget.id}`), payload);
  editingTarget = null;
  editQuestionPanel.classList.add('hidden');
  await loadData();
}

async function deleteQuestion(phase, id) {
  await remove(ref(db, `pickEm/questions/${phase}/${id}`));
  await loadData();
}

async function togglePhase(phase, open) {
  await set(ref(db, `pickEm/status/${phase}`), { open });
  await loadData();
}

async function finalizeScores() {
  const usersSnapshot = await get(ref(db, 'pickEm/users'));
  if (!usersSnapshot.exists()) return;

  const users = usersSnapshot.val();
  const entries = Object.entries(users);

  for (const [key, user] of entries) {
    const picks = user.picks || {};
    let total = 0;
    ['wildcard', 'mainStage'].forEach((phase) => {
      const phaseQuestions = questions[phase] || [];
      const phasePicks = picks[phase] || {};
      phaseQuestions.forEach((question) => {
        const picked = phasePicks[question.id];
        const correct = question.correctAnswer;
        if (picked && picked === correct) {
          total += Number(question.points || 0);
        }
      });
    });
    await set(ref(db, `pickEm/users/${key}/score`), total);
  }
  alert('Đã chốt điểm cho tất cả người dùng.');
}

addQuestionBtn.addEventListener('click', addQuestion);
saveEditBtn.addEventListener('click', saveEditQuestion);
cancelEditBtn.addEventListener('click', () => {
  editingTarget = null;
  editQuestionPanel.classList.add('hidden');
});
openWildcardBtn.addEventListener('click', () => togglePhase('wildcard', true));
closeWildcardBtn.addEventListener('click', () => togglePhase('wildcard', false));
openMainBtn.addEventListener('click', () => togglePhase('mainStage', true));
closeMainBtn.addEventListener('click', () => togglePhase('mainStage', false));
finalizeBtn.addEventListener('click', finalizeScores);

wildcardList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'edit') {
    openEditForm(button.dataset.phase, button.dataset.id);
  } else if (button.dataset.action === 'delete') {
    deleteQuestion(button.dataset.phase, button.dataset.id);
  }
});

mainList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'edit') {
    openEditForm(button.dataset.phase, button.dataset.id);
  } else if (button.dataset.action === 'delete') {
    deleteQuestion(button.dataset.phase, button.dataset.id);
  }
});

loadData();
