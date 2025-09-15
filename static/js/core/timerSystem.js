// Sistema Avançado de Temporizadores
// Gerencia múltiplos timers: desafio, total e intervalos

class TimerSystem {
    constructor() {
        this.timers = {
            challenge: {
                interval: null,
                remaining: 0,
                total: 0,
                isRunning: false,
                isPaused: false
            },
            total: {
                interval: null,
                elapsed: 0,
                isRunning: false,
                startTime: null
            },
            warnings: {
                intervals: [],
                triggered: new Set()
            }
        };

        this.warningIntervals = [300, 180, 120, 60, 30, 10]; // 5, 3, 2, 1, 0.5, 0.25 min
        this.onWarningCallbacks = [];
        this.onTimeoutCallbacks = [];

        this.initializeElements();
        this.initializeEventListeners();
    }

    // Inicializar elementos DOM
    initializeElements() {
        this.elements = {
            challengeTimer: document.getElementById('timer'),
            totalTimer: document.getElementById('total-timer'),
            currentTime: document.getElementById('current-time'),
            totalProgress: document.getElementById('total-progress'),
            timerStatus: document.getElementById('timer-status')
        };
    }

    // Inicializar listeners de eventos
    initializeEventListeners() {
        // Evento de visibilidade da página (pausar quando minimizada)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        // Prevenir fechamento quando timer está rodando
        window.addEventListener('beforeunload', (e) => {
            if (this.timers.challenge.isRunning && !this.timers.challenge.isPaused) {
                e.preventDefault();
                e.returnValue = 'O tempo do desafio está correndo! Tem certeza que deseja sair?';
                return 'O tempo do desafio está correndo! Tem certeza que deseja sair?';
            }
        });
    }

    // ===== TIMER DE DESAFIO =====

    // Iniciar timer para um desafio
    startChallengeTimer(timeLimit, challengeId = null) {
        this.stopChallengeTimer(); // Parar timer anterior

        this.timers.challenge = {
            interval: null,
            remaining: timeLimit,
            total: timeLimit,
            isRunning: true,
            isPaused: false,
            challengeId: challengeId,
            startTime: Date.now()
        };

        this.updateChallengeTimerDisplay();

        // Iniciar intervalo
        this.timers.challenge.interval = setInterval(() => {
            this.updateChallengeTimer();
        }, 1000);

        // Configurar warnings
        this.setupWarningIntervals(timeLimit);

        console.log(`Timer iniciado: ${timeLimit}s para o desafio ${challengeId}`);
    }

    // Atualizar timer do desafio
    updateChallengeTimer() {
        if (!this.timers.challenge.isRunning || this.timers.challenge.isPaused) return;

        this.timers.challenge.remaining--;
        this.updateChallengeTimerDisplay();

        // Verificar warnings
        this.checkWarnings();

        // Verificar timeout
        if (this.timers.challenge.remaining <= 0) {
            this.handleChallengeTimeout();
        }
    }

    // Atualizar display do timer do desafio
    updateChallengeTimerDisplay() {
        if (!this.elements.challengeTimer) return;

        const minutes = Math.floor(this.timers.challenge.remaining / 60);
        const seconds = this.timers.challenge.remaining % 60;
        
        this.elements.challengeTimer.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Atualizar classes CSS baseado no tempo restante
        this.updateTimerVisualState();
    }

    // Atualizar estado visual do timer
    updateTimerVisualState() {
        const timerElement = this.elements.challengeTimer;
        if (!timerElement) return;

        const remaining = this.timers.challenge.remaining;
        const total = this.timers.challenge.total;

        timerElement.classList.remove('bg-info', 'bg-warning', 'bg-danger', 'bg-success');

        if (remaining <= 60) {
            timerElement.classList.add('bg-danger');
            timerElement.classList.add('pulse-danger');
        } else if (remaining <= 180) {
            timerElement.classList.add('bg-warning');
            timerElement.classList.remove('pulse-danger');
        } else if (remaining >= total * 0.8) {
            timerElement.classList.add('bg-success');
        } else {
            timerElement.classList.add('bg-info');
        }
    }

    // Configurar intervalos de warning
    setupWarningIntervals(timeLimit) {
        this.timers.warnings.triggered.clear();
        this.timers.warnings.intervals = this.warningIntervals
            .filter(interval => interval <= timeLimit)
            .sort((a, b) => b - a); // Ordenar do maior para o menor
    }

    // Verificar e disparar warnings
    checkWarnings() {
        const remaining = this.timers.challenge.remaining;
        const warnings = this.timers.warnings.intervals;

        for (const warningTime of warnings) {
            if (remaining === warningTime && !this.timers.warnings.triggered.has(warningTime)) {
                this.triggerWarning(warningTime);
                this.timers.warnings.triggered.add(warningTime);
                break;
            }
        }
    }

