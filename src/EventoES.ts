import { exigirEnteroPositivo } from "./Validaciones";

// Evento de entrada/salida (RF08): cuando el proceso lleva `despuesDeTicks` ticks de CPU,
// se bloquea durante `duracion` ticks. Es de solo lectura.
export class EventoES {

    constructor(readonly despuesDeTicks: number, readonly duracion: number) {
        exigirEnteroPositivo(despuesDeTicks, "despuesDeTicks");
        exigirEnteroPositivo(duracion, "duracion");
    }
}
