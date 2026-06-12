import {
    db,
    ref,
    get
} from "./firebase.js";

/* =====================================
   GAME STATE
===================================== */

let gold = 22;

let refreshRemain = 4;

let allPlayers = [];

let selectedPlayers = {
    marksman: null,
    support: null,
    fighter: null,
    mage: null,
    jungle: null
};

let currentShop = {
    marksman: [],
    support: [],
    fighter: [],
    mage: [],
    jungle: []
};

// selection order and index for sequential picking
const selectionOrder = ["marksman", "support", "fighter", "mage", "jungle"];
let currentSelectionIndex = 0;

let lastResultData = null; // store last tournament result for 'KẾT QUẢ' button

/* =====================================
   DOM
===================================== */

const goldEl = document.getElementById("gold");
const refreshEl = document.getElementById("refreshCount");

const refreshBtn =
    document.getElementById("refreshBtn");

const selectedContainer =
    document.getElementById("selectedPlayers");

const laneElements = {
    marksman:
        document.getElementById("marksmanLane"),

    support:
        document.getElementById("supportLane"),

    fighter:
        document.getElementById("fighterLane"),

    mage:
        document.getElementById("mageLane"),

    jungle:
        document.getElementById("jungleLane")
};

/* =====================================
   INIT
===================================== */

window.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadPlayers();

        generateShop();

        renderShop();

        renderSelectedPlayers();
            updateVisibleLane();
            setupLaneClickHandlers();
    }
);

const laneContainer = document.getElementById("laneContainer");

function updateVisibleLane() {
    // if team completed, hide shop container and show team panel
    if (teamCompleted()) {
        if (laneContainer) laneContainer.classList.add('hidden');
        return;
    }

    // show only the current lane
    if (laneContainer) laneContainer.classList.remove('hidden');

    const currentLane = selectionOrder[currentSelectionIndex] || null;
    Object.keys(laneElements).forEach(l => {
        const section = laneElements[l].closest('section');
        if (!section) return;
        // hide non-current lanes completely; show only the active lane
        if (l === currentLane) {
            section.classList.remove('hidden');
            section.classList.add('active-lane');
            section.classList.remove('disabled-lane');
        } else {
            section.classList.add('hidden');
            section.classList.remove('active-lane');
            section.classList.remove('disabled-lane');
        }
    });
}

// allow clicking lane header to activate that lane (only one lane active at a time)
function setupLaneClickHandlers() {
    Object.keys(laneElements).forEach(lane => {
        const section = laneElements[lane].closest('section');
        if (!section) return;
        const header = section.querySelector('h2');
        if (!header) return;
        header.style.cursor = 'pointer';
        header.title = 'Nhấn để chọn lane này';
        header.addEventListener('click', () => {
            // only allow activating lanes that are not yet selected
            if (selectedPlayers[lane]) return;
            const idx = selectionOrder.indexOf(lane);
            if (idx >= 0) {
                currentSelectionIndex = idx;
                renderShop();
                updateVisibleLane();
            }
        });
    });
}

/* =====================================
   LOAD FIREBASE
===================================== */

async function loadPlayers() {

    try {

        const snapshot =
            await get(
                ref(db, "players")
            );

        if (!snapshot.exists()) {

            alert(
                "Không có dữ liệu player"
            );

            return;
        }

        const data = snapshot.val();

        allPlayers =
            Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));

        console.log(
            "Loaded players:",
            allPlayers.length
        );

    } catch (err) {

        console.error(err);

        alert(
            "Lỗi load dữ liệu Firebase"
        );
    }
}

/* =====================================
   RANDOM HELPER
===================================== */

function shuffle(arr) {

    const clone = [...arr];

    for (
        let i = clone.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [clone[i], clone[j]] =
        [clone[j], clone[i]];
    }

    return clone;
}

function randomFive(players) {

    return shuffle(players)
        .slice(0, 5);
}

/* =====================================
   SHOP GENERATION
===================================== */

function generateShop() {

    // For each lane, pick up to one player per cost tier 1..5
    function shopByLane(laneName) {
        const shop = [];
        for (let cost = 1; cost <= 5; cost++) {
            const pool = allPlayers.filter(p => p.lane === laneName && Number(p.cost) === cost);
            if (pool.length > 0) shop.push(randomPick(pool, 1)[0]);
        }
        return shop;
    }

    currentShop.marksman = shopByLane("marksman");
    currentShop.support = shopByLane("support");
    currentShop.fighter = shopByLane("fighter");
    currentShop.mage = shopByLane("mage");
    currentShop.jungle = shopByLane("jungle");
}

