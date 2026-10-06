import { BloqueMemoria } from "./BloqueMemoria";

// Contrato de las politicas de asignacion (RF04): elegir en que bloque libre ubicar un pedido.
// El gestor de memoria solo conoce este contrato, asi que se cambia de politica sin tocarlo.
export interface PoliticaAsignacion {
    readonly nombre: string;
    elegir(bloques: readonly BloqueMemoria[], tamano: number): BloqueMemoria | undefined;
}
