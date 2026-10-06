import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text"],
      include: ["src/**/*.ts"],
      // La consigna pide una cobertura de lineas superior al 90 %.
      thresholds: { lines: 90 }
    }
  }
});
