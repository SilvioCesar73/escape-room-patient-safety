// Sistema de Gerenciamento de Modais
// Controla todos os modais da aplicação de forma centralizada

class ModalSystem {
    constructor() {
        this.modals = new Map();
        this.currentModal = null;
        this.modalHistory = [];
        this.backdropStack = [];
        
        this.initializeModals();
        this.initializeEventListeners();
        this.setupKeyboardNavigation();
    }

    // Inicializar todos os modais da página
    initializeModals() {
        const modalElements = document.querySelectorAll('.modal');
        
        modalElements.forEach(modalElement => {
            const modalId = modalElement.id;
            const modal = new bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            
            this.modals.set(modalId, {
                instance: modal,
                element: modalElement,
                isOpen: false,
                config: {
                    closable: modalElement.dataset.closable !== 'false',
                    persistent: modalElement.dataset.persistent === 'true'
                }
            });

            // Eventos individuais de cada modal
            modalElement.addEventListener('show.bs.modal', (e) => {
                this.handleModalShow(modalId, e);
            });

            modalElement.addEventListener('shown.bs.modal', (e) => {
                this.handleModalShown(modalId, e);
            });

            modalElement.addEventListener('hide.bs.modal', (e) => {
                this.handleModalHide(modalId, e);
            });

            modalElement.addEventListener('hidden.bs.modal', (e) => {
                this.handleModalHidden(modalId, e);
            });
        });

        console.log(`Sistema de modais inicializado com ${this.modals.size} modais`);
    }

