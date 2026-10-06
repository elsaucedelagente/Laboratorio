import { ColasProcesos } from "./ColasProceso";
import { EstadisticasCpu } from "./EstadisticasCpu";
import { EstadoProceso } from "./EstadoProceso";
import { EstadoSistema } from "./EstadoSistema";
import { EventoES } from "./EventoES";
import { PrimerAjuste } from "./PrimerAjuste";
import { GestorMemoria } from "./GestorMemoria";
import { IGestorMemoria } from "./IGestorMemoria";
import { InfoProceso } from "./InfoProceso";
import { Metricas, MetricasSimulacion } from "./Metricas";
import { PlanificadorCpu, ResultadoCpu } from "./PlanificadorCpu";
import { PlanificadorRoundRobin } from "./PlanificadorRoundRobin";
import { PoliticaAsignacion } from "./PoliticaAsignacion";
import { Proceso } from "./Proceso";
import { ProcesoConES } from "./ProcesoConES";
import { exigir, exigirEnteroPositivo } from "./Validaciones";

// Orquestador de la simulacion: no asigna memoria ni planifica por su cuenta, se lo pide a cada colaborador. Avanza el tiempo tick por tick, siempre con las mismas fases en el mismo orden (RF06):
//   1) admitir procesos (asignar memoria)  2) avanzar bloqueos de E/S  3) CPU: despachar y ejecutar.
export class Simulador {

    private readonly memoria: IGestorMemoria;
    private readonly planificador: PlanificadorCpu;
    private readonly colas = new ColasProcesos();
    private readonly estadisticas = new EstadisticasCpu();

    // RF01: configuracion de referencia: quantum 2, memoria de 1024 KB y Primer Ajuste.
    constructor(quantum: number = 2, memoriaTotal: number = 1024, politica: PoliticaAsignacion = new PrimerAjuste()) {
        exigirEnteroPositivo(quantum, "El quantum");
        this.planificador = new PlanificadorRoundRobin(quantum);
        this.memoria = new GestorMemoria(memoriaTotal, politica);
    }

    // RF02: rechaza PIDs repetidos y procesos que piden mas memoria que toda la RAM.
    agregarProceso(proceso: Proceso): void {
        exigir(!this.colas.existe(proceso.pid), `Ya existe un proceso con PID ${proceso.pid}`);
        exigir(
            proceso.memoria <= this.memoria.total(),
            `El proceso ${proceso.pid} pide ${proceso.memoria} KB, mas que el total (${this.memoria.total()} KB)`
        );
        this.colas.registrar(proceso);
    }

    // Atajo: crea el proceso (con E/S si se indica un evento) y lo agrega.
    registrarProceso(pid: string, memoria: number, tiempoCpu: number, evento?: EventoES): void {
        this.agregarProceso(evento === undefined ? new Proceso(pid, memoria, tiempoCpu) : new ProcesoConES(pid, memoria, tiempoCpu, evento));
    }

    avanzarTick(): void {
        this.estadisticas.avanzarReloj();
        this.admitirProcesos();
        this.avanzarBloqueos();
        this.ejecutarCpu();
    }

    // Avanza varios ticks seguidos: es lo mismo que llamar a avanzarTick() esa cantidad de veces.
    avanzarTicks(cantidad: number): void {
        exigirEnteroPositivo(cantidad, "La cantidad de ticks");
        for (let i = 0; i < cantidad; i += 1) {
            this.avanzarTick();
        }
    }

    // Avanza hasta que todos los procesos terminen o se llegue al limite. Devuelve cuantos ticks avanzo.
    ejecutarHastaTerminar(limiteTicks: number): number {
        exigirEnteroPositivo(limiteTicks, "El limite de ticks");
        let avanzados = 0;
        while (!this.colas.todosTerminaron() && avanzados < limiteTicks) {
            this.avanzarTick();
            avanzados += 1;
        }
        return avanzados;
    }

