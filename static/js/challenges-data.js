// Dados completos dos 15 desafios
const challenges = {
    1: {
        id: 1,
        title: "Identificação segura do recém-nascido na maternidade",
        theme: "Maternidade - Berçario",
        background: "/static/img/scenarios/maternidade-bercario.jpg",
        timeLimit: 900, // 15 minutos em segundos
        items: [
            { id: "pulseira", x: 25, y: 60, icon: "bi-card-checklist", title: "Pulseira de Identificação" },
            { id: "documentacao", x: 65, y: 30, icon: "bi-file-text", title: "Documentação" },
            { id: "leitor", x: 45, y: 45, icon: "bi-upc-scan", title: "Leitor de Código de Barras" },
            { id: "conferencia", x: 75, y: 70, icon: "bi-clipboard-check", title: "Lista de Conferência" }
        ],
        questions: [
            {
                id: "q1",
                text: "Quais informações devem constar obrigatoriamente na pulseira de identificação do recém-nascido?",
                options: [
                    { id: "a", text: "Apenas nome da mãe e data de nascimento" },
                    { id: "b", text: "Nome completo da mãe, data e hora de nascimento, sexo e número de registro" },
                    { id: "c", text: "Apenas o primeiro nome da mãe e o sexo do bebê" },
                    { id: "d", text: "Nome do médico responsável e tipo de parto" }
                ],
                correctAnswer: "b",
                points: 10
            },
            {
                id: "q2",
                text: "Quando a pulseira de identificação deve ser colocada no recém-nascido?",
                options: [
                    { id: "a", text: "Imediatamente após o nascimento, ainda na sala de parto" },
                    { id: "b", text: "Após o primeiro banho, na unidade neonatal" },
                    { id: "c", text: "No momento da alta hospitalar" },
                    { id: "d", text: "Somente se o bebê for transferido para outra unidade" }
                ],
                correctAnswer: "a",
                points: 10
            },
            {
                id: "q3",
                text: "Qual é o procedimento correto em caso de perda da pulseira de identificação?",
                options: [
                    { id: "a", text: "Confeccionar uma nova pulseira com os mesmos dados, seguindo o protocolo de identificação" },
                    { id: "b", text: "Esperar a alta hospitalar para resolver a situação" },
                    { id: "c", text: "Usar uma pulseira provisória sem todos os dados" },
                    { id: "d", text: "Não é necessário substituir, pois o bebê já está registrado" }
                ],
                correctAnswer: "a",
                points: 10
            }
        ],
        hints: [
            {
                text: "A identificação segura é o primeiro passo para garantir a segurança do paciente. Todas as informações devem ser verificadas por pelo menos dois profissionais.",
                penalty: 2
            },
            {
                text: "A pulseira deve ser resistente à água e permanecer no recém-nascido durante toda a internação.",
                penalty: 2
            }
        ]
    },
    2: {
        id: 2,
        title: "Prevenção de erros na administração de medicamentos pediátricos",
        theme: "Farmácia e Administração de Medicamentos",
        background: "/static/img/scenarios/farmacia-pediatrica.jpg",
        timeLimit: 1200, // 20 minutos
        items: [
            { id: "bomba-infusao", x: 30, y: 40, icon: "bi-droplet", title: "Bomba de Infusão" },
            { id: "medicamentos", x: 60, y: 50, icon: "bi-capsule", title: "Medicamentos" },
            { id: "prontuario", x: 45, y: 65, icon: "bi-journal-medical", title: "Prontuário" },
            { id: "calculadora", x: 70, y: 30, icon: "bi-calculator", title: "Calculadora de Dosagem" }
        ],
        questions: [
            {
                id: "q1",
                text: "Qual é a regra de ouro para administração segura de medicamentos em pediatria?",
                options: [
                    { id: "a", text: "Administrar sempre a dose máxima para garantir efeito" },
                    { id: "b", text: "Verificar as cinco certas: paciente certo, medicamento certo, dose certa, via certa e hora certa" },
                    { id: "c", text: "Priorizar a via oral por ser mais segura" },
                    { id: "d", text: "Seguir sempre a prescrição médica, mesmo que pareça incorreta" }
                ],
                correctAnswer: "b",
                points: 10
            },
            {
                id: "q2",
                text: "Ao calcular a dose de um medicamento para uma criança de 15kg, com dose recomendada de 10mg/kg/dia, qual é a dose diária total?",
                options: [
                    { id: "a", text: "15mg" },
                    { id: "b", text: "50mg" },
                    { id: "c", text: "150mg" },
                    { id: "d", text: "100mg" }
                ],
                correctAnswer: "c",
                points: 15
            },
            {
                id: "q3",
                text: "O que fazer ao identificar uma possível incompatibilidade entre medicamentos prescritos?",
                options: [
                    { id: "a", text: "Administrar os medicamentos e observar reações" },
                    { id: "b", text: "Suspender a administração até nova prescrição médica" },
                    { id: "c", text: "Consultar o farmacêutico ou protocolos de compatibilidade" },
                    { id: "d", text: "Diluir os medicamentos em maior volume de solução" }
                ],
                correctAnswer: "c",
                points: 10
            }
        ],
        hints: [
            {
                text: "Sempre confirme o peso atual da criança antes de calcular doses. Pesar a criança diariamente em casos de medicações de janela terapêutica estreita.",
                penalty: 2
            },
            {
                text: "Use sempre a regra dos 5 certos e peça para um colega verificar cálculos complexos ou medicamentos de alto risco.",
                penalty: 2
            }
        ]
    },
    // Os demais 13 desafios seguiriam a mesma estrutura...
    // [3 a 15]...
};

// Chaves de conquista para cada desafio
const challengeKeys = {
    1: { type: "bronze", name: "Identificação Segura" },
    2: { type: "silver", name: "Medicação Segura" },
    // [3 a 15]...
};

// Pontuação por tipo de chave
const keyScores = {
    bronze: 10,
    silver: 20,
    gold: 30
};

// Exportar para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { challenges, challengeKeys, keyScores };
}