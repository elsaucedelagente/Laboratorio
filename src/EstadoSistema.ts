// Foto del sistema en un instante (RF10): todo son valores simples, nunca objetos internos.
export interface EstadoSistema {
    tick: number;
    procesoEnCpu: string | undefined;
    listos: string[];
    esperandoMemoria: string[];
    bloqueados: string[];
    terminados: string[];
    mapaMemoria: string[];
}
