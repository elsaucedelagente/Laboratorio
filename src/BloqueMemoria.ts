import { exigir, exigirEnteroPositivo } from "./Validaciones";

// Un pedazo contiguo de memoria: libre (sin pid) u ocupado por un proceso. Es de solo lectura:
// para dividir o fusionar, el gestor crea bloques nuevos.
export class BloqueMemoria {

    constructor(readonly inicio: number, readonly tamano: number, readonly pid?: string) {
        exigir(Number.isInteger(inicio) && inicio >= 0, "El inicio del bloque debe ser un entero no negativo");
        exigirEnteroPositivo(tamano, "El tamano del bloque");
    }

    get libre(): boolean {
        return this.pid === undefined;
    }

    get fin(): number {
        return this.inicio + this.tamano;
    }

    describir(): string {
        return `[${this.inicio}-${this.fin} KB] ${this.pid ?? "LIBRE"}`;
    }
}
