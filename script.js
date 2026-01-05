let caps = 0;
let cps = 0;
let radiation = 0;

let buildings = [
  { name: 'Брамин', baseCost: 15, production: 0.1, count: 0, cost: 15 },
  { name: 'Ферма с мутфрутом', baseCost: 100, production: 1, count: 0, cost: 100 },
  { name: 'Караванщик', baseCost: 1100, production: 8, count: 0, cost: 1100 },
  { name: 'Очиститель воды', baseCost: 12000, production: 47, count: 0, cost: 12000 },
  { name: 'Лазерная турель', baseCost: 130000, production: 260, count: 0, cost: 130000 },
  { name: 'Лаборатория Vault-Tec', baseCost: 1400000, production: 1400, count: 0, cost: 1400000 },
  { name: 'Ядерный реактор', baseCost: 20000000, production: 7800, count: 0, cost: 20000000 },
  { name: 'Аванпост Братства Стали', baseCost: 300000000, production: 44000, count: 0, cost: 300000000 }
];

let upgrades = [
  { name: 'Улучшенный сбор крышек', desc: 'Клик даёт +1 капс', cost: 500, purchased: false, effect: 'clickBoost' },
  { name: 'Рад-Х', desc: 'Снижает эффект радиации', cost: 5000, purchased: false, effect: 'radResist' },
  { name: 'Торговые связи', desc: 'Все здания +10% производства', cost: 20000, purchased: false, effect: 'globalBoost' }
];

const capsEl = document.getElementById('caps');
const cpsEl = document.getElementById('cps');
const radiationEl = document.getElementById('radiation');
const clickButton = document.getElementById('clickButton');
const buildingsContainer = document.getElementById('buildings');
const upgradesContainer = document.getElementById('upgrades');
const notification = document.getElementById('notification');

let clickPower = 1;
let globalMultiplier = 1;
let radiationResistance = 1;

// Загрузка игры
function loadGame() {
  const saved = localStorage.getItem('capsClicker');
  if (saved) {
    const data = JSON.parse(saved);
    caps = data.caps || 0;
    buildings = data.buildings || buildings;
    upgrades = data.upgrades || upgrades;
    clickPower = data.clickPower || 1;
    globalMultiplier = data.globalMultiplier || 1;
    radiationResistance = data.radiationResistance || 1;
    recalculateCPS();
  }
  updateUI();
  updateActiveTab();
}

// Автосохранение
function saveGame() {
  const data = {
    caps, buildings, upgrades,
    clickPower, globalMultiplier, radiationResistance
  };
  localStorage.setItem('capsClicker', JSON.stringify(data));
}

// Уведомление
function showNotification(msg) {
  notification.textContent = msg;
  notification.style.opacity = 1;
  setTimeout(() => {
    notification.style.opacity = 0;
  }, 2000);
}

// Обновление UI
function updateUI() {
  capsEl.textContent = Math.floor(caps);
  cpsEl.textContent = cps.toFixed(1);
  radiationEl.textContent = radiation.toFixed(0) + '%';

  renderBuildings();
  renderUpgrades();
}

// Активная вкладка
function updateActiveTab() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.screen === document.querySelector('.screen.active').id) {
      btn.classList.add('active');
    }
  });
}

function renderBuildings() {
  buildingsContainer.innerHTML = '';
  buildings.forEach((building, i) => {
    const div = document.createElement('div');
    div.className = 'building';
    div.innerHTML = `
      <div class="building-name">${building.name}</div>
      <div class="building-info">Количество: ${building.count}</div>
      <div class="building-info">Производит: ${(building.production * globalMultiplier).toFixed(1)} капс/сек</div>
      <div>Стоимость: ${Math.floor(building.cost)}</div>
      <button ${caps >= building.cost ? '' : 'disabled'}>Купить</button>
    `;
    div.querySelector('button').onclick = () => buyBuilding(i);
    buildingsContainer.appendChild(div);
  });
}

function renderUpgrades() {
  upgradesContainer.innerHTML = '';
  upgrades.forEach((upgrade, i) => {
    if (upgrade.purchased) return;
    const div = document.createElement('div');
    div.className = 'upgrade';
    div.innerHTML = `
      <div class="upgrade-name">${upgrade.name}</div>
      <div>${upgrade.desc}</div>
      <div>Стоимость: ${upgrade.cost}</div>
      <button ${caps >= upgrade.cost ? '' : 'disabled'}>Купить</button>
    `;
    div.querySelector('button').onclick = () => buyUpgrade(i);
    upgradesContainer.appendChild(div);
  });
}

// Покупка здания
function buyBuilding(i) {
  const b = buildings[i];
  if (caps >= b.cost) {
    caps -= b.cost;
    b.count++;
    b.cost = Math.floor(b.baseCost * Math.pow(1.15, b.count));
    cps += b.production * globalMultiplier;
    updateUI();
    showNotification(`Куплен: ${b.name}`);
    saveGame();
  }
}

// Покупка улучшения
function buyUpgrade(i) {
  const u = upgrades[i];
  if (caps >= u.cost && !u.purchased) {
    caps -= u.cost;
    u.purchased = true;
    if (u.effect === 'clickBoost') clickPower += 1;
    if (u.effect === 'radResist') radiationResistance = 0.5;
    if (u.effect === 'globalBoost') {
      globalMultiplier *= 1.1;
      recalculateCPS();
    }
    updateUI();
    showNotification(`Куплено: ${u.name}`);
    saveGame();
  }
}

function recalculateCPS() {
  cps = 0;
  buildings.forEach(b => {
    cps += b.count * b.production * globalMultiplier;
  });
}

// Клик по бутылке
clickButton.addEventListener('click', () => {
  caps += clickPower;
  updateUI();
  saveGame();
});

// Переключение вкладок
document.querySelectorAll('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.screen;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(target).classList.add('active');
    updateActiveTab();
  });
});

// Автоматическое производство и события
setInterval(() => {
  caps += cps / 10;
  updateUI();

  if (Math.random() < 0.003) {
    radiation = Math.min(100, radiation + 20);
    const reduction = 0.5 * radiationResistance;
    cps *= (1 - reduction);
    showNotification('Радиационная буря!');
    setTimeout(() => {
      recalculateCPS();
      radiation = Math.max(0, radiation - 20);
    }, 15000);
  }

  if (Math.random() < 0.005) {
    const bonuses = [
      'Нашёл тайник! +1000 капсов',
      'Караван принёс прибыль! +5000 капсов',
      'Странник поделился! Клик x2 на 10 сек'
    ];
    const msg = bonuses[Math.floor(Math.random() * bonuses.length)];
    if (msg.includes('тайник')) caps += 1000;
    if (msg.includes('Караван')) caps += 5000;
    if (msg.includes('Странник')) {
      clickPower *= 2;
      setTimeout(() => clickPower /= 2, 10000);
    }
    showNotification(msg);
  }

  saveGame();
}, 100);

// Инициализация
loadGame();
