/* =========================================================
   StudyMate — script.js
   ========================================================= */

// ─── GLOBALS ───────────────────────────────────────────────
let timerInterval = null;
let timeLeft = 25 * 60;
let totalTime = 25 * 60;
let isRunning = false;
let currentMode = 'work';
let sessionsCompleted = 0;
let timerSettings = {
    work: 25, short: 5, long: 15, sessionsBeforeLong: 4
};

const QUOTES = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Education is the passport to the future.", author: "Malcolm X" },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.", author: "Richard Feynman" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" }
];

const ACHIEVEMENTS = [
    { id: 'first_session', icon: '🎯', name: 'First Focus', desc: 'Complete your first session', check: s => s.totalSessions >= 1 },
    { id: 'five_sessions', icon: '🔥', name: 'On Fire', desc: 'Complete 5 sessions', check: s => s.totalSessions >= 5 },
    { id: 'ten_sessions', icon: '⚡', name: 'Unstoppable', desc: 'Complete 10 sessions', check: s => s.totalSessions >= 10 },
    { id: 'first_task', icon: '✅', name: 'Task Master', desc: 'Complete your first task', check: s => s.totalTasksDone >= 1 },
    { id: 'ten_tasks', icon: '📋', name: 'Productivity Pro', desc: 'Complete 10 tasks', check: s => s.totalTasksDone >= 10 },
    { id: 'first_note', icon: '📝', name: 'Note Taker', desc: 'Create your first note', check: s => s.totalNotes >= 1 },
    { id: 'streak_3', icon: '🌟', name: '3-Day Streak', desc: 'Study 3 days in a row', check: s => s.streak >= 3 },
    { id: 'streak_7', icon: '💎', name: 'Week Warrior', desc: 'Study 7 days in a row', check: s => s.streak >= 7 },
    { id: 'hour_total', icon: '⏰', name: 'Hour Hero', desc: 'Study for 60 minutes total', check: s => s.totalMinutes >= 60 },
    { id: 'five_hours', icon: '🏆', name: 'Scholar', desc: 'Study for 5 hours total', check: s => s.totalMinutes >= 300 }
];

// ─── INITIALIZATION ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initTheme();
    initParticles();
    showRandomQuote();
    loadTimerSettings();
    loadTasks();
    loadNotes();
    loadStats();
    updateStatsUI();
    renderWeeklyChart();
    renderAchievements();
    loadSavedResources();
    populateQuickTopicsFromNotes();
    initBuddy();
    renderKnowledgeGraph();
    renderWeaknessHeatmap();

    // Session dots
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('sm_sessionDate');
    if (savedDate === today) {
        sessionsCompleted = parseInt(localStorage.getItem('sm_sessionsToday') || '0');
    } else {
        sessionsCompleted = 0;
    }
    updateSessionDots();
});

// ─── TABS ──────────────────────────────────────────────────
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        });
    });
}

function goToResourcesTab() {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const resBtn = document.querySelector('.tab-btn[data-tab="resources"]');
    if (resBtn) resBtn.classList.add('active');
    document.getElementById('tab-resources').classList.add('active');
}

// ─── THEME ─────────────────────────────────────────────────
function initTheme() {
    const saved = localStorage.getItem('sm_theme');
    if (saved === 'dark') document.body.classList.add('dark-mode');
    document.getElementById('themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('sm_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        const icon = document.querySelector('#themeToggle i');
        icon.className = document.body.classList.contains('dark-mode') ? 'fas fa-sun' : 'fas fa-moon';
    });
}

// ─── PARTICLES ─────────────────────────────────────────────
function initParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 20 + 's';
        p.style.animationDuration = (15 + Math.random() * 20) + 's';
        container.appendChild(p);
    }
}

// ─── QUOTES ────────────────────────────────────────────────
function showRandomQuote() {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    document.getElementById('quoteText').textContent = `"${q.text}" — ${q.author}`;
}

// ─── POMODORO TIMER ────────────────────────────────────────
function loadTimerSettings() {
    const saved = localStorage.getItem('sm_timerSettings');
    if (saved) {
        timerSettings = JSON.parse(saved);
        document.getElementById('workDuration').value = timerSettings.work;
        document.getElementById('shortBreakDuration').value = timerSettings.short;
        document.getElementById('longBreakDuration').value = timerSettings.long;
        document.getElementById('sessionsBeforeLong').value = timerSettings.sessionsBeforeLong;
    }
    setTimerMode('work');

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!isRunning) setTimerMode(btn.dataset.mode);
        });
    });
}

function saveTimerSettings() {
    timerSettings.work = parseInt(document.getElementById('workDuration').value) || 25;
    timerSettings.short = parseInt(document.getElementById('shortBreakDuration').value) || 5;
    timerSettings.long = parseInt(document.getElementById('longBreakDuration').value) || 15;
    timerSettings.sessionsBeforeLong = parseInt(document.getElementById('sessionsBeforeLong').value) || 4;
    localStorage.setItem('sm_timerSettings', JSON.stringify(timerSettings));
    setTimerMode(currentMode);
    showToast('Settings saved!');
}

function setTimerMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.mode-btn[data-mode="${mode}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const labels = { work: 'Focus Time', short: 'Short Break', long: 'Long Break' };
    document.getElementById('timerLabel').textContent = labels[mode] || 'Focus Time';

    const durations = { work: timerSettings.work, short: timerSettings.short, long: timerSettings.long };
    timeLeft = (durations[mode] || 25) * 60;
    totalTime = timeLeft;
    updateTimerDisplay();
    updateRing();
}

function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    isRunning = true;
    document.getElementById('startBtn').innerHTML = '<i class="fas fa-pause"></i> Pause';
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        updateRing();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            isRunning = false;
            document.getElementById('startBtn').innerHTML = '<i class="fas fa-play"></i> Start';
            timerComplete();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('startBtn').innerHTML = '<i class="fas fa-play"></i> Start';
}

function resetTimer() {
    pauseTimer();
    setTimerMode(currentMode);
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timer').textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateRing() {
    const circle = document.getElementById('timerProgress');
    const circumference = 2 * Math.PI * 100;
    circle.style.strokeDasharray = circumference;
    const progress = timeLeft / totalTime;
    circle.style.strokeDashoffset = circumference * (1 - progress);
}

function timerComplete() {
    playNotificationSound();
    if (currentMode === 'work') {
        sessionsCompleted++;
        localStorage.setItem('sm_sessionsToday', sessionsCompleted);
        localStorage.setItem('sm_sessionDate', new Date().toDateString());
        updateSessionDots();

        // Update stats
        const stats = getStats();
        stats.totalSessions++;
        stats.todaySessions++;
        stats.totalMinutes += timerSettings.work;
        stats.todayMinutes += timerSettings.work;
        const dayIndex = (new Date().getDay() + 6) % 7;
        stats.weeklyMinutes[dayIndex] += timerSettings.work;
        saveStats(stats);
        updateStatsUI();
        renderWeeklyChart();
        renderAchievements();

        showToast('Great work! Session complete! 🎉');

        // Auto switch to break
        if (sessionsCompleted % timerSettings.sessionsBeforeLong === 0) {
            setTimerMode('long');
        } else {
            setTimerMode('short');
        }
    } else {
        showToast('Break over! Ready to focus? 💪');
        setTimerMode('work');
    }
}

function updateSessionDots() {
    const container = document.getElementById('sessionDots');
    container.innerHTML = '';
    for (let i = 0; i < sessionsCompleted; i++) {
        const dot = document.createElement('span');
        dot.className = 'session-dot filled';
        container.appendChild(dot);
    }
    document.getElementById('sessionCount').textContent = sessionsCompleted;
}

