import { describe, expect, it } from "vitest";
import { EstadisticasCpu } from "../src/EstadisticasCpu";

describe("EstadisticasCpu", () => {
    it("arranca en el tick 0 con uso de CPU 0", () => {
        const estadisticas = new EstadisticasCpu();
        expect(estadisticas.tickActual()).toBe(0);
        expect(estadisticas.usoCpu()).toBe(0);
    });

    it("avanzarReloj cuenta un tick por llamada", () => {
        const estadisticas = new EstadisticasCpu();
        [1, 2, 3].forEach(() => estadisticas.avanzarReloj());
        expect(estadisticas.tickActual()).toBe(3);
    });

    it("usoCpu es el porcentaje de ticks con CPU ocupada", () => {
        const estadisticas = new EstadisticasCpu();
        [true, false, true, false].forEach(ocupada => {
            estadisticas.avanzarReloj();
            estadisticas.registrarTick(ocupada);
        });
        expect(estadisticas.usoCpu()).toBe(50);
    });

    it("usoCpu llega a 100 si la CPU nunca estuvo libre", () => {
        const estadisticas = new EstadisticasCpu();
        [true, true, true].forEach(ocupada => {
            estadisticas.avanzarReloj();
            estadisticas.registrarTick(ocupada);
        });
        expect(estadisticas.usoCpu()).toBe(100);
    });
});
