import { EstadoProceso } from "./EstadoProceso";
import { InfoProceso } from "./InfoProceso";
import { exigir, exigirEnteroPositivo } from "./Validaciones";

// Transiciones permitidas entre estados: para cada estado, a cuales puede pasar.
const TRANSICIONES: Record<EstadoProceso, EstadoProceso[]> = {
    [EstadoProceso.NUEVO]: [EstadoProceso.ESPERANDO_MEMORIA],
    [EstadoProceso.ESPERANDO_MEMORIA]: [EstadoProceso.LISTO],
    [EstadoProceso.LISTO]: [EstadoProceso.EJECUTANDO],
    [EstadoProceso.EJECUTANDO]: [EstadoProceso.LISTO, EstadoProceso.BLOQUEADO, EstadoProceso.TERMINADO],
    [EstadoProceso.BLOQUEADO]: [EstadoProceso.LISTO],
    [EstadoProceso.TERMINADO]: [],
};

// Un proceso simulado (RF02, RF03). Este es el proceso comun: solo usa CPU y nunca se bloquea.
// Los metodos del final (debeBloquearse, bloquear, avanzarBloqueo y bloqueoRestante) son ganchos que ProcesoConES sobrescribe (herencia + polimorfismo).
export class Proceso {

    private tiempoRestante: number;
    private quantumConsumido: number = 0;
    private estadoActual: EstadoProceso = EstadoProceso.NUEVO;

    constructor(readonly pid: string, readonly memoria: number, readonly tiempoCpu: number) {
        exigir(pid.trim().length > 0, "El PID no puede estar vacio");
        exigirEnteroPositivo(memoria, "La memoria requerida");
        exigirEnteroPositivo(tiempoCpu, "El tiempo de CPU");
        this.tiempoRestante = tiempoCpu;
    }

    estado(): EstadoProceso {
        return this.estadoActual;
    }

    estaEn(estado: EstadoProceso): boolean {
        return this.estadoActual === estado;
    }

    // El propio proceso protege sus transiciones: las invalidas lanzan error.
    cambiarEstado(nuevo: EstadoProceso): void {
        exigir(TRANSICIONES[this.estadoActual].includes(nuevo), `Transicion invalida: ${this.estadoActual} -> ${nuevo}`);
        this.estadoActual = nuevo;
    }

    // Un tick de CPU: queda un tick menos de CPU y se gasta uno del quantum.
    ejecutarTick(): void {
        exigir(this.tiempoRestante > 0, `El proceso ${this.pid} ya no tiene CPU pendiente`);
        this.tiempoRestante -= 1;
        this.quantumConsumido += 1;
    }

    ticksEjecutados(): number {
        return this.tiempoCpu - this.tiempoRestante;
    }

    terminoCpu(): boolean {
        return this.tiempoRestante === 0;
    }

    porcentajeCompletado(): number {
        return (this.ticksEjecutados() / this.tiempoCpu) * 100;
    }

    agotoQuantum(quantum: number): boolean {
        return this.quantumConsumido >= quantum;
    }

    reiniciarQuantum(): void {
        this.quantumConsumido = 0;
    }

    describir(): string {
        return `${this.pid}: ${this.estadoActual}`;
    }

    // Copia de solo lectura con los datos actuales: es lo que se entrega hacia afuera.
    informacion(): InfoProceso {
        return Object.freeze({
            pid: this.pid,
            memoria: this.memoria,
            tiempoCpu: this.tiempoCpu,
            tiempoRestante: this.tiempoRestante,
            quantumConsumido: this.quantumConsumido,
            bloqueoRestante: this.bloqueoRestante(),
            estado: this.estadoActual,
            porcentajeCompletado: this.porcentajeCompletado(),
        });
    }

    // Ganchos de E/S: el proceso comun no hace nada.
    debeBloquearse(): boolean {
        return false;
    }

    bloquear(): void {
        // sin E/S no hay nada que preparar
    }

    // Devuelve true cuando termino el bloqueo.
    avanzarBloqueo(): boolean {
        return true;
    }

    // Ticks de E/S que le faltan: el proceso comun nunca esta bloqueado.
    bloqueoRestante(): number {
        return 0;
    }
}