function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.value = 0.3;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
}

// ─── TASKS ─────────────────────────────────────────────────
function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    if (!text) return;
    const priority = document.getElementById('taskPriority').value;
    const tasks = getTasks();
    tasks.push({ id: Date.now(), text, priority, done: false, createdAt: new Date().toISOString() });
    saveTasks(tasks);
    input.value = '';
    renderTasks();
    showToast('Task added! 📝');
}

function getTasks() {
    return JSON.parse(localStorage.getItem('sm_tasks') || '[]');
}

function saveTasks(tasks) {
    localStorage.setItem('sm_tasks', JSON.stringify(tasks));
}

function loadTasks() {
    renderTasks();
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks(btn.dataset.filter);
        });
    });
}

function renderTasks(filter = 'all') {
    const tasks = getTasks();
    const list = document.getElementById('taskList');
    list.innerHTML = '';

    const filtered = tasks.filter(t => {
        if (filter === 'active') return !t.done;
        if (filter === 'completed') return t.done;
        return true;
    });

    filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item priority-${task.priority}${task.done ? ' completed' : ''}`;
        li.innerHTML = `
            <label class="task-check">
                <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTask(${task.id})">
                <span class="checkmark"></span>
            </label>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <button class="task-delete" onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(li);
    });

    const remaining = tasks.filter(t => !t.done).length;
    const footer = document.getElementById('taskFooter');
    footer.style.display = tasks.length ? 'flex' : 'none';
    document.getElementById('taskCount').textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;
}

function toggleTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.done = !task.done;
        saveTasks(tasks);
        renderTasks();
        if (task.done) {
            const stats = getStats();
            stats.totalTasksDone++;
            stats.todayTasksDone++;
            saveStats(stats);
            updateStatsUI();
            renderAchievements();
            showConfetti();
            showToast('Task complete! Great job! ✅');
        }
    }
}

function deleteTask(id) {
    const tasks = getTasks().filter(t => t.id !== id);
    saveTasks(tasks);
    renderTasks();
}

function clearCompletedTasks() {
    const tasks = getTasks().filter(t => !t.done);
    saveTasks(tasks);
    renderTasks();
    showToast('Cleared completed tasks!');
}

function showConfetti() {
    for (let i = 0; i < 30; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.left = Math.random() * 100 + '%';
        conf.style.background = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8'][Math.floor(Math.random() * 6)];
        conf.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 2000);
    }
}

// ─── NOTES ─────────────────────────────────────────────────
function addNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const category = document.getElementById('noteCategory').value;
    if (!content) { showToast('Write something first!'); return; }
    const notes = getNotes();
    notes.unshift({ id: Date.now(), title: title || 'Untitled', content, category, createdAt: new Date().toISOString() });
    saveNotes(notes);
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    renderNotes();

    const stats = getStats();
    stats.totalNotes++;
    saveStats(stats);
    renderAchievements();
    showToast('Note saved! 📝');
}

function getNotes() {
    return JSON.parse(localStorage.getItem('sm_notes') || '[]');
}

function saveNotes(notes) {
    localStorage.setItem('sm_notes', JSON.stringify(notes));
}

function loadNotes() {
    renderNotes();
}

