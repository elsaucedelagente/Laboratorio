import { BloqueMemoria } from "./BloqueMemoria";
import { PoliticaAsignacion } from "./PoliticaAsignacion";

// Primer ajuste: el primer bloque libre donde entra el proceso.
export class PrimerAjuste implements PoliticaAsignacion {

    readonly nombre = "Primer-Ajuste";

    elegir(bloques: readonly BloqueMemoria[], tamano: number): BloqueMemoria | undefined {
        return bloques.find(bloque => bloque.libre && bloque.tamano >= tamano);
    }
}
