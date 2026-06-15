import {
    db,
    ref,
    get
} from "./firebase.js";

import { renderSelectedPlayersUI } from './selectedDisplay.js';
import { showResultModal, hideResultModal } from './resultDisplay.js';

/* =====================================
    TRẠNG THÁI GAME
    (Game state)
===================================== */

let gold = 21;

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

// thứ tự chọn lane và chỉ số hiện tại (chọn theo thứ tự)
const selectionOrder = ["marksman", "support", "fighter", "mage", "jungle"];
let currentSelectionIndex = 0;

let lastResultData = null; // lưu kết quả cuối cùng để nút 'XEM LẠI' sử dụng

// tournament control state for rematch feature
let isTournamentRunning = false;
let currentRoundIndex = 0;
let rematchRequested = false;
let rematchRoundIndex = null;

/* =====================================
    DOM (tham chiếu phần tử)
===================================== */

const goldEl = document.getElementById("gold");
const refreshEl = document.getElementById("refreshCount");

const refreshBtn =
    document.getElementById("refreshBtn");

// music elements (YouTube player)
let bgMusicPlayer = null;
let musicPlaying = false;
const defaultMusicLabelOn = '🔊 Tắt nhạc';
const defaultMusicLabelOff = '🔊 Bật nhạc';

// Lưu ý: phần hiển thị đội đã được tách sang selectedDisplay.js

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
    KHỞI TẠO (INIT)
===================================== */

window.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadPlayers();

        generateShop();

        renderShop();

        // render phần đội hình (module riêng)
        renderSelectedPlayersUI(selectedPlayers, selectionOrder, gold, 'selectedPlayers', 'gold', onDeselect);
            updateVisibleLane();
            setupLaneClickHandlers();

        // initialize music controls (YouTube player)
        try {
            const musicToggle = document.getElementById('musicToggle');
            if (musicToggle) {
                musicToggle.textContent = defaultMusicLabelOff;

                // create YT player when API ready
                function createYT() {
                    try {
                        bgMusicPlayer = new YT.Player('ytPlayer', {
                            height: '0',
                            width: '0',
                            videoId: 'KheFsJvAvsU',
                            playerVars: { controls: 1, loop: 1, playlist: 'KheFsJvAvsU', modestbranding: 1, rel: 0 },
                            events: {
                                onReady: function () {
                                    // nothing
                                }
                            }
                        });
                    } catch (e) {
                        // ignore
                    }
                }

                if (window.YT && window.YT.Player) {
                    createYT();
                } else {
                    // set global callback for API
                    window.onYouTubeIframeAPIReady = function () {
                        createYT();
                    };
                }

                musicToggle.addEventListener('click', async () => {
                    if (!bgMusicPlayer) return;
                    try {
                        const state = bgMusicPlayer.getPlayerState ? bgMusicPlayer.getPlayerState() : -1;
                        // states: 1=playing, 2=paused
                        if (state === 1) {
                            bgMusicPlayer.pauseVideo();
                            musicPlaying = false;
                            musicToggle.textContent = defaultMusicLabelOff;
                        } else {
                            bgMusicPlayer.playVideo();
                            musicPlaying = true;
                            musicToggle.textContent = defaultMusicLabelOn;
                        }
                    } catch (e) {
                        // ignore
                    }
                });
            }
        } catch (e) {
            // ignore
        }
    }
);

const laneContainer = document.getElementById("laneContainer");

