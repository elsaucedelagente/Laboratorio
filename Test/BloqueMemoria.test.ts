import { describe, expect, it } from "vitest";
import { BloqueMemoria } from "../src/BloqueMemoria";

describe("BloqueMemoria", () => {
    it("un bloque sin pid esta libre", () => {
        const bloque = new BloqueMemoria(0, 100);
        expect(bloque.libre).toBe(true);
        expect(bloque.fin).toBe(100);
    });

    it("un bloque con pid esta ocupado", () => {
        expect(new BloqueMemoria(100, 50, "P1").libre).toBe(false);
    });

    it("rechaza un tamano no positivo", () => {
        expect(() => new BloqueMemoria(0, 0)).toThrow("El tamano del bloque debe ser un entero positivo");
    });
});
