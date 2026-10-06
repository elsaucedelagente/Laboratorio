import { describe, expect, it } from "vitest";
import { ColasProcesos } from "../src/ColasProceso";
import { EstadoProceso } from "../src/EstadoProceso";
import { EventoES } from "../src/EventoES";
import { Proceso } from "../src/Proceso";
import { ProcesoConES } from "../src/ProcesoConES";

const conTres = () => {
    const colas = new ColasProcesos();
    ["A", "B", "C"].forEach(pid => colas.registrar(new Proceso(pid, 100, 3)));
    return colas;
};

describe("ColasProcesos", () => {
    it("registrar guarda el proceso y existe lo encuentra", () => {
        const colas = new ColasProcesos();
        colas.registrar(new Proceso("A", 100, 3));
        expect(colas.existe("A")).toBe(true);
        expect(colas.existe("Z")).toBe(false);
    });

    it("pendientesDeMemoria incluye nuevos y en espera, pero no los demas", () => {
        const colas = conTres();
        colas.buscar("B")?.cambiarEstado(EstadoProceso.ESPERANDO_MEMORIA);
        colas.buscar("C")?.cambiarEstado(EstadoProceso.ESPERANDO_MEMORIA);
        colas.buscar("C")?.cambiarEstado(EstadoProceso.LISTO);
        expect(colas.pendientesDeMemoria().map(proceso => proceso.pid)).toEqual(["A", "B"]);
    });

    it("pidsEsperandoMemoria solo muestra los que esperan", () => {
        const colas = conTres();
        colas.buscar("B")?.cambiarEstado(EstadoProceso.ESPERANDO_MEMORIA);
        expect(colas.pidsEsperandoMemoria()).toEqual(["B"]);
    });

    it("un proceso bloqueado se mantiene en la lista hasta cumplir su espera", () => {
        const colas = new ColasProcesos();
        const proceso = new ProcesoConES("A", 100, 5, new EventoES(1, 2));
        proceso.ejecutarTick();
        proceso.bloquear();
        colas.bloquear(proceso);
        expect(colas.despertar()).toEqual([]);
        expect(colas.pidsBloqueados()).toEqual(["A"]);
    });

    it("despertar devuelve el proceso cuando termina su bloqueo y lo saca de la lista", () => {
        const colas = new ColasProcesos();
        const proceso = new ProcesoConES("A", 100, 5, new EventoES(1, 1));
        proceso.ejecutarTick();
        proceso.bloquear();
        colas.bloquear(proceso);
        expect(colas.despertar()).toEqual([proceso]);
        expect(colas.pidsBloqueados()).toEqual([]);
    });

    it("terminar registra los pids en orden de finalizacion", () => {
        const colas = conTres();
        colas.terminar("C");
        colas.terminar("A");
        expect(colas.pidsTerminados()).toEqual(["C", "A"]);
    });

    it("todosTerminaron es falso sin procesos y verdadero cuando terminaron todos", () => {
        expect(new ColasProcesos().todosTerminaron()).toBe(false);
        const colas = conTres();
        ["A", "B", "C"].forEach(pid => colas.terminar(pid));
        expect(colas.todosTerminaron()).toBe(true);
    });
});
