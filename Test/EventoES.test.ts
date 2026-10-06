import { describe, expect, it } from "vitest";
import { EventoES } from "../src/EventoES";

describe("EventoES", () => {
    it("guarda el disparo y la duracion", () => {
        const evento = new EventoES(2, 3);
        expect([evento.despuesDeTicks, evento.duracion]).toEqual([2, 3]);
    });

    it("rechaza un disparo no positivo", () => {
        expect(() => new EventoES(0, 3)).toThrow("despuesDeTicks debe ser un entero positivo");
    });

    it("rechaza una duracion no positiva", () => {
        expect(() => new EventoES(2, 0)).toThrow("duracion debe ser un entero positivo");
    });
});
