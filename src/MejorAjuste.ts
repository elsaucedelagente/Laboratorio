import { BloqueMemoria } from "./BloqueMemoria";
import { PoliticaAsignacion } from "./PoliticaAsignacion";

// Mejor ajuste: el bloque libre mas chico donde entra el proceso. Con empate, el de menor direccion.
export class MejorAjuste implements PoliticaAsignacion {

    readonly nombre = "Mejor-Ajuste";

    elegir(bloques: readonly BloqueMemoria[], tamano: number): BloqueMemoria | undefined {
        return bloques
            .filter(bloque => bloque.libre && bloque.tamano >= tamano)
            .reduce<BloqueMemoria | undefined>((mejor, actual) => mejor === undefined || actual.tamano < mejor.tamano ? actual : mejor, undefined);
    }
}
