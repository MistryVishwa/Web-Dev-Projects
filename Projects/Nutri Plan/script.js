// ════════════════════════════════════════════
// NUTRI PLAN — script.js
// ════════════════════════════════════════════

// ─── STATE MANAGEMENT ─────────────────────
const state = {
  currentUser: null,
  users: JSON.parse(localStorage.getItem('nutri_users')) || {},
  // Current user data
  profile: null,
  dailyLog: {}, // { "YYYY-MM-DD": { meals: [...], water: 0 } }
  bodyMetrics: {}, // { "YYYY-MM-DD": weight }
  customAllergies: [],
  communityPosts: JSON.parse(localStorage.getItem('nutri_posts')) || [],
  currentDate: new Date().toISOString().split('T')[0],
  activeMealTab: 'breakfast'
};

// ─── MOCK DATABASE (Food) ─────────────────
const foodDB = [
  { id: 1, name: 'Banana', kcal: 89, p: 1.1, c: 22.8, f: 0.3, unit: '100g' },
  { id: 2, name: 'Chicken Breast (Grilled)', kcal: 165, p: 31, c: 0, f: 3.6, unit: '100g' },
  { id: 3, name: 'Brown Rice (Cooked)', kcal: 112, p: 2.6, c: 23.5, f: 0.9, unit: '100g' },
  { id: 4, name: 'Avocado', kcal: 160, p: 2, c: 8.5, f: 14.7, unit: '100g' },
  { id: 5, name: 'Salmon (Baked)', kcal: 206, p: 22, c: 0, f: 12, unit: '100g' },
  { id: 6, name: 'Broccoli (Boiled)', kcal: 35, p: 2.4, c: 7.2, f: 0.4, unit: '100g' },
  { id: 7, name: 'Eggs (Boiled)', kcal: 155, p: 13, c: 1.1, f: 11, unit: '100g' },
  { id: 8, name: 'Oatmeal', kcal: 68, p: 2.4, c: 12, f: 1.4, unit: '100g' },
  { id: 9, name: 'Almonds', kcal: 579, p: 21, c: 22, f: 50, unit: '100g' },
  { id: 10, name: 'Sweet Potato (Baked)', kcal: 90, p: 2, c: 21, f: 0.1, unit: '100g' },
  { id: 11, name: 'Greek Yogurt (Plain)', kcal: 59, p: 10, c: 3.6, f: 0.4, unit: '100g' },
  { id: 12, name: 'Apple', kcal: 52, p: 0.3, c: 14, f: 0.2, unit: '100g' }
];

// ─── INITIALIZATION ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Pre-populate mock users/posts if empty
  if (Object.keys(state.users).length === 0) {
    state.users['admin@nutri.com'] = {
      fname: 'Admin', lname: 'User', email: 'admin@nutri.com', password: 'admin123',
      goal: 'weight-loss', joined: new Date().toISOString().split('T')[0],
      height: 175, weight: 75, age: 30, gender: 'male', activity: 'moderate',
      diet: ['omnivore'], allergies: [], isAdmin: true
    };
    saveUsers();
  }
  if (state.communityPosts.length === 0) {
    state.communityPosts = [
      { id: 1, author: 'Sarah J.', authorInitials: 'SJ', date: '2 hours ago', title: 'My 5-Day Vegan Meal Prep', body: 'Just finished prepping lunches for the week! Quinoa bowls with roasted chickpeas, sweet potato, and tahini dressing. High protein and delicious!', tags: ['vegan', 'meal-prep'], likes: 24 },
      { id: 2, author: 'Mike T.', authorInitials: 'MT', date: 'Yesterday', title: 'Hit my first milestone!', body: 'Down 5kg since I started tracking my macros meticulously. The water tracking feature really helped me stay hydrated and avoid snacking.', tags: ['weight-loss', 'milestone'], likes: 56 }
    ];
    savePosts();
  }

  // Check login
  const loggedInUser = localStorage.getItem('nutri_current_user');
  if (loggedInUser && state.users[loggedInUser]) {
    login(loggedInUser);
  } else {
    showScreen('auth-screen');
  }
});

// ─── UTILS ────────────────────────────────
function saveUsers() { localStorage.setItem('nutri_users', JSON.stringify(state.users)); }
function savePosts() { localStorage.setItem('nutri_posts', JSON.stringify(state.communityPosts)); }
function saveProfile() {
  if(!state.currentUser) return;
  state.users[state.currentUser] = state.profile;
  localStorage.setItem(`nutri_log_${state.currentUser}`, JSON.stringify(state.dailyLog));
  localStorage.setItem(`nutri_metrics_${state.currentUser}`, JSON.stringify(state.bodyMetrics));
  saveUsers();
}
function showScreen(id) {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById(id).classList.remove('hidden');
}
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  setTimeout(() => t.classList.add('hidden'), 3000);
}

