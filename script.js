// script.js

// App State
const state = {
    currentUser: null,
    currentTool: 'pen',
    currentColor: '#000000',
    brushSize: 3,
    isDrawing: false,
    isMuted: false,
    isVideoOff: false,
    whiteboardVisible: false,
    chatVisible: false,
    xp: 650,
    level: 5,
    streak: 7
};

// DOM Elements
const screens = {
    splash: document.getElementById('splash-screen'),
    auth: document.getElementById('auth-screen'),
    main: document.getElementById('main-screen'),
    call: document.getElementById('call-screen') // NEW: Added call screen
};

const views = {
    dashboard: document.getElementById('dashboard-view'),
    tutors: document.getElementById('tutors-view'),
    whiteboard: document.getElementById('whiteboard-view'),
    // videoCall removed from views - now it's a separate screen
    quests: document.getElementById('quests-view'),
    profile: document.getElementById('profile-view')
};

// Canvas Setup
let canvas, ctx, callCanvas, callCtx;
let lastX = 0;
let lastY = 0;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    setupCanvas();
    updateTimeGreeting();
    setupProfileListeners();
});

function initializeApp() {
    // Simulate loading
    setTimeout(() => {
        screens.splash.classList.remove('active');
        screens.auth.classList.add('active');
    }, 2500);
}

function setupEventListeners() {
    // Auth Tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetTab = e.target.dataset.tab;
            switchAuthTab(targetTab);
        });
    });

    // Role Selection
    document.querySelectorAll('.role-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.role-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            option.querySelector('input').checked = true;
        });
    });

    // Auth Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Bottom Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Subject Chips
    document.querySelectorAll('.subject-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.subject-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });

    // Canvas Events
    setupCanvasEvents();

    // Chat Input
    const chatInput = document.getElementById('chat-input-field');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
}

function handleLogin(e) {
    e.preventDefault();
    // Simulate login
    const email = e.target.querySelector('input[type="email"]').value;
    
    state.currentUser = {
        name: 'Alex Johnson',
        email: email,
        role: 'learner'
    };
    
    showToast('Welcome back, Alex!');
    setTimeout(() => {
        screens.auth.classList.remove('active');
        screens.main.classList.add('active');
        gainXP(50); // Login bonus
    }, 1000);
}

function handleRegister(e) {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const role = e.target.querySelector('input[name="role"]:checked').value;
    
    state.currentUser = {
        name: name,
        email: e.target.querySelector('input[type="email"]').value,
        role: role
    };
    
    showToast('Account created successfully!');
    setTimeout(() => {
        screens.auth.classList.remove('active');
        screens.main.classList.add('active');
        gainXP(100); // Registration bonus
    }, 1000);
}

// ==========================================
// SCREEN MANAGEMENT - NEW FUNCTIONS
// ==========================================

// Show a screen (splash, auth, main, call)
function showScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    
    // Show target screen
    const targetScreen = screens[screenName];
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

// View Management - FIXED WITH SCROLL TO TOP
function showView(viewName) {
    // Only works within main-screen
    if (!screens.main.classList.contains('active')) {
        return;
    }
    
    // Scroll to top of main content area FIRST
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Also scroll window to top as backup
    window.scrollTo(0, 0);
    
    // Hide all views
    Object.values(views).forEach(view => {
        if (view) view.classList.remove('active');
    });
    
    // Show selected view
    if (views[viewName]) {
        views[viewName].classList.add('active');
    }
    
    // Update navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item, index) => {
        item.classList.remove('active');
        const viewMap = ['dashboard', 'tutors', 'whiteboard', 'quests', 'profile'];
        if (viewMap[index] === viewName) {
            item.classList.add('active');
        }
    });
    
    // Special handling for specific views
    if (viewName === 'whiteboard') {
        setTimeout(resizeCanvas, 100);
    }
    
    if (viewName === 'profile') {
        animateProfileStats();
    }
}

// ==========================================
// CANVAS FUNCTIONS
// ==========================================

function setupCanvas() {
    canvas = document.getElementById('whiteboard-canvas');
    ctx = canvas.getContext('2d');
    
    callCanvas = document.getElementById('call-canvas');
    if (callCanvas) {
        callCtx = callCanvas.getContext('2d');
    }
    
    // Set initial canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    if (!canvas) return;
    
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Set default styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = state.currentColor;
    ctx.lineWidth = state.brushSize;
    
    if (callCanvas && callCanvas.parentElement) {
        const callContainer = callCanvas.parentElement;
        callCanvas.width = callContainer.clientWidth;
        callCanvas.height = callContainer.clientHeight;
        callCtx.lineCap = 'round';
        callCtx.lineJoin = 'round';
    }
}

