import { describe, expect, it } from "vitest";
import { BloqueMemoria } from "../src/BloqueMemoria";
import { PrimerAjuste } from "../src/PrimerAjuste";
import { PeorAjuste } from "../src/PeorAjuste";

// Bloques libres de 100, 300 y 150 KB, separados por bloques ocupados.
const bloques = [
    new BloqueMemoria(0, 100),
    new BloqueMemoria(100, 50, "X"),
    new BloqueMemoria(150, 300),
    new BloqueMemoria(450, 50, "Y"),
    new BloqueMemoria(500, 150),
];

describe("Politicas de asignacion", () => {
    it("FirstFit elige el primer bloque libre donde entra", () => {
        expect(new PrimerAjuste().elegir(bloques, 120)?.inicio).toBe(150);
    });

    it("FirstFit devuelve undefined si no entra en ninguno", () => {
        expect(new PrimerAjuste().elegir(bloques, 400)).toBeUndefined();
    });

    it("WorstFit elige el bloque libre mas grande", () => {
        expect(new PeorAjuste().elegir(bloques, 120)?.inicio).toBe(150);
    });

    it("WorstFit con empate se queda con el de menor direccion", () => {
        const empate = [new BloqueMemoria(0, 200), new BloqueMemoria(200, 50, "X"), new BloqueMemoria(250, 200)];
        expect(new PeorAjuste().elegir(empate, 100)?.inicio).toBe(0);
    });

    it("cada politica informa su nombre", () => {
        expect(new PrimerAjuste().nombre).toBe("Primer-Ajuste");
        expect(new PeorAjuste().nombre).toBe("Peor-Ajuste");
    });
});