// ─── AUTHENTICATION ───────────────────────
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
}
function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.innerHTML = inp.type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
}
function handleLogin(e) {
  e.preventDefault();
  const em = document.getElementById('login-email').value.trim();
  const pw = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  
  if (state.users[em] && state.users[em].password === pw) {
    err.textContent = '';
    login(em);
  } else {
    err.textContent = 'Invalid email or password.';
  }
}
function handleRegister(e) {
  e.preventDefault();
  const em = document.getElementById('reg-email').value.trim();
  const err = document.getElementById('register-error');
  
  if (state.users[em]) {
    err.textContent = 'Email already registered.';
    return;
  }
  
  state.users[em] = {
    fname: document.getElementById('reg-fname').value.trim(),
    lname: document.getElementById('reg-lname').value.trim(),
    email: em,
    password: document.getElementById('reg-password').value,
    goal: document.getElementById('reg-goal').value,
    joined: new Date().toISOString().split('T')[0],
    height: null, weight: null, age: null, gender: 'other', activity: 'moderate',
    diet: ['omnivore'], allergies: [], isAdmin: false
  };
  saveUsers();
  err.textContent = '';
  showToast('Account created successfully!');
  login(em);
}
function login(email) {
  state.currentUser = email;
  state.profile = state.users[email];
  localStorage.setItem('nutri_current_user', email);
  
  // Load user data
  state.dailyLog = JSON.parse(localStorage.getItem(`nutri_log_${email}`)) || {};
  state.bodyMetrics = JSON.parse(localStorage.getItem(`nutri_metrics_${email}`)) || {};
  
  // Update UI
  const ini = (state.profile.fname.charAt(0) + (state.profile.lname ? state.profile.lname.charAt(0) : '')).toUpperCase();
  document.getElementById('nav-avatar').textContent = ini;
  document.getElementById('topbar-avatar').textContent = ini;
  document.getElementById('nav-user-name').textContent = state.profile.fname;
  document.getElementById('nav-user-goal').textContent = state.profile.goal.replace('-', ' ');
  
  document.getElementById('admin-nav').style.display = state.profile.isAdmin ? 'flex' : 'none';
  
  showScreen('main-app');
  navigateTo('dashboard');
}
function handleLogout() {
  state.currentUser = null;
  state.profile = null;
  localStorage.removeItem('nutri_current_user');
  showScreen('auth-screen');
}

