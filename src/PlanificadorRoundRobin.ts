import { EstadoProceso } from "./EstadoProceso";
import { PlanificadorCpu, ResultadoCpu, ResultadoTick } from "./PlanificadorCpu";
import { Proceso } from "./Proceso";
import { exigirEnteroPositivo } from "./Validaciones";

// Round-Robin (RF07): una sola CPU y una cola FIFO de procesos listos. Cada proceso usa la CPU
// como maximo `quantum` ticks seguidos. Cuenta un cambio de contexto por cada expulsion con otros
// listos esperando y por cada bloqueo de E/S.
export class PlanificadorRoundRobin implements PlanificadorCpu {

    private readonly cola: Proceso[] = [];
    private enCpu: Proceso | undefined = undefined;
    private cambios: number = 0;

    constructor(private readonly quantum: number) {
        exigirEnteroPositivo(quantum, "El quantum");
    }

    encolar(proceso: Proceso): void {
        this.cola.push(proceso);
    }

    // Despacha si la CPU esta libre y ejecuta, como maximo, un tick.
    ejecutarTick(): ResultadoTick {
        const proceso = this.enCpu ?? this.despachar();
        if (proceso === undefined) {
            return { resultado: ResultadoCpu.OCIOSA };
        }
        proceso.ejecutarTick();
        return { resultado: this.resolver(proceso), proceso };
    }

    private despachar(): Proceso | undefined {
        const siguiente = this.cola.shift();
        siguiente?.cambiarEstado(EstadoProceso.EJECUTANDO);
        this.enCpu = siguiente;
        return siguiente;
    }

    // Despues de ejecutar, en este orden de prioridad: terminar, bloquearse por E/S, vencer el quantum.
    private resolver(proceso: Proceso): ResultadoCpu {
        if (proceso.terminoCpu()) {
            proceso.cambiarEstado(EstadoProceso.TERMINADO);
            this.enCpu = undefined;
            return ResultadoCpu.TERMINO;
        }
        if (proceso.debeBloquearse()) {
            proceso.bloquear();
            proceso.reiniciarQuantum(); // al volver de la E/S arranca con un quantum completo
            proceso.cambiarEstado(EstadoProceso.BLOQUEADO);
            this.enCpu = undefined;
            this.cambios += 1;
            return ResultadoCpu.BLOQUEO;
        }
        if (!proceso.agotoQuantum(this.quantum)) {
            return ResultadoCpu.CONTINUA;
        }
        proceso.reiniciarQuantum();
        if (this.cola.length === 0) {
            return ResultadoCpu.CONTINUA; // nadie mas espera: sigue en CPU con un quantum nuevo
        }
        proceso.cambiarEstado(EstadoProceso.LISTO);
        this.cola.push(proceso);
        this.enCpu = undefined;
        this.cambios += 1;
        return ResultadoCpu.EXPULSION;
    }

    enEjecucion(): string | undefined {
        return this.enCpu?.pid;
    }

    pidsListos(): string[] {
        return this.cola.map(proceso => proceso.pid);
    }

    cambiosDeContexto(): number {
        return this.cambios;
    }
}