    // Disparar warning
    triggerWarning(seconds) {
        const minutes = Math.floor(seconds / 60);
        const message = minutes > 0 ? 
            `${minutes} minuto${minutes > 1 ? 's' : ''} restante${minutes > 1 ? 's' : ''}!` :
            `${seconds} segundo${seconds > 1 ? 's' : ''} restante${seconds > 1 ? 's' : ''}!`;

        this.showWarningNotification(message, seconds);
        this.playWarningSound(seconds);

        // Disparar callbacks
        this.onWarningCallbacks.forEach(callback => {
            callback(seconds, message);
        });

        console.log(`⚠️ Warning: ${message}`);
    }

    // Manipular timeout do desafio
    handleChallengeTimeout() {
        this.stopChallengeTimer();
        
        console.log('⏰ Timeout do desafio alcançado');

        // Disparar callbacks
        this.onTimeoutCallbacks.forEach(callback => {
            callback(this.timers.challenge.challengeId);
        });

        // Notificar usuário
        this.showTimeoutNotification();
    }

    // Parar timer do desafio
    stopChallengeTimer() {
        if (this.timers.challenge.interval) {
            clearInterval(this.timers.challenge.interval);
        }

        this.timers.challenge.isRunning = false;
        this.timers.challenge.isPaused = false;
        
        // Limpar warnings
        this.timers.warnings.triggered.clear();
    }

    // Pausar timer do desafio
    pauseChallengeTimer() {
        if (!this.timers.challenge.isRunning || this.timers.challenge.isPaused) return;

        this.timers.challenge.isPaused = true;
        this.timers.challenge.pauseTime = Date.now();
        
        if (this.timers.challenge.interval) {
            clearInterval(this.timers.challenge.interval);
        }

        console.log('Timer pausado');
    }

    // Continuar timer do desafio
    resumeChallengeTimer() {
        if (!this.timers.challenge.isRunning || !this.timers.challenge.isPaused) return;

        // Ajustar tempo restante baseado no tempo de pausa
        const pauseDuration = Math.floor((Date.now() - this.timers.challenge.pauseTime) / 1000);
        this.timers.challenge.remaining = Math.max(0, this.timers.challenge.remaining - pauseDuration);

        this.timers.challenge.isPaused = false;
        
        // Reiniciar intervalo
        this.timers.challenge.interval = setInterval(() => {
            this.updateChallengeTimer();
        }, 1000);

        console.log('Timer continuado');
    }

    // Alternar pausa/continuação
    togglePause() {
        if (this.timers.challenge.isPaused) {
            this.resumeChallengeTimer();
        } else {
            this.pauseChallengeTimer();
        }
    }

    // ===== TIMER TOTAL =====

    // Iniciar timer total
    startTotalTimer() {
        if (this.timers.total.isRunning) return;

        this.timers.total = {
            interval: null,
            elapsed: progressManager.totalTime || 0,
            isRunning: true,
            startTime: Date.now() - (progressManager.totalTime * 1000 || 0)
        };

        this.updateTotalTimerDisplay();

        this.timers.total.interval = setInterval(() => {
            this.updateTotalTimer();
        }, 1000);

        if (this.elements.timerStatus) {
            this.elements.timerStatus.textContent = 'Em andamento';
            this.elements.timerStatus.className = 'text-success';
        }

        console.log('Timer total iniciado');
    }

    // Atualizar timer total
    updateTotalTimer() {
        if (!this.timers.total.isRunning) return;

        this.timers.total.elapsed = Math.floor((Date.now() - this.timers.total.startTime) / 1000);
        this.updateTotalTimerDisplay();

        // Salvar a cada minuto
        if (this.timers.total.elapsed % 60 === 0) {
            this.saveTotalTime();
        }
    }

    // Atualizar display do timer total
    updateTotalTimerDisplay() {
        if (!this.elements.totalTimer || !this.elements.currentTime) return;

        const hours = Math.floor(this.timers.total.elapsed / 3600);
        const minutes = Math.floor((this.timers.total.elapsed % 3600) / 60);
        const seconds = this.timers.total.elapsed % 60;

        const timeString = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.elements.totalTimer.textContent = timeString;
        this.elements.currentTime.textContent = timeString;

        // Atualizar barra de progresso (baseado em 4 horas máximo)
        this.updateTotalProgressBar();
    }

    // Atualizar barra de progresso total
    updateTotalProgressBar() {
        if (!this.elements.totalProgress) return;

        const maxTime = 4 * 3600; // 4 horas em segundos
        const progress = Math.min((this.timers.total.elapsed / maxTime) * 100, 100);
        
        this.elements.totalProgress.style.width = progress + '%';
        
        // Mudar cor baseado no progresso
        this.elements.totalProgress.classList.remove('bg-success', 'bg-warning', 'bg-danger');
        if (progress >= 90) {
            this.elements.totalProgress.classList.add('bg-danger');
        } else if (progress >= 75) {
            this.elements.totalProgress.classList.add('bg-warning');
        } else {
            this.elements.totalProgress.classList.add('bg-success');
        }
    }