function renderNotes() {
    const notes = getNotes();
    const container = document.getElementById('notesList');
    const searchTerm = (document.getElementById('noteSearch')?.value || '').toLowerCase();
    container.innerHTML = '';

    const filtered = notes.filter(n =>
        n.title.toLowerCase().includes(searchTerm) ||
        n.content.toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">No notes yet. Start writing!</p>';
        return;
    }

    const categoryIcons = { general: '📁', math: '📐', science: '🔬', language: '📝', history: '📜', code: '💻' };

    filtered.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        const date = new Date(note.createdAt).toLocaleDateString();
        card.innerHTML = `
            <div class="note-header">
                <span class="note-category">${categoryIcons[note.category] || '📁'} ${note.category}</span>
                <span class="note-date">${date}</span>
            </div>
            <h4 class="note-title">${escapeHtml(note.title)}</h4>
            <p class="note-preview">${escapeHtml(note.content).substring(0, 200)}${note.content.length > 200 ? '...' : ''}</p>
            <div class="note-actions">
                <button class="btn-small" onclick="copyNote(${note.id})" title="Copy"><i class="fas fa-copy"></i></button>
                <button class="btn-small" onclick="findResourcesForNote(${note.id})" title="Find resources"><i class="fas fa-search"></i></button>
                <button class="btn-small btn-danger" onclick="deleteNote(${note.id})" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(card);
    });
}

function deleteNote(id) {
    const notes = getNotes().filter(n => n.id !== id);
    saveNotes(notes);
    renderNotes();
    showToast('Note deleted');
}

function copyNote(id) {
    const note = getNotes().find(n => n.id === id);
    if (note) {
        navigator.clipboard.writeText(note.content).then(() => showToast('Copied to clipboard! 📋'));
    }
}

function filterNotes() {
    renderNotes();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ─── STATISTICS ────────────────────────────────────────────
function getStats() {
    const defaults = {
        totalSessions: 0, totalMinutes: 0, totalTasksDone: 0, totalNotes: 0,
        todaySessions: 0, todayMinutes: 0, todayTasksDone: 0,
        streak: 0, lastStudyDate: null,
        weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
        weekStart: null
    };
    const saved = localStorage.getItem('sm_stats');
    if (!saved) return defaults;
    const stats = { ...defaults, ...JSON.parse(saved) };

    // Reset today if new day
    const today = new Date().toDateString();
    if (stats.lastStudyDate !== today) {
        if (stats.lastStudyDate) {
            const last = new Date(stats.lastStudyDate);
            const now = new Date();
            const diffDays = Math.floor((now - last) / 86400000);
            if (diffDays === 1) {
                stats.streak++;
            } else if (diffDays > 1) {
                stats.streak = 0;
            }
        }
        stats.todaySessions = 0;
        stats.todayMinutes = 0;
        stats.todayTasksDone = 0;
        stats.lastStudyDate = today;

        // Reset weekly if new week
        const weekStart = getWeekStart();
        if (stats.weekStart !== weekStart) {
            stats.weeklyMinutes = [0, 0, 0, 0, 0, 0, 0];
            stats.weekStart = weekStart;
        }
        saveStats(stats);
    }
    return stats;
}

function getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    return monday.toDateString();
}

function saveStats(stats) {
    localStorage.setItem('sm_stats', JSON.stringify(stats));
}

function loadStats() {
    getStats(); // triggers reset if needed
}

function updateStatsUI() {
    const stats = getStats();
    document.getElementById('statStreak').textContent = stats.streak;
    document.getElementById('statMinutes').textContent = stats.todayMinutes;
    document.getElementById('statTasksDone').textContent = stats.todayTasksDone;
    document.getElementById('statSessions').textContent = stats.todaySessions;
}

function renderWeeklyChart() {
    const stats = getStats();
    const chart = document.getElementById('weeklyChart');
    chart.innerHTML = '';
    const max = Math.max(...stats.weeklyMinutes, 1);
    stats.weeklyMinutes.forEach(mins => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = Math.max((mins / max) * 100, 2) + '%';
        bar.title = mins + ' min';
        chart.appendChild(bar);
    });
}

function renderAchievements() {
    const stats = getStats();
    const grid = document.getElementById('achievementGrid');
    grid.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
        const unlocked = a.check(stats);
        const card = document.createElement('div');
        card.className = `achievement-card${unlocked ? ' unlocked' : ''}`;
        card.innerHTML = `
            <div class="achievement-icon">${a.icon}</div>
            <div class="achievement-name">${a.name}</div>
            <div class="achievement-desc">${a.desc}</div>
        `;
        grid.appendChild(card);
    });
}

function resetStats() {
    if (confirm('Reset all statistics and achievements? This cannot be undone.')) {
        localStorage.removeItem('sm_stats');
        sessionsCompleted = 0;
        localStorage.removeItem('sm_sessionsToday');
        updateSessionDots();
        updateStatsUI();
        renderWeeklyChart();
        renderAchievements();
        showToast('Stats reset');
    }
}

// ─── TOAST NOTIFICATION ────────────────────────────────────
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ─── STUDY RESOURCE ENGINE ─────────────────────────────────
const SUBJECT_KEYWORDS = {
    math: ['algebra', 'calculus', 'geometry', 'trigonometry', 'equation', 'fraction', 'polynomial', 'matrix', 'derivative', 'integral', 'probability', 'statistics', 'math', 'arithmetic', 'quadratic', 'linear', 'logarithm', 'exponent', 'vector', 'number theory'],
    science: ['biology', 'chemistry', 'physics', 'atom', 'molecule', 'cell', 'dna', 'evolution', 'gravity', 'energy', 'force', 'photosynthesis', 'ecosystem', 'periodic table', 'chemical', 'reaction', 'newton', 'electron', 'gene', 'organism', 'science'],
    history: ['war', 'revolution', 'empire', 'civilization', 'ancient', 'medieval', 'colonial', 'independence', 'constitution', 'president', 'king', 'queen', 'dynasty', 'treaty', 'battle', 'history', 'ww1', 'ww2', 'cold war', 'renaissance'],
    language: ['grammar', 'vocabulary', 'essay', 'writing', 'literature', 'poetry', 'novel', 'shakespeare', 'syntax', 'punctuation', 'comprehension', 'reading', 'english', 'spanish', 'french', 'language', 'verb', 'noun', 'adjective', 'tense'],
    code: ['javascript', 'python', 'html', 'css', 'programming', 'code', 'algorithm', 'data structure', 'function', 'variable', 'loop', 'array', 'object', 'class', 'api', 'database', 'react', 'node', 'git', 'software'],
    business: ['economics', 'marketing', 'finance', 'accounting', 'management', 'business', 'entrepreneur', 'investment', 'stock', 'supply', 'demand', 'profit', 'revenue', 'startup', 'strategy'],
    art: ['painting', 'sculpture', 'design', 'color theory', 'art history', 'drawing', 'illustration', 'photography', 'graphic design', 'typography', 'composition', 'art'],
    music: ['music theory', 'chord', 'scale', 'rhythm', 'melody', 'harmony', 'instrument', 'piano', 'guitar', 'composition', 'tempo', 'music'],
    psychology: ['psychology', 'cognitive', 'behavior', 'mental health', 'therapy', 'freud', 'consciousness', 'memory', 'emotion', 'personality', 'disorder', 'brain', 'neuroscience']
};

const TEXTBOOK_DATABASE = {
    math: [
        { title: "Khan Academy — Math", url: "https://www.khanacademy.org/math", type: "interactive" },
        { title: "Paul's Online Math Notes", url: "https://tutorial.math.lamar.edu/", type: "textbook" },
        { title: "Mathway Problem Solver", url: "https://www.mathway.com/", type: "tool" },
        { title: "Desmos Graphing Calculator", url: "https://www.desmos.com/calculator", type: "tool" },
        { title: "Art of Problem Solving", url: "https://artofproblemsolving.com/", type: "community" }
    ],
    science: [
        { title: "Khan Academy — Science", url: "https://www.khanacademy.org/science", type: "interactive" },
        { title: "CK-12 Science", url: "https://www.ck12.org/", type: "textbook" },
        { title: "PhET Simulations", url: "https://phet.colorado.edu/", type: "interactive" },
        { title: "Biology LibreTexts", url: "https://bio.libretexts.org/", type: "textbook" },
        { title: "Physics Classroom", url: "https://www.physicsclassroom.com/", type: "interactive" }
    ],
    history: [
        { title: "Khan Academy — History", url: "https://www.khanacademy.org/humanities/world-history", type: "interactive" },
        { title: "History.com", url: "https://www.history.com/", type: "reference" },
        { title: "Crash Course History (YouTube)", url: "https://www.youtube.com/playlist?list=PLBDA2E52FB1EF80C9", type: "video" },
        { title: "World History Encyclopedia", url: "https://www.worldhistory.org/", type: "reference" },
        { title: "Digital History", url: "https://www.digitalhistory.uh.edu/", type: "textbook" }
    ],
    language: [
        { title: "Grammarly Writing Guide", url: "https://www.grammarly.com/blog/", type: "tool" },
        { title: "Purdue OWL Writing Lab", url: "https://owl.purdue.edu/", type: "reference" },
        { title: "SparkNotes Literature", url: "https://www.sparknotes.com/", type: "reference" },
        { title: "Duolingo", url: "https://www.duolingo.com/", type: "interactive" },
        { title: "Merriam-Webster Dictionary", url: "https://www.merriam-webster.com/", type: "tool" }
    ],
    code: [
        { title: "MDN Web Docs", url: "https://developer.mozilla.org/", type: "reference" },
        { title: "freeCodeCamp", url: "https://www.freecodecamp.org/", type: "interactive" },
        { title: "W3Schools", url: "https://www.w3schools.com/", type: "interactive" },
        { title: "Codecademy", url: "https://www.codecademy.com/", type: "interactive" },
        { title: "GitHub Learning Lab", url: "https://lab.github.com/", type: "interactive" }
    ],
    business: [
        { title: "Khan Academy — Economics", url: "https://www.khanacademy.org/economics-finance-domain", type: "interactive" },
        { title: "Investopedia", url: "https://www.investopedia.com/", type: "reference" },
        { title: "Harvard Business Review", url: "https://hbr.org/", type: "reference" },
        { title: "Coursera Business", url: "https://www.coursera.org/browse/business", type: "course" },
        { title: "Accounting Coach", url: "https://www.accountingcoach.com/", type: "textbook" }
    ],
    art: [
        { title: "Skillshare Art Classes", url: "https://www.skillshare.com/", type: "course" },
        { title: "Smarthistory", url: "https://smarthistory.org/", type: "reference" },
        { title: "DrawSpace", url: "https://www.drawspace.com/", type: "interactive" },
        { title: "Canva Design School", url: "https://www.canva.com/designschool/", type: "course" },
        { title: "Google Arts & Culture", url: "https://artsandculture.google.com/", type: "reference" }
    ],
    music: [
        { title: "Musictheory.net", url: "https://www.musictheory.net/", type: "interactive" },
        { title: "Teoria Music Theory", url: "https://www.teoria.com/", type: "interactive" },
        { title: "Justin Guitar", url: "https://www.justinguitar.com/", type: "interactive" },
        { title: "Coursera Music", url: "https://www.coursera.org/browse/arts-and-humanities/music-and-art", type: "course" },
        { title: "Music Notes Blog", url: "https://www.musicnotes.com/blog/", type: "reference" }
    ],
    psychology: [
        { title: "Khan Academy — Psychology", url: "https://www.khanacademy.org/science/ap-psychology", type: "interactive" },
        { title: "Simply Psychology", url: "https://www.simplypsychology.org/", type: "reference" },
        { title: "Psychology Today", url: "https://www.psychologytoday.com/", type: "reference" },
        { title: "Crash Course Psychology (YouTube)", url: "https://www.youtube.com/playlist?list=PL8dPuuaLjXtOPRKzVLY0jJY-uHOH9KVU", type: "video" },
        { title: "OpenStax Psychology", url: "https://openstax.org/details/books/psychology-2e", type: "textbook" }
    ]
};

const STUDY_TIPS = {
    math: [
        "Practice problems daily — math is a skill, not just memorization",
        "Understand the 'why' behind formulas, not just the 'how'",
        "Draw diagrams and visualize problems whenever possible",
        "Work through examples step by step before attempting exercises"
    ],
    science: [
        "Connect concepts to real-world examples for better understanding",
        "Use diagrams and visual models for complex processes",
        "Review lab experiments and their results carefully",
        "Create concept maps linking related topics together"
    ],
    history: [
        "Create timelines to visualize the sequence of events",
        "Focus on cause and effect — why things happened matters",
        "Use maps to understand the geography of historical events",
        "Study primary sources for a deeper understanding"
    ],
    language: [
        "Read widely — variety of texts improves comprehension",
        "Practice writing every day, even just a short paragraph",
        "Learn root words to expand vocabulary quickly",
        "Read your work aloud to catch errors and improve flow"
    ],
    code: [
        "Write code every day — consistency is key in programming",
        "Build small projects to apply what you learn",
        "Read other people's code to learn different approaches",
        "Debug by reading error messages carefully — they're helpful signals"
    ],
    business: [
        "Follow current business news to see concepts in action",
        "Create case studies from real companies you know",
        "Practice financial calculations with real-world numbers",
        "Study both successes and failures of businesses"
    ],
    art: [
        "Practice observational drawing regularly",
        "Study the masters and analyze their techniques",
        "Experiment with different mediums and styles",
        "Keep a sketchbook for daily creative exercises"
    ],
    music: [
        "Practice scales and fundamentals daily",
        "Listen actively — analyze the structure of songs you enjoy",
        "Record yourself to hear areas for improvement",
        "Learn music theory alongside practical playing"
    ],
    psychology: [
        "Relate psychological concepts to your own experiences",
        "Study research methods — they're fundamental to psychology",
        "Create flashcards for key theories and theorists",
        "Understand the difference between correlation and causation"
    ]
};

function detectSubject(topic) {
    const lower = topic.toLowerCase();
    let bestMatch = 'science';
    let bestScore = 0;
    for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
        const score = keywords.filter(k => lower.includes(k)).length;
        if (score > bestScore) {
            bestScore = score;
            bestMatch = subject;
        }
    }
    return bestMatch;
}

function generateResourceLinks(topic) {
    const encoded = encodeURIComponent(topic);
    return [
        { title: `YouTube: "${topic}"`, url: `https://www.youtube.com/results?search_query=${encoded}+explained+tutorial`, type: 'video', icon: 'fab fa-youtube' },
        { title: `Wikipedia: "${topic}"`, url: `https://en.wikipedia.org/wiki/${encoded.replace(/%20/g, '_')}`, type: 'reference', icon: 'fab fa-wikipedia-w' },
        { title: `Google Scholar: "${topic}"`, url: `https://scholar.google.com/scholar?q=${encoded}`, type: 'academic', icon: 'fas fa-graduation-cap' },
        { title: `Quizlet: "${topic}" flashcards`, url: `https://quizlet.com/search?query=${encoded}&type=sets`, type: 'flashcards', icon: 'fas fa-clone' }
    ];
}

