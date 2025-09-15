// /static/js/config/progress_manager.js

/**
 * Objeto global para gerenciar a comunicação com a API do jogo no backend.
 * Ele lida com o progresso do jogador, pontuações e estado do desafio.
 * Esta versão simplificada (sem IIFE) garante acessibilidade global.
 */
const progressManager = {

    // URL base da nossa API, registrada no __init__.py
    API_BASE_URL: '/api/game',

    /**
     * Função central para fazer requisições à API e tratar respostas de forma robusta.
     * @param {string} endpoint - O endpoint da API a ser chamado (ex: '/progress').
     * @param {object} options - Opções para a requisição fetch (method, headers, body).
     * @returns {Promise<object>} - A resposta JSON do servidor.
     */
    async apiRequest(endpoint, options = {}) {
        try {
            // Define 'GET' como método padrão se nenhum for fornecido.
            const method = options.method || 'GET';

            const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            // Se a resposta não for OK (ex: 401, 403, 404, 500), trata como um erro.
            if (!response.ok) {
                // Tenta ler a resposta como JSON, mas se falhar (ex: for HTML), cria um erro padrão.
                const errorData = await response.json().catch(() => ({ 
                    error: `O servidor respondeu com um erro HTTP ${response.status}.` 
                }));
                console.error(`API Error ${response.status}:`, errorData.error || response.statusText);
                return { success: false, error: errorData.error || `HTTP error ${response.status}` };
            }

            // Se a resposta for OK mas não tiver conteúdo (ex: 204 No Content), retorna sucesso.
            if (response.status === 204) {
                return { success: true };
            }
            
            // Se tudo deu certo, retorna a resposta em formato JSON.
            return await response.json();

        } catch (error) {
            console.error('Erro de rede ou na requisição fetch:', error);
            return { success: false, error: 'Erro de rede. Por favor, verifique sua conexão.' };
        }
    },

    /**
     * Busca o progresso atual do jogador no servidor.
     * @returns {Promise<object|null>} - Um objeto com os dados do progresso ou null em caso de falha.
     */
    async getProgress() {
        // Requisições GET não precisam de corpo (body) e o método já é 'GET' por padrão.
        return this.apiRequest('/progress');
    },

    /**
     * Informa ao backend que o jogador iniciou um desafio.
     * @param {number} challengeId - O ID do desafio que está sendo iniciado.
     * @returns {Promise<boolean>} - True se o desafio foi iniciado com sucesso, false caso contrário.
     */
    async startChallenge(challengeId) {
        return this.apiRequest('/challenge/start', {
            method: 'POST', // Especifica o método
            body: JSON.stringify({ challenge_id: challengeId }),
        });
    },

    /**
     * Envia os resultados de um desafio concluído para o backend.
     * @param {number} challengeId - O ID do desafio concluído.
     * @param {number} score - A pontuação obtida no desafio.
     * @param {number} timeSpent - O tempo gasto no desafio (em segundos).
     * @param {string} keyEarned - A chave que foi ganha.
     * @returns {Promise<object|null>} - A resposta do servidor ou null em caso de falha.
     */
    async completeChallenge(challengeId, score, timeSpent, keyEarned) {
        return this.apiRequest('/challenge/complete', {
            method: 'POST',
            body: JSON.stringify({
                challenge_id: challengeId,
                score: score,
                time_spent: timeSpent,
                key_earned: keyEarned,
            }),
        });
    },
};