/* =====================================
   RENDER SHOP
===================================== */

function renderShop() {

    renderLane(
        "marksman",
        currentShop.marksman
    );

    renderLane(
        "support",
        currentShop.support
    );

    renderLane(
        "fighter",
        currentShop.fighter
    );

    renderLane(
        "mage",
        currentShop.mage
    );

    renderLane(
        "jungle",
        currentShop.jungle
    );

    goldEl.textContent = gold;

    refreshEl.textContent =
        refreshRemain;
}

function renderLane(
    lane,
    players
) {

    const container =
        laneElements[lane];

    container.innerHTML = "";

    players.forEach(player => {

        const card =
            document.createElement("div");

        card.className =
            `player-card cost-${player.cost}`;

        card.innerHTML = `

            <img src="${player.image}">

            <div class="player-info">

                <div class="player-name">
                    ${player.name}
                </div>

                <div class="player-team">
                    ${player.team}
                </div>

                <div class="stat">
                    ⭐ Kỹ năng:
                    ${player.skill}
                </div>

                <div class="stat">
                    ⚡ Đột biến:
                    ${player.clutch}
                </div>

                <div class="stat">
                    🤝 Phối hợp:
                    ${player.synergy}
                </div>

                <div class="stat">
                    💰 Giá:
                    ${player.cost}
                </div>

                <button
                    class="buy-btn"
                    data-id="${player.id}"
                    data-lane="${lane}"
                >
                    CHỌN
                </button>

            </div>
        `;

        container.appendChild(card);
    });

    const buttons =
        container.querySelectorAll(
            ".buy-btn"
        );

    buttons.forEach(btn => {

        btn.addEventListener(
            "click",
            () => {

                const lane =
                    btn.dataset.lane;

                const id =
                    btn.dataset.id;

                buyPlayer(
                    lane,
                    id
                );
            }
        );
    });
}

/* =====================================
   BUY PLAYER
===================================== */

function buyPlayer(
    lane,
    playerId
) {

    if (
        selectedPlayers[lane]
    ) {

        alert(
            "Lane này đã chọn rồi!"
        );

        return;
    }

    const player =
        allPlayers.find(
            p => p.id === playerId
        );

    if (!player)
        return;

    if (
        gold < player.cost
    ) {

        alert(
            "Không đủ vàng!"
        );

        return;
    }

    gold -= player.cost;

    selectedPlayers[lane] =
        player;

    // advance to next lane index
    const idx = selectionOrder.indexOf(lane);
    if (idx >= 0 && currentSelectionIndex === idx) {
        currentSelectionIndex = Math.min(currentSelectionIndex + 1, selectionOrder.length - 1);
    }

    renderShop();

    renderSelectedPlayers();

    updateVisibleLane();
}

/* =====================================
   SELECTED TEAM
===================================== */

function renderSelectedPlayers() {

    selectedContainer.innerHTML = "";

    // render in selectionOrder so players appear in role order
    selectionOrder.forEach(lane => {
        const player = selectedPlayers[lane];
        if (!player) return;

        const div = document.createElement("div");
        div.className = "selected-card";

        div.innerHTML = `
            <h3>${player.name}</h3>
            <p>${player.team}</p>
            <p>Giá: ${player.cost}</p>
        `;

        // clicking selected card deselects and returns to that lane
        div.addEventListener('click', () => {
            selectedPlayers[lane] = null;
            gold += Number(player.cost) || 0;
            const laneIdx = selectionOrder.indexOf(lane);
            if (laneIdx >= 0) currentSelectionIndex = laneIdx;
            renderShop();
            renderSelectedPlayers();
            updateVisibleLane();
        });

        selectedContainer.appendChild(div);
    });

    goldEl.textContent =
        gold;
}

/* =====================================
   REFRESH SHOP
===================================== */

refreshBtn.addEventListener(
    "click",
    () => {

        if (
            refreshRemain <= 0
        ) {

            alert(
                "Đã hết lượt refresh"
            );

            return;
        }

        refreshRemain--;

        generateShop();

        renderShop();
    }
);