    // Fase 1 (RF03, RF04): los procesos nuevos y los que esperan memoria intentan conseguir un bloque, en orden de registro.
    private admitirProcesos(): void {
        this.colas.pendientesDeMemoria().forEach(proceso => {
            proceso.estaEn(EstadoProceso.NUEVO) && proceso.cambiarEstado(EstadoProceso.ESPERANDO_MEMORIA);
            if (this.memoria.asignar(proceso.pid, proceso.memoria)) {
                proceso.cambiarEstado(EstadoProceso.LISTO);
                this.planificador.encolar(proceso);
            }
        });
    }

    // Fase 2 (RF08): los bloqueos que terminan devuelven el proceso a la cola de listos.
    private avanzarBloqueos(): void {
        this.colas.despertar().forEach(proceso => {
            proceso.cambiarEstado(EstadoProceso.LISTO);
            this.planificador.encolar(proceso);
        });
    }

    // Fase 3 (RF07): un tick de CPU y reaccion a lo que paso.
    private ejecutarCpu(): void {
        const { resultado, proceso } = this.planificador.ejecutarTick();
        this.estadisticas.registrarTick(proceso !== undefined);
        if (proceso === undefined) {
            return;
        }
        if (resultado === ResultadoCpu.TERMINO) {
            this.memoria.liberar(proceso.pid);
            this.colas.terminar(proceso.pid);
        }
        if (resultado === ResultadoCpu.BLOQUEO) {
            this.colas.bloquear(proceso);
        }
    }

    // RF02, RF09 y RF10: consultas. Siempre devuelven valores simples o copias de solo lectura.
    tickActual(): number {
        return this.estadisticas.tickActual();
    }

    nombrePolitica(): string {
        return this.memoria.nombrePolitica();
    }

    // Copia de solo lectura de un proceso.
    proceso(pid: string): InfoProceso {
        const proceso = this.colas.buscar(pid);
        exigir(proceso !== undefined, `No existe un proceso con PID ${pid}`);
        return proceso.informacion();
    }

    // Todos los procesos registrados, en orden de registro.
    procesos(): InfoProceso[] {
        return this.colas.todos().map(proceso => proceso.informacion());
    }

    cantidadPorEstado(estado: EstadoProceso): number {
        return this.colas.todos().filter(proceso => proceso.estaEn(estado)).length;
    }

    procesoEnCpu(): string | undefined {
        return this.planificador.enEjecucion();
    }

    pidsListos(): string[] {
        return this.planificador.pidsListos();
    }

    pidsEsperandoMemoria(): string[] {
        return this.colas.pidsEsperandoMemoria();
    }

    pidsBloqueados(): string[] {
        return this.colas.pidsBloqueados();
    }

    pidsTerminados(): string[] {
        return this.colas.pidsTerminados();
    }

    estados(): string[] {
        return this.colas.todos().map(proceso => proceso.describir());
    }

    mapaMemoria(): string[] {
        return this.memoria.mapa();
    }

    metricasMemoria(): Metricas {
        return this.memoria.metricas();
    }

    usoCpu(): number {
        return this.estadisticas.usoCpu();
    }

    cambiosDeContexto(): number {
        return this.planificador.cambiosDeContexto();
    }

    // RF09: memoria y CPU juntas.
    metricas(): MetricasSimulacion {
        return { ...this.memoria.metricas(), usoCpu: this.usoCpu(), cambiosDeContexto: this.cambiosDeContexto() };
    }

    // RF10: foto completa del sistema, con valores simples.
    estadoSistema(): EstadoSistema {
        return {
            tick: this.tickActual(),
            procesoEnCpu: this.procesoEnCpu(),
            listos: this.pidsListos(),
            esperandoMemoria: this.pidsEsperandoMemoria(),
            bloqueados: this.pidsBloqueados(),
            terminados: this.pidsTerminados(),
            mapaMemoria: this.mapaMemoria(),
        };
    }
}
