// Gerenciador de Progresso do Usuário
// Controla pontuação, chaves conquistadas, dicas usadas e estado dos desafios

class ProgressManager {
    constructor() {
        this.score = 0;
        this.hintsUsed = 0;
        this.earnedKeys = [];
        this.answeredQuestions = {};
        this.unlockedChallenges = [1]; // Começa apenas com o primeiro desafio liberado
        this.currentChallenge = 1;
        this.challengeStartTime = null;
        this.totalTime = 0;
    }

    // Inicializar a partir de dados salvos
    initializeFromSavedData(savedData) {
        if (savedData) {
            this.score = savedData.score || 0;
            this.hintsUsed = savedData.hintsUsed || 0;
            this.earnedKeys = savedData.earnedKeys || [];
            this.answeredQuestions = savedData.answeredQuestions || {};
            this.unlockedChallenges = savedData.unlockedChallenges || [1];
            this.totalTime = savedData.totalTime || 0;
            this.updateUnlockedChallenges();
        }
    }

    // Responder uma pergunta
    answerQuestion(challengeId, questionId, isCorrect, points) {
        if (!this.answeredQuestions[challengeId]) {
            this.answeredQuestions[challengeId] = [];
        }
        
        const answerRecord = {
            questionId: questionId,
            isCorrect: isCorrect,
            points: isCorrect ? points : 0,
            timestamp: new Date().toISOString()
        };
        
        this.answeredQuestions[challengeId].push(answerRecord);
        
        if (isCorrect) {
            this.score += points;
        }
        
        return isCorrect;
    }

    // Usar uma dica
    useHint(penalty) {
        this.hintsUsed++;
        this.score = Math.max(0, this.score - penalty); // Não deixar pontuação negativa
        return penalty;
    }

    // Verificar se um desafio está completo
    isChallengeComplete(challengeId) {
        const challenge = window.challengeData?.challenges[challengeId];
        if (!challenge || !this.answeredQuestions[challengeId]) return false;
        
        // Para quizzes, verificar todas as perguntas respondidas
        if (challenge.type === 'quiz') {
            return this.answeredQuestions[challengeId].length >= challenge.questions.length;
        }
        
        // Para outros tipos de desafio, considerar completo se houver pelo menos uma resposta correta
        return this.answeredQuestions[challengeId].some(answer => answer.isCorrect);
    }

    // Completar um desafio e conquistar chave
    completeChallenge(challengeId, timePercentage) {
        const challenge = window.challengeData?.challenges[challengeId];
        if (!challenge) return null;

        // Determinar tipo de chave baseado no desempenho de tempo
        let keyType = 'bronze';
        if (timePercentage >= 66) keyType = 'gold';
        else if (timePercentage >= 33) keyType = 'silver';

        const keyPoints = { bronze: 10, silver: 20, gold: 30 }[keyType] || 10;
        const challengeBonus = Math.floor(timePercentage / 10) * 5; // Bônus adicional baseado no tempo
        
        const totalPoints = keyPoints + challengeBonus;

        // Adicionar chave conquistada
        if (challenge.keyReward && !this.earnedKeys.includes(challenge.keyReward)) {
            this.earnedKeys.push(challenge.keyReward);
            this.score += totalPoints;
        }

        // Liberar próximo desafio
        this.updateUnlockedChallenges();

        return {
            score: totalPoints,
            keyType: keyType,
            key: challenge.keyReward,
            bonus: challengeBonus
        };
    }

    // Atualizar desafios desbloqueados baseado nas chaves conquistadas
    updateUnlockedChallenges() {
        this.unlockedChallenges = [1]; // Sempre começa com o primeiro desafio
        
        for (let i = 2; i <= 15; i++) {
            const challenge = window.challengeData?.challenges[i];
            if (challenge && this.earnedKeys.includes(challenge.requiredKey)) {
                this.unlockedChallenges.push(i);
            }
        }
    }

    // Verificar se um desafio está desbloqueado
    isChallengeUnlocked(challengeId) {
        return this.unlockedChallenges.includes(challengeId);
    }