/* =====================================
   TEAM CHECK
===================================== */

function teamCompleted() {

    return (
        selectedPlayers.marksman &&
        selectedPlayers.support &&
        selectedPlayers.fighter &&
        selectedPlayers.mage &&
        selectedPlayers.jungle
    );
}

/* =====================================
   TEAM POWER
===================================== */

function calculateTeamPower() {

    const team =
        Object.values(
            selectedPlayers
        );

    const avgSkill =
        team.reduce(
            (sum, p) =>
                sum + Number(p.skill),
            0
        ) / 5;

    const avgClutch =
        team.reduce(
            (sum, p) =>
                sum + Number(p.clutch),
            0
        ) / 5;

    const avgSynergy =
        team.reduce(
            (sum, p) =>
                sum + Number(p.synergy),
            0
        ) / 5;

    const power =
        avgSkill * 1.2 +
        avgClutch * 0.8 +
        avgSynergy * 1.5;

    return Number(
        power.toFixed(2)
    );
}

/* =====================================
   BOT POWER
===================================== */

function calculateBotPower(
    roster
) {

    const avgSkill =
        roster.reduce(
            (s, p) =>
                s + Number(p.skill),
            0
        ) / roster.length;

    const avgClutch =
        roster.reduce(
            (s, p) =>
                s + Number(p.clutch),
            0
        ) / roster.length;

    const avgSynergy =
        roster.reduce(
            (s, p) =>
                s + Number(p.synergy),
            0
        ) / roster.length;

    const power =
        avgSkill * 1.2 +
        avgClutch * 0.8 +
        avgSynergy * 1.5;

    return Number(
        power.toFixed(2)
    );
}

/* =====================================
   RANDOM PLAYER HELPER
===================================== */

function randomPick(
    arr,
    amount
) {

    const clone =
        shuffle(arr);

    return clone.slice(
        0,
        amount
    );
}

// sleep helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* =====================================
   GET BOT ROSTER
===================================== */

function createBotRosterByCost(
    cost
) {

    const lanes = [
        "marksman",
        "support",
        "fighter",
        "mage",
        "jungle"
    ];

    const roster = [];

    lanes.forEach(lane => {
        // prefer exact cost match (compare numbers), else fallback to highest cost in lane
        const pool = allPlayers.filter(p => p.lane === lane && Number(p.cost) === cost);

        if (pool.length > 0) {
            roster.push(randomPick(pool, 1)[0]);
        } else {
            const fallback = allPlayers
                .filter(p => p.lane === lane)
                .sort((a, b) => Number(b.cost) - Number(a.cost));
            if (fallback.length > 0) roster.push(fallback[0]);
        }
    });

    return roster;
}

/* =====================================
   SEMI FINAL BOT
   3 COST4 + 2 COST5
===================================== */

function createSemiFinalBot() {

    const lanes = [
        "marksman",
        "support",
        "fighter",
        "mage",
        "jungle"
    ];

    const shuffled =
        shuffle(lanes);

    const fiveCostLanes =
        shuffled.slice(
            0,
            2
        );

    const roster = [];

    lanes.forEach(
        lane => {

            const cost =
                fiveCostLanes.includes(
                    lane
                )
                    ? 5
                    : 4;

            const pool =
                allPlayers.filter(
                    p =>
                        p.lane === lane &&
                        Number(p.cost) === cost
                );
            if (pool.length) {
                roster.push(randomPick(pool, 1)[0]);
            } else {
                const fallback = allPlayers
                    .filter(p => p.lane === lane)
                    .sort((a, b) => Number(b.cost) - Number(a.cost));
                if (fallback.length > 0) roster.push(fallback[0]);
            }
        }
    );

    return roster;
}

/* =====================================
   FINAL BOT
   4 players cost 5 + 1 player cost 4
===================================== */

