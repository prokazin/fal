let caps = 0;
let cps = 0;
let radiation = 0;

let buildings = [
  { name: 'Брамин', baseCost: 15, production: 0.1, count: 0, cost: 15, multiplier: 1 },
  { name: 'Ферма с мутфрутом', baseCost: 100, production: 1, count: 0, cost: 100, multiplier: 1 },
  { name: 'Караванщик', baseCost: 1100, production: 8, count: 0, cost: 1100, multiplier: 1 },
  { name: 'Очиститель воды', baseCost: 12000, production: 47, count: 0, cost: 12000, multiplier: 1 },
  { name: 'Лазерная турель', baseCost: 130000, production: 260, count: 0, cost: 130000, multiplier: 1 },
  { name: 'Лаборатория Vault-Tec', baseCost: 1400000, production: 1400, count: 0, cost: 1400000, multiplier: 1 },
  { name: 'Ядерный реактор', baseCost: 20000000, production: 7800, count: 0, cost: 20000000, multiplier: 1 },
  { name: 'Аванпост Братства Стали', baseCost: 300000000, production: 44000, count: 0, cost: 300000000, multiplier: 1 },
  { name: 'Супер-Здание Enclave', baseCost: 1000000000, production: 100000, count: 0, cost: 1000000000, multiplier: 1, unlocked: false } // Скрытое супер-здание
];

let upgrades = [
  // Улучшения клика
  { name: 'Power Fist', desc: 'Клик +5 капсов', cost: 500, purchased: false, effect: 'clickBoost5', category: 'click' },
  { name: 'Nuka-Cola Quantum', desc: 'Клик x2 на 30 сек (кулдаун 5 мин)', cost: 2000, purchased: false, effect: 'quantumBoost', category: 'click', cooldown: 300000, active: false },
  { name: 'Bloody Mess', desc: 'Шанс 10% критического клика (x10 капсов)', cost: 5000, purchased: false, effect: 'bloodyMess', category: 'click' },

  // Улучшения зданий
  { name: 'Intense Training', desc: '+10% ко всем зданиям', cost: 10000, purchased: false, effect: 'globalBoost10', category: 'buildings' },
  { name: 'Scrounger', desc: 'Брамины и фермы +25%', cost: 15000, purchased: false, effect: 'scrounger', category: 'buildings' },
  { name: 'Robotics Expert', desc: 'Турели и реактор +50%', cost: 50000, purchased: false, effect: 'robotics', category: 'buildings' },
  { name: 'Nuka Chemist', desc: '+20% ко всем зданиям (спец. рецепты)', cost: 100000, purchased: false, effect: 'globalBoost20', category: 'buildings' },

  // Защита и выживание
  { name: 'Rad Resistance', desc: 'Радиационные бури слабее на 50%', cost: 20000, purchased: false, effect: 'radResist50', category: 'survival' },
  { name: 'Life Giver', desc: 'Регенерирует 0.5% потерянных капсов в сек', cost: 50000, purchased: false, effect: 'lifeGiver', category: 'survival' },
  { name: 'Adamantium Skeleton', desc: 'Снижает потери от рейдеров на 50%', cost: 100000, purchased: false, effect: 'adamantium', category: 'survival' },

  // Редкие/дорогие (скрытые)
  { name: 'Mister House Alliance', desc: 'Автокликер (1 клик/сек)', cost: 1000000, purchased: false, effect: 'autoClicker', category: 'rare', unlock: () => caps >= 1000000 || getTotalBuildings() >= 20 },
  { name: 'Yes Man Independence', desc: 'Шанс случайных бесплатных покупок', cost: 5000000, purchased: false, effect: 'freePurchases', category: 'rare', unlock: () => caps >= 5000000 || getTotalBuildings() >= 50 },
  { name: 'Brotherhood Tech', desc: 'Разблокирует супер-здание', cost: 10000000, purchased: false, effect: 'unlockSuper', category: 'rare', unlock: () => caps >= 10000000 || getTotalBuildings() >= 100 }
];

const capsEl = document.getElementById('caps');
const cpsEl = document.getElementById('cps');
const radiationEl = document.getElementById('radiation');
const clickButton = document.getElementById('clickButton');
const buildingsContainer = document.getElementById('buildings');
const upgradesContainer = document.getElementById('upgrades');
const activeUpgradesContainer = document.getElementById('activeUpgrades');
const notification = document.getElementById('notification');

let clickPower = 1;
let globalMultiplier = 1;
let radiationResistance = 1;
let regenRate = 0; // Для Life Giver
let raiderLossReduction = 1; // Для Adamantium
let bloodyMessChance = 0;
let autoClickerInterval = null;
let freePurchaseChance = 0;
let lostCaps = 0; // Для регена

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
    regenRate = data.regenRate || 0;
    raiderLossReduction = data.raiderLossReduction || 1;
    bloodyMessChance = data.bloodyMessChance || 0;
    freePurchaseChance = data.freePurchaseChance || 0;
    lostCaps = data.lostCaps || 0;
    recalculateCPS();
    renderActiveUpgrades();
  }
  updateUI();
  updateActiveTab();
}