// ─── NAVIGATION ───────────────────────────
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${pageId}`).classList.add('active');
  
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === pageId);
  });
  
  const titles = {
    'dashboard': 'Dashboard',
    'meal-plan': 'Meal Plan',
    'food-log': 'Food Log',
    'progress': 'Progress',
    'community': 'Community',
    'profile': 'Profile',
    'admin': 'Admin Dashboard'
  };
  document.getElementById('page-title').textContent = titles[pageId];
  
  if(window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
  
  // Page specific renders
  if(pageId === 'dashboard') renderDashboard();
  if(pageId === 'meal-plan') renderMealPlan();
  if(pageId === 'food-log') renderFoodLog();
  if(pageId === 'progress') renderProgress();
  if(pageId === 'community') renderCommunity();
  if(pageId === 'profile') renderProfilePage();
  if(pageId === 'admin') renderAdmin();
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if(window.innerWidth <= 768) {
    sb.classList.toggle('open');
  } else {
    sb.classList.toggle('collapsed');
  }
}

// ─── UTILS (Macros / Calories) ────────────
function calculateGoals() {
  // Simple BMR estimation
  let bmr = 2000;
  if (state.profile.weight && state.profile.height && state.profile.age) {
    // Mifflin-St Jeor
    bmr = (10 * state.profile.weight) + (6.25 * state.profile.height) - (5 * state.profile.age);
    bmr += state.profile.gender === 'male' ? 5 : -161;
  }
  
  let multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9 };
  let tdee = bmr * (multipliers[state.profile.activity] || 1.55);
  
  let targetKcal = tdee;
  if (state.profile.goal === 'weight-loss') targetKcal -= 500;
  if (state.profile.goal === 'muscle-gain') targetKcal += 300;
  
  targetKcal = Math.round(targetKcal);
  
  // Macro split based on goal
  let pPercent = 0.3, fPercent = 0.3, cPercent = 0.4;
  if (state.profile.goal === 'weight-loss') { pPercent = 0.4; cPercent = 0.3; }
  if (state.profile.goal === 'muscle-gain') { pPercent = 0.35; cPercent = 0.45; fPercent = 0.2; }
  if (state.profile.diet.includes('keto')) { cPercent = 0.05; fPercent = 0.7; pPercent = 0.25; }
  
  return {
    kcal: targetKcal,
    p: Math.round((targetKcal * pPercent) / 4), // 4 kcal/g
    c: Math.round((targetKcal * cPercent) / 4), // 4 kcal/g
    f: Math.round((targetKcal * fPercent) / 9)  // 9 kcal/g
  };
}

function getTodayTotals() {
  if (!state.dailyLog[state.currentDate]) return { kcal: 0, p: 0, c: 0, f: 0, water: 0, meals: [] };
  let t = { kcal: 0, p: 0, c: 0, f: 0, water: state.dailyLog[state.currentDate].water || 0, meals: state.dailyLog[state.currentDate].meals || [] };
  t.meals.forEach(m => {
    t.kcal += m.kcal; t.p += m.p; t.c += m.c; t.f += m.f;
  });
  return { kcal: Math.round(t.kcal), p: Math.round(t.p), c: Math.round(t.c), f: Math.round(t.f), water: t.water, meals: t.meals };
}

// ─── DASHBOARD ────────────────────────────
let donutChartInst = null;
function renderDashboard() {
  document.getElementById('welcome-text').textContent = `Good ${new Date().getHours() < 12 ? 'morning' : 'evening'}, ${state.profile.fname}!`;
  const goalStr = state.profile.goal.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  document.getElementById('goal-text').innerHTML = `Your goal: <strong>${goalStr}</strong> — Stay consistent today!`;
  
  const goals = calculateGoals();
  const today = getTodayTotals();
  
  document.getElementById('banner-kcal-consumed').textContent = today.kcal;
  document.getElementById('banner-kcal-goal').textContent = goals.kcal;
  
  // Topbar update
  document.getElementById('water-count').textContent = today.water;
  document.getElementById('streak-count').textContent = calculateStreak();
  
  // Macros
  const mGrid = document.getElementById('macro-cards');
  mGrid.innerHTML = `
    ${renderMacroCard('Carbs', today.c, goals.c, 'g', 'var(--gold)')}
    ${renderMacroCard('Protein', today.p, goals.p, 'g', 'var(--green)')}
    ${renderMacroCard('Fats', today.f, goals.f, 'g', 'var(--blue)')}
  `;
  
  // Donut
  document.getElementById('donut-kcal').textContent = today.kcal;
  renderDonutChart(today.c*4, today.p*4, today.f*4);
  
  // Today Meals
  const tml = document.getElementById('today-meals-list');
  if (today.meals.length === 0) {
    tml.innerHTML = `<p style="color:var(--muted);font-size:13px;padding:10px;">No meals logged today yet.</p>`;
  } else {
    tml.innerHTML = today.meals.slice(0, 5).map(m => `
      <div class="today-meal-item">
        <div class="meal-type-badge">${getMealIcon(m.type)}</div>
        <div class="today-meal-info">
          <div class="today-meal-name">${m.name}</div>
          <div class="today-meal-macros">${m.p}g P • ${m.c}g C • ${m.f}g F</div>
        </div>
        <div class="today-meal-kcal">${m.kcal} kcal</div>
      </div>
    `).join('');
  }
  
  // Quick stats
  document.getElementById('stat-weight').textContent = state.profile.weight || '—';
  if (state.profile.weight && state.profile.height) {
    const bmi = (state.profile.weight / Math.pow(state.profile.height/100, 2)).toFixed(1);
    document.getElementById('stat-bmi').textContent = bmi;
  }
  document.getElementById('stat-water').textContent = `${today.water}/8`;
  document.getElementById('stat-streak').textContent = calculateStreak();
}

function renderMacroCard(name, val, max, unit, color) {
  const pct = Math.min(100, Math.max(0, (val/max)*100)) || 0;
  return `
    <div class="macro-card">
      <div class="macro-card-label">${name}</div>
      <div class="macro-card-val" style="color:${color}">${val}<span style="font-size:12px;color:var(--muted)">${unit}</span></div>
      <div class="macro-card-sub">Goal: ${max}${unit}</div>
      <div class="macro-bar">
        <div class="macro-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>
  `;
}

function renderDonutChart(c, p, f) {
  const ctx = document.getElementById('macroChart').getContext('2d');
  if (donutChartInst) donutChartInst.destroy();
  
  const total = c + p + f;
  if(total === 0) {
    c = 1; p = 1; f = 1; // dummy for empty
  }
  
  donutChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Carbs', 'Protein', 'Fats'],
      datasets: [{
        data: [c, p, f],
        backgroundColor: ['#D4AF37', '#2ECC71', '#4A90E2'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      cutout: '80%',
      responsive: false,
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.label}: ${Math.round((ctx.raw/(c+p+f))*100)}%` }
      } }
    }
  });
  
  document.getElementById('macro-legend').innerHTML = `
    <div class="legend-item"><div class="legend-dot" style="background:#D4AF37"></div> Carbs ${Math.round(c/total*100)||0}%</div>
    <div class="legend-item"><div class="legend-dot" style="background:#2ECC71"></div> Protein ${Math.round(p/total*100)||0}%</div>
    <div class="legend-item"><div class="legend-dot" style="background:#4A90E2"></div> Fats ${Math.round(f/total*100)||0}%</div>
  `;
}

function getMealIcon(t) {
  if(t==='breakfast') return '🌅';
  if(t==='lunch') return '☀️';
  if(t==='dinner') return '🌙';
  return '🍎';
}

