import { canTransition, type LifecycleState } from "@/models/deviceLifecycle";
import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";

/**
 * Deterministischer Lifecycle-FSM. Ungültige Übergänge werden am
 * {@link errorBus} gemeldet und **nicht** durchgeführt.
 */
export const LifecycleMachine = {
  initial(): LifecycleState {
    return "new";
  },
  transition(
    deviceId: string,
    from: LifecycleState | undefined,
    to: LifecycleState,
  ): LifecycleState {
    const current = from ?? "new";
    if (canTransition(current, to)) return to;
    errorBus.report(
      new AppError("invalid_message", `Ungültiger Lifecycle-Übergang`, {
        code: "invalid_lifecycle_transition",
        context: { deviceId, from: current, to },
      }),
    );
    return current;
  },
};
