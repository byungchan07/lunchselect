// -------------------------------------------------------------
// 1. STATE & CONSTANTS
// -------------------------------------------------------------
let menuItems = [];
let isSpinning = false;
let currentAngle = 0; // 룰렛의 현재 회전 각도 (라디안)
let audioCtx = null;
let lastTickIndex = -1; // 마지막으로 틱 사운드가 재생된 슬라이스 인덱스

// 카테고리별 프리셋 데이터
const PRESETS = {
    korean: ["제육볶음", "김치찌개", "된장찌개", "돈까스", "비빔밥", "부대찌개", "순대국밥", "삼겹살"],
    "chinese-japanese": ["짜장면", "짬뽕", "탕수육", "마라탕", "초밥", "라멘", "규동", "소바"],
    western: ["햄버거", "피자", "파스타", "샌드위치", "타코", "스테이크", "치킨", "핫도그"],
    diet: ["닭가슴살 샐러드", "포케", "월남쌈", "샤브샤브", "그릭요거트", "키토김밥", "오트밀죽", "두부구이"]
};

// 기본 초기 메뉴 리스트
const DEFAULT_MENUS = ["제육볶음", "김치찌개", "돈까스", "초밥", "햄버거", "닭가슴살 샐러드"];

// 메뉴별 매칭 슬로건
const FOOD_SLOGANS = {
    "제육볶음": "직장인들의 영원한 넘버원! 밥 한 그릇 뚝딱 밥도둑",
    "김치찌개": "칼칼하고 깊은 국물, 한국인의 소울푸드로 든든하게!",
    "된장찌개": "구수하고 뜨끈하게 속을 풀어주는 어머니의 손맛",
    "돈까스": "바삭바삭한 튀김옷 속 두툼하고 부드러운 고기의 유혹!",
    "초밥": "깔끔하고 정갈하게, 입안에서 신선함이 춤추는 한 입!",
    "짬뽕": "얼큰한 국물과 신선한 해물로 땀 흘리며 해장 완료!",
    "짜장면": "윤기 좔좔 흐르는 달콤 짭짤한 춘장 소스의 국민 매력!",
    "마라탕": "얼얼하고 매콤한 마라 중독자들을 위한 최고의 한 그릇",
    "햄버거": "두툼한 패티와 치즈의 하모니, 빠르고 맛있는 완벽 식사!",
    "피자": "치즈가 쭈욱~ 늘어나는 고소하고 짭조름한 이탈리안 피스트!",
    "파스타": "입안에 감기는 올리브유와 마늘향 가득한 로맨틱 런치",
    "닭가슴살 샐러드": "가볍고 상큼하게! 건강과 영양을 모두 잡은 스마트 초이스",
    "포케": "신선한 채소와 연어/참치가 어우러진 하와이안 건강식",
    "떡볶이": "매콤달콤 소스에 김말이와 떡의 환상적인 조합!",
    "삼겹살": "오늘 점심은 거하게! 지글지글 고소한 육즙 파티"
};

const GENERAL_SLOGANS = [
    "오늘만큼은 다이어트 생각 없이 맛있게 드세요! 😉",
    "후회 없는 완벽한 선택! 지금 바로 출발해볼까요?",
    "따뜻하고 맛있는 한 끼가 오늘 오후의 에너지가 됩니다.",
    "이 메뉴 싫으시면 '다시 고르기'를 눌러 운명을 바꿔보세요!",
    "오늘의 운명적인 만남! 맛있는 점심시간 보내세요."
];

// 룰렛용 파스텔톤 컬러 배열
const ROUTETTE_COLORS = [
    "#ff7675", // 파스텔 레드
    "#fdcb6e", // 파스텔 옐로우/오렌지
    "#55efc4", // 파스텔 그린/민트
    "#74b9ff", // 파스텔 블루
    "#a29bfe", // 파스텔 퍼플
    "#fd79a8", // 파스텔 핑크
    "#00bec4", // 파스텔 청록
    "#e1b12c", // 파스텔 골드
    "#e84393"  // 강렬한 핑크
];

// -------------------------------------------------------------
// 2. ELEMENT REFERENCES
// -------------------------------------------------------------
const menuInput = document.getElementById("menu-input");
const charCounter = document.getElementById("char-counter");
const addBtn = document.getElementById("add-btn");
const inputError = document.getElementById("input-error");
const menuList = document.getElementById("menu-list");
const menuCountSpan = document.getElementById("menu-count");
const clearAllBtn = document.getElementById("clear-all-btn");
const presetButtons = document.querySelectorAll(".btn-preset");

const canvas = document.getElementById("roulette-canvas");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spin-btn");
const needle = document.querySelector(".roulette-needle");

