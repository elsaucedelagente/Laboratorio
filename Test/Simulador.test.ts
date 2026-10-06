import { describe, expect, it } from "vitest";
import { EstadoProceso } from "../src/EstadoProceso";
import { EventoES } from "../src/EventoES";
import { Proceso } from "../src/Proceso";
import { ProcesoConES } from "../src/ProcesoConES";
import { Simulador } from "../src/Simulador";

const avanzar = (simulador: Simulador, ticks: number): void => {
    Array.from({ length: ticks }).forEach(() => simulador.avanzarTick());
};

// Escenario comun de E/S: P1 se bloquea 2 ticks tras 1 tick de CPU; P2 y P3 son procesos comunes.
const escenarioES = () => {
    const simulador = new Simulador(2, 1024);
    simulador.agregarProceso(new ProcesoConES("1", 300, 3, new EventoES(1, 2)));
    simulador.agregarProceso(new Proceso("2", 200, 2));
    simulador.agregarProceso(new Proceso("3", 100, 1));
    return simulador;
};

describe("Simulador: configuracion e inicio (RF01)", () => {
    it("arranca en el tick 0, con la memoria vacia y la CPU libre", () => {
        const simulador = new Simulador();
        expect(simulador.tickActual()).toBe(0);
        expect(simulador.procesoEnCpu()).toBeUndefined();
        expect(simulador.mapaMemoria()).toEqual(["[0-1024 KB] LIBRE"]);
    });

    it("rechaza un quantum no positivo", () => {
        expect(() => new Simulador(0)).toThrow("El quantum debe ser un entero positivo");
    });

    it("rechaza una memoria no positiva", () => {
        expect(() => new Simulador(2, 0)).toThrow("El tamano de memoria debe ser un entero positivo");
    });
});

describe("Simulador: avance de ticks (RF06)", () => {
    it("avanzarTicks avanza la cantidad pedida", () => {
        const simulador = new Simulador();
        simulador.avanzarTicks(5);
        expect(simulador.tickActual()).toBe(5);
    });

    it("avanzarTicks rechaza una cantidad no positiva", () => {
        expect(() => new Simulador().avanzarTicks(0)).toThrow("La cantidad de ticks debe ser un entero positivo");
    });
});

describe("Simulador: registro de procesos (RF02)", () => {
    it("rechaza un PID repetido", () => {
        const simulador = new Simulador();
        simulador.agregarProceso(new Proceso("1", 100, 2));
        expect(() => simulador.agregarProceso(new Proceso("1", 100, 2))).toThrow("Ya existe un proceso con PID 1");
    });

    it("rechaza un proceso que pide mas memoria que el total", () => {
        const simulador = new Simulador(2, 500);
        expect(() => simulador.agregarProceso(new Proceso("1", 600, 2))).toThrow("pide 600 KB, mas que el total (500 KB)");
    });

    it("se puede registrar un proceso con la simulacion en marcha", () => {
        const simulador = new Simulador(2, 1024);
        simulador.agregarProceso(new Proceso("A", 100, 1));
        avanzar(simulador, 2);
        simulador.agregarProceso(new Proceso("B", 100, 1));
        avanzar(simulador, 1);
        expect(simulador.pidsTerminados()).toEqual(["A", "B"]);
    });
});

describe("Simulador: Round-Robin y memoria (RF03 a RF07)", () => {
    const armar = () => {
        const simulador = new Simulador(2, 1000);
        simulador.agregarProceso(new Proceso("A", 200, 3));
        simulador.agregarProceso(new Proceso("B", 300, 2));
        simulador.agregarProceso(new Proceso("C", 100, 1));
        return simulador;
    };

    it("tick 1: se asigna memoria a todos y se despacha al primero", () => {
        const simulador = armar();
        avanzar(simulador, 1);
        expect(simulador.procesoEnCpu()).toBe("A");
        expect(simulador.pidsListos()).toEqual(["B", "C"]);
        expect(simulador.mapaMemoria()).toEqual(["[0-200 KB] A", "[200-500 KB] B", "[500-600 KB] C", "[600-1000 KB] LIBRE"]);
    });

    it("tick 2: vence el quantum de A y rota al final de la cola", () => {
        const simulador = armar();
        avanzar(simulador, 2);
        expect(simulador.pidsListos()).toEqual(["B", "C", "A"]);
        expect(simulador.cambiosDeContexto()).toBe(1);
    });

    it("tick 4: B termina y libera su memoria", () => {
        const simulador = armar();
        avanzar(simulador, 4);
        expect(simulador.pidsTerminados()).toEqual(["B"]);
        expect(simulador.mapaMemoria()[1]).toBe("[200-500 KB] LIBRE");
    });

    it("al terminar todos la memoria vuelve a quedar libre", () => {
        const simulador = armar();
        avanzar(simulador, 6);
        expect(simulador.pidsTerminados()).toEqual(["B", "C", "A"]);
        expect(simulador.mapaMemoria()).toEqual(["[0-1000 KB] LIBRE"]);
    });

    it("el uso de CPU baja cuando ya no hay trabajo", () => {
        const simulador = armar();
        avanzar(simulador, 12);
        expect(simulador.usoCpu()).toBe(50);
    });

    it("un proceso que no entra espera memoria hasta que otro termina", () => {
        const simulador = new Simulador(2, 500);
        simulador.agregarProceso(new Proceso("X", 300, 2));
        simulador.agregarProceso(new Proceso("Y", 300, 1));
        avanzar(simulador, 2);
        expect(simulador.pidsEsperandoMemoria()).toEqual(["Y"]);
        expect(simulador.mapaMemoria()).toEqual(["[0-500 KB] LIBRE"]);
        avanzar(simulador, 1);
        expect(simulador.pidsTerminados()).toEqual(["X", "Y"]);
    });
});