// Автосохранение
function saveGame() {
  const data = {
    caps, buildings, upgrades,
    clickPower, globalMultiplier, radiationResistance,
    regenRate, raiderLossReduction, bloodyMessChance,
    freePurchaseChance, lostCaps
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

function getTotalBuildings() {
  return buildings.reduce((total, b) => total + b.count, 0);
}

function renderBuildings() {
  buildingsContainer.innerHTML = '';
  buildings.forEach((building, i) => {
    if (building.unlocked === false) return; // Скрытое
    const div = document.createElement('div');
    div.className = 'building';
    div.innerHTML = `
      <div class="building-name">${building.name}</div>
      <div class="building-info">Количество: ${building.count}</div>
      <div class="building-info">Производит: ${(building.production * globalMultiplier * building.multiplier).toFixed(1)} капс/сек</div>
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
    if (upgrade.unlock && !upgrade.unlock()) return; // Скрытое
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

function renderActiveUpgrades() {
  activeUpgradesContainer.innerHTML = '';
  upgrades.forEach(u => {
    if (u.purchased && u.effect === 'quantumBoost') {
      const btn = document.createElement('button');
      btn.className = 'active-upgrade-button';
      btn.textContent = 'Активировать Quantum';
      btn.onclick = () => activateQuantum();
      btn.disabled = u.active;
      activeUpgradesContainer.appendChild(btn);
    }
  });
}

// Покупка здания
function buyBuilding(i) {
  const b = buildings[i];
  let effectiveCost = b.cost;
  if (Math.random() < freePurchaseChance) {
    effectiveCost = 0;
    showNotification('Бесплатная покупка от Yes Man!');
  }
  if (caps >= effectiveCost) {
    caps -= effectiveCost;
    b.count++;
    b.cost = Math.floor(b.baseCost * Math.pow(1.15, b.count));
    recalculateCPS();
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
    applyUpgradeEffect(u.effect);
    updateUI();
    renderActiveUpgrades();
    showNotification(`Куплено: ${u.name}`);
    saveGame();
  }
}

function applyUpgradeEffect(effect) {
  switch (effect) {
    case 'clickBoost5':
      clickPower += 5;
      break;
    case 'quantumBoost':
      // Кнопка для активации
      break;
    case 'bloodyMess':
      bloodyMessChance = 0.1;
      break;
    case 'globalBoost10':
      globalMultiplier *= 1.1;
      recalculateCPS();
      break;
    case 'scrounger':
      buildings[0].multiplier *= 1.25; // Брамин
      buildings[1].multiplier *= 1.25; // Ферма
      recalculateCPS();
      break;
    case 'robotics':
      buildings[4].multiplier *= 1.5; // Турель
      buildings[6].multiplier *= 1.5; // Реактор
      recalculateCPS();
      break;
    case 'globalBoost20':
      globalMultiplier *= 1.2;
      recalculateCPS();
      break;
    case 'radResist50':
      radiationResistance *= 0.5;
      break;
    case 'lifeGiver':
      regenRate = 0.005; // 0.5%
      break;
    case 'adamantium':
      raiderLossReduction = 0.5;
      break;
    case 'autoClicker':
      if (!autoClickerInterval) {
        autoClickerInterval = setInterval(() => {
          caps += clickPower;
          updateUI();
        }, 1000);
      }
      break;
    case 'freePurchases':
      freePurchaseChance = 0.05; // 5% шанс
      break;
    case 'unlockSuper':
      buildings[8].unlocked = true; // Разблок супер-здания
      break;
  }
}

function recalculateCPS() {
  cps = 0;
  buildings.forEach(b => {
    cps += b.count * b.production * globalMultiplier * b.multiplier;
  });
}

// Активация Quantum
function activateQuantum() {
  const u = upgrades.find(u => u.effect === 'quantumBoost');
  if (u && !u.active) {
    u.active = true;
    clickPower *= 2;
    showNotification('Quantum активирован! x2 клики на 30 сек');
    setTimeout(() => {
      clickPower /= 2;
      showNotification('Quantum закончился.');
      setTimeout(() => u.active = false, u.cooldown - 30000); // Кулдаун после эффекта
    }, 30000);
  }
}

// Клик по бутылке
clickButton.addEventListener('click', () => {
  let add = clickPower;
  if (bloodyMessChance > 0 && Math.random() < bloodyMessChance) {
    add *= 10;
    showNotification('Критический клик! x10');
  }
  caps += add;
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
  if (regenRate > 0 && lostCaps > 0) {
    const regen = lostCaps * regenRate / 10;
    caps += regen;
    lostCaps -= regen;
  }
  updateUI();

  // Радиационная буря
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

  // Рейдеры (новое событие)
  if (Math.random() < 0.002) {
    const loss = caps * 0.1 * raiderLossReduction;
    caps -= loss;
    lostCaps += loss;
    showNotification(`Рейдеры напали! Потеряно ${Math.floor(loss)} капсов`);
  }

  // Положительные события
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