    // Parar timer total
    stopTotalTimer() {
        if (this.timers.total.interval) {
            clearInterval(this.timers.total.interval);
        }

        this.timers.total.isRunning = false;
        
        if (this.elements.timerStatus) {
            this.elements.timerStatus.textContent = 'Concluído';
            this.elements.timerStatus.className = 'text-info';
        }

        this.saveTotalTime();
        console.log('Timer total parado');
    }

    // ===== UTILITÁRIOS =====

    // Salvar tempo total
    saveTotalTime() {
        if (typeof progressManager !== 'undefined') {
            progressManager.totalTime = this.timers.total.elapsed;
            
            // Salvar no servidor (se disponível)
            if (typeof stationCore !== 'undefined' && stationCore.saveProgress) {
                stationCore.saveProgress();
            }
        }
    }

    // Manipular página oculta
    handlePageHidden() {
        if (this.timers.challenge.isRunning && !this.timers.challenge.isPaused) {
            this.pauseChallengeTimer();
            console.log('Timer pausado automaticamente (página oculta)');
        }
    }

    // Manipular página visível
    handlePageVisible() {
        if (this.timers.challenge.isRunning && this.timers.challenge.isPaused) {
            this.resumeChallengeTimer();
            console.log('Timer continuado automaticamente (página visível)');
        }
    }

    // ===== NOTIFICAÇÕES E FEEDBACK =====

    // Mostrar notificação de warning
    showWarningNotification(message, seconds) {
        if (window.questionSystem && questionSystem.showToast) {
            const urgency = seconds <= 60 ? 'error' : seconds <= 180 ? 'warning' : 'info';
            questionSystem.showToast(`⏰ ${message}`, urgency);
        }
    }

    // Mostrar notificação de timeout
    showTimeoutNotification() {
        if (window.questionSystem && questionSystem.showToast) {
            questionSystem.showToast('⏰ Tempo esgotado! O desafio será reiniciado.', 'error');
        }
    }

    // Tocar som de warning
    playWarningSound(seconds) {
        // Implementação básica - pode ser expandida com Web Audio API
        if (seconds <= 30 && window.questionSystem) {
            questionSystem.showToast('🔔 Tempo crítico!', 'error');
        }
    }

    // ===== CALLBACKS E EVENTOS =====

    // Registrar callback para warnings
    onWarning(callback) {
        this.onWarningCallbacks.push(callback);
    }

    // Registrar callback para timeout
    onTimeout(callback) {
        this.onTimeoutCallbacks.push(callback);
    }

    // ===== GETTERS E INFO =====

    // Obter informações do timer atual
    getTimerInfo() {
        return {
            challenge: {
                remaining: this.timers.challenge.remaining,
                total: this.timers.challenge.total,
                isRunning: this.timers.challenge.isRunning,
                isPaused: this.timers.challenge.isPaused,
                percentage: this.timers.challenge.total > 0 ? 
                    Math.round((this.timers.challenge.remaining / this.timers.challenge.total) * 100) : 0
            },
            total: {
                elapsed: this.timers.total.elapsed,
                isRunning: this.timers.total.isRunning,
                formatted: this.formatTime(this.timers.total.elapsed)
            }
        };
    }

    // Formatar tempo para exibição
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    // Reiniciar todos os timers
    resetAllTimers() {
        this.stopChallengeTimer();
        this.stopTotalTimer();
        
        this.timers = {
            challenge: {
                interval: null,
                remaining: 0,
                total: 0,
                isRunning: false,
                isPaused: false
            },
            total: {
                interval: null,
                elapsed: 0,
                isRunning: false,
                startTime: null
            },
            warnings: {
                intervals: [],
                triggered: new Set()
            }
        };

        if (this.elements.challengeTimer) {
            this.elements.challengeTimer.textContent = '00:00';
            this.elements.challengeTimer.className = 'badge bg-info fs-6';
        }

        console.log('Todos os timers reiniciados');
    }
}

// Inicializar o sistema de timers
document.addEventListener('DOMContentLoaded', function() {
    window.timerSystem = new TimerSystem();
    console.log('Sistema de timers inicializado');

    // Configurar callbacks padrão
    timerSystem.onTimeout((challengeId) => {
        if (typeof stationCore !== 'undefined') {
            stationCore.challengeTimeOut();
        }
    });

    timerSystem.onWarning((seconds, message) => {
        // Feedback visual adicional para warnings críticos
        if (seconds <= 30) {
            document.body.classList.add('warning-critical');
            setTimeout(() => {
                document.body.classList.remove('warning-critical');
            }, 1000);
        }
    });
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimerSystem };
} else {
    window.TimerSystem = TimerSystem;
}