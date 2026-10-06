import { describe, expect, it } from "vitest";
import { GestorMemoria } from "../src/GestorMemoria";
import { PeorAjuste } from "../src/PeorAjuste";

describe("GestorMemoria", () => {
    it("por defecto tiene 1024 KB, todo libre", () => {
        const gestor = new GestorMemoria();
        expect(gestor.total()).toBe(1024);
        expect(gestor.mapa()).toEqual(["[0-1024 KB] LIBRE"]);
    });

    it("rechaza un tamano de memoria no positivo", () => {
        expect(() => new GestorMemoria(0)).toThrow("El tamano de memoria debe ser un entero positivo");
    });

    it("asigna y divide el bloque libre", () => {
        const gestor = new GestorMemoria(1000);
        expect(gestor.asignar("A", 300)).toBe(true);
        expect(gestor.mapa()).toEqual(["[0-300 KB] A", "[300-1000 KB] LIBRE"]);
    });

    it("con ajuste exacto no queda bloque libre", () => {
        const gestor = new GestorMemoria(100);
        gestor.asignar("A", 100);
        expect(gestor.mapa()).toEqual(["[0-100 KB] A"]);
    });

    it("devuelve false si el proceso no entra", () => {
        const gestor = new GestorMemoria(100);
        expect(gestor.asignar("A", 200)).toBe(false);
    });

    it("liberar fusiona con el bloque libre siguiente", () => {
        const gestor = new GestorMemoria(1000);
        gestor.asignar("A", 100);
        gestor.asignar("B", 100);
        gestor.liberar("B");
        expect(gestor.mapa()).toEqual(["[0-100 KB] A", "[100-1000 KB] LIBRE"]);
    });

    it("liberar fusiona con los bloques libres de ambos lados", () => {
        const gestor = new GestorMemoria(1000);
        ["A", "B", "C", "D"].forEach(pid => gestor.asignar(pid, 100));
        gestor.liberar("B");
        gestor.liberar("D");
        gestor.liberar("C");
        expect(gestor.mapa()).toEqual(["[0-100 KB] A", "[100-1000 KB] LIBRE"]);
    });

    it("las metricas reflejan lo ocupado", () => {
        const gestor = new GestorMemoria(1000);
        gestor.asignar("A", 250);
        const metricas = gestor.metricas();
        expect([metricas.ocupada, metricas.libre, metricas.mayorHueco, metricas.ocupacion]).toEqual([250, 750, 750, 25]);
    });

    it("con WorstFit asigna en el bloque libre mas grande", () => {
        const gestor = new GestorMemoria(950, new PeorAjuste());
        [["A", 100], ["B", 200], ["C", 100], ["D", 300], ["E", 100]].forEach(([pid, kb]) => gestor.asignar(pid as string, kb as number));
        gestor.liberar("B");
        gestor.liberar("D");
        gestor.asignar("F", 150);
        expect(gestor.mapa()[3]).toBe("[400-550 KB] F");
    });

    it("la fragmentacion externa es 0 si no queda memoria libre", () => {
        const gestor = new GestorMemoria(100);
        gestor.asignar("A", 100);
        const metricas = gestor.metricas();
        expect([metricas.libre, metricas.mayorHueco, metricas.fragmentacionExterna, metricas.ocupacion]).toEqual([0, 0, 0, 100]);
    });

    it("calcula la fragmentacion externa cuando hay huecos separados", () => {
        const gestor = new GestorMemoria(1000);
        ["A", "B", "C"].forEach(pid => gestor.asignar(pid, 100));
        gestor.liberar("B");
        const metricas = gestor.metricas();
        expect([metricas.libre, metricas.mayorHueco, metricas.ocupacion]).toEqual([800, 700, 20]);
        expect(metricas.fragmentacionExterna).toBe(12.5);
    });

    it("tieneAsignado indica si el proceso tiene un bloque", () => {
        const gestor = new GestorMemoria(1000);
        gestor.asignar("A", 100);
        expect(gestor.tieneAsignado("A")).toBe(true);
        expect(gestor.tieneAsignado("B")).toBe(false);
    });

    it("liberar todo deja la memoria como al principio", () => {
        const gestor = new GestorMemoria(1000);
        ["A", "B", "C"].forEach(pid => gestor.asignar(pid, 100));
        ["B", "A", "C"].forEach(pid => gestor.liberar(pid));
        expect(gestor.mapa()).toEqual(["[0-1000 KB] LIBRE"]);
    });
});
