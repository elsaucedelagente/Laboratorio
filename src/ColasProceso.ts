import { EstadoProceso } from "./EstadoProceso";
import { Proceso } from "./Proceso";

// Lleva el registro de todos los procesos (en orden de registro) y las listas de bloqueados y terminados.
// Solo guarda y mueve procesos: no sabe de memoria ni de CPU.
export class ColasProcesos {

    private readonly registro = new Map<string, Proceso>();
    private bloqueados: Proceso[] = [];
    private terminados: string[] = [];

    registrar(proceso: Proceso): void {
        this.registro.set(proceso.pid, proceso);
    }

    existe(pid: string): boolean {
        return this.registro.has(pid);
    }

    buscar(pid: string): Proceso | undefined {
        return this.registro.get(pid);
    }

    todos(): Proceso[] {
        return [...this.registro.values()];
    }

    // Procesos nuevos o esperando memoria, en orden de registro.
    pendientesDeMemoria(): Proceso[] {
        return this.todos().filter(proceso => proceso.estaEn(EstadoProceso.NUEVO) || proceso.estaEn(EstadoProceso.ESPERANDO_MEMORIA));
    }

    bloquear(proceso: Proceso): void {
        this.bloqueados.push(proceso);
    }

    // Avanza un tick de E/S: devuelve (y saca de la lista) los procesos cuyo bloqueo termino.
    despertar(): Proceso[] {
        const despiertos = this.bloqueados.filter(proceso => proceso.avanzarBloqueo());
        this.bloqueados = this.bloqueados.filter(proceso => !despiertos.includes(proceso));
        return despiertos;
    }

    terminar(pid: string): void {
        this.terminados.push(pid);
    }

    todosTerminaron(): boolean {
        return this.registro.size > 0 && this.terminados.length === this.registro.size;
    }

    pidsEsperandoMemoria(): string[] {
        return this.todos().filter(proceso => proceso.estaEn(EstadoProceso.ESPERANDO_MEMORIA)).map(proceso => proceso.pid);
    }

    pidsBloqueados(): string[] {
        return this.bloqueados.map(proceso => proceso.pid);
    }

    pidsTerminados(): string[] {
        return [...this.terminados];
    }
}