const resultModal = document.getElementById("result-modal");
const winnerName = document.getElementById("winner-name");
const winnerSlogan = document.getElementById("winner-slogan");
const naverMapLink = document.getElementById("naver-map-link");
const kakaoMapLink = document.getElementById("kakao-map-link");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalRetryBtn = document.getElementById("modal-retry-btn");
const confettiCanvas = document.getElementById("confetti-canvas");

// -------------------------------------------------------------
// 3. INITIALIZATION
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    // 로컬스토리지에서 메뉴 불러오기, 없으면 기본 메뉴 로드
    const savedMenus = localStorage.getItem("lunch-roulette-menus");
    if (savedMenus) {
        menuItems = JSON.parse(savedMenus);
    } else {
        menuItems = [...DEFAULT_MENUS];
        saveMenusToLocalStorage();
    }
    
    // UI 및 캔버스 초기화
    renderMenuList();
    initCanvasDPI();
    drawRoulette();

    // 이벤트 리스너 등록
    menuInput.addEventListener("input", handleInputValidation);
    menuInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addMenu();
        }
    });
    addBtn.addEventListener("click", addMenu);
    clearAllBtn.addEventListener("click", clearAllMenus);
    spinBtn.addEventListener("click", spinRoulette);
    
    // 프리셋 버튼 이벤트
    presetButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const presetKey = btn.getAttribute("data-preset");
            loadPreset(presetKey);
        });
    });

    // 모달 닫기 / 재시도
    modalCloseBtn.addEventListener("click", closeModal);
    modalRetryBtn.addEventListener("click", () => {
        closeModal();
        setTimeout(spinRoulette, 300);
    });

    // 창 크기 변경 시 캔버스 다시 그리기
    window.addEventListener("resize", () => {
        initCanvasDPI();
        drawRoulette();
    });
});

// -------------------------------------------------------------
// 4. CANVAS HIGH-DPI & RENDER LOGIC
// -------------------------------------------------------------
function initCanvasDPI() {
    // CSS 크기와 캔버스 드로잉 해상도(DPI) 매칭으로 텍스트 번짐 방지
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
}

function drawRoulette() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    // 버퍼 클리어
    ctx.clearRect(0, 0, width, height);

    const N = menuItems.length;

    // 메뉴가 없는 경우 안내 메시지 출력
    if (N === 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.02)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.stroke();

        ctx.fillStyle = "var(--color-text-muted)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "16px 'Noto Sans KR', sans-serif";
        ctx.fillText("메뉴를 등록해주세요!", centerX, centerY);
        ctx.restore();
        return;
    }

    const arcSize = (Math.PI * 2) / N;

    // 1. 각 섹터 그리기
    for (let i = 0; i < N; i++) {
        const startAngle = i * arcSize + currentAngle;
        const endAngle = (i + 1) * arcSize + currentAngle;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        // 파스텔 색상 순환
        ctx.fillStyle = ROUTETTE_COLORS[i % ROUTETTE_COLORS.length];
        ctx.fill();

        // 구분선 그리기
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "var(--color-bg-dark)";
        ctx.stroke();
        ctx.restore();
    }

    // 2. 텍스트 그리기 (각 섹터 중심에 회전하여 배치)
    for (let i = 0; i < N; i++) {
        const startAngle = i * arcSize + currentAngle;
        const textAngle = startAngle + arcSize / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(textAngle);
        
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        // 그림자 효과로 가독성 확보
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // 메뉴 수에 따라 폰트 크기 조정
        let fontSize = 16;
        if (N > 12) fontSize = 11;
        else if (N > 8) fontSize = 13;
        
        ctx.font = `bold ${fontSize}px 'Noto Sans KR', sans-serif`;
        
        // 텍스트 길이가 길어도 잘 배치되도록 반경 안쪽으로 마진 설정
        ctx.fillText(menuItems[i], radius - 20, 0);
        ctx.restore();
    }

    // 3. 룰렛 테두리 장식
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.stroke();
    
    // 테두리 반짝이는 외부 링
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.stroke();
    ctx.restore();
}

// -------------------------------------------------------------
// 5. INPUT & MENU MANAGEMENT LOGIC
// -------------------------------------------------------------
function handleInputValidation() {
    const text = menuInput.value;
    charCounter.textContent = `${text.length}/8`;

    if (text.length > 8) {
        charCounter.classList.add("warning");
        menuInput.classList.add("error");
        inputError.textContent = "메뉴 이름은 최대 8자까지만 입력 가능합니다.";
    } else {
        charCounter.classList.remove("warning");
        menuInput.classList.remove("error");
        inputError.textContent = "";
    }
}