function createFinalBot() {
    const lanes = [
        "marksman",
        "support",
        "fighter",
        "mage",
        "jungle"
    ];

    // pick one lane to be cost 4, others cost 5
    const fourLane = randomPick(lanes, 1)[0];

    const roster = [];

    lanes.forEach(lane => {
        const cost = lane === fourLane ? 4 : 5;

        const pool = allPlayers.filter(p => p.lane === lane && Number(p.cost) === cost);

        if (pool.length > 0) {
            roster.push(randomPick(pool, 1)[0]);
        } else {
            // fallback: pick highest-cost available for this lane
            const fallback = allPlayers
                .filter(p => p.lane === lane)
                .sort((a, b) => Number(b.cost) - Number(a.cost));
            if (fallback.length > 0) roster.push(fallback[0]);
        }
    });

    return roster;
}

/* =====================================
   SINGLE GAME
===================================== */

function playSingleGame(
    playerPower,
    botPower
) {

    /*
       Thêm yếu tố ngẫu nhiên
    */

    const playerRoll =
        playerPower +
        Math.random() * 15;

    const botRoll =
        botPower +
        Math.random() * 15;

    return playerRoll >
        botRoll
        ? "PLAYER"
        : "BOT";
}

/* =====================================
   GENERATE SERIES SCORE
===================================== */

function generateSeriesScore(
    targetWins,
    winner
) {

    let playerWins = 0;
    let botWins = 0;

    while (
        playerWins < targetWins &&
        botWins < targetWins
    ) {

        if (
            winner === "PLAYER"
        ) {

            const chance =
                Math.random();

            if (
                chance < 0.65
            ) {

                playerWins++;
            } else {

                botWins++;
            }

        } else {

            const chance =
                Math.random();

            if (
                chance < 0.65
            ) {

                botWins++;
            } else {

                playerWins++;
            }
        }

        /*
         tránh vượt quá
        */

        if (
            playerWins === targetWins
        )
            break;

        if (
            botWins === targetWins
        )
            break;
    }

    /*
      ép đúng kết quả
    */

    if (
        winner === "PLAYER"
    ) {

        playerWins =
            targetWins;

        if (
            botWins >=
            targetWins
        ) {

            botWins =
                targetWins - 1;
        }

    } else {

        botWins =
            targetWins;

        if (
            playerWins >=
            targetWins
        ) {

            playerWins =
                targetWins - 1;
        }
    }

    return {
        playerWins,
        botWins
    };
}

// simulate a series with per-game results, biased toward the stronger side
function simulateSeries(playerPower, botPower, targetWins) {
    const playerIsFavored = playerPower > botPower;
    const chanceFav = 0.65; // favored side win chance per game
    const chancePlayerWin = playerIsFavored ? chanceFav : (1 - chanceFav);

    let playerWins = 0, botWins = 0;
    const games = [];

    while (playerWins < targetWins && botWins < targetWins) {
        const roll = Math.random();
        const gameWinner = roll < chancePlayerWin ? 'PLAYER' : 'BOT';
        games.push(gameWinner);
        if (gameWinner === 'PLAYER') playerWins++; else botWins++;
    }

    // ensure overall winner matches stronger side — if not, force by flipping last games
    const expected = playerIsFavored ? 'PLAYER' : 'BOT';
    const actual = playerWins > botWins ? 'PLAYER' : 'BOT';
    if (actual !== expected) {
        // rebuild games so expected wins the series and loser has at most targetWins-1
        const loser = expected === 'PLAYER' ? 'BOT' : 'PLAYER';
        const loserWins = Math.min(playerIsFavored ? botWins : playerWins, targetWins - 1);
        const winnerWins = targetWins;

        // create array with the required counts
        const newGames = [];
        for (let i = 0; i < winnerWins; i++) newGames.push(expected);
        for (let i = 0; i < loserWins; i++) newGames.push(loser);

        // shuffle but ensure last game is a win for expected
        const shuffled = shuffle(newGames);
        // move an expected to the end if not already
        if (shuffled[shuffled.length - 1] !== expected) {
            const idx = shuffled.indexOf(expected);
            if (idx > -1) {
                shuffled.splice(idx, 1);
                shuffled.push(expected);
            }
        }

        games.length = 0;
        Array.prototype.push.apply(games, shuffled);

        // recompute counts
        playerWins = games.filter(g => g === 'PLAYER').length;
        botWins = games.filter(g => g === 'BOT').length;
    }

    return { playerWins, botWins, games };
}

/* =====================================
   TOURNAMENT RUNNER
===================================== */

