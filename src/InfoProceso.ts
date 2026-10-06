import { EstadoProceso } from "./EstadoProceso";

// Copia de solo lectura de un proceso (RF02, RF10). Es lo que se entrega hacia afuera: quien la consulta
// no puede modificar el proceso real ni cambiarle el estado.
export interface InfoProceso {
    readonly pid: string;
    readonly memoria: number;
    readonly tiempoCpu: number;
    readonly tiempoRestante: number;
    readonly quantumConsumido: number;
    readonly bloqueoRestante: number;
    readonly estado: EstadoProceso;
    readonly porcentajeCompletado: number;
}
