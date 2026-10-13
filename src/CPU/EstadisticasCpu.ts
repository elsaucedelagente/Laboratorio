// Lleva el reloj de la simulacion y cuantos ticks la CPU estuvo ocupada (RF06, RF09).
// Solo cuenta: no decide nada sobre quien usa la CPU.
export class EstadisticasCpu {

    private reloj: number = 0;
    private ticksOcupada: number = 0;

    // El tiempo es discreto: cada llamada es un tick.
    avanzarReloj(): void {
        this.reloj += 1;
    }

    registrarTick(cpuOcupada: boolean): void {
        this.ticksOcupada += cpuOcupada ? 1 : 0;
    }

    tickActual(): number {
        return this.reloj;
    }

    // Uso de CPU (%) = ticks con CPU ocupada / ticks transcurridos x 100. En el tick 0 vale 0.
    usoCpu(): number {
        return this.reloj === 0 ? 0 : (this.ticksOcupada / this.reloj) * 100;
    }
}