function addMenu() {
    if (isSpinning) return;
    
    const value = menuInput.value.trim();

    // 1. 공백 예외 처리
    if (value === "") {
        inputError.textContent = "메뉴를 입력해주세요.";
        menuInput.classList.add("error");
        setTimeout(() => menuInput.classList.remove("error"), 300);
        menuInput.focus();
        return;
    }

    // 2. 글자 수 8자 제한 초과 검증
    if (value.length > 8) {
        inputError.textContent = "메뉴 이름은 8자를 초과할 수 없습니다.";
        menuInput.classList.add("error");
        setTimeout(() => menuInput.classList.remove("error"), 300);
        return;
    }

    // 3. 중복 메뉴 처리 (가벼운 경고 피드백)
    if (menuItems.includes(value)) {
        inputError.textContent = "이미 등록된 메뉴입니다.";
        menuInput.classList.add("error");
        setTimeout(() => menuInput.classList.remove("error"), 300);
        return;
    }

    // 등록 성공
    menuItems.push(value);
    saveMenusToLocalStorage();
    renderMenuList();
    drawRoulette();

    // 입력창 초기화
    menuInput.value = "";
    charCounter.textContent = "0/8";
    inputError.textContent = "";
    menuInput.focus();
}

function deleteMenu(index) {
    if (isSpinning) return;
    menuItems.splice(index, 1);
    saveMenusToLocalStorage();
    renderMenuList();
    drawRoulette();
}

function clearAllMenus() {
    if (isSpinning) return;
    
    if (menuItems.length === 0) return;
    
    if (confirm("정말 모든 메뉴를 삭제하시겠습니까?")) {
        menuItems = [];
        saveMenusToLocalStorage();
        renderMenuList();
        drawRoulette();
    }
}

function loadPreset(presetKey) {
    if (isSpinning) return;
    
    const preset = PRESETS[presetKey];
    if (preset) {
        // 기존 리스트 덮어쓰기 or 병합 선택 (여기선 직관적으로 덮어씌움)
        menuItems = [...preset];
        saveMenusToLocalStorage();
        renderMenuList();
        drawRoulette();
        
        // 예외 메시지 초기화
        inputError.textContent = "";
    }
}

function renderMenuList() {
    menuList.innerHTML = "";
    menuCountSpan.textContent = menuItems.length;

    menuItems.forEach((menu, index) => {
        const li = document.createElement("li");
        li.className = "menu-item";
        
        const span = document.createElement("span");
        span.className = "menu-item-text";
        span.textContent = menu;
        
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-item-btn";
        deleteBtn.innerHTML = "&times;";
        deleteBtn.title = "삭제";
        deleteBtn.addEventListener("click", () => deleteMenu(index));

        li.appendChild(span);
        li.appendChild(deleteBtn);
        menuList.appendChild(li);
    });
}

function saveMenusToLocalStorage() {
    localStorage.setItem("lunch-roulette-menus", JSON.stringify(menuItems));
}

// -------------------------------------------------------------
// 6. ROULETTE ROTATION & AUDIO SYNTHESIS
// -------------------------------------------------------------
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

function playTickSound() {
    if (!audioCtx) return;
    
    // 짧은 오실레이터 틱 사운드 합성
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = "sine";
    // 높은 주파수에서 순식간에 저음으로 벤딩하여 둔탁한 플라스틱 튕김 소리 묘사
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.03);
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.03);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.035);
}

function playWinSound() {
    if (!audioCtx) return;
    
    const now = audioCtx.currentTime;
    // 아르페지오 C코드 장조 축하 팡파르
    const chord = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    
    chord.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.002, now + i * 0.08 + 0.4);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.5);
    });
}

function spinRoulette() {
    if (isSpinning) return;

    const N = menuItems.length;

    // 1. 최소 조건 검증 (2개 미만일 때)
    if (N < 2) {
        alert("메뉴를 2개 이상 입력해주세요!");
        menuInput.focus();
        return;
    }

    // 오디오 초기화
    initAudio();

    isSpinning = true;
    spinBtn.disabled = true;
    lastTickIndex = -1;

    // 회전 계산 파라미터
    const startAngle = currentAngle % (Math.PI * 2);
    // 6바퀴 ~ 10바퀴 사이로 굴러감 + 무작위 잔여 각도
    const totalRotation = Math.PI * 2 * (6 + Math.random() * 4);
    const duration = 4500; // 4.5초
    let startTime = null;

    function animateSpin(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // cubic ease-out 적용 (초반에 급격히 빨라진 뒤 서서히 멈춤)
        const ease = 1 - Math.pow(1 - progress, 4);
        currentAngle = startAngle + totalRotation * ease;

        drawRoulette();
        checkAndPlayTick();

        if (progress < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            // 회전 완전 종료
            isSpinning = false;
            spinBtn.disabled = false;
            needle.classList.remove("wiggle");
            
            // 당첨 슬라이스 판별
            const winner = getWinningItem();
            showResult(winner);
        }
    }

    needle.classList.add("wiggle");
    requestAnimationFrame(animateSpin);
}

