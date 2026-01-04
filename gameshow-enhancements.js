// ================================================================================
// GAME SHOW SCORER - CHRISTMAS ENHANCEMENTS 2025
// ================================================================================
// This script adds: Templates Library, Bulk Operations, Undo, Pause/Resume,
// Sound Effects, Dark Mode, Enhanced Statistics, and Spectator Mode
// ================================================================================

(function() {
    'use strict';
    
    // ============================================================================
    // GLOBAL VARIABLES FOR NEW FEATURES
    // ============================================================================
    
    window.gameEnhancements = {
        soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
        darkModeEnabled: localStorage.getItem('darkMode') === 'true',
        gamePaused: false,
        actionHistory: [],
        savedTemplates: JSON.parse(localStorage.getItem('savedTemplates') || '{}'),
        spectatorMode: false
    };
    
    // ============================================================================
    // SOUND EFFECTS SYSTEM
    // ============================================================================
    
    const SoundEffects = {
        context: null,
        
        init() {
            if (typeof(AudioContext) !== 'undefined' || typeof(webkitAudioContext) !== 'undefined') {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
            }
        },
        
        playCorrect() {
            if (!window.gameEnhancements.soundEnabled || !this.context) return;
            this.playTone(800, 0.1, 'sine');
            setTimeout(() => this.playTone(1000, 0.15, 'sine'), 100);
        },
        
        playIncorrect() {
            if (!window.gameEnhancements.soundEnabled || !this.context) return;
            this.playTone(200, 0.3, 'sawtooth');
        },
        
        playRoundStart() {
            if (!window.gameEnhancements.soundEnabled || !this.context) return;
            this.playTone(600, 0.1, 'sine');
            setTimeout(() => this.playTone(800, 0.1, 'sine'), 100);
            setTimeout(() => this.playTone(1000, 0.2, 'sine'), 200);
        },
        
        playGameEnd() {
            if (!window.gameEnhancements.soundEnabled || !this.context) return;
            const notes = [523, 659, 784, 1047]; // C, E, G, High C
            notes.forEach((freq, i) => {
                setTimeout(() => this.playTone(freq, 0.15, 'sine'), i * 150);
            });
        },
        
        playBonus() {
            if (!window.gameEnhancements.soundEnabled || !this.context) return;
            this.playTone(1200, 0.1, 'sine');
            setTimeout(() => this.playTone(1400, 0.2, 'sine'), 100);
        },
        
        playTone(frequency, duration, type = 'sine') {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        },
        
        toggle() {
            window.gameEnhancements.soundEnabled = !window.gameEnhancements.soundEnabled;
            localStorage.setItem('soundEnabled', window.gameEnhancements.soundEnabled);
            return window.gameEnhancements.soundEnabled;
        }
    };
    
    // ============================================================================
    // DARK MODE SYSTEM
    // ============================================================================
    
    const DarkMode = {
        init() {
            if (window.gameEnhancements.darkModeEnabled) {
                this.enable();
            }
        },
        
        toggle() {
            if (window.gameEnhancements.darkModeEnabled) {
                this.disable();
            } else {
                this.enable();
            }
        },
        
        enable() {
            window.gameEnhancements.darkModeEnabled = true;
            localStorage.setItem('darkMode', 'true');
            document.body.classList.add('dark-mode');
            this.injectDarkModeCSS();
        },
        
        disable() {
            window.gameEnhancements.darkModeEnabled = false;
            localStorage.setItem('darkMode', 'false');
            document.body.classList.remove('dark-mode');
        },
        
        injectDarkModeCSS() {
            if (document.getElementById('darkModeStyles')) return;
            
            const style = document.createElement('style');
            style.id = 'darkModeStyles';
            style.textContent = `
                body.dark-mode {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                }
                
                body.dark-mode .container {
                    background: #0f3460;
                    color: #e1e1e1;
                }
                
                body.dark-mode .section {
                    background: #16213e;
                    border-left-color: #e94560;
                }
                
                body.dark-mode .game-card {
                    background: #16213e;
                    border-color: #e94560;
                }
                
                body.dark-mode input,
                body.dark-mode select,
                body.dark-mode textarea {
                    background: #1a1a2e;
                    color: #e1e1e1;
                    border-color: #e94560;
                }
                
                body.dark-mode .btn-primary {
                    background: linear-gradient(135deg, #e94560 0%, #c62045 100%);
                }
                
                body.dark-mode .btn-secondary {
                    background: #1a1a2e;
                    border: 2px solid #e94560;
                    color: #e1e1e1;
                }
                
                body.dark-mode .correct-btn {
                    background: #2e7d32;
                }
                
                body.dark-mode .incorrect-btn {
                    background: #c62828;
                }
                
                body.dark-mode .scoreboard {
                    background: #16213e;
                }
                
                body.dark-mode .contestant-row {
                    background: #0f3460;
                    border-color: #e94560;
                }
                
                body.dark-mode h1, body.dark-mode h2, body.dark-mode h3,
                body.dark-mode label, body.dark-mode p {
                    color: #e1e1e1;
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    // ============================================================================
    // UNDO SYSTEM
    // ============================================================================
    
    const UndoSystem = {
        maxHistory: 50,
        
        recordAction(action) {
            window.gameEnhancements.actionHistory.push({
                ...action,
                timestamp: Date.now()
            });
            
            // Keep only last N actions
            if (window.gameEnhancements.actionHistory.length > this.maxHistory) {
                window.gameEnhancements.actionHistory.shift();
            }
            
            this.updateUndoButton();
        },
        
        undo() {
            const history = window.gameEnhancements.actionHistory;
            if (history.length === 0) {
                this.showToast('Nothing to undo', 'info');
                return;
            }
            
            const lastAction = history.pop();
            
            if (lastAction.type === 'score') {
                // Reverse the score change
                const contestant = lastAction.contestant;
                const points = lastAction.points;
                
                if (typeof window.gameState !== 'undefined') {
                    window.gameState.scores[contestant] = (window.gameState.scores[contestant] || 0) - points;
                    
                    // Also update round history if applicable
                    if (lastAction.round && window.gameState.roundHistory[contestant]) {
                        const roundIdx = lastAction.round - 1;
                        if (window.gameState.roundHistory[contestant][roundIdx]) {
                            // Remove this round's entry
                            window.gameState.roundHistory[contestant].splice(roundIdx, 1);
                        }
                    }
                    
                    // Update UI - reload current round
                    if (typeof window.loadRound === 'function') {
                        window.loadRound(window.gameState.currentRound);
                    }
                    
                    // Update scoreboard
                    if (typeof window.updateScoreboardDisplay === 'function') {
                        window.updateScoreboardDisplay();
                    }
                    
                    // Sync to Firebase
                    if (typeof window.saveLiveGameState === 'function') {
                        window.saveLiveGameState();
                    }
                }
            } else if (lastAction.type === 'bonus') {
                // Reverse bonus points
                const contestant = lastAction.contestant;
                const points = lastAction.points;
                
                if (typeof window.gameState !== 'undefined') {
                    window.gameState.scores[contestant] = (window.gameState.scores[contestant] || 0) - points;
                    
                    // Update UI
                    if (typeof window.loadRound === 'function') {
                        window.loadRound(window.gameState.currentRound);
                    }
                    
                    if (typeof window.updateScoreboardDisplay === 'function') {
                        window.updateScoreboardDisplay();
                    }
                    
                    if (typeof window.saveLiveGameState === 'function') {
                        window.saveLiveGameState();
                    }
                }
            }
            
            this.updateUndoButton();
            this.showToast('Action undone', 'info');
        },
        
        updateUndoButton() {
            const undoBtn = document.getElementById('undoBtn');
            if (undoBtn) {
                undoBtn.disabled = window.gameEnhancements.actionHistory.length === 0;
                undoBtn.style.opacity = window.gameEnhancements.actionHistory.length === 0 ? '0.5' : '1';
            }
        },
        
        showToast(message, type = 'success') {
            if (typeof window.showToast === 'function') {
                window.showToast(message, type);
            } else {
                alert(message);
            }
        }
    };
    
    // ============================================================================
    // PAUSE/RESUME SYSTEM
    // ============================================================================
    
    const PauseSystem = {
        toggle() {
            window.gameEnhancements.gamePaused = !window.gameEnhancements.gamePaused;
            
            if (window.gameEnhancements.gamePaused) {
                this.showPauseOverlay();
            } else {
                this.hidePauseOverlay();
            }
            
            return window.gameEnhancements.gamePaused;
        },
        
        showPauseOverlay() {
            let overlay = document.getElementById('pauseOverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'pauseOverlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    flex-direction: column;
                    gap: 30px;
                `;
                overlay.innerHTML = `
                    <div style="font-size: 120px;">⏸️</div>
                    <div style="color: white; font-size: 48px; font-weight: bold;">GAME PAUSED</div>
                    <button onclick="window.gameEnhancements.PauseSystem.toggle()" 
                            style="padding: 20px 40px; font-size: 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Resume Game
                    </button>
                `;
                document.body.appendChild(overlay);
            }
            overlay.style.display = 'flex';
        },
        
        hidePauseOverlay() {
            const overlay = document.getElementById('pauseOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
    };
    
    // ============================================================================
    // TEMPLATES LIBRARY
    // ============================================================================
    
    const TemplatesLibrary = {
        save(name) {
            if (!name || name.trim() === '') {
                alert('Please enter a template name');
                return;
            }
            
            // Get current setup data
            const setupData = {
                version: '1.0',
                savedDate: new Date().toISOString(),
                competitionName: document.getElementById('competitionName')?.value || 'Untitled',
                contestants: [],
                rounds: [],
                scoringRules: []
            };
            
            // Get contestant count
            const count = parseInt(document.getElementById('contestantCount')?.textContent || 0);
            
            // Get contestants
            for (let i = 1; i <= count; i++) {
                const nameEl = document.getElementById(`name${i}`);
                if (nameEl) {
                    setupData.contestants.push({
                        name: nameEl.value,
                        email: document.getElementById(`email${i}`)?.value || '',
                        mobile: document.getElementById(`mobile${i}`)?.value || '',
                        avatar: window.contestantData?.[i]?.avatar || '',
                        avatarType: window.contestantData?.[i]?.avatarType || 'upload'
                    });
                }
            }
            
            // Get rounds
            const numRounds = parseInt(document.getElementById('numRounds')?.value || 0);
            for (let i = 1; i <= numRounds; i++) {
                const roundEl = document.getElementById(`round${i}`);
                if (roundEl) {
                    setupData.rounds.push({
                        number: i,
                        name: roundEl.value,
                        avatar: window.roundAvatarData?.[i] || '',
                        tabletRequired: document.getElementById(`tabletToggle${i}`)?.checked || false
                    });
                    
                    // Also save scoring rules
                    setupData.scoringRules.push({
                        roundNumber: i,
                        name: roundEl.value,
                        correctPoints: parseInt(document.getElementById(`correct${i}`)?.value || 1),
                        incorrectPoints: -Math.abs(parseInt(document.getElementById(`incorrect${i}`)?.value || 0)),
                        avatar: window.roundAvatarData?.[i] || '',
                        tabletRequired: document.getElementById(`tabletToggle${i}`)?.checked || false
                    });
                }
            }
            
            // Save to templates
            window.gameEnhancements.savedTemplates[name] = setupData;
            localStorage.setItem('savedTemplates', JSON.stringify(window.gameEnhancements.savedTemplates));
            
            this.showToast(`Template "${name}" saved successfully!`);
            this.refreshTemplatesList();
        },
        
        load(name) {
            const template = window.gameEnhancements.savedTemplates[name];
            if (!template) {
                alert('Template not found');
                return;
            }
            
            // Store as imported data
            window.importedSetupData = template;
            
            // Trigger the import flow
            if (typeof window.proceedToContestants === 'function') {
                // Hide splash if visible
                const splash = document.getElementById('splashScreen');
                if (splash && !splash.classList.contains('hidden')) {
                    splash.classList.add('hidden');
                }
                
                // Load competition name
                const compName = document.getElementById('competitionName');
                if (compName) {
                    compName.value = template.competitionName;
                }
                
                // Set contestant count
                const countEl = document.getElementById('contestantCount');
                if (countEl) {
                    countEl.textContent = template.contestants.length;
                }
                
                // Auto-advance
                setTimeout(() => {
                    window.proceedToContestants();
                    this.showToast(`Template "${name}" loaded successfully!`);
                }, 500);
            }
        },
        
        delete(name) {
            if (confirm(`Delete template "${name}"?`)) {
                delete window.gameEnhancements.savedTemplates[name];
                localStorage.setItem('savedTemplates', JSON.stringify(window.gameEnhancements.savedTemplates));
                this.refreshTemplatesList();
                this.showToast(`Template "${name}" deleted`);
            }
        },
        
        showDialog() {
            const dialog = this.createDialog();
            document.body.appendChild(dialog);
        },
        
        createDialog() {
            const dialog = document.createElement('div');
            dialog.id = 'templatesDialog';
            dialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `;
            
            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            `;
            
            content.innerHTML = `
                <h2 style="margin-bottom: 20px; color: #333;">📚 Templates Library</h2>
                
                <div style="margin-bottom: 20px;">
                    <input type="text" id="templateName" placeholder="Enter template name..." 
                           style="width: calc(100% - 120px); padding: 10px; border: 2px solid #ddd; border-radius: 6px; margin-right: 10px;">
                    <button onclick="window.gameEnhancements.TemplatesLibrary.save(document.getElementById('templateName').value)" 
                            style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        💾 Save Current
                    </button>
                </div>
                
                <div id="templatesList" style="margin-top: 20px;"></div>
                
                <button onclick="document.getElementById('templatesDialog').remove()" 
                        style="margin-top: 20px; padding: 10px 20px; background: #999; color: white; border: none; border-radius: 6px; cursor: pointer; width: 100%;">
                    Close
                </button>
            `;
            
            dialog.appendChild(content);
            
            // Click outside to close
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    dialog.remove();
                }
            });
            
            // Load templates list after a moment
            setTimeout(() => this.refreshTemplatesList(), 100);
            
            return dialog;
        },
        
        refreshTemplatesList() {
            const listEl = document.getElementById('templatesList');
            if (!listEl) return;
            
            const templates = window.gameEnhancements.savedTemplates;
            const names = Object.keys(templates);
            
            if (names.length === 0) {
                listEl.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No saved templates yet</p>';
                return;
            }
            
            listEl.innerHTML = names.map(name => {
                const template = templates[name];
                return `
                    <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #667eea;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <strong style="font-size: 16px;">${name}</strong><br>
                                <span style="color: #666; font-size: 14px;">
                                    ${template.contestants?.length || 0} contestants, 
                                    ${template.rounds?.length || 0} rounds
                                </span><br>
                                <span style="color: #999; font-size: 12px;">
                                    Saved: ${new Date(template.savedDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="window.gameEnhancements.TemplatesLibrary.load('${name}')" 
                                        style="padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    Load
                                </button>
                                <button onclick="window.gameEnhancements.TemplatesLibrary.delete('${name}')" 
                                        style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        },
        
        showToast(message) {
            if (typeof window.showToast === 'function') {
                window.showToast(message);
            }
        }
    };
    
    // ============================================================================
    // BULK OPERATIONS
    // ============================================================================
    
    const BulkOperations = {
        applyScoringToAll() {
            const firstCorrect = document.getElementById('correct1')?.value;
            const firstIncorrect = document.getElementById('incorrect1')?.value;
            
            if (!firstCorrect) {
                alert('Please set Round 1 scoring first');
                return;
            }
            
            const numRounds = parseInt(document.getElementById('numRounds')?.value || 0);
            
            for (let i = 2; i <= numRounds; i++) {
                const correctEl = document.getElementById(`correct${i}`);
                const incorrectEl = document.getElementById(`incorrect${i}`);
                
                if (correctEl) correctEl.value = firstCorrect;
                if (incorrectEl) incorrectEl.value = firstIncorrect;
            }
            
            this.showToast(`Applied scoring (+${firstCorrect}/-${firstIncorrect}) to all ${numRounds} rounds`);
        },
        
        copyRound(roundNum) {
            const roundEl = document.getElementById(`round${roundNum}`);
            const correctEl = document.getElementById(`correct${roundNum}`);
            const incorrectEl = document.getElementById(`incorrect${roundNum}`);
            const tabletEl = document.getElementById(`tabletToggle${roundNum}`);
            
            if (!roundEl) return;
            
            // Store in session storage
            sessionStorage.setItem('copiedRound', JSON.stringify({
                name: roundEl.value,
                correct: correctEl?.value || 1,
                incorrect: incorrectEl?.value || 0,
                tablet: tabletEl?.checked || false,
                avatar: window.roundAvatarData?.[roundNum] || ''
            }));
            
            this.showToast(`Round ${roundNum} copied to clipboard`);
        },
        
        pasteRound(roundNum) {
            const copiedData = sessionStorage.getItem('copiedRound');
            if (!copiedData) {
                alert('No round copied yet');
                return;
            }
            
            const data = JSON.parse(copiedData);
            
            const roundEl = document.getElementById(`round${roundNum}`);
            const correctEl = document.getElementById(`correct${roundNum}`);
            const incorrectEl = document.getElementById(`incorrect${roundNum}`);
            const tabletEl = document.getElementById(`tabletToggle${roundNum}`);
            
            if (roundEl) roundEl.value = data.name;
            if (correctEl) correctEl.value = data.correct;
            if (incorrectEl) incorrectEl.value = data.incorrect;
            if (tabletEl && typeof window.setTabletRequirement === 'function') {
                window.setTabletRequirement(roundNum, data.tablet);
            }
            if (data.avatar) {
                window.roundAvatarData[roundNum] = data.avatar;
                const preview = document.getElementById(`roundAvatarPreview${roundNum}`);
                if (preview) {
                    preview.src = data.avatar;
                    preview.classList.add('show');
                }
            }
            
            this.showToast(`Round pasted to Round ${roundNum}`);
        },
        
        showToast(message) {
            if (typeof window.showToast === 'function') {
                window.showToast(message);
            }
        }
    };
    
    // ============================================================================
    // BONUS POINTS SYSTEM
    // ============================================================================
    
    const BonusPoints = {
        show() {
            const dialog = this.createDialog();
            document.body.appendChild(dialog);
        },
        
        createDialog() {
            const dialog = document.createElement('div');
            dialog.id = 'bonusDialog';
            dialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `;
            
            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
            `;
            
            // Try multiple ways to access gameState
            let gameState = window.gameState;
            
            // Debug: Check if contestants exist
            console.log('🎯 Bonus Points Debug:');
            console.log('   - window.gameState:', window.gameState);
            console.log('   - gameState exists:', typeof gameState !== 'undefined');
            if (gameState) {
                console.log('   - gameState.contestants:', gameState.contestants);
                console.log('   - contestants length:', gameState.contestants?.length);
            }
            
            // Also check if game is running
            const gameScreen = document.getElementById('gameScreen');
            console.log('   - gameScreen visible:', gameScreen && !gameScreen.classList.contains('hidden'));
            
            let html = `
                <h2 style="margin-bottom: 20px; color: #333;">⭐ Award Bonus Points</h2>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #333; font-size: 14px;">Select Contestant:</label>
                    <select id="bonusContestant" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; margin-bottom: 15px; font-size: 16px; background: white; color: #333;">
            `;
            
            // Check for contestants with better error handling
            let contestantsFound = false;
            if (gameState && gameState.contestants && Array.isArray(gameState.contestants) && gameState.contestants.length > 0) {
                gameState.contestants.forEach((contestant, idx) => {
                    html += `<option value="${idx}">${contestant.name}</option>`;
                    contestantsFound = true;
                });
                console.log('   ✅ Found', gameState.contestants.length, 'contestants');
            } else {
                console.log('   ❌ No contestants found');
                console.log('   - Troubleshooting info:');
                console.log('     gameState type:', typeof gameState);
                console.log('     contestants type:', typeof gameState?.contestants);
                console.log('     is array:', Array.isArray(gameState?.contestants));
            }
            
            if (!contestantsFound) {
                // No contestants found - show error message
                html += `<option value="">⚠️ No contestants found - please start a game first</option>`;
            }
            
            html += `
                    </select>
                    
                    <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #333; font-size: 14px;">Bonus Points:</label>
                    <input type="number" id="bonusPoints" value="5" min="1" max="100" 
                           style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; margin-bottom: 15px; font-size: 16px;">
                    
                    <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #333; font-size: 14px;">Reason (optional):</label>
                    <input type="text" id="bonusReason" placeholder="e.g., Fastest answer" 
                           style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; margin-bottom: 20px; font-size: 16px;">
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.gameEnhancements.BonusPoints.award()" 
                            style="flex: 1; padding: 14px; background: ${contestantsFound ? '#ffc107' : '#ccc'}; color: #000; border: none; border-radius: 6px; cursor: ${contestantsFound ? 'pointer' : 'not-allowed'}; font-weight: bold; font-size: 16px;" 
                            ${contestantsFound ? '' : 'disabled'}>
                        Award Bonus
                    </button>
                    <button onclick="document.getElementById('bonusDialog').remove()" 
                            style="flex: 1; padding: 14px; background: #999; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                        Cancel
                    </button>
                </div>
            `;
            
            content.innerHTML = html;
            dialog.appendChild(content);
            
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    dialog.remove();
                }
            });
            
            return dialog;
        },
        
        award() {
            const contestantIdx = parseInt(document.getElementById('bonusContestant')?.value);
            const points = parseInt(document.getElementById('bonusPoints')?.value || 0);
            const reason = document.getElementById('bonusReason')?.value || 'Bonus Points';
            
            if (isNaN(contestantIdx) || points <= 0) {
                alert('Invalid selection');
                return;
            }
            
            if (typeof window.gameState !== 'undefined') {
                window.gameState.scores[contestantIdx] = (window.gameState.scores[contestantIdx] || 0) + points;
                
                // Track bonus points separately in gameState
                if (!window.gameState.bonusPoints) {
                    window.gameState.bonusPoints = {};
                }
                if (!window.gameState.bonusPoints[contestantIdx]) {
                    window.gameState.bonusPoints[contestantIdx] = [];
                }
                
                // Add bonus point record with timestamp
                window.gameState.bonusPoints[contestantIdx].push({
                    points: points,
                    reason: reason,
                    round: window.gameState.currentRound,
                    timestamp: new Date().toISOString()
                });
                
                console.log('💰 Bonus awarded:', {
                    contestant: contestantIdx,
                    points: points,
                    reason: reason,
                    totalBonuses: window.gameState.bonusPoints[contestantIdx].length
                });
                
                // Record for undo
                UndoSystem.recordAction({
                    type: 'bonus',
                    contestant: contestantIdx,
                    points: points,
                    reason: reason
                });
                
                // Play sound
                SoundEffects.playBonus();
                
                // Update UI
                if (typeof window.loadRound === 'function') {
                    window.loadRound(window.gameState.currentRound);
                }
                
                if (typeof window.updateScoreboardDisplay === 'function') {
                    window.updateScoreboardDisplay();
                }
                
                // Sync to Firebase
                if (typeof window.saveLiveGameState === 'function') {
                    window.saveLiveGameState();
                }
                
                const contestantName = window.gameState.contestants[contestantIdx]?.name || 'Contestant';
                this.showToast(`${contestantName} awarded +${points} bonus points: ${reason}`);
            }
            
            document.getElementById('bonusDialog')?.remove();
        },
        
        showToast(message) {
            if (typeof window.showToast === 'function') {
                window.showToast(message);
            }
        }
    };
    
    // ============================================================================
    // ENHANCED STATISTICS
    // ============================================================================
    
    const EnhancedStats = {
        generate() {
            if (typeof window.gameState === 'undefined' || !window.gameState.contestants) {
                return;
            }
            
            const stats = this.calculateStats();
            const dialog = this.createStatsDialog(stats);
            document.body.appendChild(dialog);
        },
        
        calculateStats() {
            const contestants = window.gameState.contestants;
            const scores = window.gameState.scores;
            const roundHistory = window.gameState.roundHistory;
            
            const stats = contestants.map((contestant, idx) => {
                const totalScore = scores[idx] || 0;
                const history = roundHistory[idx] || [];
                
                // Calculate round-by-round performance
                const roundPerformance = history.map((round, roundIdx) => ({
                    round: roundIdx + 1,
                    points: round.points || 0,
                    correct: round.correct || false
                }));
                
                // Find best and worst rounds
                const sortedRounds = [...roundPerformance].sort((a, b) => b.points - a.points);
                const bestRound = sortedRounds[0];
                const worstRound = sortedRounds[sortedRounds.length - 1];
                
                // Calculate accuracy
                const correctCount = history.filter(r => r.correct).length;
                const accuracy = history.length > 0 ? (correctCount / history.length * 100).toFixed(1) : 0;
                
                return {
                    name: contestant.name,
                    totalScore,
                    roundPerformance,
                    bestRound,
                    worstRound,
                    accuracy,
                    correctCount,
                    totalRounds: history.length
                };
            });
            
            // Find biggest comeback
            stats.forEach(contestant => {
                let minScore = Infinity;
                let maxRecovery = 0;
                let currentScore = 0;
                
                contestant.roundPerformance.forEach(round => {
                    currentScore += round.points;
                    if (currentScore < minScore) {
                        minScore = currentScore;
                    }
                    const recovery = currentScore - minScore;
                    if (recovery > maxRecovery) {
                        maxRecovery = recovery;
                    }
                });
                
                contestant.comeback = maxRecovery;
            });
            
            return stats;
        },
        
        createStatsDialog(stats) {
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                overflow-y: auto;
            `;
            
            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 900px;
                width: 95%;
                max-height: 90vh;
                overflow-y: auto;
            `;
            
            let html = `
                <h2 style="margin-bottom: 25px; color: #333; text-align: center;">📊 Enhanced Statistics</h2>
            `;
            
            stats.forEach(contestant => {
                html += `
                    <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                        <h3 style="margin-bottom: 15px; color: #667eea;">${contestant.name}</h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                                <div style="font-size: 32px; font-weight: bold; color: #667eea;">${contestant.totalScore}</div>
                                <div style="color: #666; font-size: 14px;">Total Score</div>
                            </div>
                            
                            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                                <div style="font-size: 32px; font-weight: bold; color: #4caf50;">${contestant.accuracy}%</div>
                                <div style="color: #666; font-size: 14px;">Accuracy</div>
                            </div>
                            
                            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
                                <div style="font-size: 32px; font-weight: bold; color: #ff9800;">${contestant.comeback}</div>
                                <div style="color: #666; font-size: 14px;">Biggest Comeback</div>
                            </div>
                        </div>
                        
                        ${contestant.bestRound ? `
                        <div style="display: flex; gap: 15px; margin-bottom: 10px;">
                            <div style="flex: 1; background: white; padding: 10px; border-radius: 6px;">
                                <strong style="color: #4caf50;">💪 Best Round:</strong> 
                                Round ${contestant.bestRound.round} (+${contestant.bestRound.points})
                            </div>
                            <div style="flex: 1; background: white; padding: 10px; border-radius: 6px;">
                                <strong style="color: #f44336;">😓 Toughest Round:</strong> 
                                Round ${contestant.worstRound.round} (${contestant.worstRound.points})
                            </div>
                        </div>
                        ` : ''}
                        
                        <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
                            <strong>Round-by-Round Performance:</strong>
                            <div style="display: flex; gap: 5px; margin-top: 10px; flex-wrap: wrap;">
                                ${contestant.roundPerformance.map(round => `
                                    <div style="padding: 8px 12px; background: ${round.correct ? '#4caf50' : '#f44336'}; color: white; border-radius: 4px; font-size: 12px;">
                                        R${round.round}: ${round.points >= 0 ? '+' : ''}${round.points}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // Add highlight boxes
            const sortedByScore = [...stats].sort((a, b) => b.totalScore - a.totalScore);
            const sortedByComebacks = [...stats].sort((a, b) => b.comeback - a.comeback);
            const mostAccurate = [...stats].sort((a, b) => b.accuracy - a.accuracy);
            
            html += `
                <div style="padding: 20px; background: #fff3cd; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ffc107;">
                    <h4 style="margin-bottom: 10px; color: #856404;">🏆 Highlights</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li><strong>Winner:</strong> ${sortedByScore[0].name} with ${sortedByScore[0].totalScore} points</li>
                        <li><strong>Biggest Comeback:</strong> ${sortedByComebacks[0].name} (+${sortedByComebacks[0].comeback} recovery)</li>
                        <li><strong>Most Accurate:</strong> ${mostAccurate[0].name} (${mostAccurate[0].accuracy}%)</li>
                    </ul>
                </div>
            `;
            
            html += `
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="window.gameEnhancements.EnhancedStats.exportToCSV()" 
                            style="flex: 1; padding: 12px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        📄 Export to CSV
                    </button>
                    <button id="statsCloseBtn"
                            style="flex: 1; padding: 12px; background: #999; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Close
                    </button>
                </div>
            `;
            
            content.innerHTML = html;
            dialog.appendChild(content);
            
            // Add close button event listener after DOM is created
            const closeBtn = content.querySelector('#statsCloseBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    dialog.remove();
                });
            }
            
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    dialog.remove();
                }
            });
            
            return dialog;
        },
        
        exportToCSV() {
            const stats = this.calculateStats();
            
            let csv = 'Name,Total Score,Accuracy,Correct Answers,Total Rounds,Biggest Comeback\n';
            
            stats.forEach(contestant => {
                csv += `"${contestant.name}",${contestant.totalScore},${contestant.accuracy},${contestant.correctCount},${contestant.totalRounds},${contestant.comeback}\n`;
            });
            
            // Download
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `game-stats-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showToast('Statistics exported to CSV');
        },
        
        showToast(message) {
            if (typeof window.showToast === 'function') {
                window.showToast(message);
            }
        }
    };
    
    // ============================================================================
    // ENHANCED UI CONTROLS
    // ============================================================================
    
    function addEnhancedControls() {
        // Add control bar during game
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen && !document.getElementById('enhancedControls')) {
            const controlBar = document.createElement('div');
            controlBar.id = 'enhancedControls';
            controlBar.style.cssText = `
                position: sticky;
                top: 0;
                background: white;
                padding: 15px;
                border-bottom: 2px solid #667eea;
                z-index: 1000;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            `;
            
            const btnStyle = `
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
                transition: transform 0.2s;
            `;
            
            controlBar.innerHTML = `
                <button id="pauseBtn" style="${btnStyle} background: #ff9800; color: white;" 
                        onclick="window.gameEnhancements.PauseSystem.toggle()">
                    ⏸️ Pause
                </button>
                
                <button id="undoBtn" style="${btnStyle} background: #2196f3; color: white;" 
                        onclick="window.gameEnhancements.UndoSystem.undo()">
                    ↶ Undo
                </button>
                
                <button style="${btnStyle} background: #ffc107; color: #333;" 
                        onclick="window.gameEnhancements.BonusPoints.show()">
                    ⭐ Bonus Points
                </button>
                
                <button style="${btnStyle} background: #9c27b0; color: white;" 
                        onclick="window.gameEnhancements.EnhancedStats.generate()">
                    📊 Stats
                </button>
                
                <button id="soundBtn" style="${btnStyle} background: #4caf50; color: white;" 
                        onclick="window.gameEnhancements.toggleSound(this)">
                    ${window.gameEnhancements.soundEnabled ? '🔊' : '🔇'} Sound
                </button>
                
                <button id="darkModeBtn" style="${btnStyle} background: #333; color: white;" 
                        onclick="window.gameEnhancements.toggleDarkMode(this)">
                    ${window.gameEnhancements.darkModeEnabled ? '☀️' : '🌙'} Mode
                </button>
                
                <button style="${btnStyle} background: #e91e63; color: white;" 
                        onclick="window.open(window.location.href + '?spectator=true', '_blank')">
                    👁️ Spectator View
                </button>
            `;
            
            gameScreen.insertBefore(controlBar, gameScreen.firstChild);
            
            // Update undo button state
            UndoSystem.updateUndoButton();
        }
        
        // Add bulk operations to scoring setup
        const scoringSetup = document.getElementById('scoringSetup');
        if (scoringSetup && !document.getElementById('bulkOpsBar')) {
            const section = scoringSetup.querySelector('.section');
            if (section) {
                const bulkBar = document.createElement('div');
                bulkBar.id = 'bulkOpsBar';
                bulkBar.style.cssText = `
                    padding: 15px;
                    background: #e3f2fd;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border-left: 4px solid #2196f3;
                `;
                
                bulkBar.innerHTML = `
                    <h4 style="margin-bottom: 10px; color: #1976d2;">⚡ Bulk Operations</h4>
                    <button onclick="window.gameEnhancements.BulkOperations.applyScoringToAll()" 
                            style="padding: 10px 20px; background: #2196f3; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                        Apply Round 1 Scoring to All Rounds
                    </button>
                    <p style="margin-top: 10px; font-size: 13px; color: #666;">
                        💡 Tip: Set Round 1 scoring, then use this button to apply it to all rounds at once!
                    </p>
                `;
                
                section.insertBefore(bulkBar, section.firstChild);
            }
        }
    }
    
    // ============================================================================
    // TOGGLE FUNCTIONS (exposed to global scope)
    // ============================================================================
    
    window.gameEnhancements.toggleSound = function(btn) {
        const enabled = SoundEffects.toggle();
        if (btn) {
            btn.innerHTML = `${enabled ? '🔊' : '🔇'} Sound`;
        }
    };
    
    window.gameEnhancements.toggleDarkMode = function(btn) {
        DarkMode.toggle();
        if (btn) {
            btn.innerHTML = `${window.gameEnhancements.darkModeEnabled ? '☀️' : '🌙'} Mode`;
        }
    };
    
    // Expose systems to global scope
    window.gameEnhancements.SoundEffects = SoundEffects;
    window.gameEnhancements.DarkMode = DarkMode;
    window.gameEnhancements.UndoSystem = UndoSystem;
    window.gameEnhancements.PauseSystem = PauseSystem;
    window.gameEnhancements.TemplatesLibrary = TemplatesLibrary;
    window.gameEnhancements.BulkOperations = BulkOperations;
    window.gameEnhancements.BonusPoints = BonusPoints;
    window.gameEnhancements.EnhancedStats = EnhancedStats;
    
    // ============================================================================
    // INTEGRATION HOOKS
    // ============================================================================
    
    // Hook into existing scoring functions
    const originalMarkAnswer = window.markAnswer;
    if (originalMarkAnswer) {
        window.markAnswer = function(contestantIdx, isCorrect) {
            const result = originalMarkAnswer.apply(this, arguments);
            
            // Play sound
            if (isCorrect) {
                SoundEffects.playCorrect();
            } else {
                SoundEffects.playIncorrect();
            }
            
            return result;
        };
    }
    
    const originalSubmitRoundPoints = window.submitRoundPoints;
    if (originalSubmitRoundPoints) {
        window.submitRoundPoints = function() {
            // Get current scores before submission
            const scoresBefore = {};
            if (typeof window.gameState !== 'undefined' && window.gameState.contestants) {
                window.gameState.contestants.forEach((c, idx) => {
                    scoresBefore[idx] = window.gameState.scores[idx] || 0;
                });
            }
            
            // Call original function
            const result = originalSubmitRoundPoints.apply(this, arguments);
            
            // Record changes for undo
            if (typeof window.gameState !== 'undefined' && window.gameState.contestants) {
                window.gameState.contestants.forEach((c, idx) => {
                    const scoreBefore = scoresBefore[idx] || 0;
                    const scoreAfter = window.gameState.scores[idx] || 0;
                    const pointsChange = scoreAfter - scoreBefore;
                    
                    if (pointsChange !== 0) {
                        UndoSystem.recordAction({
                            type: 'score',
                            contestant: idx,
                            points: pointsChange,
                            round: window.gameState.currentRound
                        });
                        
                        // Play sound based on whether it was positive or negative
                        if (pointsChange > 0) {
                            SoundEffects.playCorrect();
                        } else if (pointsChange < 0) {
                            SoundEffects.playIncorrect();
                        }
                    }
                });
            }
            
            return result;
        };
    }
    
    const originalStartGame = window.startGame;
    if (originalStartGame) {
        window.startGame = function(...args) {
            const result = originalStartGame.apply(this, args);
            return result;
        };
    }
    
    const originalProceedWithGameStart = window.proceedWithGameStart;
    if (originalProceedWithGameStart) {
        window.proceedWithGameStart = function(...args) {
            const result = originalProceedWithGameStart.apply(this, args);
            SoundEffects.playRoundStart();
            // Add controls after a delay to ensure DOM is ready
            setTimeout(() => addEnhancedControls(), 500);
            return result;
        };
    }
    
    const originalNextRound = window.nextRound;
    if (originalNextRound) {
        window.nextRound = function(...args) {
            const result = originalNextRound.apply(this, args);
            SoundEffects.playRoundStart();
            return result;
        };
    }
    
    const originalShowFinalResults = window.showFinalResults;
    if (originalShowFinalResults) {
        window.showFinalResults = function(...args) {
            const result = originalShowFinalResults.apply(this, args);
            SoundEffects.playGameEnd();
            return result;
        };
    }
    
    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    
    document.addEventListener('DOMContentLoaded', function() {
        SoundEffects.init();
        DarkMode.init();
        
        // Add templates button to initial setup
        setTimeout(() => {
            const initialSetup = document.getElementById('initialSetup');
            if (initialSetup && !document.getElementById('templatesBtn')) {
                const section = initialSetup.querySelector('.section');
                if (section) {
                    const btn = document.createElement('button');
                    btn.id = 'templatesBtn';
                    btn.className = 'btn-secondary';
                    btn.style.cssText = 'margin-top: 15px; width: 100%;';
                    btn.innerHTML = '📚 Templates Library';
                    btn.onclick = () => TemplatesLibrary.showDialog();
                    section.appendChild(btn);
                }
            }
            
            // Add bulk operations if on scoring screen
            addEnhancedControls();
        }, 1000);
        
        // Check for spectator mode
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('spectator') === 'true') {
            window.gameEnhancements.spectatorMode = true;
            enableSpectatorMode();
        }
    });
    
    // ============================================================================
    // SPECTATOR MODE
    // ============================================================================
    
    function enableSpectatorMode() {
        // Hide all control buttons
        document.body.classList.add('spectator-mode');
        
        const style = document.createElement('style');
        style.textContent = `
            .spectator-mode .correct-btn,
            .spectator-mode .incorrect-btn,
            .spectator-mode .settings-icon,
            .spectator-mode #enhancedControls,
            .spectator-mode button {
                display: none !important;
            }
            
            .spectator-mode .header h1::after {
                content: ' - Spectator View';
                font-size: 0.5em;
                color: #ffc107;
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log('🎄 Game Show Scorer - Christmas Enhancements Loaded! 🎄');
    console.log('Features: Templates, Bulk Ops, Undo, Pause, Sounds, Dark Mode, Stats, Spectator');
    
})();