function findResources() {
    const topicInput = document.getElementById('resourceTopic');
    const topic = topicInput.value.trim();
    if (!topic) { showToast('Enter a topic to search!'); return; }

    const subjectSelect = document.getElementById('resourceSubject');
    let subject = subjectSelect.value;
    if (subject === 'auto') subject = detectSubject(topic);

    const dynamicLinks = generateResourceLinks(topic);
    const textbooks = TEXTBOOK_DATABASE[subject] || TEXTBOOK_DATABASE.science;
    const tips = STUDY_TIPS[subject] || STUDY_TIPS.science;

    renderResourceResults(topic, subject, dynamicLinks, textbooks, tips);
}

function quickSearch(topic) {
    document.getElementById('resourceTopic').value = topic;
    findResources();
}

function renderResourceResults(topic, subject, links, textbooks, tips) {
    const container = document.getElementById('resourceResults');
    const subjectLabels = {
        math: '📐 Mathematics', science: '🔬 Science', history: '📜 History',
        language: '📝 Language', code: '💻 Programming', business: '💼 Business',
        art: '🎨 Art & Design', music: '🎵 Music', psychology: '🧠 Psychology'
    };
    const typeIcons = {
        video: '🎬', reference: '📖', academic: '🎓', flashcards: '🃏',
        interactive: '🖥️', textbook: '📘', tool: '🔧', community: '👥',
        course: '📺'
    };

    let html = `<div class="resources-result-card">`;
    html += `<div class="resource-result-header"><h3>Results for "${escapeHtml(topic)}"</h3><span class="resource-subject-badge">${subjectLabels[subject] || '📚 Study'}</span></div>`;

    // Dynamic links
    html += `<div class="resource-section"><h4><i class="fas fa-link"></i> Quick Links</h4><div class="resource-links-grid">`;
    links.forEach(l => {
        html += `<a href="${l.url}" target="_blank" rel="noopener" class="resource-link-card">
            <div class="resource-link-icon"><i class="${l.icon}"></i></div>
            <div class="resource-link-info"><strong>${escapeHtml(l.title)}</strong><small>${l.type}</small></div>
            <i class="fas fa-external-link-alt resource-ext-icon"></i>
        </a>`;
    });
    html += `</div></div>`;

    // Textbooks
    html += `<div class="resource-section"><h4><i class="fas fa-book"></i> Recommended Resources</h4><div class="textbook-list">`;
    textbooks.forEach(t => {
        const icon = typeIcons[t.type] || '📚';
        html += `<a href="${t.url}" target="_blank" rel="noopener" class="textbook-card">
            <div class="textbook-icon">${icon}</div>
            <div class="textbook-info"><strong>${escapeHtml(t.title)}</strong><span class="textbook-type">${t.type}</span></div>
            <button class="btn-small btn-save-resource" onclick="event.preventDefault();event.stopPropagation();saveResource('${escapeHtml(t.title).replace(/'/g, "\\'") }','${t.url}','${subject}')"><i class="fas fa-bookmark"></i></button>
        </a>`;
    });
    html += `</div></div>`;

    // Tips
    html += `<div class="resource-section"><h4><i class="fas fa-lightbulb"></i> Study Tips</h4><ul class="study-tips-list">`;
    tips.forEach(t => {
        html += `<li><i class="fas fa-check-circle"></i> ${escapeHtml(t)}</li>`;
    });
    html += `</ul></div>`;

    html += `</div>`;
    container.innerHTML = html;
}

function findResourcesForNote(noteId) {
    const note = getNotes().find(n => n.id === noteId);
    if (note) {
        goToResourcesTab();
        document.getElementById('resourceTopic').value = note.title !== 'Untitled' ? note.title : note.content.substring(0, 50);
        findResources();
    }
}

function populateQuickTopicsFromNotes() {
    const notes = getNotes();
    if (notes.length === 0) return;
    const container = document.getElementById('quickTopicChips');
    const existing = container.querySelectorAll('.topic-chip-note');
    existing.forEach(el => el.remove());

    notes.slice(0, 3).forEach(note => {
        const title = note.title !== 'Untitled' ? note.title : note.content.substring(0, 20);
        const btn = document.createElement('button');
        btn.className = 'topic-chip topic-chip-note';
        btn.textContent = title;
        btn.onclick = () => quickSearch(title);
        container.appendChild(btn);
    });
}