    // Inicializar listeners de eventos globais
    initializeEventListeners() {
        // Fechar modal ao clicar no backdrop (se permitido)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                const topModal = this.getTopModal();
                if (topModal && this.modals.get(topModal).config.closable) {
                    this.hide(topModal);
                }
            }
        });

        // Fechar modal ao pressionar Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const topModal = this.getTopModal();
                if (topModal && this.modals.get(topModal).config.closable) {
                    this.hide(topModal);
                    e.preventDefault();
                }
            }
        });
    }

    // Configurar navegação por teclado
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.currentModal) return;

            // Navegação por tab entre elementos focáveis
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }

            // Enter para submeter formulários
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                this.handleEnterKey(e);
            }
        });
    }

    // Mostrar modal
    show(modalId, options = {}) {
        const modal = this.modals.get(modalId);
        if (!modal) {
            console.error(`Modal ${modalId} não encontrado`);
            return false;
        }

        // Configurações específicas para este show
        const config = {
            data: options.data || {},
            onShow: options.onShow,
            onHide: options.onHide,
            onConfirm: options.onConfirm,
            onCancel: options.onCancel
        };

        // Preparar modal antes de mostrar
        this.prepareModal(modalId, config);

        // Adicionar à pilha de histórico
        this.modalHistory.push(modalId);
        this.currentModal = modalId;

        // Mostrar modal
        modal.instance.show();
        modal.isOpen = true;

        // Executar callback onShow
        if (config.onShow) {
            config.onShow(modal.element, config.data);
        }

        return true;
    }

    // Esconder modal
    hide(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal || !modal.isOpen) return false;

        // Executar validação antes de esconder
        if (!this.validateBeforeHide(modalId)) {
            return false;
        }

        modal.instance.hide();
        modal.isOpen = false;

        // Remover do histórico
        this.modalHistory = this.modalHistory.filter(id => id !== modalId);
        this.currentModal = this.modalHistory[this.modalHistory.length - 1] || null;

        return true;
    }

    // Esconder todos os modais
    hideAll() {
        this.modals.forEach((modal, modalId) => {
            if (modal.isOpen) {
                this.hide(modalId);
            }
        });
    }

    // Esconder modal atual
    hideCurrent() {
        if (this.currentModal) {
            return this.hide(this.currentModal);
        }
        return false;
    }

    // Preparar modal antes de mostrar
    prepareModal(modalId, config) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        // Armazenar configuração temporária
        modal._tempConfig = config;

        // Preencher dados se fornecidos
        if (config.data) {
            this.populateModalData(modal.element, config.data);
        }

        // Configurar botões de ação
        this.setupActionButtons(modal.element, config);
    }

    // Popular modal com dados
    populateModalData(modalElement, data) {
        // Preencher elementos com data attributes
        const dataElements = modalElement.querySelectorAll('[data-field]');
        
        dataElements.forEach(element => {
            const fieldName = element.dataset.field;
            if (data[fieldName] !== undefined) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                    element.value = data[fieldName];
                } else {
                    element.textContent = data[fieldName];
                }
            }
        });

        // Preencher elementos com data-text
        const textElements = modalElement.querySelectorAll('[data-text]');
        textElements.forEach(element => {
            const textKey = element.dataset.text;
            if (data[textKey] !== undefined) {
                element.textContent = data[textKey];
            }
        });

        // Preencher elementos com data-html
        const htmlElements = modalElement.querySelectorAll('[data-html]');
        htmlElements.forEach(element => {
            const htmlKey = element.dataset.html;
            if (data[htmlKey] !== undefined) {
                element.innerHTML = data[htmlKey];
            }
        });
    }

    // Configurar botões de ação
    setupActionButtons(modalElement, config) {
        // Botão de confirmar
        const confirmBtn = modalElement.querySelector('[data-action="confirm"]');
        if (confirmBtn && config.onConfirm) {
            confirmBtn.onclick = () => {
                const result = this.collectFormData(modalElement);
                if (this.validateForm(modalElement, result)) {
                    config.onConfirm(result);
                    this.hide(modalElement.id);
                }
            };
        }

        // Botão de cancelar
        const cancelBtn = modalElement.querySelector('[data-action="cancel"]');
        if (cancelBtn && config.onCancel) {
            cancelBtn.onclick = () => {
                config.onCancel();
                this.hide(modalElement.id);
            };
        }

        // Botão de fechar
        const closeBtn = modalElement.querySelector('[data-action="close"]');
        if (closeBtn) {
            closeBtn.onclick = () => {
                this.hide(modalElement.id);
            };
        }
    }

    // Coletar dados do formulário do modal
    collectFormData(modalElement) {
        const form = modalElement.querySelector('form');
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Adicionar dados de elementos com data-field
        const fieldElements = modalElement.querySelectorAll('[data-field]');
        fieldElements.forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                data[element.dataset.field] = element.value;
            }
        });

        return data;
    }

    // Validar formulário do modal
    validateForm(modalElement, data) {
        const form = modalElement.querySelector('form');
        if (!form) return true;

        // Validação HTML5 nativa
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        // Validação customizada
        const validateEvent = new CustomEvent('modal-validate', {
            bubbles: true,
            detail: { data, isValid: true }
        });

        form.dispatchEvent(validateEvent);

        return validateEvent.detail.isValid;
    }

    // Validar antes de esconder o modal
    validateBeforeHide(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal || !modal._tempConfig) return true;

        const form = modal.element.querySelector('form');
        if (form && modal._tempConfig.validateOnClose) {
            return this.validateForm(modal.element, this.collectFormData(modal.element));
        }

        return true;
    }

    // Manipular evento de show do modal
    handleModalShow(modalId, event) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        // Adicionar classes customizadas
        modal.element.classList.add('modal-shown');

        // Configurar foco no primeiro elemento interativo
        setTimeout(() => {
            this.focusFirstInput(modal.element);
        }, 100);

        // Disparar evento customizado
        this.dispatchModalEvent(modalId, 'modal-show', event);
    }

    // Manipular evento de shown do modal
    handleModalShown(modalId, event) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        // Configurar backdrop stacking
        this.setupBackdropStacking();

        // Disparar evento customizado
        this.dispatchModalEvent(modalId, 'modal-shown', event);
    }

    // Manipular evento de hide do modal
    handleModalHide(modalId, event) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        // Disparar evento customizado
        this.dispatchModalEvent(modalId, 'modal-hide', event);
    }

    // Manipular evento de hidden do modal
    handleModalHidden(modalId, event) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        // Limpar configuração temporária
        delete modal._tempConfig;

        // Remover classes customizadas
        modal.element.classList.remove('modal-shown');

        // Limpar formulários
        this.clearModalForms(modal.element);

        // Disparar evento customizado
        this.dispatchModalEvent(modalId, 'modal-hidden', event);
    }

    // Configurar stacking de backdrops
    setupBackdropStacking() {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((backdrop, index) => {
            backdrop.style.zIndex = 1040 + index * 10;
        });

        // Ajustar z-index dos modais
        this.modals.forEach((modal, modalId) => {
            if (modal.isOpen) {
                modal.element.style.zIndex = 1050 + this.modalHistory.indexOf(modalId) * 10;
            }
        });
    }

    // Focar no primeiro input do modal
    focusFirstInput(modalElement) {
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    // Limpar formulários do modal
    clearModalForms(modalElement) {
        const forms = modalElement.querySelectorAll('form');
        forms.forEach(form => form.reset());
    }

    // Manipular navegação por tab
    handleTabNavigation(event) {
        const modal = this.modals.get(this.currentModal);
        if (!modal) return;

        const focusableElements = modal.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    }

    // Manipular tecla Enter
    handleEnterKey(event) {
        const modal = this.modals.get(this.currentModal);
        if (!modal) return;

        const confirmBtn = modal.element.querySelector('[data-action="confirm"]');
        if (confirmBtn && !event.target.closest('textarea')) {
            confirmBtn.click();
            event.preventDefault();
        }
    }

    // Disparar evento customizado do modal
    dispatchModalEvent(modalId, eventName, originalEvent) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        const event = new CustomEvent(eventName, {
            bubbles: true,
            detail: {
                modalId: modalId,
                modalElement: modal.element,
                originalEvent: originalEvent,
                data: modal._tempConfig?.data || {}
            }
        });

        modal.element.dispatchEvent(event);
    }

    // Obter modal do topo da pilha
    getTopModal() {
        return this.modalHistory[this.modalHistory.length - 1] || null;
    }

    // Verificar se algum modal está aberto
    isAnyModalOpen() {
        return this.modalHistory.length > 0;
    }

    // Obter modal atual
    getCurrentModal() {
        return this.currentModal ? this.modals.get(this.currentModal) : null;
    }

    // Criar modal dinamicamente
    createDynamicModal(options) {
        const modalId = options.id || `modal-${Date.now()}`;
        
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog ${options.size ? `modal-${options.size}` : ''}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${options.title || ''}</h5>
                            ${options.closable !== false ? 
                                '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>' : ''}
                        </div>
                        <div class="modal-body">
                            ${options.content || ''}
                        </div>
                        ${options.footer !== false ? `
                            <div class="modal-footer">
                                ${options.cancelText ? 
                                    `<button type="button" class="btn btn-secondary" data-action="cancel">
                                        ${options.cancelText}
                                    </button>` : ''}
                                ${options.confirmText ? 
                                    `<button type="button" class="btn btn-primary" data-action="confirm">
                                        ${options.confirmText}
                                    </button>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        // Adicionar ao DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Inicializar e retornar
        this.initializeModals();
        return modalId;
    }

    // Mostrar modal de confirmação rápido
    confirm(options) {
        return new Promise((resolve) => {
            const modalId = this.createDynamicModal({
                title: options.title || 'Confirmação',
                content: options.message || 'Tem certeza que deseja continuar?',
                confirmText: options.confirmText || 'Confirmar',
                cancelText: options.cancelText || 'Cancelar',
                size: options.size || 'md',
                closable: options.closable !== false
            });

            this.show(modalId, {
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false),
                onHide: () => {
                    // Remover modal dinâmico após uso
                    setTimeout(() => {
                        const modalElement = document.getElementById(modalId);
                        if (modalElement) {
                            modalElement.remove();
                            this.modals.delete(modalId);
                        }
                    }, 100);
                }
            });
        });
    }

    // Mostrar modal de alerta rápido
    alert(options) {
        return new Promise((resolve) => {
            const modalId = this.createDynamicModal({
                title: options.title || 'Alerta',
                content: options.message || '',
                confirmText: options.confirmText || 'OK',
                cancelText: null,
                size: options.size || 'md',
                closable: options.closable !== false
            });

            this.show(modalId, {
                onConfirm: () => resolve(true),
                onHide: () => {
                    setTimeout(() => {
                        const modalElement = document.getElementById(modalId);
                        if (modalElement) {
                            modalElement.remove();
                            this.modals.delete(modalId);
                        }
                    }, 100);
                }
            });
        });
    }
}

// Inicializar o sistema de modais
document.addEventListener('DOMContentLoaded', function() {
    window.modalSystem = new ModalSystem();
    console.log('Sistema de modais inicializado');

    // Expor métodos globais úteis
    window.showModal = (modalId, options) => modalSystem.show(modalId, options);
    window.hideModal = (modalId) => modalSystem.hide(modalId);
    window.hideAllModals = () => modalSystem.hideAll();
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModalSystem };
} else {
    window.ModalSystem = ModalSystem;
}