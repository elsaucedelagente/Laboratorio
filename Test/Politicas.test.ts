import { describe, expect, it } from "vitest";
import { BloqueMemoria } from "../src/BloqueMemoria";
import { MejorAjuste } from "../src/MejorAjuste";
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
    it("PrimerAjuste elige el primer bloque libre donde entra", () => {
        expect(new PrimerAjuste().elegir(bloques, 120)?.inicio).toBe(150);
    });

    it("PrimerAjuste devuelve undefined si no entra en ninguno", () => {
        expect(new PrimerAjuste().elegir(bloques, 400)).toBeUndefined();
    });

    it("MejorAjuste elige el bloque libre mas chico donde entra", () => {
        expect(new MejorAjuste().elegir(bloques, 120)?.inicio).toBe(500);
    });

    it("MejorAjuste devuelve undefined si no entra en ninguno", () => {
        expect(new MejorAjuste().elegir(bloques, 400)).toBeUndefined();
    });

    it("MejorAjuste con empate se queda con el de menor direccion", () => {
        const empate = [new BloqueMemoria(0, 200), new BloqueMemoria(200, 50, "X"), new BloqueMemoria(250, 200)];
        expect(new MejorAjuste().elegir(empate, 100)?.inicio).toBe(0);
    });

    it("PeorAjuste elige el bloque libre mas grande", () => {
        expect(new PeorAjuste().elegir(bloques, 120)?.inicio).toBe(150);
    });

    it("PeorAjuste con empate se queda con el de menor direccion", () => {
        const empate = [new BloqueMemoria(0, 200), new BloqueMemoria(200, 50, "X"), new BloqueMemoria(250, 200)];
        expect(new PeorAjuste().elegir(empate, 100)?.inicio).toBe(0);
    });

    it("cada politica informa su nombre", () => {
        expect(new PrimerAjuste().nombre).toBe("Primer-Ajuste");
        expect(new MejorAjuste().nombre).toBe("Mejor-Ajuste");
        expect(new PeorAjuste().nombre).toBe("Peor-Ajuste");
    });
});