function addWater() {
  if (!state.dailyLog[state.currentDate]) state.dailyLog[state.currentDate] = { meals: [], water: 0 };
  if(state.dailyLog[state.currentDate].water < 20) {
    state.dailyLog[state.currentDate].water++;
    saveProfile();
    document.getElementById('water-count').textContent = state.dailyLog[state.currentDate].water;
    if(document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
    if(document.getElementById('page-progress').classList.contains('active')) renderProgress();
  }
}

function calculateStreak() {
  let streak = 0;
  const today = new Date();
  for(let i=0; i<365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    if (state.dailyLog[dStr] && state.dailyLog[dStr].meals && state.dailyLog[dStr].meals.length > 0) streak++;
    else if (i !== 0) break; // skip today if empty, but break if past day empty
  }
  return streak;
}


// ─── MEAL PLAN ────────────────────────────
function renderMealPlan() {
  const g = calculateGoals();
  const filter = document.getElementById('meal-diet-filter').value;
  
  const slots = [
    { id: 'breakfast', name: 'Breakfast', emoji: '🌅', target: Math.round(g.kcal*0.25) },
    { id: 'lunch', name: 'Lunch', emoji: '☀️', target: Math.round(g.kcal*0.35) },
    { id: 'dinner', name: 'Dinner', emoji: '🌙', target: Math.round(g.kcal*0.30) },
    { id: 'snack', name: 'Snack', emoji: '🍎', target: Math.round(g.kcal*0.10) },
  ];
  
  const wrapper = document.getElementById('meal-slots');
  wrapper.innerHTML = slots.map(s => {
    // Generate some mock suggestions
    const items = getMockMeals(s.id, filter);
    return `
      <div class="meal-slot">
        <div class="meal-slot-header">
          <span class="meal-slot-emoji">${s.emoji}</span>
          <span class="meal-slot-title">${s.name}</span>
          <span class="meal-slot-total">Target: ~${s.target} kcal</span>
        </div>
        <div class="meal-cards">
          ${items.map(m => `
            <div class="meal-card">
              <div class="meal-card-name">${m.name}</div>
              <div class="meal-card-tags">
                ${m.tags.map(t => `<span class="meal-tag ${t.toLowerCase()}">${t}</span>`).join('')}
              </div>
              <div class="meal-nutrients">
                <div class="meal-nutrient"><div class="meal-nutrient-val">${m.p}g</div><div class="meal-nutrient-lbl">Protein</div></div>
                <div class="meal-nutrient"><div class="meal-nutrient-val">${m.c}g</div><div class="meal-nutrient-lbl">Carbs</div></div>
                <div class="meal-nutrient"><div class="meal-nutrient-val">${m.f}g</div><div class="meal-nutrient-lbl">Fats</div></div>
              </div>
              <div class="meal-card-kcal">${m.kcal} kcal</div>
              <button class="btn-sm meal-card-btn" onclick="openFoodModalFromPlan('${m.name}', '${s.id}')"><i class="fa-solid fa-plus"></i> Add to Log</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
  
  // Update bars
  const today = getTodayTotals();
  document.getElementById('nutrition-bars').innerHTML = `
    ${renderNutBar('Calories', today.kcal, g.kcal, 'kcal', 'var(--gold)')}
    ${renderNutBar('Protein', today.p, g.p, 'g', 'var(--green)')}
    ${renderNutBar('Carbs', today.c, g.c, 'g', 'var(--orange)')}
    ${renderNutBar('Fats', today.f, g.f, 'g', 'var(--blue)')}
  `;
}

function getMockMeals(type, diet) {
  // Mock data generator
  const meals = {
    breakfast: [
      { name: 'Oatmeal with Berries', tags: ['Vegan', 'High-Carb'], kcal: 320, p: 10, c: 55, f: 6 },
      { name: 'Avocado Toast & Eggs', tags: ['Vegetarian'], kcal: 450, p: 18, c: 35, f: 22 },
      { name: 'Keto Scramble', tags: ['Keto', 'High-Protein'], kcal: 380, p: 25, c: 4, f: 28 }
    ],
    lunch: [
      { name: 'Grilled Chicken Salad', tags: ['High-Protein'], kcal: 410, p: 45, c: 12, f: 18 },
      { name: 'Quinoa Buddha Bowl', tags: ['Vegan'], kcal: 520, p: 16, c: 68, f: 18 },
      { name: 'Salmon & Asparagus', tags: ['Keto', 'High-Protein'], kcal: 460, p: 42, c: 8, f: 26 }
    ],
    dinner: [
      { name: 'Lean Steak & Sweet Potato', tags: ['High-Protein'], kcal: 620, p: 55, c: 40, f: 20 },
      { name: 'Tofu Stir-fry', tags: ['Vegan'], kcal: 380, p: 22, c: 35, f: 16 },
      { name: 'Zucchini Pasta w/ Turkey', tags: ['Keto'], kcal: 420, p: 38, c: 15, f: 24 }
    ],
    snack: [
      { name: 'Greek Yogurt & Honey', tags: ['Vegetarian'], kcal: 180, p: 15, c: 22, f: 2 },
      { name: 'Handful of Almonds', tags: ['Vegan', 'Keto'], kcal: 210, p: 7, c: 6, f: 18 },
      { name: 'Protein Shake', tags: ['High-Protein'], kcal: 150, p: 25, c: 5, f: 2 }
    ]
  };
  
  let res = meals[type];
  if(diet && diet !== 'all') {
    // fuzzy filter
    const matches = res.filter(m => m.tags.some(t => t.toLowerCase().includes(diet)));
    if(matches.length > 0) res = matches;
  }
  return res.sort(()=>Math.random()-0.5).slice(0, 2); // Random 2
}

function regenerateMeals() {
  renderMealPlan();
  showToast('Meal plan updated!');
}

function renderNutBar(name, val, max, unit, color) {
  const pct = Math.min(100, Math.max(0, (val/max)*100)) || 0;
  return `
    <div class="nutrition-bar-row">
      <div class="nutrition-bar-info">
        <strong>${name}</strong>
        <span>${val} / ${max} ${unit}</span>
      </div>
      <div class="nutrition-bar-track">
        <div class="nutrition-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>
  `;
}

// ─── FOOD LOG ─────────────────────────────
function changeLogDate(dir) {
  const d = new Date(state.currentDate);
  d.setDate(d.getDate() + dir);
  state.currentDate = d.toISOString().split('T')[0];
  
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('log-date-display').textContent = state.currentDate === todayStr ? 'Today' : state.currentDate;
  
  renderFoodLog();
}

function switchMealTab(tab, btn) {
  document.querySelectorAll('.meal-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.activeMealTab = tab;
  renderFoodLog();
}

function renderFoodLog() {
  const todayLog = state.dailyLog[state.currentDate] || { meals: [] };
  const filteredMeals = todayLog.meals.filter(m => m.type === state.activeMealTab);
  
  const wrap = document.getElementById('log-entries');
  if(filteredMeals.length === 0) {
    wrap.innerHTML = `<div class="log-empty"><i class="fa-solid fa-plate-wheat"></i><p>No food logged for ${state.activeMealTab}.</p></div>`;
  } else {
    wrap.innerHTML = filteredMeals.map((m, idx) => `
      <div class="log-entry">
        <div class="log-entry-info">
          <div class="log-entry-name">${m.name} <span style="font-weight:400;color:var(--muted);font-size:12px;">(${m.qty}g)</span></div>
          <div class="log-entry-detail">${m.p}g P • ${m.c}g C • ${m.f}g F</div>
        </div>
        <div class="log-entry-kcal">${m.kcal} kcal</div>
        <button class="log-entry-del" onclick="deleteFoodLog('${m.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');
  }
  
  // Totals
  const g = calculateGoals();
  let t = { kcal: 0, p: 0, c: 0, f: 0 };
  todayLog.meals.forEach(m => { t.kcal+=m.kcal; t.p+=m.p; t.c+=m.c; t.f+=m.f; });
  t.kcal = Math.round(t.kcal); t.p = Math.round(t.p); t.c = Math.round(t.c); t.f = Math.round(t.f);
  
  document.getElementById('daily-totals-list').innerHTML = `
    ${renderSimpleBar('Calories', t.kcal, g.kcal, 'var(--gold)')}
    ${renderSimpleBar('Protein', t.p, g.p, 'var(--green)')}
    ${renderSimpleBar('Carbs', t.c, g.c, 'var(--orange)')}
    ${renderSimpleBar('Fats', t.f, g.f, 'var(--blue)')}
  `;
  
  renderLogMacroChart(t.c*4, t.p*4, t.f*4);
}

function renderSimpleBar(name, val, max, color) {
  const pct = Math.min(100, Math.max(0, (val/max)*100)) || 0;
  return `
    <div class="total-row">
      <div class="total-label">${name} (${val}/${max})</div>
      <div class="total-bar-wrap"><div class="total-bar-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>
  `;
}

let logMacroInst = null;
function renderLogMacroChart(c, p, f) {
  const ctx = document.getElementById('logMacroChart').getContext('2d');
  if(logMacroInst) logMacroInst.destroy();
  if(c+p+f === 0) { c=1;p=1;f=1; }
  logMacroInst = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Carbs', 'Protein', 'Fats'],
      datasets: [{
        data: [c, p, f],
        backgroundColor: ['#F39C12', '#2ECC71', '#4A90E2'],
        borderWidth: 1, borderColor: '#111'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels:{color:'#888', font:{size:11}} } }
    }
  });
}

function deleteFoodLog(id) {
  if(!state.dailyLog[state.currentDate]) return;
  state.dailyLog[state.currentDate].meals = state.dailyLog[state.currentDate].meals.filter(m => m.id !== id);
  saveProfile();
  renderFoodLog();
}

/* FOOD MODAL LOGIC */
let selectedFoodBase = null;
function openFoodModal() {
  document.getElementById('food-modal-overlay').classList.remove('hidden');
  document.getElementById('food-search').value = '';
  document.getElementById('food-search-results').innerHTML = '';
  document.getElementById('selected-food-panel').style.display = 'none';
  document.getElementById('food-meal-type').value = state.activeMealTab;
}
function openFoodModalFromPlan(name, type) {
  openFoodModal();
  document.getElementById('food-meal-type').value = type;
  document.getElementById('food-search').value = name;
  searchFood(name);
}
function closeFoodModal(e) {
  if (e && e.target !== document.getElementById('food-modal-overlay')) return;
  document.getElementById('food-modal-overlay').classList.add('hidden');
}

function searchFood(q) {
  const resWrap = document.getElementById('food-search-results');
  if(!q) { resWrap.innerHTML = ''; return; }
  
  q = q.toLowerCase();
  const matches = foodDB.filter(f => f.name.toLowerCase().includes(q));
  
  if(matches.length === 0) {
    // Add custom option
    resWrap.innerHTML = `
      <div class="food-result-item" onclick="selectFood({id:Date.now(), name:'${q}', kcal:200, p:10, c:20, f:5, unit:'100g'})">
        <div class="food-result-name">Add custom: "${q}"</div>
        <div class="food-result-kcal"><i class="fa-solid fa-plus"></i></div>
      </div>
    `;
    return;
  }
  
  resWrap.innerHTML = matches.map(m => `
    <div class="food-result-item" onclick='selectFood(${JSON.stringify(m)})'>
      <div class="food-result-name">${m.name} <small style="color:var(--muted)">(${m.unit})</small></div>
      <div class="food-result-kcal">${m.kcal} kcal</div>
    </div>
  `).join('');
}

function selectFood(f) {
  selectedFoodBase = f;
  document.getElementById('food-search-results').innerHTML = '';
  document.getElementById('selected-food-panel').style.display = 'block';
  document.getElementById('selected-food-name').textContent = f.name;
  document.getElementById('food-qty').value = 100;
  updateFoodCalc();
}

function updateFoodCalc() {
  if(!selectedFoodBase) return;
  const qty = parseFloat(document.getElementById('food-qty').value) || 0;
  const ratio = qty / 100;
  
  const kcal = Math.round(selectedFoodBase.kcal * ratio);
  const p = Math.round(selectedFoodBase.p * ratio * 10)/10;
  const c = Math.round(selectedFoodBase.c * ratio * 10)/10;
  const f = Math.round(selectedFoodBase.f * ratio * 10)/10;
  
  document.getElementById('selected-food-nutrients').innerHTML = `
    <div class="food-nutrient-pill">Protein <strong>${p}g</strong></div>
    <div class="food-nutrient-pill">Carbs <strong>${c}g</strong></div>
    <div class="food-nutrient-pill">Fats <strong>${f}g</strong></div>
  `;
  document.getElementById('food-calc-total').textContent = `Total: ${kcal} kcal`;
}

function addFoodToLog() {
  if(!selectedFoodBase) return;
  const qty = parseFloat(document.getElementById('food-qty').value) || 0;
  const type = document.getElementById('food-meal-type').value;
  const ratio = qty / 100;
  
  if(!state.dailyLog[state.currentDate]) state.dailyLog[state.currentDate] = { meals: [], water: 0 };
  
  state.dailyLog[state.currentDate].meals.push({
    id: 'm_' + Date.now(),
    type: type,
    name: selectedFoodBase.name,
    qty: qty,
    kcal: Math.round(selectedFoodBase.kcal * ratio),
    p: Math.round(selectedFoodBase.p * ratio * 10)/10,
    c: Math.round(selectedFoodBase.c * ratio * 10)/10,
    f: Math.round(selectedFoodBase.f * ratio * 10)/10
  });
  
  saveProfile();
  closeFoodModal();
  showToast('Food logged successfully!');
  
  if(document.getElementById('page-food-log').classList.contains('active')) renderFoodLog();
  if(document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
}

// ─── PROGRESS ─────────────────────────────
let charts = {};
function renderProgress() {
  const days = parseInt(document.getElementById('progress-period').value);
  const data = getProgressData(days);
  
  createChart('calorieTrendChart', 'line', data.labels, [
    { label: 'Calories Consumed', data: data.kcal, borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)', fill: true, tension: 0.4 }
  ]);
  createChart('weightTrendChart', 'line', data.labels, [
    { label: 'Weight (kg)', data: data.weight, borderColor: '#2ECC71', backgroundColor: 'transparent', tension: 0.1, pointRadius: 4 }
  ]);
  createChart('weeklyMacroChart', 'bar', data.labels, [
    { label: 'Protein (g)', data: data.p, backgroundColor: '#2ECC71' },
    { label: 'Carbs (g)', data: data.c, backgroundColor: '#D4AF37' },
    { label: 'Fats (g)', data: data.f, backgroundColor: '#4A90E2' }
  ], { stacked: true });
  createChart('waterTrendChart', 'bar', data.labels, [
    { label: 'Water (Glasses)', data: data.water, backgroundColor: '#4A90E2', borderRadius: 4 }
  ]);
}

function getProgressData(days) {
  const res = { labels: [], kcal: [], p: [], c: [], f: [], water: [], weight: [] };
  const today = new Date();
  
  let lastWeight = state.profile.weight || 70; // fallback
  
  for(let i=days-1; i>=0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    
    res.labels.push(d.getDate() + '/' + (d.getMonth()+1));
    
    const log = state.dailyLog[dStr] || { meals: [], water: 0 };
    let kcal=0, p=0, c=0, f=0;
    if(log.meals) log.meals.forEach(m => { kcal+=m.kcal; p+=m.p; c+=m.c; f+=m.f; });
    
    res.kcal.push(kcal);
    res.p.push(p); res.c.push(c); res.f.push(f);
    res.water.push(log.water || 0);
    
    if(state.bodyMetrics[dStr]) lastWeight = state.bodyMetrics[dStr];
    res.weight.push(lastWeight);
  }
  return res;
}

function createChart(id, type, labels, datasets, customOptions = {}) {
  const ctx = document.getElementById(id).getContext('2d');
  if(charts[id]) charts[id].destroy();
  
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#888' } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' }, stacked: customOptions.stacked },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' }, stacked: customOptions.stacked }
    }
  };
  
  charts[id] = new Chart(ctx, { type, data: { labels, datasets }, options });
}

function logBodyMetric(e) {
  e.preventDefault();
  const w = parseFloat(document.getElementById('metric-weight').value);
  const d = document.getElementById('metric-date').value || state.currentDate;
  if(w && d) {
    state.bodyMetrics[d] = w;
    state.profile.weight = w; // update current
    saveProfile();
    showToast('Metric saved!');
    renderProgress();
    if(document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
  }
}

// ─── COMMUNITY ────────────────────────────
function renderCommunity() {
  const feed = document.getElementById('posts-feed');
  const sorted = [...state.communityPosts].reverse();
  
  feed.innerHTML = sorted.map(p => `
    <div class="post-card">
      <div class="post-header">
        <div class="post-avatar">${p.authorInitials}</div>
        <div>
          <div class="post-author-name">${p.author}</div>
          <div class="post-date">${p.date}</div>
        </div>
      </div>
      <div class="post-title">${p.title}</div>
      <div class="post-body">${p.body}</div>
      <div class="post-tags-row">
        ${p.tags.map(t => `<span class="post-tag">#${t}</span>`).join('')}
      </div>
      <div class="post-actions">
        <button class="post-action-btn" onclick="likePost(${p.id}, this)">
          <i class="fa-regular fa-heart"></i> <span>${p.likes} Likes</span>
        </button>
        <button class="post-action-btn"><i class="fa-regular fa-comment"></i> Reply</button>
        <button class="post-action-btn"><i class="fa-solid fa-share-nodes"></i> Share</button>
      </div>
    </div>
  `).join('');
  
  // Sidebar
  const tags = ['vegan', 'keto', 'weight-loss', 'meal-prep', 'high-protein', 'recipe', 'motivation'];
  document.getElementById('tag-cloud').innerHTML = tags.map(t => `<span class="tag">#${t}</span>`).join('');
  
  const tips = [
    "Drinking water before meals can help control portions naturally.",
    "Don't fear healthy fats! Avocados and nuts are essential for hormones.",
    "Consistency over perfection. One bad meal doesn't ruin your progress."
  ];
  document.getElementById('daily-tip').textContent = tips[Math.floor(Math.random() * tips.length)];
  
  // Leaderboard mock
  const lb = [
    {name: 'Alex D.', s: 45}, {name: 'Maria K.', s: 38}, {name: 'John S.', s: 22}, {name: 'You', s: calculateStreak()}
  ].sort((a,b)=>b.s-a.s);
  
  document.getElementById('leaderboard-list').innerHTML = lb.map((l, i) => `
    <li>
      <div class="lb-rank ${i===0?'gold-rank':''}">${i+1}</div>
      <span>${l.name}</span>
      <div class="lb-streak">🔥 ${l.s}d</div>
    </li>
  `).join('');
}

function likePost(id, btn) {
  const post = state.communityPosts.find(p => p.id === id);
  if(post) {
    if(btn.classList.contains('liked')) {
      post.likes--; btn.classList.remove('liked');
      btn.innerHTML = `<i class="fa-regular fa-heart"></i> <span>${post.likes} Likes</span>`;
    } else {
      post.likes++; btn.classList.add('liked');
      btn.innerHTML = `<i class="fa-solid fa-heart"></i> <span>${post.likes} Likes</span>`;
    }
    savePosts();
  }
}

function openPostModal() { document.getElementById('post-modal-overlay').classList.remove('hidden'); }
function closePostModal(e) {
  if (e && e.target !== document.getElementById('post-modal-overlay')) return;
  document.getElementById('post-modal-overlay').classList.add('hidden');
}
function submitPost(e) {
  e.preventDefault();
  const t = document.getElementById('post-title').value;
  const b = document.getElementById('post-body').value;
  const tagsStr = document.getElementById('post-tags').value;
  
  const tags = tagsStr ? tagsStr.split(',').map(s=>s.trim().replace('#','')).filter(Boolean) : [];
  
  state.communityPosts.push({
    id: Date.now(),
    author: state.profile.fname + ' ' + (state.profile.lname ? state.profile.lname.charAt(0)+'.' : ''),
    authorInitials: (state.profile.fname.charAt(0) + (state.profile.lname ? state.profile.lname.charAt(0) : '')).toUpperCase(),
    date: 'Just now',
    title: t, body: b, tags: tags, likes: 0
  });
  savePosts();
  closePostModal();
  document.getElementById('post-title').value = '';
  document.getElementById('post-body').value = '';
  document.getElementById('post-tags').value = '';
  showToast('Post published!');
  renderCommunity();
}

// ─── PROFILE ──────────────────────────────
function renderProfilePage() {
  document.getElementById('profile-name-display').textContent = `${state.profile.fname} ${state.profile.lname}`;
  document.getElementById('profile-email-display').textContent = state.profile.email;
  document.getElementById('profile-joined').textContent = state.profile.joined;
  document.getElementById('profile-avatar-big').textContent = document.getElementById('nav-avatar').textContent;
  
  const badge = document.getElementById('profile-goal-badge');
  badge.textContent = state.profile.goal.replace('-', ' ');
  
  document.getElementById('pf-fname').value = state.profile.fname;
  document.getElementById('pf-lname').value = state.profile.lname || '';
  document.getElementById('pf-age').value = state.profile.age || '';
  document.getElementById('pf-gender').value = state.profile.gender || 'other';
  document.getElementById('pf-height').value = state.profile.height || '';
  document.getElementById('pf-weight').value = state.profile.weight || '';
  document.getElementById('pf-goal').value = state.profile.goal;
  document.getElementById('pf-activity').value = state.profile.activity || 'moderate';
  
  document.querySelectorAll('.diet-chips .chip').forEach(c => {
    c.classList.toggle('active', state.profile.diet.includes(c.dataset.diet));
  });
  
  renderAllergies();
}

function toggleDiet(btn) {
  btn.classList.toggle('active');
  const d = btn.dataset.diet;
  if(btn.classList.contains('active')) {
    if(!state.profile.diet.includes(d)) state.profile.diet.push(d);
  } else {
    state.profile.diet = state.profile.diet.filter(x => x !== d);
  }
}

function renderAllergies() {
  const wrap = document.getElementById('allergy-tags');
  if(!state.profile.allergies || state.profile.allergies.length === 0) {
    wrap.innerHTML = `<span style="color:var(--muted);font-size:12px;">No allergies added.</span>`;
  } else {
    wrap.innerHTML = state.profile.allergies.map(a => `
      <div class="allergy-tag">${a} <button type="button" onclick="removeAllergy('${a}')"><i class="fa-solid fa-xmark"></i></button></div>
    `).join('');
  }
}

function addAllergy() {
  const inp = document.getElementById('allergy-input');
  const v = inp.value.trim();
  if(v && !state.profile.allergies.includes(v)) {
    state.profile.allergies.push(v);
    inp.value = '';
    renderAllergies();
    saveProfile();
  }
}
function removeAllergy(a) {
  state.profile.allergies = state.profile.allergies.filter(x => x !== a);
  renderAllergies();
  saveProfile();
}

function saveProfile(e) {
  if(e) e.preventDefault();
  state.profile.fname = document.getElementById('pf-fname').value;
  state.profile.lname = document.getElementById('pf-lname').value;
  state.profile.age = parseInt(document.getElementById('pf-age').value) || null;
  state.profile.gender = document.getElementById('pf-gender').value;
  state.profile.height = parseInt(document.getElementById('pf-height').value) || null;
  state.profile.weight = parseFloat(document.getElementById('pf-weight').value) || null;
  state.profile.goal = document.getElementById('pf-goal').value;
  state.profile.activity = document.getElementById('pf-activity').value;
  
  saveProfile();
  showToast('Profile updated successfully!');
  
  // update topbar
  document.getElementById('nav-user-name').textContent = state.profile.fname;
  document.getElementById('nav-user-goal').textContent = state.profile.goal.replace('-',' ');
  document.getElementById('profile-name-display').textContent = `${state.profile.fname} ${state.profile.lname}`;
  document.getElementById('profile-goal-badge').textContent = state.profile.goal.replace('-',' ');
}

// ─── ADMIN DASHBOARD ──────────────────────
function renderAdmin() {
  if(!state.profile.isAdmin) return;
  
  const uArr = Object.values(state.users);
  
  document.getElementById('admin-stats').innerHTML = `
    <div class="admin-stat"><div class="admin-stat-label">Total Users</div><div class="admin-stat-val" style="color:var(--gold)">${uArr.length}</div></div>
    <div class="admin-stat"><div class="admin-stat-label">Total Posts</div><div class="admin-stat-val" style="color:var(--blue)">${state.communityPosts.length}</div></div>
    <div class="admin-stat"><div class="admin-stat-label">Active Today</div><div class="admin-stat-val" style="color:var(--green)">1</div></div>
  `;
  
  document.getElementById('admin-user-tbody').innerHTML = uArr.map(u => `
    <tr>
      <td><strong>${u.fname} ${u.lname||''}</strong> ${u.isAdmin?'<i class="fa-solid fa-star" style="color:var(--gold);font-size:10px;"></i>':''}</td>
      <td style="color:var(--muted)">${u.email}</td>
      <td><span class="meal-tag">${u.goal.replace('-',' ')}</span></td>
      <td style="color:var(--muted)">${u.joined}</td>
      <td>
        ${!u.isAdmin ? `<button class="admin-ban-btn" onclick="alert('User banned (simulation)')">Ban</button>` : `<span style="color:var(--muted);font-size:11px;">Admin</span>`}
      </td>
    </tr>
  `).join('');
  
  // Render dummy usage chart
  const ctx = document.getElementById('adminUsageChart').getContext('2d');
  if(charts['adminUsage']) charts['adminUsage'].destroy();
  charts['adminUsage'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [
        { label: 'Active Users', data: [12,19,15,22,30,28,35], borderColor: '#D4AF37', tension: 0.4 },
        { label: 'Meals Logged', data: [45,60,55,80,110,95,130], borderColor: '#2ECC71', tension: 0.4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#888' } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } }
      }
    }
  });
}