function setupCanvasEvents() {
    if (!canvas) return;
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Prevent scrolling when drawing
    canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}

function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function startDrawing(e) {
    state.isDrawing = true;
    const coords = getCoordinates(e);
    lastX = coords.x;
    lastY = coords.y;
    
    // Draw a single dot if it's just a click
    draw(e);
}

function draw(e) {
    if (!state.isDrawing) return;
    
    const coords = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    lastX = coords.x;
    lastY = coords.y;
    
    // Also draw on call whiteboard if visible
    if (state.whiteboardVisible && callCtx) {
        callCtx.beginPath();
        callCtx.moveTo(lastX, lastY);
        callCtx.lineTo(coords.x, coords.y);
        callCtx.strokeStyle = state.currentColor;
        callCtx.lineWidth = state.brushSize;
        callCtx.stroke();
    }
}

function stopDrawing() {
    state.isDrawing = false;
    ctx.beginPath(); // Reset path
}

function selectTool(tool) {
    state.currentTool = tool;
    
    // Update UI
    document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tool[data-tool="${tool}"]`).classList.add('active');
    
    // Set cursor and mode
    if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        if (callCtx) callCtx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        if (callCtx) callCtx.globalCompositeOperation = 'source-over';
    }
}

function selectColor(color) {
    state.currentColor = color;
    ctx.strokeStyle = color;
    
    // Update UI
    document.querySelectorAll('.color').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
}

function updateBrushSize(size) {
    state.brushSize = size;
    ctx.lineWidth = size;
}

function clearWhiteboard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    showToast('Whiteboard cleared!');
    gainXP(30); // Quest progress
}

// ==========================================
// VIDEO CALL FUNCTIONS - UPDATED
// ==========================================

function joinSession() {
    // Use showScreen instead of showView
    showScreen('call');
    resetCallState();
    showToast('Joining session...');
    
    // Simulate connection delay
    setTimeout(() => {
        const indicator = document.querySelector('#call-screen .connecting-indicator');
        if (indicator) indicator.style.display = 'none';
        showToast('Connected to Dr. Sarah Chen');
    }, 2000);
}

function resetCallState() {
    state.isMuted = false;
    state.isVideoOff = false;
    state.whiteboardVisible = false;
    state.chatVisible = false;
    
    // Reset UI elements
    const chatPanel = document.getElementById('chat-panel');
    const localVideo = document.querySelector('#call-screen .local-video');
    const callWhiteboard = document.getElementById('call-whiteboard');
    const indicator = document.querySelector('#call-screen .connecting-indicator');
    
    if (chatPanel) chatPanel.classList.add('hidden');
    if (localVideo) {
        localVideo.style.bottom = '100px';
        localVideo.style.zIndex = '10';
    }
    if (callWhiteboard) callWhiteboard.classList.add('hidden');
    if (indicator) indicator.style.display = 'flex';
    
    // Reset buttons
    document.querySelectorAll('#call-screen .call-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

function toggleMute() {
    state.isMuted = !state.isMuted;
    const btn = document.querySelector('#call-screen .call-btn.mute');
    if (btn) {
        btn.classList.toggle('active', state.isMuted);
        btn.innerHTML = state.isMuted ? '<i class="fas fa-microphone-slash"></i>' : '<i class="fas fa-microphone"></i>';
    }
    showToast(state.isMuted ? 'Microphone muted' : 'Microphone unmuted');
}

function toggleVideo() {
    state.isVideoOff = !state.isVideoOff;
    const btn = document.querySelector('#call-screen .call-btn.video');
    if (btn) {
        btn.classList.toggle('active', state.isVideoOff);
        btn.innerHTML = state.isVideoOff ? '<i class="fas fa-video-slash"></i>' : '<i class="fas fa-video"></i>';
    }
    showToast(state.isVideoOff ? 'Camera turned off' : 'Camera turned on');
}

function toggleCallWhiteboard() {
    state.whiteboardVisible = !state.whiteboardVisible;
    const whiteboard = document.getElementById('call-whiteboard');
    const btn = document.querySelector('#call-screen .call-btn.whiteboard');
    
    if (state.whiteboardVisible) {
        if (whiteboard) whiteboard.classList.remove('hidden');
        if (btn) btn.classList.add('active');
        showToast('Whiteboard enabled');
        
        // Initialize call canvas
        if (callCanvas) {
            const container = callCanvas.parentElement;
            if (container) {
                callCanvas.width = container.clientWidth;
                callCanvas.height = container.clientHeight;
            }
            callCtx.lineCap = 'round';
            callCtx.lineJoin = 'round';
            callCtx.strokeStyle = state.currentColor;
            callCtx.lineWidth = state.brushSize;
            
            // Add drawing events to call canvas
            callCanvas.addEventListener('mousedown', (e) => {
                const rect = callCanvas.getBoundingClientRect();
                callCtx.beginPath();
                callCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                
                function drawOnCall(e) {
                    callCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                    callCtx.stroke();
                }
                
                function stopDrawOnCall() {
                    callCanvas.removeEventListener('mousemove', drawOnCall);
                    callCanvas.removeEventListener('mouseup', stopDrawOnCall);
                }
                
                callCanvas.addEventListener('mousemove', drawOnCall);
                callCanvas.addEventListener('mouseup', stopDrawOnCall);
            });
        }
    } else {
        if (whiteboard) whiteboard.classList.add('hidden');
        if (btn) btn.classList.remove('active');
    }
}

function toggleChat() {
    state.chatVisible = !state.chatVisible;
    const chatPanel = document.getElementById('chat-panel');
    const localVideo = document.querySelector('#call-screen .local-video');
    
    if (state.chatVisible) {
        if (chatPanel) chatPanel.classList.remove('hidden');
        if (localVideo) localVideo.style.bottom = '420px';
    } else {
        if (chatPanel) chatPanel.classList.add('hidden');
        if (localVideo) localVideo.style.bottom = '100px';
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input-field');
    const message = input.value.trim();
    
    if (!message) return;
    
    const chatMessages = document.getElementById('chat-messages');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageHTML = `
        <div class="message sent">
            <div class="message-content">
                <p>${escapeHtml(message)}</p>
                <span class="time">${time}</span>
            </div>
        </div>
    `;
    
    chatMessages.insertAdjacentHTML('beforeend', messageHTML);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    input.value = '';
    
    // Simulate tutor reply
    setTimeout(() => {
        const replies = [
            "Great question! Let me explain that.",
            "Exactly! You're getting it.",
            "That's correct! Well done.",
            "Let's work through this together."
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        const replyHTML = `
            <div class="message received">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Tutor">
                <div class="message-content">
                    <p>${randomReply}</p>
                    <span class="time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', replyHTML);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1500);
}

