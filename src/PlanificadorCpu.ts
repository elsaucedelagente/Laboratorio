import { Proceso } from "./Proceso";

// Que paso en la CPU durante un tick.
export enum ResultadoCpu {
    OCIOSA = "OCIOSA",
    CONTINUA = "CONTINUA",
    TERMINO = "TERMINO",
    BLOQUEO = "BLOQUEO",
    EXPULSION = "EXPULSION",
}

export interface ResultadoTick {
    resultado: ResultadoCpu;
    proceso?: Proceso;
}

// Contrato de la planificacion de CPU (RF07).
export interface PlanificadorCpu {
    encolar(proceso: Proceso): void;
    ejecutarTick(): ResultadoTick;
    enEjecucion(): string | undefined;
    pidsListos(): string[];
    cambiosDeContexto(): number;
}
