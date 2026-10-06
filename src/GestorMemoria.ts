import { BloqueMemoria } from "./BloqueMemoria";
import { PrimerAjuste } from "./PrimerAjuste";
import { IGestorMemoria } from "./IGestorMemoria";
import { Metricas } from "./Metricas";
import { PoliticaAsignacion } from "./PoliticaAsignacion";
import { exigirEnteroPositivo } from "./Validaciones";

// Memoria principal con asignacion contigua. Arranca con un unico bloque libre que ocupa todo.
// La politica de asignacion se recibe por constructor (por defecto, Primer Ajuste).
export class GestorMemoria implements IGestorMemoria {

    private bloques: BloqueMemoria[];

    constructor(private readonly memoriaTotal: number = 1024, private readonly politica: PoliticaAsignacion = new PrimerAjuste()) {
        exigirEnteroPositivo(memoriaTotal, "El tamano de memoria");
        this.bloques = [new BloqueMemoria(0, memoriaTotal)];
    }

    total(): number {
        return this.memoriaTotal;
    }

    nombrePolitica(): string {
        return this.politica.nombre;
    }

    tieneAsignado(pid: string): boolean {
        return this.bloques.some(bloque => bloque.pid === pid);
    }

    // RF04: la politica elige el bloque; ese bloque se reemplaza por el ocupado y, si sobra lugar, por un bloque libre.
    asignar(pid: string, tamano: number): boolean {
        const elegido = this.politica.elegir(this.bloques, tamano);
        if (elegido === undefined) {
            return false;
        }
        const reemplazo = [new BloqueMemoria(elegido.inicio, tamano, pid)];
        const sobrante = elegido.tamano - tamano;
        if (sobrante > 0) {
            reemplazo.push(new BloqueMemoria(elegido.inicio + tamano, sobrante));
        }
        this.bloques.splice(this.bloques.indexOf(elegido), 1, ...reemplazo);
        return true;
    }

    // RF05: libera los bloques del proceso y fusiona los bloques libres vecinos (coalescencia).
    liberar(pid: string): void {
        const liberados = this.bloques.map(bloque => bloque.pid === pid ? new BloqueMemoria(bloque.inicio, bloque.tamano) : bloque);
        this.bloques = liberados.reduce<BloqueMemoria[]>((fusionados, bloque) => {
            const ultimo = fusionados.at(-1);
            if (ultimo?.libre && bloque.libre) {
                fusionados[fusionados.length - 1] = new BloqueMemoria(ultimo.inicio, ultimo.tamano + bloque.tamano);
            } else {
                fusionados.push(bloque);
            }
            return fusionados;
        }, []);
    }

    // RF09
    metricas(): Metricas {
        const libres = this.bloques.filter(bloque => bloque.libre).map(bloque => bloque.tamano);
        const libre = libres.reduce((suma, tamano) => suma + tamano, 0);
        const mayorHueco = Math.max(0, ...libres);
        return {
            total: this.memoriaTotal,
            ocupada: this.memoriaTotal - libre,
            libre,
            mayorHueco,
            ocupacion: ((this.memoriaTotal - libre) / this.memoriaTotal) * 100,
            fragmentacionExterna: libre === 0 ? 0 : ((libre - mayorHueco) / libre) * 100,
        };
    }

    // RF10
    mapa(): string[] {
        return this.bloques.map(bloque => bloque.describir());
    }
}
