// Metricas de memoria (RF09). Los porcentajes van de 0 a 100.
export interface Metricas {
    total: number;
    ocupada: number;
    libre: number;
    mayorHueco: number;
    ocupacion: number;
    fragmentacionExterna: number;
}

// Metricas de toda la simulacion: las de memoria mas las de CPU.
export interface MetricasSimulacion extends Metricas {
    usoCpu: number;
    cambiosDeContexto: number;
}
