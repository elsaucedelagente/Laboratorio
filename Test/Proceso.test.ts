import { describe, expect, it } from "vitest";
import { EstadoProceso } from "../src/EstadoProceso";
import { EventoES } from "../src/EventoES";
import { Proceso } from "../src/Proceso";
import { ProcesoConES } from "../src/ProcesoConES";

describe("Proceso", () => {
    it("nace en estado NUEVO", () => {
        expect(new Proceso("P1", 100, 3).estado()).toBe(EstadoProceso.NUEVO);
    });

    it("guarda pid, memoria y tiempo de CPU", () => {
        const proceso = new Proceso("P1", 100, 3);
        expect([proceso.pid, proceso.memoria, proceso.tiempoCpu]).toEqual(["P1", 100, 3]);
    });

    it("rechaza una memoria no positiva", () => {
        expect(() => new Proceso("P1", 0, 3)).toThrow("La memoria requerida debe ser un entero positivo");
    });

    it("rechaza un tiempo de CPU no positivo", () => {
        expect(() => new Proceso("P1", 100, 0)).toThrow("El tiempo de CPU debe ser un entero positivo");
    });

    it("recorre los estados validos", () => {
        const proceso = new Proceso("P1", 100, 3);
        proceso.cambiarEstado(EstadoProceso.ESPERANDO_MEMORIA);
        proceso.cambiarEstado(EstadoProceso.LISTO);
        proceso.cambiarEstado(EstadoProceso.EJECUTANDO);
        expect(proceso.estaEn(EstadoProceso.EJECUTANDO)).toBe(true);
    });

    it("rechaza una transicion invalida", () => {
        const proceso = new Proceso("P1", 100, 3);
        expect(() => proceso.cambiarEstado(EstadoProceso.EJECUTANDO)).toThrow("Transicion invalida: NUEVO -> EJECUTANDO");
    });

    it("ejecutarTick descuenta CPU hasta terminar", () => {
        const proceso = new Proceso("P1", 100, 2);
        proceso.ejecutarTick();
        expect(proceso.terminoCpu()).toBe(false);
        proceso.ejecutarTick();
        expect(proceso.terminoCpu()).toBe(true);
        expect(proceso.ticksEjecutados()).toBe(2);
    });

    it("controla el quantum", () => {
        const proceso = new Proceso("P1", 100, 5);
        proceso.ejecutarTick();
        proceso.ejecutarTick();
        expect(proceso.agotoQuantum(2)).toBe(true);
        proceso.reiniciarQuantum();
        expect(proceso.agotoQuantum(2)).toBe(false);
    });

    it("el proceso comun nunca se bloquea", () => {
        const proceso = new Proceso("P1", 100, 5);
        proceso.ejecutarTick();
        expect(proceso.debeBloquearse()).toBe(false);
    });
});

describe("ProcesoConES", () => {
    it("el evento tiene que ocurrir antes de que el proceso termine", () => {
        expect(() => new ProcesoConES("P1", 100, 3, new EventoES(3, 1))).toThrow("antes de que el proceso termine");
    });

    it("debe bloquearse justo cuando ejecuto los ticks del evento", () => {
        const proceso = new ProcesoConES("P1", 100, 5, new EventoES(2, 3));
        proceso.ejecutarTick();
        expect(proceso.debeBloquearse()).toBe(false);
        proceso.ejecutarTick();
        expect(proceso.debeBloquearse()).toBe(true);
    });

    it("el bloqueo dura lo que indica el evento", () => {
        const proceso = new ProcesoConES("P1", 100, 5, new EventoES(1, 2));
        proceso.ejecutarTick();
        proceso.bloquear();
        expect(proceso.avanzarBloqueo()).toBe(false);
        expect(proceso.avanzarBloqueo()).toBe(true);
    });

    it("no vuelve a bloquearse por el mismo evento", () => {
        const proceso = new ProcesoConES("P1", 100, 5, new EventoES(1, 1));
        proceso.ejecutarTick();
        proceso.bloquear();
        expect(proceso.debeBloquearse()).toBe(false);
    });
});

describe("Proceso: mas casos", () => {
    it("rechaza un PID vacio", () => {
        expect(() => new Proceso("  ", 100, 3)).toThrow("El PID no puede estar vacio");
    });

    it("no se puede ejecutar un proceso que ya consumio toda su CPU", () => {
        const proceso = new Proceso("P1", 100, 1);
        proceso.ejecutarTick();
        expect(() => proceso.ejecutarTick()).toThrow("El proceso P1 ya no tiene CPU pendiente");
    });

    it.each([[0, 0], [1, 25], [2, 50], [4, 100]])("con %i ticks ejecutados el porcentaje es %i", (ticks, porcentaje) => {
        const proceso = new Proceso("P1", 100, 4);
        Array.from({ length: ticks }).forEach(() => proceso.ejecutarTick());
        expect(proceso.porcentajeCompletado()).toBe(porcentaje);
    });

});

describe("Proceso: informacion (copia de solo lectura)", () => {
    it("devuelve los datos actuales", () => {
        const proceso = new Proceso("P1", 100, 4);
        proceso.ejecutarTick();
        expect(proceso.informacion()).toEqual({
            pid: "P1", memoria: 100, tiempoCpu: 4, tiempoRestante: 3, quantumConsumido: 1,
            bloqueoRestante: 0, estado: EstadoProceso.NUEVO, porcentajeCompletado: 25,
        });
    });

    it("es una copia congelada: no se puede modificar", () => {
        const informacion = new Proceso("P1", 100, 4).informacion();
        expect(Object.isFrozen(informacion)).toBe(true);
        expect(() => { (informacion as { memoria: number }).memoria = 1; }).toThrow();
    });

    it("no cambia cuando el proceso sigue avanzando", () => {
        const proceso = new Proceso("P1", 100, 4);
        const antes = proceso.informacion();
        proceso.ejecutarTick();
        expect(antes.tiempoRestante).toBe(4);
        expect(proceso.informacion().tiempoRestante).toBe(3);
    });

    it("en un ProcesoConES refleja el bloqueo pendiente", () => {
        const proceso = new ProcesoConES("P1", 100, 5, new EventoES(1, 3));
        proceso.ejecutarTick();
        proceso.bloquear();
        expect(proceso.informacion().bloqueoRestante).toBe(3);
        proceso.avanzarBloqueo();
        expect(proceso.informacion().bloqueoRestante).toBe(2);
    });
});

describe("ProcesoConES: mas casos", () => {
    it("el bloqueo nunca baja de cero", () => {
        const proceso = new ProcesoConES("P1", 100, 5, new EventoES(1, 1));
        proceso.ejecutarTick();
        proceso.bloquear();
        [1, 2, 3].forEach(() => proceso.avanzarBloqueo());
        expect(proceso.bloqueoRestante()).toBe(0);
    });

});
