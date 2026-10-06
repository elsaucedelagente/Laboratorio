import { EventoES } from "./EventoES";
import { Proceso } from "./Proceso";
import { exigir } from "./Validaciones";

// Proceso que, ademas de CPU, hace una entrada/salida (RF08). Hereda todo de Proceso y solo
// sobrescribe los ganchos de E/S: el simulador lo trata igual que a cualquier otro Proceso.
export class ProcesoConES extends Proceso {

    private ticksBloqueo: number = 0;
    private yaBloqueo: boolean = false;

    constructor(pid: string, memoria: number, tiempoCpu: number, private readonly evento: EventoES) {
        super(pid, memoria, tiempoCpu);
        exigir(evento.despuesDeTicks < tiempoCpu, "El evento de E/S debe ocurrir antes de que el proceso termine");
    }

    // Se bloquea una sola vez, cuando ejecuto justo los ticks del evento.
    override debeBloquearse(): boolean {
        return !this.yaBloqueo && this.ticksEjecutados() === this.evento.despuesDeTicks;
    }

    override bloquear(): void {
        this.yaBloqueo = true;
        this.ticksBloqueo = this.evento.duracion;
    }

    override avanzarBloqueo(): boolean {
        this.ticksBloqueo = Math.max(0, this.ticksBloqueo - 1);
        return this.ticksBloqueo === 0;
    }

    override bloqueoRestante(): number {
        return this.ticksBloqueo;
    }
}
