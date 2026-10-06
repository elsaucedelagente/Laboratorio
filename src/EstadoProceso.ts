// Los seis estados por los que pasa un proceso (RF03).
export enum EstadoProceso {
    NUEVO = "NUEVO",
    ESPERANDO_MEMORIA = "ESPERANDO_MEMORIA",
    LISTO = "LISTO",
    EJECUTANDO = "EJECUTANDO",
    BLOQUEADO = "BLOQUEADO",
    TERMINADO = "TERMINADO",
}
