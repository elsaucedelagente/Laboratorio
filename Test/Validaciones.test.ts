import { describe, expect, it } from "vitest";
import { ErrorSimulacion } from "../src/ErrorSimulacion";
import { exigir, exigirEnteroPositivo } from "../src/Validaciones";

describe("Validaciones", () => {
    it("exigir no hace nada si la condicion es verdadera", () => {
        expect(() => exigir(true, "no deberia fallar")).not.toThrow();
    });

    it("exigir lanza el mensaje recibido si la condicion es falsa", () => {
        expect(() => exigir(false, "condicion incumplida")).toThrow("condicion incumplida");
    });

    it("el error lanzado es un ErrorSimulacion, que a su vez es un Error", () => {
        try {
            exigir(false, "x");
        } catch (error) {
            expect(error).toBeInstanceOf(ErrorSimulacion);
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).name).toBe("ErrorSimulacion");
        }
    });

    it.each([1, 7, 1024])("exigirEnteroPositivo acepta %i", valor => {
        expect(() => exigirEnteroPositivo(valor, "El valor")).not.toThrow();
    });

    it.each([0, -3, 1.5, NaN])("exigirEnteroPositivo rechaza %s", valor => {
        expect(() => exigirEnteroPositivo(valor, "El valor")).toThrow("El valor debe ser un entero positivo");
    });
});