function endCall() {
    if (confirm('End this session? You will earn XP for completed time.')) {
        // Return to main screen and dashboard
        showScreen('main');
        showView('dashboard');
        gainXP(100); // Session completion bonus
        showToast('Session ended. +100 XP earned!');
        
        // Reset call state
        resetCallState();
    }
}

function startBooking() {
    showToast('Booking session...');
    setTimeout(() => {
        showToast('Session booked! Check your schedule.');
        gainXP(25);
    }, 1500);
}

// ==========================================
// GAMIFICATION FUNCTIONS
// ==========================================

function gainXP(amount) {
    state.xp += amount;
    
    // Show XP popup
    const popup = document.getElementById('xp-popup');
    if (popup) {
        popup.querySelector('span').textContent = `+${amount} XP`;
        popup.classList.add('show');
        
        setTimeout(() => {
            popup.classList.remove('show');
        }, 1500);
    }
    
    // Update XP bar
    const maxXP = 1000;
    const progress = (state.xp / maxXP) * 100;
    const xpProgress = document.querySelector('.xp-progress');
    const xpText = document.querySelector('.xp-text');
    
    if (xpProgress) xpProgress.style.width = `${Math.min(progress, 100)}%`;
    if (xpText) xpText.textContent = `${state.xp}/${maxXP} XP`;
    
    // Check for level up
    if (state.xp >= maxXP) {
        levelUp();
    }
    
    // Update quests if applicable
    updateQuestProgress();
}

function levelUp() {
    state.level++;
    state.xp = state.xp - 1000;
    
    const levelNum = document.querySelector('.level-num');
    if (levelNum) levelNum.textContent = `Level ${state.level}`;
    
    // Celebration effect
    showToast(`🎉 Level Up! You're now Level ${state.level}!`);
    
    // Update XP bar
    const xpProgress = document.querySelector('.xp-progress');
    const xpText = document.querySelector('.xp-text');
    if (xpProgress) xpProgress.style.width = `${(state.xp / 1000) * 100}%`;
    if (xpText) xpText.textContent = `${state.xp}/1000 XP`;
}

