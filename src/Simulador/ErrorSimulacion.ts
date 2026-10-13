// Error que se lanza cuando se rompe una regla del simulador (dato invalido, transicion invalida, etc.).
// Hereda de Error: es un caso de "es un" (un ErrorSimulacion ES un Error).
export class ErrorSimulacion extends Error {

    constructor(mensaje: string) {
        super(mensaje);
        this.name = "ErrorSimulacion";
    }
}