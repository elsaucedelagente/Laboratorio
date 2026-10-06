# Laboratorio

Proyecto de la **Actividad de Evaluación 2 (AE2)** de *Paradigmas y Lenguajes de Programación II*.

Simulador de procesos y memoria hecho con **Programación Orientada a Objetos** en TypeScript. Representa la
administración de memoria contigua, los estados de los procesos y la planificación de CPU con **Round-Robin**.
Avanza por *ticks* discretos, sin reloj real ni azar, y no tiene interfaz gráfica, menú de consola ni `main`:
su funcionamiento se verifica con tests automatizados.

## Requerimientos funcionales

| RF | Descripción | Dónde |
|---|---|---|
| RF01 | Configurar e iniciar la simulación | `Simulador` (constructor) |
| RF02 | Registrar y consultar procesos | `Simulador.agregarProceso`, `registrarProceso`, `proceso(pid)`, `procesos()`, `Proceso`, `InfoProceso` |
| RF03 | Gestionar estados y admisión | `EstadoProceso`, `Proceso.cambiarEstado`, `Simulador` |
| RF04 | Asignar memoria contigua | `GestorMemoria.asignar`, `PrimeAjuste`, `MejorAJuste`, `PeorAjuste` |
| RF05 | Liberar memoria y coalescencia | `GestorMemoria.liberar` |
| RF06 | Avanzar un tick de forma determinista | `Simulador.avanzarTick`, `avanzarTicks`, `ejecutarHastaTerminar`, `EstadisticasCpu` |
| RF07 | Planificar la CPU con Round-Robin | `PlanificadorRoundRobin` |
| RF08 | Simular entrada/salida | `EventoES`, `ProcesoConES` |
| RF09 | Exponer métricas | `Simulador.metricas` (memoria y CPU), `GestorMemoria.metricas`, `EstadisticasCpu` |
| RF10 | Consultar el estado del sistema | `Simulador.estadoSistema` y consultas (`procesoEnCpu`, `pidsListos`, `pidsEsperandoMemoria`, `mapaMemoria`...) |

## Requisitos e instalación

Node.js 20 o superior.

```bash
npm install
```

## Comandos

```bash
npm test             # corre los tests
npm run check        # revisa los tipos (tsc --noEmit)
npm run cobertura    # corre los tests y muestra la cobertura por archivo
```



## Características

La simulación comienza en el **tick 0**, con la memoria vacía y la CPU libre. Configuración de referencia
(configurable): **quantum 2**, **memoria 1024 KB** y política (`PrimerAjuste`). También están disponibles `Mejorajuste` y `PeorAjuste` .

Cada tick tiene siempre tres fases, en este orden:

1. **Admisión:** los procesos nuevos y los que esperan memoria intentan conseguir un bloque, en orden de registro.
2. **Bloqueos:** se descuenta un tick a cada E/S; los que terminan vuelven a la cola de listos.
3. **CPU:** se despacha si la CPU está libre y se ejecuta un tick. Después de ejecutar, la prioridad es:
   terminar, bloquearse por E/S, vencer el quantum.

Estados: `NUEVO → ESPERANDO_MEMORIA → LISTO ⇄ EJECUTANDO → TERMINADO`, y `EJECUTANDO → BLOQUEADO → LISTO`.
Una transición inválida lanza un error.

Los errores de validación son `ErrorSimulacion` (hereda de `Error`). Las consultas de procesos devuelven copias de solo lectura (`InfoProceso`), nunca los objetos internos.

Un cambio de contexto se cuenta al expulsar un proceso por quantum con otros listos esperando y al bloquearse por E/S.