async function startTournament() {
    if (!teamCompleted()) {
        alert('Đội hình chưa đầy đủ!');
        return;
    }

    const matchLog = document.getElementById('matchLog');
    const tournamentScreen = document.getElementById('tournamentScreen');
    const resultModal = document.getElementById('resultModal');
    const resultTitle = document.getElementById('resultTitle');
    const resultRoster = document.getElementById('resultRoster');

    matchLog.innerHTML = '';
    resultModal.classList.add('hidden');
    tournamentScreen.classList.remove('hidden');

    const playerRoster = selectionOrder.map(l => selectedPlayers[l]).filter(Boolean);
    const playerPower = calculateTeamPower();

    // Define rounds
    const rounds = [
        { label: 'Vòng bảng', builder: () => createBotRosterByCost(3), targetWins: 1 },
        { label: 'Vòng tứ kết', builder: () => createBotRosterByCost(4), targetWins: 2 },
        { label: 'Vòng bán kết', builder: () => createSemiFinalBot(), targetWins: 3 },
        { label: 'Vòng chung kết', builder: () => createFinalBot(), targetWins: 4 }
    ];

    for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i];
        const botRoster = r.builder();
        let botPower = calculateBotPower(botRoster);

        // random events: player clutch (10%) increases player power by 20%; bot stumble (20%) reduces bot power by 30%
        let playerEvent = false;
        let botEvent = false;

        // Log round header (hide power values)
        const header = document.createElement('div');
        header.className = 'round-header';
        header.textContent = `${r.label}`;

        // determine random events
        if (Math.random() < 0.10) {
            playerEvent = true;
            // apply player clutch +20%
            playerPower = Number((playerPower * 1.2).toFixed(2));
            const badge = document.createElement('span');
            badge.className = 'event-badge event-player';
            badge.textContent = 'Đột biến +20%';
            header.appendChild(badge);
        }

        if (Math.random() < 0.20) {
            botEvent = true;
            // apply bot stumble -30%
            botPower = Number((botPower * 0.7).toFixed(2));
            const badge2 = document.createElement('span');
            badge2.className = 'event-badge event-bot';
            badge2.textContent = 'Bot xẩy chân -30%';
            header.appendChild(badge2);
        }

        matchLog.appendChild(header);

        // Determine winner and simulate per-game details
        let playerWins = 0, botWins = 0, games = [];
        if (r.targetWins === 1) {
            const winner = playerPower > botPower ? 'PLAYER' : 'BOT';
            if (winner === 'PLAYER') playerWins = 1; else botWins = 1;
            games = [playerWins === 1 ? 'PLAYER' : 'BOT'];
            const row = document.createElement('div');
            row.className = 'match-row';
            row.textContent = `${r.label}: ${winner === 'PLAYER' ? 'Bạn thắng' : 'Bot thắng'} (${playerWins}-${botWins})`;
            matchLog.appendChild(row);
        } else {
            const series = simulateSeries(playerPower, botPower, r.targetWins);
            playerWins = series.playerWins;
            botWins = series.botWins;
            games = series.games;
            const row = document.createElement('div');
            row.className = 'match-row';
            row.textContent = `${r.label} (BO${r.targetWins*2-1}): Kết quả ${playerWins}-${botWins}`;
            matchLog.appendChild(row);
        }

        // create horizontal round result panel
        const roundResult = document.createElement('div');
        roundResult.className = 'round-result';

        const playerPanel = document.createElement('div');
        playerPanel.className = 'round-panel player-panel';
        const playerTitle = document.createElement('div');
        playerTitle.className = 'panel-title';
        playerTitle.textContent = 'Your Roster';
        playerPanel.appendChild(playerTitle);
        playerRoster.forEach(p => {
            const el = document.createElement('div');
            el.className = 'panel-player';
            const img = document.createElement('img');
            img.className = 'panel-avatar';
            img.src = p.image || '';
            img.alt = p.name;
            const meta = document.createElement('div');
            meta.className = 'panel-meta';
            meta.textContent = `${p.name} (${p.team}) - Giá: ${p.cost}`;
            el.appendChild(img);
            el.appendChild(meta);
            playerPanel.appendChild(el);
        });

        const botPanel = document.createElement('div');
        botPanel.className = 'round-panel bot-panel';
        const botTitle = document.createElement('div');
        botTitle.className = 'panel-title';
        botTitle.textContent = `Bot Lineup (${r.label})`;
        botPanel.appendChild(botTitle);
        botRoster.forEach(p => {
            const d = document.createElement('div');
            d.className = 'panel-player bot-player';
            const img = document.createElement('img');
            img.className = 'panel-avatar';
            img.src = p.image || '';
            img.alt = p.name;
            const meta = document.createElement('div');
            meta.className = 'panel-meta';
            meta.textContent = `${p.name} - ${p.team} - Giá: ${p.cost}`;
            d.appendChild(img);
            d.appendChild(meta);
            botPanel.appendChild(d);
        });

        roundResult.appendChild(playerPanel);
        roundResult.appendChild(botPanel);
        // show per-game results inside this round
        const gamesList = document.createElement('div');
        gamesList.className = 'games-list';
        games.forEach((g, idx) => {
            const gi = document.createElement('div');
            gi.className = 'game-item';
            gi.textContent = `Ván ${idx + 1}: ${g === 'PLAYER' ? 'Bạn thắng' : 'Bot thắng'}`;
            if (g === 'PLAYER') gi.classList.add('game-win'); else gi.classList.add('game-lose');
            gamesList.appendChild(gi);
        });

        roundResult.appendChild(gamesList);
        matchLog.appendChild(roundResult);

        // wait 5 seconds so user can view this round
        await sleep(5000);

        // if lost, show failure and stop
        if (botWins > playerWins) {
            resultTitle.textContent = `THẤT BẠI TẠI ${r.label.toUpperCase()} `;
            resultRoster.innerHTML = '';
            const lostTitle = document.createElement('h3');
            lostTitle.textContent = 'ĐỘI HÌNH BOT:';
            resultRoster.appendChild(lostTitle);
            botRoster.forEach(p => {
                const el = document.createElement('div');
                el.textContent = `${p.name} (${p.team}) - Giá: ${p.cost}`;
                resultRoster.appendChild(el);
            });

            // save last result for manual view
            lastResultData = {
                title: resultTitle.textContent,
                roster: botRoster.map(p => ({ name: p.name, team: p.team, cost: p.cost }))
            };

            resultModal.classList.remove('hidden');
            return;
        }
        // else continue to next round
    }

    // if all rounds passed
    resultTitle.textContent = `BẠN LÀ NHÀ VÔ ĐỊCH VỚI ĐỘI HÌNH:`;
    resultRoster.innerHTML = '';
    playerRoster.forEach(p => {
        const el = document.createElement('div');
        el.textContent = `${p.name} (${p.team}) - Giá: ${p.cost}`;
        resultRoster.appendChild(el);
    });

    // save last result (victory)
    lastResultData = {
        title: resultTitle.textContent,
        roster: playerRoster.map(p => ({ name: p.name, team: p.team, cost: p.cost }))
    };

    resultModal.classList.remove('hidden');
}