describe("Simulador: entrada/salida (RF08)", () => {
    it.each([
        [1, undefined, ["2", "3"], ["1"], []],
        [2, "2", ["3"], ["1"], []],
        [3, undefined, ["3", "1"], [], ["2"]],
        [5, "1", [], [], ["2", "3"]],
        [6, undefined, [], [], ["2", "3", "1"]],
    ])("al terminar el tick %i", (tick, enCpu, listos, bloqueados, terminados) => {
        const simulador = escenarioES();
        avanzar(simulador, tick);
        expect(simulador.procesoEnCpu()).toBe(enCpu);
        expect(simulador.pidsListos()).toEqual(listos);
        expect(simulador.pidsBloqueados()).toEqual(bloqueados);
        expect(simulador.pidsTerminados()).toEqual(terminados);
    });

    it("hubo un solo cambio de contexto: el del bloqueo por E/S", () => {
        const simulador = escenarioES();
        avanzar(simulador, 6);
        expect(simulador.cambiosDeContexto()).toBe(1);
    });

    it("al volver de la E/S, el proceso no se rota antes de tiempo (el quantum se reinicio)", () => {
        const simulador = new Simulador(2, 1024);
        simulador.agregarProceso(new ProcesoConES("1", 100, 6, new EventoES(1, 1)));
        simulador.agregarProceso(new Proceso("2", 100, 6));
        avanzar(simulador, 4);
        expect(simulador.procesoEnCpu()).toBe("1");
    });
});

describe("Simulador: consultas de estado y metricas (RF09, RF10)", () => {
    it("estadoSistema al inicio", () => {
        expect(new Simulador().estadoSistema()).toEqual({
            tick: 0, procesoEnCpu: undefined, listos: [], esperandoMemoria: [], bloqueados: [], terminados: [],
            mapaMemoria: ["[0-1024 KB] LIBRE"],
        });
    });

    it("estadoSistema despues del primer tick del escenario de E/S", () => {
        const simulador = escenarioES();
        avanzar(simulador, 1);
        expect(simulador.estadoSistema()).toEqual({
            tick: 1, procesoEnCpu: undefined, listos: ["2", "3"], esperandoMemoria: [], bloqueados: ["1"], terminados: [],
            mapaMemoria: ["[0-300 KB] 1", "[300-500 KB] 2", "[500-600 KB] 3", "[600-1024 KB] LIBRE"],
        });
    });

    it("metricas combina memoria y CPU", () => {
        const simulador = escenarioES();
        avanzar(simulador, 3);
        const metricas = simulador.metricas();
        expect([metricas.ocupada, metricas.libre, metricas.mayorHueco]).toEqual([400, 624, 424]);
        expect([metricas.usoCpu, metricas.cambiosDeContexto]).toEqual([100, 1]);
        expect(metricas.fragmentacionExterna).toBeCloseTo(32.05, 1);
    });

    it("proceso(pid) devuelve una copia con el estado actual", () => {
        const simulador = escenarioES();
        avanzar(simulador, 1);
        const informacion = simulador.proceso("1");
        expect(informacion.estado).toBe(EstadoProceso.BLOQUEADO);
        expect([informacion.tiempoRestante, informacion.bloqueoRestante, informacion.quantumConsumido]).toEqual([2, 2, 0]);
    });

    it("proceso(pid) falla si el PID no existe", () => {
        expect(() => escenarioES().proceso("9")).toThrow("No existe un proceso con PID 9");
    });
});

describe("Simulador: determinismo y avance hasta el final", () => {
    const foto = (simulador: Simulador): string => JSON.stringify([simulador.estadoSistema(), simulador.metricas()]);

    it("dos simulaciones con la misma carga producen la misma historia", () => {
        const [uno, dos] = [escenarioES(), escenarioES()];
        const historias = [uno, dos].map(simulador => Array.from({ length: 12 }, () => { simulador.avanzarTick(); return foto(simulador); }));
        expect(historias[0]).toEqual(historias[1]);
    });

    it("ejecutarHastaTerminar se detiene cuando todos terminaron", () => {
        const simulador = escenarioES();
        expect(simulador.ejecutarHastaTerminar(100)).toBe(6);
        expect(simulador.pidsTerminados()).toHaveLength(3);
    });

    it("ejecutarHastaTerminar respeta el limite de ticks", () => {
        const simulador = escenarioES();
        expect(simulador.ejecutarHastaTerminar(3)).toBe(3);
        expect(simulador.pidsTerminados()).toEqual(["2"]);
    });
});
