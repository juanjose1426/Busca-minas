// Componente principal del juego
class BuscaminasGame extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.filas = 10;
        this.columnas = 10;
        this.minas = 15;
        this.tablero = [];
        this.juegoTerminado = false;
        this.juegoGanado = false;
        this.primerClick = true;
        this.banderasColocadas = 0;
        this.tiempoInicio = 0;
        this.tiempoTranscurrido = 0;
        this.temporizador = null;
    }

    connectedCallback() {
        this.inicializarJuego();
        this.render();
    }

    inicializarJuego() {
        this.tablero = this.crearTablero();
        this.juegoTerminado = false;
        this.juegoGanado = false;
        this.primerClick = true;
        this.banderasColocadas = 0;
        this.tiempoTranscurrido = 0;
        this.detenerTemporizador();
    }

    iniciarTemporizador() {
        this.tiempoInicio = Date.now();
        this.temporizador = setInterval(() => {
            this.tiempoTranscurrido = Math.floor((Date.now() - this.tiempoInicio) / 1000);
            this.actualizarUI();
        }, 1000);
    }

    detenerTemporizador() {
        if (this.temporizador) {
            clearInterval(this.temporizador);
            this.temporizador = null;
        }
    }

    crearTablero() {
        const tablero = [];
        for (let i = 0; i < this.filas; i++) {
            const fila = [];
            for (let j = 0; j < this.columnas; j++) {
                fila.push({
                    esMina: false,
                    revelada: false,
                    bandera: false,
                    minasAlrededor: 0,
                    x: i,
                    y: j
                });
            }
            tablero.push(fila);
        }
        return tablero;
    }

    colocarMinas(excluirX, excluirY) {
        let minasColocadas = 0;
        while (minasColocadas < this.minas) {
            const x = Math.floor(Math.random() * this.filas);
            const y = Math.floor(Math.random() * this.columnas);

            if (Math.abs(x - excluirX) <= 1 && Math.abs(y - excluirY) <= 1) {
                continue;
            }

            if (!this.tablero[x][y].esMina) {
                this.tablero[x][y].esMina = true;
                minasColocadas++;
            }
        }
        this.calcularMinasAlrededor();
    }

    calcularMinasAlrededor() {
        for (let i = 0; i < this.filas; i++) {
            for (let j = 0; j < this.columnas; j++) {
                if (!this.tablero[i][j].esMina) {
                    this.tablero[i][j].minasAlrededor = this.contarMinasAlrededor(i, j);
                }
            }
        }
    }

    contarMinasAlrededor(x, y) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const nuevoX = x + i;
                const nuevoY = y + j;
                if (nuevoX >= 0 && nuevoX < this.filas && nuevoY >= 0 && nuevoY < this.columnas) {
                    if (this.tablero[nuevoX][nuevoY].esMina) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    revelarCelda(x, y) {
        if (this.juegoTerminado) return;

        const celda = this.tablero[x][y];

        if (celda.revelada || celda.bandera) return;

        if (this.primerClick) {
            this.primerClick = false;
            this.colocarMinas(x, y);
            this.iniciarTemporizador();
        }

        celda.revelada = true;

        if (celda.esMina) {
            this.terminarJuego(false);
            return;
        }

        if (celda.minasAlrededor === 0) {
            this.revelarCeldasVacias(x, y);
        }

        this.verificarVictoria();
        this.render();
    }

    revelarCeldasVacias(x, y) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const nuevoX = x + i;
                const nuevoY = y + j;
                if (nuevoX >= 0 && nuevoX < this.filas && nuevoY >= 0 && nuevoY < this.columnas) {
                    const celdaAdyacente = this.tablero[nuevoX][nuevoY];
                    if (!celdaAdyacente.revelada && !celdaAdyacente.bandera) {
                        this.revelarCelda(nuevoX, nuevoY);
                    }
                }
            }
        }
    }

    alternarBandera(x, y) {
        if (this.juegoTerminado || this.tablero[x][y].revelada) return;

        const celda = this.tablero[x][y];
        celda.bandera = !celda.bandera;
        this.banderasColocadas += celda.bandera ? 1 : -1;
        this.render();
    }

    verificarVictoria() {
        for (let i = 0; i < this.filas; i++) {
            for (let j = 0; j < this.columnas; j++) {
                const celda = this.tablero[i][j];
                if (!celda.esMina && !celda.revelada) {
                    return;
                }
            }
        }
        this.terminarJuego(true);
    }

    terminarJuego(ganado) {
        this.juegoTerminado = true;
        this.juegoGanado = ganado;
        this.detenerTemporizador();

        if (!ganado) {
            for (let i = 0; i < this.filas; i++) {
                for (let j = 0; j < this.columnas; j++) {
                    if (this.tablero[i][j].esMina) {
                        this.tablero[i][j].revelada = true;
                    }
                }
            }
        }
        this.render();
    }

    reiniciarJuego() {
        this.inicializarJuego();
        this.render();
    }

    actualizarUI() {
        const statusElement = this.shadowRoot.querySelector('.game-status');
        const tiempoElement = this.shadowRoot.querySelector('#tiempo');
        const banderasElement = this.shadowRoot.querySelector('#banderas');

        if (statusElement) {
            statusElement.textContent = this.juegoTerminado ? 
                (this.juegoGanado ? '¡Ganaste! 🎉' : '¡Perdiste! 💥') : 
                'Juego en progreso ⏳';
            statusElement.className = `game-status ${this.juegoTerminado ? 
                (this.juegoGanado ? 'status-win' : 'status-lose') : 'status-playing'}`;
        }

        if (tiempoElement) {
            tiempoElement.textContent = this.tiempoTranscurrido;
        }

        if (banderasElement) {
            banderasElement.textContent = this.banderasColocadas;
        }
    }

    render() {
const style = `
    <style>
        :host {
            display: block;
            width: 100%;
            max-width: 100%;
        }
        
        .game-header {
            background: var(--bg-surface, #ffffff);
            padding: clamp(12px, 3vw, 24px);
            border-radius: clamp(8px, 2vw, 16px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            margin-bottom: clamp(12px, 3vw, 20px);
            text-align: center;
        }

        .game-title {
            color: var(--text-primary, #212121);
            font-size: clamp(18px, 5vw, 28px);
            font-weight: 700;
            margin-bottom: clamp(12px, 3vw, 20px);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: clamp(6px, 1.5vw, 12px);
        }

        .stats-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: clamp(8px, 2vw, 12px);
            margin-bottom: clamp(12px, 3vw, 20px);
            background: var(--gray-50, #fafafa);
            padding: clamp(12px, 3vw, 20px);
            border-radius: clamp(8px, 2vw, 12px);
            border: 1px solid var(--border-color, #e0e0e0);
        }

        .stat {
            text-align: center;
            padding: clamp(6px, 1.5vw, 8px);
        }

        .stat-value {
            font-size: clamp(16px, 4vw, 22px);
            font-weight: 700;
            color: var(--primary-700, #1976d2);
            display: block;
            line-height: 1;
            margin-bottom: clamp(4px, 1vw, 6px);
            font-variant-numeric: tabular-nums;
        }

        .stat-label {
            font-size: clamp(10px, 2.5vw, 12px);
            color: var(--text-secondary, #616161);
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.3px;
        }

        .controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: clamp(8px, 2vw, 12px);
            margin-bottom: clamp(12px, 3vw, 20px);
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: clamp(4px, 1vw, 8px);
            padding: clamp(10px, 2.5vw, 16px) clamp(12px, 3vw, 20px);
            border: none;
            border-radius: clamp(8px, 2vw, 12px);
            font-family: inherit;
            font-size: clamp(14px, 3.5vw, 16px);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            white-space: nowrap;
        }

        .btn-primary {
            background: var(--primary-500, #2196f3);
            color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .btn-success {
            background: var(--success-500, #4caf50);
            color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .btn:active {
            transform: translateY(0);
        }

        .game-status {
            padding: clamp(10px, 2.5vw, 20px);
            border-radius: clamp(8px, 2vw, 12px);
            font-weight: 700;
            font-size: clamp(14px, 3.5vw, 18px);
            text-align: center;
            margin-bottom: clamp(12px, 3vw, 20px);
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }

        .status-playing {
            background: var(--gray-100, #f5f5f5);
            color: var(--text-secondary, #616161);
            border-color: var(--gray-300, #e0e0e0);
        }

        .status-win {
            background: var(--success-500, #4caf50);
            color: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .status-lose {
            background: var(--error-500, #f44336);
            color: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .tablero-container {
            background: var(--bg-surface, #ffffff);
            padding: clamp(12px, 3vw, 24px);
            border-radius: clamp(8px, 2vw, 16px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: auto;
            margin-bottom: clamp(12px, 3vw, 20px);
            max-width: 100%;
        }

        .tablero {
            display: grid;
            grid-template-columns: repeat(${this.columnas}, minmax(28px, 1fr));
            grid-gap: 2px;
            margin: 0 auto;
            justify-content: center;
            max-width: 100%;
        }

        .game-footer {
            margin-top: clamp(16px, 4vw, 24px);
            text-align: center;
            color: white;
        }

        .instructions {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: clamp(12px, 3vw, 20px);
            border-radius: clamp(8px, 2vw, 16px);
            margin-top: clamp(12px, 3vw, 20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .instructions h3 {
            margin-bottom: clamp(8px, 2vw, 12px);
            font-size: clamp(14px, 3.5vw, 18px);
            font-weight: 600;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: clamp(4px, 1vw, 8px);
        }

        .instructions p {
            margin-bottom: clamp(6px, 1.5vw, 8px);
            font-size: clamp(12px, 3vw, 14px);
            opacity: 0.9;
            line-height: 1.4;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: clamp(4px, 1vw, 8px);
        }

        /* Responsive mejorado */
        @media (max-width: 480px) {
            .stats-container {
                grid-template-columns: repeat(3, 1fr);
            }
            
            .controls {
                grid-template-columns: 1fr;
            }
            
            .btn {
                padding: 12px 16px;
                font-size: 14px;
            }
        }

        @media (max-width: 360px) {
            .stats-container {
                grid-template-columns: 1fr;
                gap: 12px;
            }
            
            .game-title {
                font-size: 16px;
            }
            
            .stat-value {
                font-size: 18px;
            }
            
            .instructions h3 {
                font-size: 14px;
            }
            
            .instructions p {
                font-size: 11px;
            }
        }

        @media (max-width: 320px) {
            .tablero {
                grid-template-columns: repeat(${this.columnas}, 26px);
            }
            
            .game-header {
                padding: 10px;
            }
            
            .tablero-container {
                padding: 10px;
            }
        }

        /* Para pantallas grandes */
        @media (min-width: 768px) {
            :host {
                max-width: 500px;
                margin: 0 auto;
            }
        }

        /* Animaciones solo en dispositivos que las soportan */
        @media (prefers-reduced-motion: no-preference) {
            .status-win {
                animation: pulse 2s infinite;
            }
            
            .status-lose {
                animation: shake 0.5s ease-in-out;
            }
            
            .game-header {
                animation: slideIn 0.5s ease-out;
            }
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-3px); }
            75% { transform: translateX(3px); }
        }

        /* Mejoras de accesibilidad */
        @media (prefers-reduced-motion: reduce) {
            * {
                animation: none !important;
                transition: none !important;
            }
        }
    </style>
`;
        const tableroHTML = this.tablero.map((fila, i) => 
            fila.map((celda, j) => {
                return `
                    <buscaminas-celda 
                        data-celda='${JSON.stringify(celda)}'
                        data-gameover='${this.juegoTerminado}'
                    ></buscaminas-celda>
                `;
            }).join('')
        ).join('');

        this.shadowRoot.innerHTML = `
            ${style}
            <div class="game-header">
                <h1 class="game-title">💣 Buscaminas</h1>
                
                <div class="stats-container">
                    <div class="stat">
                        <span class="stat-value" id="minas">${this.minas}</span>
                        <span class="stat-label">Minas</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value" id="banderas">${this.banderasColocadas}</span>
                        <span class="stat-label">Banderas</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value" id="tiempo">${this.tiempoTranscurrido}</span>
                        <span class="stat-label">Segundos</span>
                    </div>
                </div>

                <div class="controls">
                    <button class="btn btn-primary" id="reiniciar">
                        🔄 Reiniciar
                    </button>
                    <button class="btn btn-success" id="ayuda">
                        ❓ Ayuda
                    </button>
                </div>

                <div class="game-status ${this.juegoTerminado ? 
                    (this.juegoGanado ? 'status-win' : 'status-lose') : 'status-playing'}">
                    ${this.juegoTerminado ? 
                        (this.juegoGanado ? '¡Ganaste! 🎉' : '¡Perdiste! 💥') : 
                        'Juego en progreso ⏳'}
                </div>
            </div>

            <div class="tablero-container">
                <div class="tablero">${tableroHTML}</div>
            </div>

            <div class="game-footer">
                <div class="instructions">
                    <h3>📋 Instrucciones</h3>
                    <p>👆 Click: Revelar celda</p>
                    <p>👆 Click largo: Colocar bandera</p>
                    <p>🎯 Objetivo: Encontrar todas las minas</p>
                </div>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        this.shadowRoot.getElementById('reiniciar').addEventListener('click', () => {
            this.reiniciarJuego();
        });

        this.shadowRoot.getElementById('ayuda').addEventListener('click', () => {
            alert('💡 Buscaminas Tips:\n\n• Revela celdas para encontrar minas\n• Los números indican minas adyacentes\n• Usa banderas para marcar minas sospechosas\n• ¡El primer click siempre es seguro!');
        });

        const celdas = this.shadowRoot.querySelectorAll('buscaminas-celda');
        celdas.forEach((celdaElement, index) => {
            const x = Math.floor(index / this.columnas);
            const y = index % this.columnas;
            
            celdaElement.onClick = () => this.revelarCelda(x, y);
            celdaElement.onRightClick = () => this.alternarBandera(x, y);
        });
    }
}

customElements.define('buscaminas-game', BuscaminasGame);
