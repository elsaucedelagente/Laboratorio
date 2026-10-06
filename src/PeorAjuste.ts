import { BloqueMemoria } from "./BloqueMemoria";
import { PoliticaAsignacion } from "./PoliticaAsignacion";

// Peor ajuste: el bloque libre mas grande donde entra el proceso. Con empate, el de menor direccion.
export class PeorAjuste implements PoliticaAsignacion {

    readonly nombre = "Peor-Ajuste";

    elegir(bloques: readonly BloqueMemoria[], tamano: number): BloqueMemoria | undefined {
        return bloques
            .filter(bloque => bloque.libre && bloque.tamano >= tamano)
            .reduce<BloqueMemoria | undefined>((peor, actual) => peor === undefined || actual.tamano > peor.tamano ? actual : peor, undefined);
    }
}