// wire button
const startBtn = document.getElementById('startTournament');
if (startBtn) startBtn.addEventListener('click', startTournament);

// New Game button handler
const newGameBtn = document.getElementById('newGameBtn');
if (newGameBtn) newGameBtn.addEventListener('click', () => {
    // reset state
    gold = 22;
    refreshRemain = 4;
    selectedPlayers = { marksman: null, support: null, fighter: null, mage: null, jungle: null };
    currentSelectionIndex = 0;
    lastResultData = null;

    generateShop();
    renderShop();
    renderSelectedPlayers();
    updateVisibleLane();

    // hide tournament/result UI
    const tournamentScreen = document.getElementById('tournamentScreen');
    const resultModalEl = document.getElementById('resultModal');
    if (tournamentScreen) tournamentScreen.classList.add('hidden');
    if (resultModalEl) resultModalEl.classList.add('hidden');
});

// Review button inside result modal
const reviewBtn = document.getElementById('reviewBtn');
if (reviewBtn) reviewBtn.addEventListener('click', () => {
    const resultModalEl = document.getElementById('resultModal');
    const tournamentScreen = document.getElementById('tournamentScreen');
    if (resultModalEl) resultModalEl.classList.add('hidden');
    if (tournamentScreen) tournamentScreen.classList.remove('hidden');
    // scroll to match log
    const matchLogEl = document.getElementById('matchLog');
    if (matchLogEl) matchLogEl.scrollIntoView({ behavior: 'smooth' });
});
