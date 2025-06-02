class WateringSystemDashboard {
    constructor() {
        this.baseUrl = window.location.origin;
        this.currentTab = 'health';
        this.history = [];
        this.init();
    }

    init() {
        this.updateTime();
        this.setupEventListeners();
        this.checkHealthOnLoad();
        this.loadHistoryFromStorage();
        
        // Update time every second
        setInterval(() => this.updateTime(), 1000);
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('decision-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.getWateringDecision();
            });
        }

        // Input synchronization with sliders
        this.setupInputSliderSync();
    }

    setupInputSliderSync() {
        const inputs = ['soil1', 'soil2', 'temp', 'light', 'water', 'hour'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            const slider = input?.parentElement.querySelector('input[type="range"]');
            
            if (input && slider) {
                input.addEventListener('input', (e) => {
                    slider.value = e.target.value;
                });
                
                slider.addEventListener('input', (e) => {
                    input.value = e.target.value;
                });
            }
        });
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('en-US', {
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        document.getElementById('current-time').textContent = timeString + ' UTC';
        document.getElementById('last-updated').textContent = now.toLocaleString();
    }

    async checkHealthOnLoad() {
        setTimeout(() => this.checkHealth(), 1000);
    }

    async checkHealth() {
        const loadingEl = document.getElementById('health-loading');
        const resultEl = document.getElementById('health-result');
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        const statusDetails = document.getElementById('status-details');
        
        this.showLoading('health-loading', true);
        resultEl.textContent = '';
        
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            
            // Add to history
            this.addToHistory('GET', '/health', null, data, response.ok);
            
            if (response.ok) {
                // Update status indicators
                statusDot.className = 'status-indicator online';
                statusText.textContent = 'System Online';
                statusDetails.textContent = `Models: Decision(${data.models_loaded.decision_model ? '✓' : '✗'}) Amount(${data.models_loaded.amount_model ? '✓' : '✗'})`;
                
                // Update model status
                document.getElementById('decision-model-status').textContent = data.models_loaded.decision_model ? '✅ Loaded' : '❌ Not Found';
                document.getElementById('amount-model-status').textContent = data.models_loaded.amount_model ? '✅ Loaded' : '❌ Not Found';
                
                resultEl.className = 'result-content success';
                resultEl.textContent = `✅ Service is healthy!\n\n${JSON.stringify(data, null, 2)}`;
                
                this.showToast('success', 'Health Check Successful', 'All systems are operational');
            } else {
                statusDot.className = 'status-indicator offline';
                statusText.textContent = 'System Error';
                statusDetails.textContent = 'Health check failed';
                
                resultEl.className = 'result-content error';
                resultEl.textContent = `❌ Health check failed!\n\n${JSON.stringify(data, null, 2)}`;
                
                this.showToast('error', 'Health Check Failed', 'System is not responding correctly');
            }
        } catch (error) {
            statusDot.className = 'status-indicator offline';
            statusText.textContent = 'Connection Error';
            statusDetails.textContent = 'Cannot connect to service';
            
            resultEl.className = 'result-content error';
            resultEl.textContent = `❌ Error connecting to service:\n\n${error.message}`;
            
            this.showToast('error', 'Connection Error', 'Unable to reach the watering system service');
        } finally {
            this.showLoading('health-loading', false);
        }
    }

    async getWateringDecision() {
        const loadingEl = document.getElementById('decision-loading');
        const resultEl = document.getElementById('decision-result');
        const form = document.getElementById('decision-form');
        
        this.showLoading('decision-loading', true);
        resultEl.textContent = '';
        
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = parseFloat(value);
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/watering/decision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            // Add to history
            this.addToHistory('POST', '/watering/decision', data, result, response.ok);
            
            if (response.ok && result.success) {
                const wateringStatus = result.should_water ? '💧 YES - Watering needed!' : '🚫 NO - No watering needed';
                const waterAmount = result.water_amount_litres > 0 ? `\n💧 Water Amount: ${result.water_amount_litres.toFixed(2)} litres` : '';
                
                resultEl.className = 'result-content success';
                resultEl.textContent = `🤖 AI RECOMMENDATION\n${wateringStatus}${waterAmount}\n\n📊 SENSOR ANALYSIS:\n` +
                    `🌱 Soil Moisture 1: ${result.soil_moisture_1}%\n` +
                    `🌱 Soil Moisture 2: ${result.soil_moisture_2}%\n` +
                    `🌡️  Temperature: ${result.temperature}°C\n` +
                    `☀️  Light Level: ${result.light_level} lux\n` +
                    `🚰 Water Tank: ${result.water_level}%\n` +
                    `🕒 Timestamp: ${result.timestamp}\n\n` +
                    `📋 FULL API RESPONSE:\n${JSON.stringify(result, null, 2)}`;
                
                // Update last decision card
                this.updateLastDecision(result);
                
                const toastMessage = result.should_water ? 
                    `Recommend ${result.water_amount_litres.toFixed(2)}L of water` : 
                    'No watering needed at this time';
                    
                this.showToast('success', 'Decision Complete', toastMessage);
            } else {
                resultEl.className = 'result-content error';
                resultEl.textContent = `❌ Decision failed!\n\n${JSON.stringify(result, null, 2)}`;
                
                this.showToast('error', 'Decision Failed', result.error || 'Unknown error occurred');
            }
        } catch (error) {
            resultEl.className = 'result-content error';
            resultEl.textContent = `❌ Error making decision:\n\n${error.message}`;
            
            this.showToast('error', 'Network Error', 'Failed to connect to the API');
        } finally {
            this.showLoading('decision-loading', false);
        }
    }

    updateLastDecision(result) {
        const lastDecisionEl = document.getElementById('last-decision');
        if (lastDecisionEl) {
            const statusIcon = result.should_water ? '💧' : '🚫';
            const statusText = result.should_water ? 'Water Needed' : 'No Water Needed';
            const amount = result.should_water ? ` (${result.water_amount_litres.toFixed(2)}L)` : '';
            
            lastDecisionEl.innerHTML = `
                <span class="decision-result">${statusIcon} ${statusText}${amount}</span>
                <small class="decision-time">${result.timestamp}</small>
            `;
        }
    }

    fillRandomData() {
        const scenarios = {
            random: {
                'soil1': Math.random() * 100,
                'soil2': Math.random() * 100,
                'temp': Math.random() * 35 + 10,
                'light': Math.random() * 8000,
                'water': Math.random() * 100,
                'hour': Math.floor(Math.random() * 24),
                'day': Math.floor(Math.random() * 7)
            }
        };
        
        this.applyScenario(scenarios.random);
        this.showToast('info', 'Random Data Generated', 'Form filled with random sensor values');
    }

    loadScenario(scenarioType) {
        const scenarios = {
            dry: {
                'soil1': 15 + Math.random() * 10,
                'soil2': 12 + Math.random() * 10,
                'temp': 32 + Math.random() * 8,
                'light': 7000 + Math.random() * 2000,
                'water': 70 + Math.random() * 20,
                'hour': 14,
                'day': 2
            },
            wet: {
                'soil1': 75 + Math.random() * 15,
                'soil2': 70 + Math.random() * 15,
                'temp': 18 + Math.random() * 5,
                'light': 800 + Math.random() * 500,
                'water': 85 + Math.random() * 10,
                'hour': 10,
                'day': 1
            },
            hot: {
                'soil1': 25 + Math.random() * 15,
                'soil2': 22 + Math.random() * 15,
                'temp': 38 + Math.random() * 7,
                'light': 9000 + Math.random() * 1000,
                'water': 60 + Math.random() * 25,
                'hour': 15,
                'day': 4
            },
            night: {
                'soil1': 40 + Math.random() * 20,
                'soil2': 35 + Math.random() * 20,
                'temp': 16 + Math.random() * 6,
                'light': 0 + Math.random() * 50,
                'water': 75 + Math.random() * 20,
                'hour': 22,
                'day': 5
            }
        };
        
        if (scenarios[scenarioType]) {
            this.applyScenario(scenarios[scenarioType]);
            this.showToast('info', 'Scenario Loaded', `Applied ${scenarioType} conditions to the form`);
        }
    }

    applyScenario(scenario) {
        Object.entries(scenario).forEach(([key, value]) => {
            const input = document.getElementById(key);
            const slider = input?.parentElement.querySelector('input[type="range"]');
            
            if (input) {
                input.value = typeof value === 'number' ? value.toFixed(1) : value;
                if (slider) {
                    slider.value = input.value;
                }
            }
        });
    }

    clearAll() {
        // Clear form
        const form = document.getElementById('decision-form');
        if (form) {
            form.reset();
            
            // Reset sliders to match default values
            this.setupInputSliderSync();
        }
        
        // Clear results
        const results = ['health-result', 'decision-result'];
        results.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.className = 'result-content info';
                el.textContent = 'Results cleared. Run a test to see new data.';
            }
        });
        
        this.showToast('info', 'Cleared', 'All forms and results have been cleared');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        this.currentTab = tabName;
        
        // Load history if switching to history tab
        if (tabName === 'history') {
            this.renderHistory();
        }
    }

    addToHistory(method, endpoint, request, response, success) {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            method,
            endpoint,
            request,
            response,
            success
        };
        
        this.history.unshift(historyItem);
        
        // Keep only last 50 items
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        // Save to localStorage
        this.saveHistoryToStorage();
        
        // Update history tab if it's active
        if (this.currentTab === 'history') {
            this.renderHistory();
        }
    }

    renderHistory() {
        const historyList = document.getElementById('history-list');
        
        if (this.history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-inbox"></i>
                    <p>No API requests made yet</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-method method ${item.method.toLowerCase()}">${item.method}</span>
                    <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <div class="history-endpoint">${item.endpoint}</div>
                ${item.request ? `
                    <div class="history-section">
                        <strong>Request:</strong>
                        <div class="history-content">${JSON.stringify(item.request, null, 2)}</div>
                    </div>
                ` : ''}
                <div class="history-section">
                    <strong>Response:</strong>
                    <div class="history-content ${item.success ? 'success' : 'error'}">${JSON.stringify(item.response, null, 2)}</div>
                </div>
            </div>
        `).join('');
    }

    clearHistory() {
        this.history = [];
        this.saveHistoryToStorage();
        this.renderHistory();
        this.showToast('info', 'History Cleared', 'All request history has been removed');
    }

    saveHistoryToStorage() {
        try {
            localStorage.setItem('watering_system_history', JSON.stringify(this.history));
        } catch (error) {
            console.warn('Could not save history to localStorage:', error);
        }
    }

    loadHistoryFromStorage() {
        try {
            const stored = localStorage.getItem('watering_system_history');
            if (stored) {
                this.history = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Could not load history from localStorage:', error);
            this.history = [];
        }
    }

    copyResult(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            navigator.clipboard.writeText(element.textContent).then(() => {
                this.showToast('success', 'Copied!', 'Result copied to clipboard');
            }).catch(() => {
                this.showToast('error', 'Copy Failed', 'Could not copy to clipboard');
            });
        }
    }

    showLoading(elementId, show) {
        const element = document.getElementById(elementId);
        if (element) {
            if (show) {
                element.classList.add('show');
            } else {
                element.classList.remove('show');
            }
        }
    }

    showToast(type, title, message) {
        const toastContainer = document.getElementById('toast-container');
        const toastId = `toast-${Date.now()}`;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = toastId;
        toast.innerHTML = `
            <div class="toast-header">
                <div class="toast-title">
                    <i class="fas fa-${this.getToastIcon(type)}"></i>
                    ${title}
                </div>
                <button class="toast-close" onclick="dashboard.removeToast('${toastId}')">&times;</button>
            </div>
            <div class="toast-message">${message}</div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => this.removeToast(toastId), 5000);
    }

    removeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    }
}

// Global functions for HTML onclick handlers
let dashboard;

function checkHealth() {
    dashboard.checkHealth();
}

function getWateringDecision() {
    dashboard.getWateringDecision();
}

function fillRandomData() {
    dashboard.fillRandomData();
}

function loadScenario(scenario) {
    dashboard.loadScenario(scenario);
}

function clearAll() {
    dashboard.clearAll();
}

function switchTab(tab) {
    dashboard.switchTab(tab);
}

function clearHistory() {
    dashboard.clearHistory();
}

function copyResult(elementId) {
    dashboard.copyResult(elementId);
}

function updateInput(inputId, value) {
    document.getElementById(inputId).value = value;
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    dashboard = new WateringSystemDashboard();
});