function updateVisibleLane() {
    // nếu đội đã đầy, ẩn phần shop và hiển thị panel đội
    if (teamCompleted()) {
        if (laneContainer) laneContainer.classList.add('hidden');
        return;
    }

    // chỉ hiển thị lane hiện tại
    if (laneContainer) laneContainer.classList.remove('hidden');

    const currentLane = selectionOrder[currentSelectionIndex] || null;
    Object.keys(laneElements).forEach(l => {
        const section = laneElements[l].closest('section');
        if (!section) return;
        // ẩn các lane không phải lane hiện tại; chỉ hiển thị lane active
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

// cho phép bấm tiêu đề lane để kích hoạt lane đó (chỉ 1 lane active)
function setupLaneClickHandlers() {
    Object.keys(laneElements).forEach(lane => {
        const section = laneElements[lane].closest('section');
        if (!section) return;
        const header = section.querySelector('h2');
        if (!header) return;
        header.style.cursor = 'pointer';
        header.title = 'Nhấn để chọn lane này';
        header.addEventListener('click', () => {
            // chỉ cho kích hoạt lane chưa được chọn
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
    TẢI DỮ LIỆU FIREBASE
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
    HÀM TRỢ GIÚP NGẪU NHIÊN
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
    TẠO SHOP
===================================== */

function generateShop() {

    // Với mỗi lane, chọn tối đa 1 player cho mỗi mức giá 1..5
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
    VẼ SHOP LÊN DOM
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
    MUA PLAYER
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

    // tiến tới chỉ số lane tiếp theo (nếu đang ở lane hiện tại)
    const idx = selectionOrder.indexOf(lane);
    if (idx >= 0 && currentSelectionIndex === idx) {
        currentSelectionIndex = Math.min(currentSelectionIndex + 1, selectionOrder.length - 1);
    }

    renderShop();

    renderSelectedPlayersUI(selectedPlayers, selectionOrder, gold, 'selectedPlayers', 'gold', onDeselect);

    updateVisibleLane();
}

/* =====================================
   ĐỘI HÌNH ĐÃ CHỌN (đã tách thành module)
===================================== */
// Hàm renderSelectedPlayers đã được di chuyển vào selectedDisplay.js

// callback khi người dùng bấm bỏ chọn trên thẻ đã chọn
function onDeselect(lane, player) {
    selectedPlayers[lane] = null;
    gold += Number(player.cost) || 0;
    const laneIdx = selectionOrder.indexOf(lane);
    if (laneIdx >= 0) currentSelectionIndex = laneIdx;
    renderShop();
    renderSelectedPlayersUI(selectedPlayers, selectionOrder, gold, 'selectedPlayers', 'gold', onDeselect);
    updateVisibleLane();
}

/* =====================================
    LÀM MỚI SHOP
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
    KIỂM TRA ĐỘI HÌNH
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
    TÍNH SỨC MẠNH ĐỘI
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
    TÍNH SỨC MẠNH BOT
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
    TRỢ GIÚP CHỌN NGẪU NHIÊN
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

/* =====================================
    DÒNG PHÂN TÍCH (commentary)
    Các câu dẫn cho thắng/thua/trung lập
===================================== */

const winLines = [
    'Đội ta có chiến công đầu',
    'Đội ăn được rùa thần',
    'Đội ăn được lord',
    'Solo kill ở đường giữa',
    'Solo kill ở đường vàng',
    'Solo kill ở đường kinh nghiệm',
    'Quét sạch giành cho team ta'
];

const loseLines = [
    'Đội bot có chiến công đầu',
    'Đội bot ăn được rùa thần',
    'Đội bot ăn được lord',
    'Team ta bị Solo kill ở đường giữa',
    'Team ta bị Solo kill ở đường vàng',
    'Team ta bị Solo kill ở đường kinh nghiệm',
    'Quét sạch giành cho đội bot'
];

const neutralLines = [
    'Rừng bên ta cướp được rùa',
    'Rừng bên ta cướp được lord'
];

function pickRandomLine(cat) {
    if (cat === 'win') return winLines[Math.floor(Math.random() * winLines.length)];
    if (cat === 'lose') return loseLines[Math.floor(Math.random() * loseLines.length)];
    return neutralLines[Math.floor(Math.random() * neutralLines.length)];
}

const playerWinPatterns = [
    ['win','neutral','win'],
    ['lose','neutral','win'],
    ['neutral','win','win'],
    ['win','win','win'],
    ['lose','lose','win']
];

const botWinPatterns = [
    ['lose','neutral','lose'],
    ['win','neutral','lose'],
    ['neutral','lose','lose'],
    ['lose','lose','lose'],
    ['win','win','lose']
];

function generateCommentary(winner) {
    // choose patterns but avoid patterns that end with neutral
    const patterns = winner === 'PLAYER' ? playerWinPatterns : botWinPatterns;
    const validPatterns = patterns.filter(p => p[p.length - 1] !== 'neutral');
    const usePatterns = validPatterns.length ? validPatterns : patterns;
    const pattern = usePatterns[Math.floor(Math.random() * usePatterns.length)];

    const isFirstBlood = txt => typeof txt === 'string' && txt.toLowerCase().includes('chiến công đầu');
    const isRune = txt => typeof txt === 'string' && txt.toLowerCase().includes('rùa');
    const isLord = txt => typeof txt === 'string' && txt.toLowerCase().includes('lord');
    const isSolo = txt => typeof txt === 'string' && txt.toLowerCase().includes('solo');

    const result = [];
    let firstBloodShown = false;
    let hasSolo = false;
    let hasLord = false;
    let hasRune = false;

    for (let i = 0; i < pattern.length; i++) {
        const cat = pattern[i];

        let attempts = 0;
        let line = pickRandomLine(cat);

        while (attempts < 30) {
            const fb = isFirstBlood(line);
            const rn = isRune(line);
            const ld = isLord(line);
            const sl = isSolo(line);

            // rule: if we've already shown a first-blood, don't show another
            if (fb && firstBloodShown) {
                line = pickRandomLine(cat);
                attempts++;
                continue;
            }

            // rule: if we already have a solo line, don't allow a first-blood
            if (fb && hasSolo) {
                line = pickRandomLine(cat);
                attempts++;
                continue;
            }

            // rule: if we already have a first-blood, don't allow solo
            if (sl && firstBloodShown) {
                line = pickRandomLine(cat);
                attempts++;
                continue;
            }

            // rule: lord and rùa cannot both appear
            if (ld && hasRune) {
                line = pickRandomLine(cat);
                attempts++;
                continue;
            }
            if (rn && hasLord) {
                line = pickRandomLine(cat);
                attempts++;
                continue;
            }

            // rule: neutral cannot be last (double-check)
            if (cat === 'neutral' && i === pattern.length - 1) {
                line = pickRandomLine(cat);
                attempts++;
                continue;
            }

            // accepted
            break;
        }

        // update flags
        if (isFirstBlood(line)) firstBloodShown = true;
        if (isSolo(line)) hasSolo = true;
        if (isLord(line)) hasLord = true;
        if (isRune(line)) hasRune = true;

        result.push({ cat, text: line });
    }

    // after selection, final sweep: if both lord and rune present, remove rune preference by replacing rune lines
    if (hasLord && hasRune) {
        for (let i = 0; i < result.length; i++) {
            if (isRune(result[i].text)) {
                // try to replace with another neutral or same category non-rune
                const cat = result[i].cat;
                let replaced = false;
                for (let a = 0; a < 10; a++) {
                    const cand = pickRandomLine(cat);
                    if (!isRune(cand) && !(isFirstBlood(cand) && firstBloodShown && !isFirstBlood(result[i].text))) {
                        result[i].text = cand;
                        replaced = true;
                        break;
                    }
                }
                if (replaced) {
                    hasRune = result.some(r => isRune(r.text));
                    if (!hasRune) break;
                }
            }
        }
    }

    // ensure no neutral at last position (final safety)
    if (result.length > 0 && result[result.length - 1].cat === 'neutral') {
        // try swap with earlier non-neutral
        for (let j = result.length - 2; j >= 0; j--) {
            if (result[j].cat !== 'neutral') {
                const tmp = result[j];
                result[j] = result[result.length - 1];
                result[result.length - 1] = tmp;
                break;
            }
        }
    }

    return result;
}

/* (commentary removed in rollback) */

// hàm tạm dừng (sleep)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* =====================================
    TẠO DANH SÁCH BOT THEO COST
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
        // ưu tiên chọn player có đúng cost, nếu không có thì chọn player cost cao nhất trong lane
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
    BOT BÁN KẾT (semi-final)
    cấu trúc: 3 người cost4 + 2 người cost5
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
    BOT CHUNG KẾT
    5 người cost 5
===================================== */

function createFinalBot() {
    const lanes = [
        "marksman",
        "support",
        "fighter",
        "mage",
        "jungle"
    ];

    const roster = [];

    lanes.forEach(lane => {
        const cost = 5;

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
    PHIÊN TRANH (1 trận)
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
    TẠO KẾT QUẢ LOẠT (series)
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

// mô phỏng loạt trận với kết quả từng ván, thiên về bên mạnh hơn
function simulateSeries(playerPower, botPower, targetWins) {
    const playerIsFavored = playerPower > botPower;
    const chanceFav = 0.65; // xác suất thắng mỗi ván cho bên được ưu thế
    const chancePlayerWin = playerIsFavored ? chanceFav : (1 - chanceFav);

    let playerWins = 0, botWins = 0;
    const games = [];

    while (playerWins < targetWins && botWins < targetWins) {
        const roll = Math.random();
        const gameWinner = roll < chancePlayerWin ? 'PLAYER' : 'BOT';
        games.push(gameWinner);
        if (gameWinner === 'PLAYER') playerWins++; else botWins++;
    }

    // đảm bảo kết quả loạt trận phù hợp với bên mạnh hơn — nếu không, sửa lại bằng cách đảo ván cuối
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
    CHẠY GIẢI ĐẤU
===================================== */

async function startTournament() {
    if (!teamCompleted()) {
        alert('Đội hình chưa đầy đủ!');
        return;
    }

    const matchLog = document.getElementById('matchLog');
    const tournamentScreen = document.getElementById('tournamentScreen');

    matchLog.innerHTML = '';
    hideResultModal();
    tournamentScreen.classList.remove('hidden');

    // attempt to play background music on tournament start (user gesture may allow autoplay)
    try {
        if (bgMusicPlayer && !musicPlaying) {
            // attempt to play (may be blocked until user interacts)
            bgMusicPlayer.playVideo();
            musicPlaying = true;
            const musicToggle = document.getElementById('musicToggle');
            if (musicToggle) musicToggle.textContent = defaultMusicLabelOn;
        }
    } catch (e) {
        // ignore play errors
    }

    const playerRoster = selectionOrder.map(l => selectedPlayers[l]).filter(Boolean);
    let playerPower = calculateTeamPower();

    // reset rematch state
    isTournamentRunning = true;
    rematchRequested = false;
    rematchRoundIndex = null;

    // Define rounds
    const rounds = [
        { label: 'Vòng bảng', builder: () => createBotRosterByCost(3), targetWins: 1 },
        { label: 'Vòng tứ kết', builder: () => createBotRosterByCost(4), targetWins: 2 },
        { label: 'Vòng bán kết', builder: () => createSemiFinalBot(), targetWins: 3 },
        { label: 'Vòng chung kết', builder: () => createFinalBot(), targetWins: 4 }
    ];

    // show rematch button while tournament is visible
    const rematchBtn = document.getElementById('rematchBtn');
    if (rematchBtn) rematchBtn.style.display = 'inline-block';

    let i = 0;
    while (i < rounds.length) {
        currentRoundIndex = i;
        const r = rounds[i];
        const roundStartChildIndex = matchLog.children.length;
        const botRoster = r.builder();
        let botPower = calculateBotPower(botRoster);

        // snapshot powers so we can restore on rematch
        const playerPowerBefore = playerPower;
        const botPowerBefore = botPower;

        // sự kiện ngẫu nhiên: đột biến người chơi (20%) tăng sức mạnh; bot sẩy chân (20%) giảm sức mạnh (mức giảm 17.5%)
        let playerEvent = false;
        let botEvent = false;

        // tạo header vòng (ẩn giá trị sức mạnh)
        const header = document.createElement('div');
        header.className = 'round-header';
        header.textContent = `${r.label}`;

        // xác định sự kiện ngẫu nhiên
        if (Math.random() < 0.20) {
            playerEvent = true;
            // áp dụng đột biến người chơi +20%
            playerPower = Number((playerPower * 1.2).toFixed(2));
            const badge = document.createElement('span');
            badge.className = 'event-badge event-player';
            badge.textContent = 'Đột biến +20%';
            header.appendChild(badge);
        }

        if (Math.random() < 0.20) {
            botEvent = true;
            // áp dụng bot sẩy chân -20%
            botPower = Number((botPower * 0.80).toFixed(2));
            const badge2 = document.createElement('span');
            badge2.className = 'event-badge event-bot';
            badge2.textContent = 'Bot sẩy chân -20%';
            header.appendChild(badge2);
        }

        matchLog.appendChild(header);

        // Determine winner and simulate per-game details
        let playerWins = 0, botWins = 0, games = [];
        if (r.targetWins === 1) {
            const winner = playerPower > botPower ? 'PLAYER' : 'BOT';
            if (winner === 'PLAYER') playerWins = 1; else botWins = 1;
            games = [playerWins === 1 ? 'PLAYER' : 'BOT'];
            // không hiển thị dòng tóm tắt: hiện theo từng ván với bình luận
        } else {
            const series = simulateSeries(playerPower, botPower, r.targetWins);
            playerWins = series.playerWins;
            botWins = series.botWins;
            games = series.games;
            // không hiển thị dòng tóm tắt: hiện theo từng ván với bình luận
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

        // show roster (ảnh 1) first
        matchLog.appendChild(roundResult);

        // then show Best-of panel (ảnh 2)
        const bestOfPanel = document.createElement('div');
        bestOfPanel.className = 'best-of-panel';

        const boTitle = document.createElement('div');
        boTitle.className = 'bo-title';
        boTitle.textContent = `Best of ${r.targetWins * 2 - 1}`;
        bestOfPanel.appendChild(boTitle);

        // create match boxes
        const boxes = document.createElement('div');
        boxes.className = 'match-boxes';
        for (let b = 0; b < (r.targetWins * 2 - 1); b++) {
            const box = document.createElement('div');
            box.className = 'match-box';
            box.dataset.index = b;
            box.innerHTML = `
                <div class="box-label">M${b + 1}</div>
                <div class="box-score"></div>
            `;
            boxes.appendChild(box);
        }
        bestOfPanel.appendChild(boxes);

        // commentary area (will be cleared after each game's 3 lines)
        const commentaryContainer = document.createElement('div');
        commentaryContainer.className = 'commentary-container';
        bestOfPanel.appendChild(commentaryContainer);

        // game results area (shows per-game result after clearing commentary)
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container';
        bestOfPanel.appendChild(resultsContainer);

        matchLog.appendChild(bestOfPanel);

        // iterate games and display sequence: highlight box -> show 3 lines -> clear -> show result
        for (let idx = 0; idx < games.length; idx++) {
            const g = games[idx];

            // highlight current box
            const currentBox = boxes.querySelector(`.match-box[data-index="${idx}"]`);
            if (currentBox) {
                currentBox.classList.add('active');
            }

            // show 3 commentary lines sequentially
            const commentary = generateCommentary(g); // [{cat,text},...]
            for (let ci = 0; ci < commentary.length; ci++) {
                const item = commentary[ci];
                const el = document.createElement('div');
                el.className = 'commentary-line';
                if (item.cat === 'win') el.classList.add('win-line');
                else if (item.cat === 'lose') el.classList.add('lose-line');
                else el.classList.add('neutral-line');
                el.textContent = item.text;
                commentaryContainer.appendChild(el);

                // scroll
                const matchLogEl = document.getElementById('matchLog');
                if (matchLogEl) matchLogEl.scrollTop = matchLogEl.scrollHeight;

                await sleep(2000);
            }

            // after showing 3 lines, remove them
            commentaryContainer.innerHTML = '';

            // show result for this game
            const gi = document.createElement('div');
            gi.className = 'game-item';
            gi.textContent = `Ván ${idx + 1}: ${g === 'PLAYER' ? 'Bạn thắng' : 'Bot thắng'}`;
            if (g === 'PLAYER') gi.classList.add('game-win'); else gi.classList.add('game-lose');
            resultsContainer.appendChild(gi);

            // mark box as win/lose and update label
            if (currentBox) {
                currentBox.classList.remove('active');
                const scoreEl = currentBox.querySelector('.box-score');
                if (g === 'PLAYER') {
                    currentBox.classList.add('box-win');
                    if (scoreEl) scoreEl.textContent = 'Bạn thắng';
                    currentBox.title = 'Bạn thắng';
                } else {
                    currentBox.classList.add('box-lose');
                    if (scoreEl) scoreEl.textContent = 'Bot thắng';
                    currentBox.title = 'Bot thắng';
                }
            }

            // scroll to view
            const matchLogEl2 = document.getElementById('matchLog');
            if (matchLogEl2) matchLogEl2.scrollTop = matchLogEl2.scrollHeight;

            // short pause before next game
            await sleep(2000);
        }


        // đợi 1s để người dùng xem khối vòng đấu trước khi tiếp tục
        await sleep(1000);

        // nếu người dùng yêu cầu rematch cho vòng này, xóa UI phần vòng này về trước và replay
        if (rematchRequested && rematchRoundIndex === i) {
            // remove any children appended for this round
            try {
                while (matchLog.children.length > roundStartChildIndex) {
                    matchLog.removeChild(matchLog.lastChild);
                }
            } catch (e) {}

            // restore powers
            playerPower = playerPowerBefore;
            botPower = botPowerBefore;

            // reset rematch flag and replay same round
            rematchRequested = false;
            rematchRoundIndex = null;
            // continue without incrementing i (replay same round)
            continue;
        }

        // ẩn/đóng khối trận này sau khi đã có kết quả chung cuộc
        try {
            if (header && header.parentNode) header.parentNode.removeChild(header);
            if (roundResult && roundResult.parentNode) roundResult.parentNode.removeChild(roundResult);
            if (bestOfPanel && bestOfPanel.parentNode) bestOfPanel.parentNode.removeChild(bestOfPanel);
        } catch (e) {
            // ignore
        }

        // nếu thua, hiển thị thất bại và dừng
        if (botWins > playerWins) {
            const title = `THẤT BẠI TẠI ${r.label.toUpperCase()} `;

            // save last result for manual view
            lastResultData = {
                title,
                roster: botRoster.map(p => ({ name: p.name, team: p.team, cost: p.cost }))
            };

            // hide rematch button and mark tournament ended
            if (rematchBtn) rematchBtn.style.display = 'none';
            isTournamentRunning = false;

            showResultModal(title, botRoster.map(p => ({ name: p.name, team: p.team, cost: p.cost })));
            return;
        }

        // nếu không, tiếp tục vòng tiếp theo
        i++;
    }

    // nếu vượt qua tất cả các vòng
    const title = `BẠN LÀ NHÀ VÔ ĐỊCH VỚI ĐỘI HÌNH:`;
    // save last result (victory)
    lastResultData = {
        title,
        roster: playerRoster.map(p => ({ name: p.name, team: p.team, cost: p.cost }))
    };

    showResultModal(title, playerRoster.map(p => ({ name: p.name, team: p.team, cost: p.cost })));
    // hide rematch and mark not running
    const rematchBtnNow = document.getElementById('rematchBtn');
    if (rematchBtnNow) rematchBtnNow.style.display = 'none';
    isTournamentRunning = false;
}

// gắn sự kiện nút
const startBtn = document.getElementById('startTournament');
if (startBtn) startBtn.addEventListener('click', startTournament);

// Xử lý nút Game Mới
const newGameBtn = document.getElementById('newGameBtn');
if (newGameBtn) newGameBtn.addEventListener('click', () => {
    // reset state
    gold = 21;
    refreshRemain = 4;
    selectedPlayers = { marksman: null, support: null, fighter: null, mage: null, jungle: null };
    currentSelectionIndex = 0;
    lastResultData = null;

    generateShop();
    renderShop();
    renderSelectedPlayersUI(selectedPlayers, selectionOrder, gold, 'selectedPlayers', 'gold', onDeselect);
    updateVisibleLane();

    // hide tournament/result UI
    const tournamentScreen = document.getElementById('tournamentScreen');
    const resultModalEl = document.getElementById('resultModal');
    if (tournamentScreen) tournamentScreen.classList.add('hidden');
    if (resultModalEl) resultModalEl.classList.add('hidden');
    // hide rematch and mark not running
    const rematchBtnNow = document.getElementById('rematchBtn');
    if (rematchBtnNow) rematchBtnNow.style.display = 'none';
    isTournamentRunning = false;
});

// Rematch button: request replay of current round and subsequent rounds
const rematchBtnEl = document.getElementById('rematchBtn');
if (rematchBtnEl) {
    rematchBtnEl.addEventListener('click', () => {
        if (!isTournamentRunning) return;
        rematchRequested = true;
        rematchRoundIndex = currentRoundIndex;
        // provide quick feedback
        rematchBtnEl.textContent = 'Yêu cầu thi đấu lại đã gửi';
        setTimeout(() => {
            if (rematchBtnEl) rematchBtnEl.textContent = 'Thi đấu lại vòng này';
        }, 1500);
    });
}

// Remove/hide review button (not used)
const reviewBtn = document.getElementById('reviewBtn');
if (reviewBtn) {
    try { reviewBtn.style.display = 'none'; } catch (e) {}
}