// ─── STUDY GUIDE GENERATOR ────────────────────────────────
function generateStudyGuide() {
    const topic = document.getElementById('guideTopicInput').value.trim();
    if (!topic) { showToast('Enter a topic first!'); return; }

    const subject = detectSubject(topic);
    const tips = STUDY_TIPS[subject] || STUDY_TIPS.science;

    const guide = `
📚 STUDY GUIDE: ${topic.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 OVERVIEW
Start by understanding what "${topic}" covers. Read through your textbook chapter or class notes to get the big picture before diving into details.

📖 STEP-BY-STEP PLAN
1. Read & Preview — Skim headings, summaries, and key terms
2. Active Reading — Take notes in your own words as you read
3. Summarize — Write a 1-paragraph summary of the key ideas
4. Practice — Do practice problems or answer review questions
5. Teach — Explain the concept aloud as if teaching someone
6. Review — Revisit weak areas and redo difficult problems

💡 SUBJECT-SPECIFIC TIPS
${tips.map(t => '• ' + t).join('\n')}

⏰ SUGGESTED SCHEDULE
• Day 1: Preview + Read (25 min focus session)
• Day 2: Notes + Summarize (25 min focus session)
• Day 3: Practice + Problems (2x 25 min sessions)
• Day 4: Teach + Review (25 min session)
• Day 5: Final Review + Self-Test

🔗 Use the Learn tab to find videos, textbooks, and practice resources for "${topic}".

Good luck! You've got this! 💪
    `.trim();

    const output = document.getElementById('studyGuideOutput');
    const guideHtml = escapeHtml(guide).replace(/\n/g, '<br>');
    output.innerHTML = `<div class="study-guide-card">
        <div class="guide-header"><h3>📚 Study Guide: ${escapeHtml(topic)}</h3><button class="btn-small" onclick="copyStudyGuide()"><i class="fas fa-copy"></i> Copy</button></div>
        <div class="guide-section study-guide-text">${guideHtml}</div>
    </div>`;
}

function copyStudyGuide() {
    const text = document.querySelector('.study-guide-text')?.textContent;
    if (text) {
        navigator.clipboard.writeText(text).then(() => showToast('Study guide copied! 📋'));
    }
}

// ─── SAVED RESOURCES ───────────────────────────────────────
function getSavedResources() {
    return JSON.parse(localStorage.getItem('sm_savedResources') || '[]');
}

function saveResource(title, url, subject) {
    const resources = getSavedResources();
    if (resources.find(r => r.url === url)) { showToast('Already saved!'); return; }
    resources.push({ title, url, subject, savedAt: new Date().toISOString() });
    localStorage.setItem('sm_savedResources', JSON.stringify(resources));
    renderSavedResources();
    showToast('Resource saved! 🔖');
}

function removeSavedResource(url) {
    const resources = getSavedResources().filter(r => r.url !== url);
    localStorage.setItem('sm_savedResources', JSON.stringify(resources));
    renderSavedResources();
}

function loadSavedResources() {
    renderSavedResources();
}

function renderSavedResources() {
    const resources = getSavedResources();
    const container = document.getElementById('savedResourcesList');
    document.getElementById('savedCount').textContent = resources.length;
    if (resources.length === 0) {
        container.innerHTML = '<p class="empty-state">No saved resources yet. Use the bookmark button to save!</p>';
        return;
    }
    container.innerHTML = resources.map(r => `
        <div class="saved-resource-item">
            <a href="${r.url}" target="_blank" rel="noopener">${escapeHtml(r.title)}</a>
            <button class="btn-small btn-danger" onclick="removeSavedResource('${r.url}')"><i class="fas fa-times"></i></button>
        </div>
    `).join('');
}

// ─── STUDY BUDDY CHAT AI ──────────────────────────────────
let buddyMemory = {
    name: null,
    mood: 'neutral',
    chatHistory: [],
    lastTopic: null
};

