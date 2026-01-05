// Основные переменные
let caps = 0;
let cps = 0; // Caps per second
let radiation = 0; // Уровень радиации (0-100%)
let buildings = [
  { name: 'Брамин', cost: 15, production: 0.1, count: 0 },
  { name: 'Ферма с мутфрутом', cost: 100, production: 1, count: 0 },
  { name: 'Караванщик', cost: 1100, production: 8, count: 0 },
  { name: 'Очиститель воды', cost: 12000, production: 47, count: 0 },
  { name: 'Лазерная турель', cost: 130000, production: 260, count: 0 },
  { name: 'Лаборатория Vault-Tec', cost: 1400000, production: 1400, count: 0 },
  { name: 'Ядерный реактор', cost: 20000000, production: 7800, count: 0 },
  { name: 'Аванпост Братства Стали', cost: 300000000, production: 44000, count: 0 }
];

// Элементы DOM
const capsEl = document.getElementById('caps');
const cpsEl = document.getElementById('cps');
const radiationEl = document.getElementById('radiation');
const clickButton = document.getElementById('clickButton');
const buildingsContainer = document.getElementById('buildings');
const eventLog = document.getElementById('eventLog');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');

// Загрузка сохранений
function loadGame() {
  const saved = localStorage.getItem('capsClicker');
  if (saved) {
    const data = JSON.parse(saved);
    caps = data.caps;
    cps = data.cps;
    radiation = data.radiation;
    buildings = data.buildings;
  }
  updateUI();
}

// Сохранение
function saveGame() {
  const data = { caps, cps, radiation, buildings };
  localStorage.setItem('capsClicker', JSON.stringify(data));
  logEvent('Прогресс сохранён!');
}

// Сброс
function resetGame() {
  if (confirm('Сбросить всю игру?')) {
    caps = 0;
    cps = 0;
    radiation = 0;
    buildings.forEach(b => b.count = 0);
    saveGame();
    updateUI();
    logEvent('Игра сброшена. Пустошь ждёт заново!');
  }
}

// Обновление UI
function updateUI() {
  capsEl.textContent = Math.floor(caps);
  cpsEl.textContent = cps.toFixed(1);
  radiationEl.textContent = radiation.toFixed(0) + '%';

  buildingsContainer.innerHTML = '';
  buildings.forEach((building, index) => {
    const el = document.createElement('div');
    el.className = 'building';
    el.innerHTML = `
      <span>${building.name} (x${building.count}) - Производит ${building.production} cps</span>
      <span>Стоимость: ${Math.floor(building.cost)}</span>
      <button ${caps >= building.cost ? '' : 'disabled'}>Купить</button>
    `;
    el.querySelector('button').addEventListener('click', () => buyBuilding(index));
    buildingsContainer.appendChild(el);
  });
}

// Клик за капсы
clickButton.addEventListener('click', () => {
  caps += 1; // Базовый +1, можно улучшать позже
  updateUI();
});

// Покупка здания
function buyBuilding(index) {
  const building = buildings[index];
  if (caps >= building.cost) {
    caps -= building.cost;
    building.count++;
    building.cost *= 1.15; // Экспоненциальный рост стоимости
    cps += building.production;
    updateUI();
    logEvent(`Куплен ${building.name}!`);
  }
}

// Автоматическое производство
setInterval(() => {
  caps += cps / 10; // Обновление 10 раз в секунду для плавности
  handleRadiation();
  updateUI();
}, 100);

// Радиация и события
function handleRadiation() {
  if (Math.random() < 0.005) { // 0.5% шанс на бурю каждые 100мс (~5% в секунду)
    radiation += 10;
    if (radiation > 100) radiation = 100;
    logEvent('Радиационная буря! Производство падает.');
    cps *= 0.5; // Временный дебафф
    setTimeout(() => {
      cps *= 2; // Восстановление
      radiation -= 10;
      if (radiation < 0) radiation = 0;
      logEvent('Буря прошла.');
    }, 30000); // 30 секунд
  }

  // Случайные события каждые 10-60 секунд
  if (Math.random() < 0.001) { // Редко
    randomEvent();
  }
}

function randomEvent() {
  const events = [
    { msg: 'Нашёл тайник в руинах!', effect: () => caps += 1000 },
    { msg: 'Рейдеры напали!', effect: () => caps *= 0.9 },
    { msg: 'Странник с Пип-Боем!', effect: () => cps *= 2, timeout: 60000, restore: () => cps /= 2 },
    { msg: 'Супермутант торгует.', effect: () => caps += cps * 10 }
  ];
  const event = events[Math.floor(Math.random() * events.length)];
  event.effect();
  logEvent(event.msg);
  if (event.timeout) {
    setTimeout(event.restore, event.timeout);
  }
}

// Лог событий
function logEvent(msg) {
  const p = document.createElement('p');
  p.textContent = new Date().toLocaleTimeString() + ': ' + msg;
  eventLog.appendChild(p);
  eventLog.scrollTop = eventLog.scrollHeight;
}

// Инициализация
loadGame();
saveButton.addEventListener('click', saveGame);
resetButton.addEventListener('click', resetGame);

// Замените placeholder на реальную картинку Nuka-Cola, если нужно (например, из Fallout wiki, но проверьте права)