function updateQuestProgress() {
    // Simulate quest completion check
    const quests = document.querySelectorAll('.quest-card');
    quests.forEach(quest => {
        if (!quest.classList.contains('completed') && Math.random() > 0.7) {
            quest.classList.add('completed');
            const icon = quest.querySelector('.quest-icon');
            if (icon) {
                icon.innerHTML = '<i class="fas fa-check-circle"></i>';
                icon.style.background = 'var(--success)';
                icon.style.color = 'white';
            }
        }
    });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

function updateTimeGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    
    if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
    } else if (hour >= 17) {
        greeting = 'Good Evening';
    }
    
    const greetingElement = document.querySelector('.time-greeting');
    if (greetingElement) {
        greetingElement.textContent = greeting;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// EVENT LISTENERS SETUP
// ==========================================

// Notification badge click
document.querySelector('.notification-btn')?.addEventListener('click', () => {
    showToast('No new notifications');
    const badge = document.querySelector('.badge');
    if (badge) badge.style.display = 'none';
});

// Settings button
document.querySelector('.settings-btn')?.addEventListener('click', () => {
    showToast('Settings coming soon!');
});

// Quest action buttons
document.querySelectorAll('.quest-action').forEach(btn => {
    btn.addEventListener('click', () => {
        joinSession(); // Use new joinSession function
        gainXP(100);
    });
});

// Handle window resize for canvas
window.addEventListener('resize', () => {
    if (views.whiteboard && views.whiteboard.classList.contains('active')) {
        resizeCanvas();
    }
});

// Prevent double-tap zoom on mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// ==========================================
// PROFILE PAGE FUNCTIONS
// ==========================================

function toggleSwitch(element) {
    element.classList.toggle('active');
    const isActive = element.classList.contains('active');
    const settingName = element.closest('.setting-item').querySelector('span').textContent;
    showToast(`${settingName} ${isActive ? 'enabled' : 'disabled'}`);
}

function logout() {
    if (confirm('Are you sure you want to log out?')) {
        // Reset state
        state.currentUser = null;
        state.xp = 650;
        state.level = 5;
        
        // Show splash screen again
        screens.main.classList.remove('active');
        screens.splash.classList.add('active');
        
        // Reset forms
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        
        // Reload after animation
        setTimeout(() => {
            location.reload();
        }, 2000);
        
        showToast('Logged out successfully');
    }
}

function animateProfileStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const finalValue = stat.textContent;
        stat.style.opacity = '0';
        stat.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            stat.style.transition = 'all 0.5s ease';
            stat.style.opacity = '1';
            stat.style.transform = 'translateY(0)';
        }, 100);
    });
}

function setupProfileListeners() {
    // Edit profile buttons
    document.querySelectorAll('.edit-avatar-btn, .edit-cover-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showToast('Photo upload coming soon!');
        });
    });

    // Preference tags
    document.querySelectorAll('.preference-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('active');
            const name = tag.querySelector('span').textContent;
            const isActive = tag.classList.contains('active');
            showToast(`${name} ${isActive ? 'added to' : 'removed from'} preferences`);
        });
    });

    // Setting items (non-toggle)
    document.querySelectorAll('.setting-item').forEach(item => {
        const hasToggle = item.querySelector('.toggle-switch');
        const hasBadge = item.querySelector('.badge-premium');
        if (!hasToggle && !hasBadge) {
            item.addEventListener('click', () => {
                const settingName = item.querySelector('span').textContent;
                showToast(`${settingName} - Coming soon!`);
            });
        }
    });
}

// ==========================================
// EXPORT ALL FUNCTIONS
// ==========================================

window.showScreen = showScreen; // NEW: Export showScreen
window.showView = showView;
window.selectTool = selectTool;
window.selectColor = selectColor;
window.updateBrushSize = updateBrushSize;
window.clearWhiteboard = clearWhiteboard;
window.joinSession = joinSession;
window.toggleMute = toggleMute;
window.toggleVideo = toggleVideo;
window.toggleCallWhiteboard = toggleCallWhiteboard;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.endCall = endCall;
window.startBooking = startBooking;
window.gainXP = gainXP;
window.toggleSwitch = toggleSwitch;
window.logout = logout;

console.log('🎓 Learn O\'Clock App Initialized');
console.log('📱 Mobile-first tutoring platform ready');
console.log('👤 Profile module loaded');
console.log('🎨 Custom logo integrated');
console.log('📞 Call screen separated'); // NEW