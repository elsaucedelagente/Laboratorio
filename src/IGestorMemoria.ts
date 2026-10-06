import { Metricas } from "./Metricas";

// Contrato de la gestion de memoria (RF04, RF05): el simulador depende de esto y no de la clase concreta.
export interface IGestorMemoria {
    total(): number;
    nombrePolitica(): string;
    tieneAsignado(pid: string): boolean;
    asignar(pid: string, tamano: number): boolean;
    liberar(pid: string): void;
    metricas(): Metricas;
    mapa(): string[];
}
