import { db, ref, set, get, child, onValue, update } from './firebase.js';

const authPanel = document.getElementById('authPanel');
const pickemPanel = document.getElementById('pickemPanel');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const authStatus = document.getElementById('authStatus');
const userMeta = document.getElementById('userMeta');
const userScore = document.getElementById('userScore');
const wildcardQuestionsEl = document.getElementById('wildcardQuestions');
const mainQuestionsEl = document.getElementById('mainQuestions');

let currentUserKey = null;
let currentUser = null;
let questions = { wildcard: [], mainStage: [] };
let statuses = { wildcard: false, mainStage: false };
let answers = { wildcard: {}, mainStage: {} };
let editModes = {};

function showMessage(message, isError = false) {
  authStatus.textContent = message;
  authStatus.style.color = isError ? '#f87171' : '#fbbf24';
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function showLoginView() {
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
}

function showRegisterView() {
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
}

async function checkUser(gameId, server) {
  const userRef = ref(db, `pickEm/users/${normalize(gameId)}_${normalize(server)}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : null;
}

async function handleLogin() {
  const gameId = document.getElementById('loginGameId').value.trim();
  const server = document.getElementById('loginServer').value.trim();
  if (!gameId || !server) {
    showMessage('Vui lòng nhập đầy đủ ID Ingame và Server.', true);
    return;
  }

  try {
    const user = await checkUser(gameId, server);
    if (!user) {
      showMessage('Tài khoản chưa tồn tại. Vui lòng đăng ký.', true);
      return;
    }

    currentUserKey = `${normalize(gameId)}_${normalize(server)}`;
    currentUser = user;
    authPanel.classList.add('hidden');
    pickemPanel.classList.remove('hidden');
    renderUserHeader();
    await loadData();
  } catch (error) {
    console.error(error);
    showMessage('Đăng nhập thất bại.', true);
  }
}

async function handleRegister() {
  const gameId = document.getElementById('registerGameId').value.trim();
  const server = document.getElementById('registerServer').value.trim();
  const fbName = document.getElementById('registerName').value.trim();
  if (!gameId || !server || !fbName) {
    showMessage('Vui lòng nhập đầy đủ thông tin đăng ký.', true);
    return;
  }

  const key = `${normalize(gameId)}_${normalize(server)}`;
  const existing = await checkUser(gameId, server);
  if (existing) {
    showMessage('Tài khoản đã tồn tại. Vui lòng đăng nhập.', true);
    return;
  }

  const payload = {
    gameId,
    server,
    fbName,
    score: 0,
    picks: { wildcard: {}, mainStage: {} },
    submitted: { wildcard: false, mainStage: false }
  };

  await set(ref(db, `pickEm/users/${key}`), payload);
  currentUserKey = key;
  currentUser = payload;
  authPanel.classList.add('hidden');
  pickemPanel.classList.remove('hidden');
  renderUserHeader();
  await loadData();
}

function renderUserHeader() {
  userMeta.textContent = `${currentUser.fbName} • ${currentUser.gameId} • ${currentUser.server}`;
  userScore.textContent = `${currentUser.score || 0} điểm`;
}

async function loadData() {
  const questionsRef = ref(db, 'pickEm/questions');
  const statusRef = ref(db, 'pickEm/status');
  const answersRef = ref(db, 'pickEm/answers');
  const userRef = ref(db, `pickEm/users/${currentUserKey}`);

  const [questionsSnapshot, statusSnapshot, answersSnapshot, userSnapshot] = await Promise.all([
    get(questionsRef),
    get(statusRef),
    get(answersRef),
    get(userRef)
  ]);

  questions = { wildcard: [], mainStage: [] };
  statuses = { wildcard: false, mainStage: false };
  answers = { wildcard: {}, mainStage: {} };

  if (questionsSnapshot.exists()) {
    const raw = questionsSnapshot.val();
    questions.wildcard = Object.entries(raw.wildcard || {}).map(([id, item]) => ({ id, ...item }));
    questions.mainStage = Object.entries(raw.mainStage || {}).map(([id, item]) => ({ id, ...item }));
  }

  if (statusSnapshot.exists()) {
    const raw = statusSnapshot.val();
    statuses.wildcard = !!raw.wildcard?.open;
    statuses.mainStage = !!raw.mainStage?.open;
  }

  if (answersSnapshot.exists()) {
    const raw = answersSnapshot.val();
    answers.wildcard = raw.wildcard || {};
    answers.mainStage = raw.mainStage || {};
  }

  if (userSnapshot.exists()) {
    currentUser = userSnapshot.val();
    renderUserHeader();
  }

  renderQuestions();
  attachListeners();
}

function renderQuestions() {
  wildcardQuestionsEl.innerHTML = '';
  mainQuestionsEl.innerHTML = '';

  const renderSection = (container, phase, items) => {
    if (!items.length) {
      container.innerHTML = '<p class="hint">Chưa có câu hỏi nào.</p>';
      return;
    }

    items.forEach((question) => {
      const card = document.createElement('div');
      card.className = 'question-card';
      const isOpen = phase === 'wildcard' ? statuses.wildcard : statuses.mainStage;
      const locked = !isOpen;
      const answer = (phase === 'wildcard' ? answers.wildcard : answers.mainStage)[question.id] || question.correctAnswer;
      const currentPick = (currentUser?.picks?.[phase] || {})[question.id];
      const options = question.options || [];
      const showAnswer = !isOpen && answer;
      const isEditing = !!editModes[`${phase}_${question.id}`];
      const selectionView = currentPick && !isEditing && !locked;

      card.innerHTML = `
        <strong>${question.text}</strong>
        <div class="hint">Điểm: ${question.points || 0} • ${locked ? 'Đã khóa' : 'Đang mở'}</div>
        ${selectionView ? `
          <div class="option-list">
            <div class="hint">Bạn đã chọn: ${currentPick}</div>
            <button class="btn secondary edit-btn" data-phase="${phase}" data-question="${question.id}">Sửa</button>
          </div>
        ` : `
          <div class="option-list">
            ${options.map((option) => `
              <button class="option-btn ${currentPick === option ? 'active' : ''}" data-phase="${phase}" data-question="${question.id}" data-option="${option}" ${locked ? 'disabled' : ''}>${option}${showAnswer && answer === option ? ' ✅' : ''}</button>
            `).join('')}
          </div>
        `}
        ${showAnswer ? `<div class="hint">Đáp án đúng: ${answer}</div>` : ''}
      `;
      container.appendChild(card);
    });
  };

  renderSection(wildcardQuestionsEl, 'wildcard', questions.wildcard);
  renderSection(mainQuestionsEl, 'mainStage', questions.mainStage);
}

function attachListeners() {
  document.querySelectorAll('.option-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const phase = button.dataset.phase;
      const questionId = button.dataset.question;
      const option = button.dataset.option;
      const open = phase === 'wildcard' ? statuses.wildcard : statuses.mainStage;
      if (!open) {
        showMessage('Phần này hiện đang khóa, không thể chọn câu trả lời.', true);
        return;
      }

      const userPicksPath = `pickEm/users/${currentUserKey}/picks/${phase}/${questionId}`;
      await set(ref(db, userPicksPath), option);
      editModes[`${phase}_${questionId}`] = false;
      const userRef = ref(db, `pickEm/users/${currentUserKey}`);
      const snapshot = await get(userRef);
      currentUser = snapshot.val();
      renderQuestions();
      attachListeners();
    });
  });

  document.querySelectorAll('.edit-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const phase = button.dataset.phase;
      const questionId = button.dataset.question;
      editModes[`${phase}_${questionId}`] = true;
      renderQuestions();
      attachListeners();
    });
  });
}

showLoginBtn.addEventListener('click', showLoginView);
showRegisterBtn.addEventListener('click', showRegisterView);
backToLoginBtn.addEventListener('click', showLoginView);
loginBtn.addEventListener('click', handleLogin);
registerBtn.addEventListener('click', handleRegister);
showLoginView();

onValue(ref(db, 'pickEm/questions'), () => loadData());
onValue(ref(db, 'pickEm/status'), () => loadData());
onValue(ref(db, 'pickEm/answers'), () => loadData());
