import { ErrorSimulacion } from "./ErrorSimulacion";

// Validaciones compartidas: si algo es invalido se lanza un ErrorSimulacion con un mensaje claro.
// `asserts condicion` le avisa a TypeScript que, si la funcion retorna, la condicion es verdadera.
export function exigir(condicion: boolean, mensaje: string): asserts condicion {
    if (!condicion) {
        throw new ErrorSimulacion(mensaje);
    }
}

export function exigirEnteroPositivo(valor: number, nombre: string): void {
    exigir(Number.isInteger(valor) && valor > 0, `${nombre} debe ser un entero positivo`);
}