    // Obter o próximo desafio disponível
    getNextAvailableChallenge() {
        for (let i = 1; i <= 15; i++) {
            if (this.isChallengeUnlocked(i) && !this.isChallengeComplete(i)) {
                return i;
            }
        }
        return null; // Todos os desafios completos
    }

    // Iniciar temporizador do desafio
    startChallengeTimer() {
        this.challengeStartTime = Date.now();
    }

    // Finalizar temporizador do desafio e calcular tempo decorrido
    endChallengeTimer() {
        if (!this.challengeStartTime) return 0;
        
        const elapsedTime = Math.floor((Date.now() - this.challengeStartTime) / 1000);
        this.totalTime += elapsedTime;
        this.challengeStartTime = null;
        
        return elapsedTime;
    }

    // Calcular porcentagem de tempo restante
    calculateTimePercentage(elapsedTime, timeLimit) {
        const timeUsed = elapsedTime;
        const timePercentage = Math.max(0, Math.min(100, ((timeLimit - timeUsed) / timeLimit) * 100));
        return timePercentage;
    }

    // Obter progresso geral
    getOverallProgress() {
        const completed = this.unlockedChallenges.filter(challengeId => 
            this.isChallengeComplete(challengeId)
        ).length;

        return {
            completed: completed,
            total: 15,
            percentage: Math.round((completed / 15) * 100),
            score: this.score,
            hintsUsed: this.hintsUsed,
            totalTime: this.totalTime,
            earnedKeys: this.earnedKeys.slice(),
            unlockedChallenges: this.unlockedChallenges.slice()
        };
    }

    // Obter estatísticas específicas do desafio
    getChallengeStats(challengeId) {
        const answers = this.answeredQuestions[challengeId] || [];
        const correctAnswers = answers.filter(a => a.isCorrect).length;
        const totalQuestions = window.challengeData?.challenges[challengeId]?.questions?.length || answers.length;
        
        return {
            completed: this.isChallengeComplete(challengeId),
            correctAnswers: correctAnswers,
            totalQuestions: totalQuestions,
            accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
            attempts: answers.length
        };
    }

    // Preparar dados para salvamento
    getSaveData() {
        return {
            score: this.score,
            hintsUsed: this.hintsUsed,
            earnedKeys: this.earnedKeys.slice(),
            answeredQuestions: {...this.answeredQuestions},
            unlockedChallenges: this.unlockedChallenges.slice(),
            totalTime: this.totalTime
        };
    }

    // Reiniciar progresso
    resetProgress() {
        this.score = 0;
        this.hintsUsed = 0;
        this.earnedKeys = [];
        this.answeredQuestions = {};
        this.unlockedChallenges = [1];
        this.currentChallenge = 1;
        this.totalTime = 0;
        this.challengeStartTime = null;
    }

    // Exportar para relatório
    exportProgressReport() {
        const progress = this.getOverallProgress();
        const report = {
            summary: progress,
            challenges: {}
        };

        for (let i = 1; i <= 15; i++) {
            report.challenges[i] = this.getChallengeStats(i);
        }

        return report;
    }
}

// Instância global do gerenciador de progresso
const progressManager = new ProgressManager();

// Carregar progresso salvo se disponível
document.addEventListener('DOMContentLoaded', function() {
    const savedProgress = localStorage.getItem('escapeRoomProgress');
    if (savedProgress) {
        try {
            const parsedData = JSON.parse(savedProgress);
            progressManager.initializeFromSavedData(parsedData);
            console.log('Progresso carregado:', progressManager.getOverallProgress());
        } catch (error) {
            console.error('Erro ao carregar progresso:', error);
        }
    }
});

// Salvar progresso automaticamente antes de sair da página
window.addEventListener('beforeunload', function() {
    const saveData = progressManager.getSaveData();
    localStorage.setItem('escapeRoomProgress', JSON.stringify(saveData));
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProgressManager, progressManager };
} else {
    window.progressManager = progressManager;
}