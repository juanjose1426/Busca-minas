// Componente para cada celda
class BuscaminasCelda extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.celda = null;
        this.onClick = null;
        this.onRightClick = null;
        this.gameOver = false;
    }

    connectedCallback() {
        this.render();
        this.addEventListeners();
    }

    static get observedAttributes() {
        return ['data-celda', 'data-gameover'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-celda') {
            this.celda = JSON.parse(newValue);
        }
        if (name === 'data-gameover') {
            this.gameOver = newValue === 'true';
        }
        this.render();
    }

    render() {
        const celda = this.celda;
        if (!celda) return;

        const style = `
            <style>
                .celda {
                    width: var(--celda-size, 44px);
                    height: var(--celda-size, 44px);
                    border: 2px outset var(--primary-900);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: var(--font-weight-bold);
                    font-size: var(--font-size-lg);
                    cursor: pointer;
                    user-select: none;
                    transition: all var(--transition-fast);
                    border-radius: var(--border-radius-sm);
                    position: relative;
                }

                .oculta {
                    background: linear-gradient(145deg, var(--primary-700), var(--primary-900));
                    border: 2px solid var(--primary-900);
                    box-shadow: var(--shadow-inner),
                                2px 2px 4px rgba(0, 0, 0, 0.3);
                }

                .revelada {
                    background: var(--gray-200);
                    border: 1px solid var(--gray-300);
                    box-shadow: var(--shadow-inner);
                }

                .mina {
                    background: var(--error-500);
                    animation: explode 0.3s ease-out;
                }

                .numero-1 { color: var(--primary-600); }
                .numero-2 { color: var(--success-600); }
                .numero-3 { color: var(--error-600); }
                .numero-4 { color: #8e44ad; }
                .numero-5 { color: var(--warning-600); }
                .numero-6 { color: #16a085; }
                .numero-7 { color: var(--gray-800); }
                .numero-8 { color: var(--gray-600); }

                @keyframes explode {
                    0% { transform: scale(0.8); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }

                @media (prefers-color-scheme: dark) {
                    .revelada {
                        background: var(--gray-700);
                        border-color: var(--gray-600);
                    }
                }
            </style>
        `;

        const content = this.getCeldaContent();
        const className = this.getCeldaClassName();

        this.shadowRoot.innerHTML = `
            ${style}
            <div class="celda ${className}">${content}</div>
        `;
    }

    getCeldaContent() {
        const celda = this.celda;
        if (!celda) return '';

        if (celda.revelada) {
            if (celda.esMina) {
                return '💣';
            }
            return celda.minasAlrededor > 0 ? celda.minasAlrededor : '';
        }
        if (celda.bandera) {
            return '🚩';
        }
        return '';
    }

    getCeldaClassName() {
        const celda = this.celda;
        if (!celda) return '';

        let className = '';
        if (celda.revelada) {
            className += 'revelada ';
            if (celda.esMina) {
                className += 'mina';
            } else if (celda.minasAlrededor > 0) {
                className += `numero-${celda.minasAlrededor}`;
            }
        } else {
            className += 'oculta';
        }
        return className;
    }

    addEventListeners() {
        this.shadowRoot.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.onClick && !this.gameOver && !this.celda.revelada && !this.celda.bandera) {
                this.onClick();
            }
        });

        this.shadowRoot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.onRightClick && !this.gameOver && !this.celda.revelada) {
                this.onRightClick();
            }
        });

        // Soporte para touch largo (bandera)
        let touchTimer;
        this.shadowRoot.addEventListener('touchstart', (e) => {
            touchTimer = setTimeout(() => {
                e.preventDefault();
                if (this.onRightClick && !this.gameOver && !this.celda.revelada) {
                    this.onRightClick();
                }
            }, 500);
        });

        this.shadowRoot.addEventListener('touchend', () => {
            clearTimeout(touchTimer);
        });

        this.shadowRoot.addEventListener('touchmove', () => {
            clearTimeout(touchTimer);
        });
    }
}

customElements.define('buscaminas-celda', BuscaminasCelda);