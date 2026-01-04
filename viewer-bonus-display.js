// ================================================================================
// CONTESTANT VIEWER - BONUS POINTS DISPLAY ENHANCEMENT
// ================================================================================
// This script adds bonus points display to the contestant viewer
// ================================================================================

(function() {
    'use strict';
    
    console.log('💰 Bonus Points Display Enhancement Loaded');
    
    // Add bonus points display section to the viewer
    function addBonusPointsDisplay() {
        // Find the main container
        const container = document.querySelector('.container .content') || 
                         document.querySelector('.container') || 
                         document.querySelector('body');
        
        if (!container) {
            console.warn('Could not find container for bonus points display');
            return;
        }
        
        // Check if already added
        if (document.getElementById('bonusPointsSection')) {
            return; // Already exists
        }
        
        // Create bonus points section
        const bonusSection = document.createElement('div');
        bonusSection.id = 'bonusPointsSection';
        bonusSection.style.cssText = `
            margin: 20px 0;
            padding: 20px;
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
            display: none;
        `;
        
        bonusSection.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #000; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 28px;">⭐</span>
                <span>Bonus Points Earned!</span>
            </h3>
            <div id="bonusPointsList" style="display: flex; flex-direction: column; gap: 10px;">
                <!-- Bonus points will be inserted here -->
            </div>
        `;
        
        // Insert after header or at top of content
        const header = container.querySelector('.header');
        if (header && header.nextSibling) {
            container.insertBefore(bonusSection, header.nextSibling);
        } else {
            container.insertBefore(bonusSection, container.firstChild);
        }
        
        console.log('✅ Bonus points section added to viewer');
    }
    
    // Update bonus points display
    function updateBonusPointsDisplay(liveGameState, contestantIndex) {
        const bonusSection = document.getElementById('bonusPointsSection');
        const bonusList = document.getElementById('bonusPointsList');
        
        if (!bonusSection || !bonusList) {
            console.log('Bonus section not found, adding it...');
            addBonusPointsDisplay();
            // Try again after adding
            setTimeout(() => updateBonusPointsDisplay(liveGameState, contestantIndex), 100);
            return;
        }
        
        // Check if this contestant has any bonus points
        const bonusPoints = liveGameState?.bonusPoints?.[contestantIndex];
        
        console.log('🔍 Checking bonus points for contestant', contestantIndex);
        console.log('   - bonusPoints data:', bonusPoints);
        
        // Debug: Show full structure of each bonus
        if (bonusPoints && bonusPoints.length > 0) {
            console.log(`   - Found ${bonusPoints.length} bonus point(s):`);
            bonusPoints.forEach((bonus, idx) => {
                console.log(`     [${idx}] points:${bonus.points}, reason:"${bonus.reason}", round:${bonus.round}`);
            });
        }
        
        if (!bonusPoints || bonusPoints.length === 0) {
            bonusSection.style.display = 'none';
            return;
        }
        
        // Calculate total bonus points
        const totalBonus = bonusPoints.reduce((sum, bonus) => sum + bonus.points, 0);
        
        // Show the section
        bonusSection.style.display = 'block';
        
        // Update the list
        bonusList.innerHTML = bonusPoints.map((bonus, idx) => {
            const date = new Date(bonus.timestamp);
            const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div style="background: rgba(255, 255, 255, 0.9); padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 18px; color: #000; margin-bottom: 5px;">
                                +${bonus.points} Bonus Point${bonus.points !== 1 ? 's' : ''}
                            </div>
                            <div style="color: #666; font-size: 14px;">
                                ${bonus.reason}
                            </div>
                        </div>
                        <div style="text-align: right; font-size: 12px; color: #999;">
                            <div>Round ${bonus.round}</div>
                            <div>${timeStr}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add total if multiple bonuses
        if (bonusPoints.length > 1) {
            bonusList.innerHTML += `
                <div style="background: rgba(255, 255, 255, 0.95); padding: 15px; border-radius: 8px; border: 2px solid #ff9800; font-weight: bold;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 16px; color: #000;">Total Bonus Points:</span>
                        <span style="font-size: 24px; color: #ff9800;">+${totalBonus}</span>
                    </div>
                </div>
            `;
        }
        
        console.log(`✅ Displaying ${bonusPoints.length} bonus point(s) totaling +${totalBonus}`);
    }
    
    // Hook into the existing Firebase listener or data update
    const originalSetInterval = window.setInterval;
    let checkCount = 0;
    const maxChecks = 100; // Check for 50 seconds (100 * 500ms)
    
    // Wait for liveGameState to be available
    const checkForGameState = originalSetInterval(function() {
        checkCount++;
        
        if (checkCount > maxChecks) {
            console.log('⏱️ Stopped checking for game state after 50 seconds');
            clearInterval(checkForGameState);
            return;
        }
        
        // Try to find the game state
        const liveGameState = window.liveGameState;
        
        if (liveGameState && liveGameState.contestants) {
            console.log('✅ Found liveGameState with contestants');
            
            // Find which contestant this viewer is for
            // Check URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const contestantName = urlParams.get('name');
            
            let contestantIndex = -1;
            if (contestantName) {
                contestantIndex = liveGameState.contestants.findIndex(c => 
                    c.name.toLowerCase() === contestantName.toLowerCase()
                );
            }
            
            // If not found in URL, try to find from page content
            if (contestantIndex === -1) {
                const nameElement = document.querySelector('.contestant-name');
                if (nameElement) {
                    const pageName = nameElement.textContent.trim();
                    contestantIndex = liveGameState.contestants.findIndex(c => 
                        c.name.toLowerCase() === pageName.toLowerCase()
                    );
                }
            }
            
            console.log('👤 Contestant index:', contestantIndex);
            
            if (contestantIndex >= 0) {
                // Add the display section
                addBonusPointsDisplay();
                
                // Update immediately
                updateBonusPointsDisplay(liveGameState, contestantIndex);
                
                // Set up continuous monitoring for updates
                originalSetInterval(function() {
                    if (window.liveGameState) {
                        updateBonusPointsDisplay(window.liveGameState, contestantIndex);
                    }
                }, 2000); // Check every 2 seconds
                
                // Clear this check interval
                clearInterval(checkForGameState);
            }
        }
    }, 500); // Check every 500ms
    
    // Also try to hook into any existing data refresh functions
    if (typeof window.refreshData === 'function') {
        const originalRefresh = window.refreshData;
        window.refreshData = function(...args) {
            const result = originalRefresh.apply(this, args);
            
            // Update bonus points after refresh
            if (window.liveGameState && window.contestantIndex >= 0) {
                updateBonusPointsDisplay(window.liveGameState, window.contestantIndex);
            }
            
            return result;
        };
    }
    
    console.log('💰 Bonus Points Display Enhancement Ready');
    
})();
