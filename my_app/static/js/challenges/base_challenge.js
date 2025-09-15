// static/js/challenges/base_challenge.js

window.BaseChallenge = class BaseChallenge {
    constructor(challengeData) {
        this.challengeData = challengeData;
        this.challengeId = challengeData.id;
        this.scoreForThisChallenge = 0;
        this.startTime = 0; // Será definido após o início bem-sucedido
        this.timerInterval = null;
        this.remainingTime = 0;
        this.gameScenario = document.getElementById("game-scenario");

        if (!this.gameScenario) {
            console.error("Elemento 'game-scenario' não encontrado no DOM.");
        }
    }

    async startChallenge() {
        console.log("Iniciando desafio:", this.challengeId);

        try {
            const response = await fetch("/api/game/challenge/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    challenge_id: this.challengeId
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                alert(data.error || "Você não pode iniciar este desafio ainda. Complete os requisitos anteriores.");
                window.location.href = "/station"; // Redireciona se não puder iniciar
                return false;
            }

            console.log("Desafio iniciado com sucesso:", data);
            this.startTime = Date.now(); // Marca o tempo de início somente após sucesso
            return true;
        } catch (error) {
            console.error("Erro ao iniciar o desafio:", error);
            alert("Erro de conexão com o servidor ao iniciar o desafio.");
            window.location.href = "/station";
            return false;
        }
    }

    async completeChallenge(success) {
        clearInterval(this.timerInterval); // Para o cronômetro imediatamente

        console.log("Concluindo desafio:", this.challengeId, "Sucesso:", success);

        // Usa o novo método centralizado
        const results = this.finalizeAndPackageResults(
            this.wrongAnswers || 0,
            this.totalQuestions || 1
        );

        try {
            const response = await fetch("/api/game/challenge/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    challenge_id: results.challengeId,
                    challenge_type: results.challengeType,
                    score: results.finalScore,
                    time_spent: results.timeSpent,
                    wrong_answers: results.wrongAnswers,
                    total_questions: results.totalQuestions,
                    key_earned: results.keyReward,
                    // extras úteis para relatórios e debug
                    tempo_extra: results.tempoExtra,
                    error_factor: results.errorPenaltyFactor,
                    time_factor: results.timePenaltyFactor,
                    alpha: results.alpha,
                    beta: results.beta
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(
                    `Desafio concluído!\n` +
                    `Pontuação: ${results.finalScore}/${results.basePoints}\n` +
                    `Erros: ${results.wrongAnswers}/${results.totalQuestions}\n` +
                    `Tempo gasto: ${results.timeSpent}s`
                );
                console.log("Nova chave obtida:", data.new_key_earned);

                // >>> NOVO BLOCO: salvar também no station_results <<<
                try {
                    console.log(">>> Enviando para /api/station_result:", {
                        station_id: results.challengeId,
                        score: results.finalScore,
                        time_spent: results.timeSpent
                    });

                    const stationResp = await fetch("/api/station_result", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            station_id: results.challengeId,
                            score: results.finalScore,
                            time_spent: results.timeSpent
                        })
                    });

                    const stationData = await stationResp.json();
                    console.log(">>> Resposta do /api/station_result:", stationData);
                } catch (err) {
                    console.error("❌ Erro ao salvar no station_results:", err);
                }
                // <<< FIM DO NOVO BLOCO >>>

            } else {
                alert(data.message || "Falha ao salvar o progresso do desafio.");
            }
        } catch (error) {
            console.error("Erro de conexão ao concluir o desafio:", error);
            alert("Erro de conexão com o servidor. Seu progresso não pôde ser salvo.");
        } finally {
            // Sempre redireciona para a tela de estações
            window.location.href = "/station";
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    startChallengeTimer(timeLimit) {
        this.remainingTime = timeLimit;
        const timerDisplay = document.getElementById("challenge-timer");
        let alreadyWarned = false; // controla se já avisou

        const updateTimerDisplay = () => {
            if (timerDisplay) {
                timerDisplay.textContent = this.formatTime(this.remainingTime);
            }
        };

        updateTimerDisplay(); // Atualiza imediatamente

        this.timerInterval = setInterval(() => {
            this.remainingTime--;
            updateTimerDisplay();

            // Mostra aviso apenas uma vez, quando bater zero
            if (this.remainingTime === 0 && !alreadyWarned) {
                alreadyWarned = true;
                alert("⏰ Tempo esgotado! Você pode continuar, mas cada segundo a mais será penalizado.");
            }
        }, 1000);
    }

    updateScoreDisplay() {
        const scoreElement = document.getElementById("total-score");
        if (scoreElement) {
            scoreElement.textContent = this.scoreForThisChallenge;
        }
    }

    computeFinalScore(basePoints, timeLimit, timeSpent, wrongAnswers, totalQuestions) {
        // Pesos
        const alpha = 0.6; // penalização por erro
        const beta = 0.4;  // penalização por tempo extra

        // Casos-limite
        if (totalQuestions < 1) totalQuestions = 1;
        if (wrongAnswers > totalQuestions) wrongAnswers = totalQuestions;
        if (timeLimit < 1) timeLimit = 1;
        if (timeSpent < 0) timeSpent = 0;

        // Cálculo de tempo extra
        const tempoExtra = Math.max(0, timeSpent - timeLimit);

        // Fatores de penalização
        const errorPenaltyFactor = 1 - alpha * (wrongAnswers / totalQuestions);
        const timePenaltyFactor = 1 - beta * (tempoExtra / timeLimit);

        // Score bruto
        let finalScore = basePoints * errorPenaltyFactor * timePenaltyFactor;

        // Arredonda e limita no intervalo [0, basePoints]
        finalScore = Math.round(finalScore);
        finalScore = Math.max(0, Math.min(finalScore, basePoints));

        return {
            finalScore,
            tempoExtra,
            errorPenaltyFactor,
            timePenaltyFactor
        };
    }

    finalizeAndPackageResults(wrongAnswers, totalQuestions) {
        const basePoints = this.challengeData.points || 0;
        const timeLimit = this.challengeData.timeLimit || 1;
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        // Chama a função de cálculo
        const { finalScore, tempoExtra, errorPenaltyFactor, timePenaltyFactor } =
            this.computeFinalScore(basePoints, timeLimit, timeSpent, wrongAnswers, totalQuestions);

        // Atualiza score local (para exibição imediata)
        this.scoreForThisChallenge = finalScore;

        // Monta payload unificado
        return {
            challengeId: this.challengeId,
            challengeType: this.challengeData.type,
            basePoints,
            timeLimit,
            timeSpent,
            tempoExtra,
            totalQuestions,
            wrongAnswers,
            alpha: 0.6,
            beta: 0.4,
            finalScore,
            errorPenaltyFactor,
            timePenaltyFactor,
            keyReward: this.challengeData.keyReward
        };
    }
};