const BUDDY_RESPONSES = {
    greetings: {
        patterns: [/^(hi|hello|hey|sup|yo|what's up|howdy|hola|greetings)/i],
        responses: [
            "Hey there! 👋 How's it going? Ready to study or just wanna chat?",
            "Hello! 😊 Great to see you! What are you up to today?",
            "Hey hey! 🌟 How's your day been so far?",
            "Hi! 👋 I'm here for you. What's on your mind?"
        ],
        responses_named: [
            "Hey {name}! 👋 How's it going? Ready to study or just wanna chat?",
            "Hello {name}! 😊 Great to see you! What are you up to today?",
            "Hey hey {name}! 🌟 How's your day been so far?",
            "{name}! 👋 Good to see you! What's on your mind?"
        ]
    },
    name_tell: {
        patterns: [/my name is (.+)/i, /i'm (.+)/i, /call me (.+)/i, /i am (.+)/i],
        responses: [
            "Nice to meet you, {name}! 😊 I'll remember that. How can I help you today?",
            "Hey {name}! 🎉 Love that name! What are you studying lately?",
            "{name}! Great name! 🌟 I'm your study buddy and I'm here to help you succeed!"
        ]
    },
    name_ask: {
        patterns: [/what('s| is) my name/i, /do you (know|remember) my name/i, /who am i/i],
        responses_known: [
            "You're {name}! 😊 How could I forget?",
            "Of course I remember — you're {name}! 🌟"
        ],
        responses_unknown: [
            "Hmm, I don't think you've told me yet! What's your name? 😊",
            "I'm not sure — want to tell me your name?"
        ]
    },
    feelings_good: {
        patterns: [/i('m| am) (good|great|fine|amazing|awesome|happy|fantastic|wonderful|excellent)/i, /(feeling|doing) (good|great|well|fine|amazing)/i],
        responses: [
            "That's awesome to hear! 🎉 A positive mindset makes studying so much easier!",
            "Glad you're feeling great! 😊 Let's channel that energy into something productive!",
            "Love the positivity! 🌟 You're in a great place to learn and grow!"
        ]
    },
    feelings_bad: {
        patterns: [/i('m| am) (sad|bad|terrible|stressed|anxious|depressed|upset|angry|frustrated|tired|exhausted|overwhelmed)/i, /(feeling|doing) (bad|terrible|awful|stressed|tired)/i],
        responses: [
            "I'm sorry to hear that 💙 Remember, it's okay to not be okay. Take a deep breath and be gentle with yourself.",
            "That sounds tough 💛 Take a little break if you need to. Your well-being comes first!",
            "Hey, everyone has hard days 🌈 Would a short walk or some deep breaths help? I'm here for you.",
            "Sending you good vibes 💜 Remember you're doing better than you think. One step at a time!"
        ]
    },
    studying: {
        patterns: [/i('m| am) studying (.+)/i, /studying (.+)/i, /working on (.+)/i, /learning (.+)/i],
        responses: [
            "That's great! 📚 {topic} is a really interesting subject. Need any resources? Check out the Learn tab!",
            "Nice! 🎯 {topic} — keep it up! If you need study materials, head over to the Learn tab!",
            "Awesome! 💪 Working on {topic}? The Learn tab has tons of free resources that could help!"
        ]
    },
    age: {
        patterns: [/how old are you/i, /what('s| is) your age/i, /your age/i],
        responses: [
            "I'm ageless! 😄 I exist in the digital realm — no birthdays here, just endless study help!",
            "Age is just a number, and mine is... undefined! 🤖 But I'm always ready to help you study!"
        ]
    },
    likes: {
        patterns: [/what do you like/i, /your (hobbies|interests|favorites)/i, /what are you into/i],
        responses: [
            "I love helping students succeed! 📚 Seeing you learn and grow is my favorite thing!",
            "My hobbies? Motivating awesome people like you! 🌟 And I'm really into study tips and productivity hacks!"
        ]
    },
    farewell: {
        patterns: [/^(bye|goodbye|see you|later|gotta go|cya|peace out|goodnight|good night)/i],
        responses: [
            "Bye! 👋 You're doing amazing — keep it up! Come back anytime!",
            "See you later! 🌟 Remember, every study session counts. You've got this!",
            "Take care! 💪 I'll be here whenever you need me. Go crush it!",
            "Bye bye! 😊 Rest up and come back ready to learn!"
        ],
        responses_named: [
            "Bye {name}! 👋 You're doing amazing — keep it up! Come back anytime!",
            "See you later {name}! 🌟 Remember, every study session counts. You've got this!",
            "Take care {name}! 💪 I'll be here whenever you need me. Go crush it!",
            "Bye bye {name}! 😊 Rest up and come back ready to learn!"
        ]
    },
    motivation: {
        patterns: [/motivat(e|ion)/i, /inspire me/i, /i need encouragement/i, /cheer me up/i, /pump me up/i],
        responses: [
            "🔥 You are capable of AMAZING things! Every minute you study is an investment in your future. Don't stop now!",
            "💪 Remember why you started. You're stronger than any challenge that comes your way!",
            "🌟 The hard work you put in today will pay off tomorrow. Believe in yourself — I believe in you!",
            "⚡ Champions aren't born — they're made through dedication and hard work. And you're on that path right now!",
            "🎯 Progress, not perfection. Every small step forward counts. You're doing incredible!"
        ]
    },
    stress: {
        patterns: [/i('m| am) stressed/i, /so stressed/i, /stress/i, /can't handle/i, /too much/i, /overwhelmed/i],
        responses: [
            "Hey, take a deep breath 🌊 In... and out... You're handling more than you realize, and that's impressive.",
            "I hear you 💙 Try breaking your work into tiny pieces. One thing at a time. You can do this!",
            "Stress means you care, and that's a good thing! 🌟 But also take care of yourself. Maybe a 5-minute break?",
            "Remember: you don't have to do everything at once 💛 Start with the easiest task and build momentum!"
        ]
    },
    tired: {
        patterns: [/i('m| am) tired/i, /so tired/i, /exhausted/i, /sleepy/i, /no energy/i, /burnt out/i, /burnout/i],
        responses: [
            "Rest is important for learning! 😴 Your brain needs sleep to consolidate all that knowledge. Take a power nap!",
            "Being tired is your body saying it needs a break 💤 Even 15 minutes of rest can make a huge difference!",
            "Hey, even superheroes need rest! 🦸 Take care of yourself first. The books will be there when you're refreshed!"
        ]
    },
    procrastination: {
        patterns: [/procrastinat/i, /can't focus/i, /distracted/i, /can't start/i, /don't feel like/i, /lazy/i, /putting off/i],
        responses: [
            "The hardest part is starting! 🚀 Try this: commit to just 5 minutes. Once you begin, you'll often keep going!",
            "Try the 2-minute rule — if something takes less than 2 minutes, do it NOW ⚡ Build that momentum!",
            "Here's a trick: set a timer for just 10 minutes ⏰ Tell yourself you only have to study until it rings. You'll surprise yourself!",
            "Everyone procrastinates sometimes! 😊 The key is to start small. Open that textbook to any page and read one paragraph."
        ]
    },
    confusion: {
        patterns: [/i don't understand/i, /confused/i, /this is hard/i, /too difficult/i, /makes no sense/i, /don't get it/i, /stuck/i],
        responses: [
            "That's totally normal! 💡 Try explaining the problem in your own words — it helps break it down.",
            "Being confused means you're learning! 🧠 Head to the Learn tab and search for your topic — there are great video explanations!",
            "Don't worry! 😊 Every expert was once confused too. Try the Learn tab for videos and guides on the topic!",
            "Feeling stuck is part of the process! 🌟 Take a short break, then come back with fresh eyes. The Learn tab has helpful resources!"
        ]
    },
    exams: {
        patterns: [/exam/i, /test/i, /quiz coming/i, /finals/i, /midterm/i, /assessment/i],
        responses: [
            "Exam time! 📝 Here's the plan: review your notes, do practice questions, and get plenty of sleep the night before!",
            "You've been preparing for this! 💪 Trust your studying. Check the Learn tab for quick review resources!",
            "Pro tip for exams: start with questions you know, then tackle harder ones 🎯 This builds confidence!",
            "Test anxiety is normal! 🌊 Deep breaths, positive self-talk, and remember — you know more than you think!"
        ]
    },
    tips: {
        patterns: [/study tip/i, /advice/i, /how to study/i, /study better/i, /tips/i, /help me study/i, /study method/i],
        responses: [
            "Here's a great tip! 📚 Use the Pomodoro technique: 25 minutes of focus, then a 5-minute break. Our Timer tab is perfect for this!",
            "Try active recall! 🧠 Instead of just reading, close your notes and try to remember what you read. It's super effective!",
            "Spaced repetition works wonders! 📅 Review material at increasing intervals — today, tomorrow, then in 3 days, then a week.",
            "Teach what you learn! 🗣️ Explaining concepts to someone else (or even a rubber duck!) helps you understand deeply.",
            "Mix up your study topics! 🔄 Interleaving different subjects in one session can improve long-term retention."
        ]
    },
    reminders: {
        patterns: [/remind me/i, /reminder/i, /don't forget/i, /remember to/i],
        responses: [
            "I wish I could set alarms for you! ⏰ For now, try adding it to your Tasks — they'll help you stay organized! 📋",
            "Great idea to stay on top of things! 📝 Add it to your task list so you don't forget. I'll cheer you on!",
            "Use the Tasks tab to keep track of everything! ✅ That's what it's there for!"
        ]
    },
    praise: {
        patterns: [/you're (great|awesome|amazing|the best|cool|helpful|nice)/i, /thank you/i, /thanks/i, /love you/i, /appreciate/i, /you rock/i],
        responses: [
            "Aww, that means so much! 💜 You're pretty awesome yourself! Keep being amazing!",
            "Thank YOU for being such a dedicated learner! 🌟 I'm here for you anytime!",
            "You're making my day! 😊 Remember, your hard work is what makes the difference. I'm just here to help!",
            "Right back at you! 💪 You're the real star here — keep up the incredible work!"
        ]
    },
    about_app: {
        patterns: [/what (can|do) you do/i, /about (this|the) app/i, /what is (this|studymate)/i, /your features/i, /help me with/i, /what are you/i],
        responses: [
            "I'm your Study Buddy! 🤖 Here's what StudyMate offers:\n\n⏰ **Timer** — Pomodoro sessions to keep you focused\n📋 **Tasks** — Track your to-do list\n📝 **Notes** — Save and organize study notes\n📚 **Learn** — Find videos, textbooks, and study guides\n📊 **Stats** — Track your progress and earn achievements\n💬 **Me!** — I'm here to motivate & chat with you!\n\nTry clicking the different tabs to explore!",
            "StudyMate is your all-in-one study companion! 🌟 Use the Timer for focused sessions, Tasks to stay organized, Notes for your thoughts, Learn for study resources, and Stats to track your progress. And I'm here to keep you company! 😊"
        ]
    },
    subject_question: {
        patterns: [/what is (.+)/i, /explain (.+)/i, /how does (.+) work/i, /tell me about (.+)/i, /teach me (.+)/i, /define (.+)/i, /meaning of (.+)/i],
        responses: [
            "Great question! 🤔 I'm more of a motivational buddy than a teacher, but the Learn tab is PERFECT for this! Head there, search for your topic, and you'll find videos, guides, and more! 📚",
            "Ooh, interesting topic! 💡 I'd love to help explain, but the Learn tab has way better resources — YouTube videos, textbooks, and study guides! Click the Learn tab and search for it! 🎓",
            "That's a great thing to explore! 🌟 Head to the Learn tab and type in your topic — you'll get instant study links, tips, and textbook recommendations!"
        ]
    }
};

// Personalize a response by sometimes adding the user's name
function personalize(response) {
    const name = buddyMemory.name;
    if (!name) return response;
    // ~60% chance to include name in the response
    if (Math.random() > 0.6) return response;
    // Don't double-add if name is already there
    if (response.includes(name)) return response;
    // Pick a natural way to weave the name in
    const styles = [
        () => response.replace(/^(Hey|Hi|Hello|Aww|That's|Glad|Love|I'm sorry|I hear you|Remember|Being|Rest|The hardest|Try|Here's|Exam|You've|Pro tip|Stress|Everyone)/,
            (match) => `${match}, ${name},`),
        () => `${name}, ${response.charAt(0).toLowerCase()}${response.slice(1)}`,
        () => response.replace('! ', `! ${name}, `),
        () => response.replace('you!', `you, ${name}!`),
    ];
    const style = styles[Math.floor(Math.random() * styles.length)];
    const result = style();
    // If personalization produced something weird, just prepend name
    if (result === response) return `Hey ${name}! ${response}`;
    return result;
}

function getBuddyResponse(message) {
    const msg = message.trim();

    // Check for name telling
    for (const pattern of BUDDY_RESPONSES.name_tell.patterns) {
        const match = msg.match(pattern);
        if (match) {
            let name = match[1].trim();
            // Clean up common prefixes
            name = name.replace(/^(just |actually |really )/i, '').trim();
            // Remove trailing punctuation
            name = name.replace(/[.!?]+$/, '').trim();
            if (name.length > 0 && name.length < 30) {
                buddyMemory.name = name;
                localStorage.setItem('sm_buddyName', name);
                const responses = BUDDY_RESPONSES.name_tell.responses;
                return responses[Math.floor(Math.random() * responses.length)].replace('{name}', name);
            }
        }
    }

    // Check for name asking
    for (const pattern of BUDDY_RESPONSES.name_ask.patterns) {
        if (pattern.test(msg)) {
            if (buddyMemory.name) {
                const responses = BUDDY_RESPONSES.name_ask.responses_known;
                return responses[Math.floor(Math.random() * responses.length)].replace('{name}', buddyMemory.name);
            } else {
                const responses = BUDDY_RESPONSES.name_ask.responses_unknown;
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }
    }

    // Check studying topic
    for (const pattern of BUDDY_RESPONSES.studying.patterns) {
        const match = msg.match(pattern);
        if (match) {
            const topic = match[match.length - 1].trim();
            buddyMemory.lastTopic = topic;
            const responses = BUDDY_RESPONSES.studying.responses;
            let reply = responses[Math.floor(Math.random() * responses.length)].replace('{topic}', topic);
            return personalize(reply);
        }
    }

    // Check all other categories (except subject_question which is fallback)
    const checkOrder = ['greetings', 'farewell', 'feelings_good', 'feelings_bad', 'motivation', 'stress', 'tired', 'procrastination', 'confusion', 'exams', 'tips', 'reminders', 'praise', 'about_app', 'age', 'likes'];

    for (const category of checkOrder) {
        const data = BUDDY_RESPONSES[category];
        if (!data || !data.patterns) continue;
        for (const pattern of data.patterns) {
            if (pattern.test(msg)) {
                // Use named responses if available and name is known
                const useNamed = buddyMemory.name && data.responses_named;
                const pool = useNamed ? data.responses_named : data.responses;
                let reply = pool[Math.floor(Math.random() * pool.length)];
                if (buddyMemory.name) reply = reply.replace(/\{name\}/g, buddyMemory.name);
                return useNamed ? reply : personalize(reply);
            }
        }
    }

    // Check if it looks like a subject question
    for (const pattern of BUDDY_RESPONSES.subject_question.patterns) {
        if (pattern.test(msg)) {
            const responses = BUDDY_RESPONSES.subject_question.responses;
            let reply = responses[Math.floor(Math.random() * responses.length)];
            return personalize(reply);
        }
    }

    // Default — friendly "I don't understand" responses
    const name = buddyMemory.name;
    const defaults = name ? [
        `Hmm ${name}, I'm not quite sure what you mean! 😅 But I'm here to chat, motivate you, or help you study. What would you like?`,
        `That's interesting, ${name}! 🤔 I might not have the answer, but try the Learn tab for study resources or ask me for motivation!`,
        `I didn't quite catch that, ${name}! 😊 I'm great at giving motivation, study tips, and pointing you to learning resources!`,
        `Hmm, I'm still learning, ${name}! 🌱 I can help with motivation, study tips, or point you to the Learn tab for any topic!`,
        `Hey ${name}, I'm not sure about that one! 💭 But I can give you study tips, motivation, or help you find resources in the Learn tab!`
    ] : [
        "Hmm, I'm not quite sure what you mean! 😅 But I'm here to chat, motivate you, or help you study. What would you like?",
        "That's interesting! 🤔 I might not have the answer, but try the Learn tab for study resources or ask me for motivation!",
        "I didn't quite catch that! 😊 I'm great at giving motivation, study tips, and pointing you to learning resources. Try asking me something like that!",
        "Hmm, I'm still learning! 🌱 I can help with motivation, study tips, or I can point you to the Learn tab for any topic!",
        "I'm not sure about that! 💭 But ask me for study tips, motivation, or head to the Learn tab for any subject help!"
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
}

// ─── BUDDY QUICK ACTIONS ──────────────────────────────────
function buddyQuickAction(action) {
    const actions = {
        motivate: "Give me some motivation!",
        tip: "Give me a study tip",
        remind: "Remind me to stay focused",
        stressed: "I'm feeling stressed",
        about: "What can you do?"
    };
    const msg = actions[action];
    if (msg) {
        addBuddyMessage(msg, 'user');
        setTimeout(() => {
            const reply = getBuddyResponse(msg);
            addBuddyMessage(reply, 'bot');
        }, 500 + Math.random() * 500);
    }
}

// ─── CHAT UI ───────────────────────────────────────────────
function initBuddy() {
    // Load memory
    buddyMemory.name = localStorage.getItem('sm_buddyName') || null;
    const savedChat = localStorage.getItem('sm_buddyChat');
    if (savedChat) {
        try {
            const messages = JSON.parse(savedChat);
            const chatBody = document.getElementById('buddyChatBody');
            messages.forEach(m => {
                const div = document.createElement('div');
                div.className = `buddy-msg ${m.role}`;
                div.innerHTML = m.html;
                chatBody.appendChild(div);
            });
            scrollBuddyChat();
        } catch (e) {}
    } else {
        // Welcome message
        const greeting = buddyMemory.name
            ? `Hey ${buddyMemory.name}! 👋 Welcome back! How's it going today?`
            : "Hey there! 👋 I'm your Study Buddy! I'm here to keep you motivated and help you stay on track. What's your name?";
        addBuddyMessage(greeting, 'bot');
    }

    // Study reminders
    setInterval(() => {
        const chat = document.getElementById('buddyChat');
        if (chat && chat.classList.contains('open')) {
            const reminders = [
                "Just checking in! 👀 How's your studying going?",
                "Remember to stay hydrated! 💧 Drink some water!",
                "Quick stretch break? 🤸 Your body will thank you!",
                "You're doing great! 🌟 Keep up the awesome work!",
                buddyMemory.name ? `Hey ${buddyMemory.name}, you're doing amazing! 💪` : "Keep pushing! You've got this! 💪"
            ];
            const reminder = reminders[Math.floor(Math.random() * reminders.length)];
            addBuddyMessage(reminder, 'bot');
        }
    }, 15 * 60 * 1000); // Every 15 minutes
}

function toggleBuddyChat() {
    const chat = document.getElementById('buddyChat');
    const fab = document.getElementById('buddyFab');
    chat.classList.toggle('open');
    fab.classList.toggle('active');
    if (chat.classList.contains('open')) {
        scrollBuddyChat();
        document.getElementById('buddyInput').focus();
    }
}

function sendBuddyMessage() {
    const input = document.getElementById('buddyInput');
    const text = input.value.trim();
    if (!text) return;

    addBuddyMessage(text, 'user');
    input.value = '';
    input.style.height = 'auto';

    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'buddy-msg bot typing-indicator';
    typingDiv.innerHTML = `
        <div class="buddy-msg-bubble">
            <div class="buddy-msg-avatar">🤖</div>
            <div class="buddy-typing-dots"><span></span><span></span><span></span></div>
        </div>`;
    document.getElementById('buddyChatBody').appendChild(typingDiv);
    scrollBuddyChat();

    setTimeout(() => {
        typingDiv.remove();
        const reply = getBuddyResponse(text);
        addBuddyMessage(reply, 'bot');
    }, 600 + Math.random() * 800);
}

function addBuddyMessage(text, role) {
    const chatBody = document.getElementById('buddyChatBody');
    const div = document.createElement('div');
    div.className = `buddy-msg ${role}`;

    // Simple markdown-like formatting
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatar = role === 'bot' ? '🤖' : '🧑';

    div.innerHTML = `
        <div class="buddy-msg-bubble">
            <div class="buddy-msg-avatar">${avatar}</div>
            <div class="buddy-msg-text">${html}</div>
        </div>
        <div class="buddy-msg-time">${timeStr}</div>
    `;
    chatBody.appendChild(div);
    scrollBuddyChat();
    saveBuddyChatHistory();
}

function scrollBuddyChat() {
    const body = document.getElementById('buddyChatBody');
    if (body) body.scrollTop = body.scrollHeight;
}

function saveBuddyChatHistory() {
    const chatBody = document.getElementById('buddyChatBody');
    const messages = [];
    chatBody.querySelectorAll('.buddy-msg').forEach(el => {
        if (!el.classList.contains('typing-indicator')) {
            messages.push({
                role: el.classList.contains('user') ? 'user' : 'bot',
                html: el.innerHTML
            });
        }
    });
    // Keep only last 50 messages
    const toSave = messages.slice(-50);
    localStorage.setItem('sm_buddyChat', JSON.stringify(toSave));
}

// ─── PANEL HELPERS ─────────────────────────────────────────
function handleGPTKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendBuddyMessage();
    }
}

function gptAutoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function toggleGPTExpand() {
    const panel = document.getElementById('buddyChat');
    panel.classList.toggle('expanded');
    const icon = document.getElementById('gptExpandIcon');
    icon.className = panel.classList.contains('expanded') ? 'fas fa-compress-alt' : 'fas fa-expand-alt';
}

function clearBuddyChat() {
    document.getElementById('buddyChatBody').innerHTML = '';
    localStorage.removeItem('sm_buddyChat');
    const greeting = buddyMemory.name
        ? `Chat cleared! Hey ${buddyMemory.name}, fresh start! 😊 What's up?`
        : "Chat cleared! Fresh start! 😊 How can I help you?";
    addBuddyMessage(greeting, 'bot');
}

// ─── KNOWLEDGE GRAPH ───────────────────────────────────────
function getKnowledgeData() {
    const notes = getNotes();
    const stats = getStats();
    const categories = {};

    notes.forEach(note => {
        const cat = note.category || 'general';
        if (!categories[cat]) categories[cat] = { count: 0, titles: [] };
        categories[cat].count++;
        categories[cat].titles.push(note.title);
    });

    const nodes = [];
    const categoryLabels = {
        general: 'General', math: 'Math', science: 'Science',
        language: 'Language', history: 'History', code: 'Programming'
    };

    for (const [cat, data] of Object.entries(categories)) {
        let level = 'unexplored';
        if (data.count >= 5) level = 'mastered';
        else if (data.count >= 3) level = 'learning';
        else if (data.count >= 1) level = 'weak';
        nodes.push({ label: categoryLabels[cat] || cat, level, count: data.count });
    }

    // Add empty categories
    for (const [cat, label] of Object.entries(categoryLabels)) {
        if (!categories[cat]) {
            nodes.push({ label, level: 'unexplored', count: 0 });
        }
    }

    return nodes;
}

function renderKnowledgeGraph() {
    const container = document.getElementById('knowledgeGraph');
    if (!container) return;
    const nodes = getKnowledgeData();
    container.innerHTML = '';

    if (nodes.length === 0) {
        container.innerHTML = '<p class="empty-state">Add notes to see your knowledge graph!</p>';
        return;
    }

    nodes.forEach(node => {
        const el = document.createElement('div');
        el.className = `kg-node ${node.level}`;
        el.innerHTML = `<span class="kg-node-label">${node.label}</span><span class="kg-node-count">${node.count} notes</span>`;
        container.appendChild(el);
    });
}

// ─── WEAKNESS HEATMAP ──────────────────────────────────────
function renderWeaknessHeatmap() {
    const container = document.getElementById('weaknessHeatmap');
    if (!container) return;
    const notes = getNotes();
    container.innerHTML = '';

    const subjects = ['Math', 'Science', 'Language', 'History', 'Programming', 'General'];
    const subjectMap = { math: 'Math', science: 'Science', language: 'Language', history: 'History', code: 'Programming', general: 'General' };

    const counts = {};
    subjects.forEach(s => counts[s] = 0);
    notes.forEach(n => {
        const label = subjectMap[n.category] || 'General';
        counts[label] = (counts[label] || 0) + 1;
    });

    const max = Math.max(...Object.values(counts), 1);

    subjects.forEach(subj => {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        const intensity = counts[subj] / max;
        // More notes = more green (stronger), fewer = more red (weaker)
        if (counts[subj] === 0) {
            cell.style.background = '#ff6b6b44';
            cell.style.borderColor = '#ff6b6b';
        } else if (intensity < 0.3) {
            cell.style.background = '#ffd93d44';
            cell.style.borderColor = '#ffd93d';
        } else if (intensity < 0.6) {
            cell.style.background = '#4d96ff44';
            cell.style.borderColor = '#4d96ff';
        } else {
            cell.style.background = '#6bcb7744';
            cell.style.borderColor = '#6bcb77';
        }
        cell.innerHTML = `<span class="heatmap-label">${subj}</span><span class="heatmap-value">${counts[subj]}</span>`;
        container.appendChild(cell);
    });
}

// ─── RELATED TOPICS STUB ───────────────────────────────────
function getRelatedTopics() {
    return [];
}