// 바늘 통과 틱 검사
function checkAndPlayTick() {
    const N = menuItems.length;
    const arcSize = (Math.PI * 2) / N;

    // 바늘이 가리키는 방향: 상단 270도 (= 1.5 * PI 라디안)
    // 룰렛 회전 좌표에 대입하여 현재 바늘이 올라서 있는 칸 인덱스 추출
    const needleTarget = (1.5 * Math.PI - currentAngle) % (Math.PI * 2);
    const normalizedAngle = needleTarget < 0 ? needleTarget + Math.PI * 2 : needleTarget;
    const currentSlice = Math.floor(normalizedAngle / arcSize);

    if (currentSlice !== lastTickIndex) {
        playTickSound();
        lastTickIndex = currentSlice;
        
        // 바늘에 틱 통과 튕김 효과 애니메이션 적용
        needle.style.transform = "rotate(-8deg)";
        setTimeout(() => {
            needle.style.transform = "rotate(0deg)";
        }, 50);
    }
}

// 현재 회전각 기준으로 바늘에 걸린 당첨자 색출
function getWinningItem() {
    const N = menuItems.length;
    const arcSize = (Math.PI * 2) / N;
    
    // 바늘은 12시 방향(1.5 * Math.PI)에 셋팅됨
    const needleTarget = (1.5 * Math.PI - currentAngle) % (Math.PI * 2);
    const normalizedAngle = needleTarget < 0 ? needleTarget + Math.PI * 2 : needleTarget;
    
    const winningIndex = Math.floor(normalizedAngle / arcSize);
    return menuItems[winningIndex];
}

// -------------------------------------------------------------
// 7. RESULT POPUP & CONFETTI PARTICLES
// -------------------------------------------------------------
let confettiAnimationId = null;
let confettiParticles = [];

function showResult(menuName) {
    winnerName.textContent = menuName;

    // 매칭되는 전용 문구 혹은 무작위 일반 문구 배정
    const slogan = FOOD_SLOGANS[menuName] || GENERAL_SLOGANS[Math.floor(Math.random() * GENERAL_SLOGANS.length)];
    winnerSlogan.textContent = slogan;

    // 네이버 및 카카오 지도 연동 링크 갱신
    naverMapLink.href = `https://map.naver.com/v5/search/${encodeURIComponent(menuName)}`;
    kakaoMapLink.href = `https://map.kakao.com/?q=${encodeURIComponent(menuName)}`;

    // 오디오 & 이펙트 가동
    playWinSound();
    startConfetti();

    // 모달 노출
    resultModal.classList.add("active");
}

function closeModal() {
    resultModal.classList.remove("active");
    stopConfetti();
}

// 꽃가루 파티클 클래스
class ConfettiParticle {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * -100 - 20; // 스크린 상단 바깥쪽에서 대기
        this.size = Math.random() * 8 + 6;
        
        // 속도 및 흔들림(sin)
        this.speedY = Math.random() * 3 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.wobble = Math.random() * 10;
        this.wobbleSpeed = Math.random() * 0.05 + 0.02;
        
        // 파티클 모양 및 회전
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
        
        // 색상 지정
        const colors = ["#ff7675", "#fdcb6e", "#55efc4", "#74b9ff", "#a29bfe", "#fd79a8"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.wobble) * 0.5;
        this.wobble += this.wobbleSpeed;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        
        // 직사각형 꽃가루
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size / 1.5);
        ctx.restore();
    }
}

function startConfetti() {
    const rect = confettiCanvas.getBoundingClientRect();
    confettiCanvas.width = rect.width;
    confettiCanvas.height = rect.height;
    const ctxConf = confettiCanvas.getContext("2d");

    confettiParticles = [];
    // 120개 파티클 로드
    for (let i = 0; i < 120; i++) {
        confettiParticles.push(new ConfettiParticle(confettiCanvas.width, confettiCanvas.height));
    }

    function animateConfetti() {
        ctxConf.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        let activeParticles = 0;

        confettiParticles.forEach((p) => {
            if (p.y < confettiCanvas.height) {
                p.update();
                p.draw(ctxConf);
                activeParticles++;
            }
        });

        if (activeParticles > 0) {
            confettiAnimationId = requestAnimationFrame(animateConfetti);
        }
    }

    // 창 크기 조절 시 파티클 경계 수정용
    window.addEventListener("resize", resizeConfettiCanvas);
    animateConfetti();
}

function resizeConfettiCanvas() {
    if (!confettiCanvas) return;
    const rect = confettiCanvas.getBoundingClientRect();
    confettiCanvas.width = rect.width;
    confettiCanvas.height = rect.height;
}

function stopConfetti() {
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
    }
    window.removeEventListener("resize", resizeConfettiCanvas);
    const ctxConf = confettiCanvas.getContext("2d");
    if (ctxConf) {
        ctxConf.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    confettiParticles = [];
}
