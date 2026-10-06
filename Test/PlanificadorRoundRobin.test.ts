import { describe, expect, it } from "vitest";
import { EstadoProceso } from "../src/EstadoProceso";
import { EventoES } from "../src/EventoES";
import { ResultadoCpu } from "../src/PlanificadorCpu";
import { PlanificadorRoundRobin } from "../src/PlanificadorRoundRobin";
import { Proceso } from "../src/Proceso";
import { ProcesoConES } from "../src/ProcesoConES";

const listo = <T extends Proceso>(proceso: T): T => {
    proceso.cambiarEstado(EstadoProceso.ESPERANDO_MEMORIA);
    proceso.cambiarEstado(EstadoProceso.LISTO);
    return proceso;
};

describe("PlanificadorRoundRobin", () => {
    it("rechaza un quantum no positivo", () => {
        expect(() => new PlanificadorRoundRobin(0)).toThrow("El quantum debe ser un entero positivo");
    });

    it("sin procesos la CPU esta ociosa", () => {
        expect(new PlanificadorRoundRobin(2).ejecutarTick().resultado).toBe(ResultadoCpu.OCIOSA);
    });

    it("despacha en orden FIFO", () => {
        const planificador = new PlanificadorRoundRobin(2);
        planificador.encolar(listo(new Proceso("A", 100, 5)));
        planificador.encolar(listo(new Proceso("B", 100, 5)));
        planificador.ejecutarTick();
        expect(planificador.enEjecucion()).toBe("A");
        expect(planificador.pidsListos()).toEqual(["B"]);
    });

    it("sigue en CPU mientras no venza el quantum", () => {
        const planificador = new PlanificadorRoundRobin(3);
        planificador.encolar(listo(new Proceso("A", 100, 5)));
        expect(planificador.ejecutarTick().resultado).toBe(ResultadoCpu.CONTINUA);
    });

    it("al vencer el quantum con otro listo, el proceso es expulsado y cuenta un cambio de contexto", () => {
        const planificador = new PlanificadorRoundRobin(1);
        planificador.encolar(listo(new Proceso("A", 100, 5)));
        planificador.encolar(listo(new Proceso("B", 100, 5)));
        expect(planificador.ejecutarTick().resultado).toBe(ResultadoCpu.EXPULSION);
        expect(planificador.pidsListos()).toEqual(["B", "A"]);
        expect(planificador.cambiosDeContexto()).toBe(1);
    });

    it("al vencer el quantum sin otros listos, renueva el quantum y sigue", () => {
        const planificador = new PlanificadorRoundRobin(1);
        planificador.encolar(listo(new Proceso("A", 100, 5)));
        expect(planificador.ejecutarTick().resultado).toBe(ResultadoCpu.CONTINUA);
        expect(planificador.enEjecucion()).toBe("A");
        expect(planificador.cambiosDeContexto()).toBe(0);
    });

    it("terminar tiene prioridad sobre el quantum", () => {
        const planificador = new PlanificadorRoundRobin(1);
        planificador.encolar(listo(new Proceso("A", 100, 1)));
        planificador.encolar(listo(new Proceso("B", 100, 1)));
        expect(planificador.ejecutarTick().resultado).toBe(ResultadoCpu.TERMINO);
        expect(planificador.enEjecucion()).toBeUndefined();
    });

    it("el proceso expulsado vuelve a LISTO", () => {
        const planificador = new PlanificadorRoundRobin(1);
        const proceso = listo(new Proceso("A", 100, 5));
        planificador.encolar(proceso);
        planificador.encolar(listo(new Proceso("B", 100, 5)));
        planificador.ejecutarTick();
        expect(proceso.estado()).toBe(EstadoProceso.LISTO);
    });

    it("el proceso con E/S pasa a BLOQUEADO y no queda en la cola de listos", () => {
        const planificador = new PlanificadorRoundRobin(5);
        const proceso = listo(new ProcesoConES("A", 100, 3, new EventoES(1, 2)));
        planificador.encolar(proceso);
        planificador.ejecutarTick();
        expect(proceso.estado()).toBe(EstadoProceso.BLOQUEADO);
        expect(planificador.pidsListos()).toEqual([]);
        expect(planificador.enEjecucion()).toBeUndefined();
    });

    it("tres procesos rotan en orden con quantum 1", () => {
        const planificador = new PlanificadorRoundRobin(1);
        ["A", "B", "C"].forEach(pid => planificador.encolar(listo(new Proceso(pid, 100, 3))));
        [1, 2, 3].forEach(() => planificador.ejecutarTick());
        expect(planificador.pidsListos()).toEqual(["A", "B", "C"]);
        expect(planificador.cambiosDeContexto()).toBe(3);
    });

    it("al bloquearse por E/S el quantum se reinicia: al volver tiene un quantum completo", () => {
        const planificador = new PlanificadorRoundRobin(2);
        const a = listo(new ProcesoConES("A", 100, 5, new EventoES(1, 1)));
        planificador.encolar(a);
        planificador.ejecutarTick();                      // A ejecuta 1 tick y se bloquea
        a.avanzarBloqueo();
        a.cambiarEstado(EstadoProceso.LISTO);
        planificador.encolar(a);
        planificador.encolar(listo(new Proceso("B", 100, 5)));
        expect(planificador.ejecutarTick().resultado).toBe(ResultadoCpu.CONTINUA);
        expect(planificador.enEjecucion()).toBe("A");
    });
});
