export type AppErrorKind =
  | "network"
  | "timeout"
  | "auth"
  | "parse"
  | "invalid_message"
  | "server"
  | "unknown";

export interface AppErrorPayload {
  kind: AppErrorKind;
  message: string;
  code?: string;
  cause?: unknown;
  context?: Record<string, unknown>;
  timestamp: number;
}

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly code?: string;
  readonly context?: Record<string, unknown>;
  readonly timestamp: number;

  constructor(
    kind: AppErrorKind,
    message: string,
    opts: { code?: string; cause?: unknown; context?: Record<string, unknown> } = {},
  ) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
    this.code = opts.code;
    this.context = opts.context;
    this.timestamp = Date.now();
    if (opts.cause !== undefined) (this as { cause?: unknown }).cause = opts.cause;
  }

  toPayload(): AppErrorPayload {
    return {
      kind: this.kind,
      message: this.message,
      code: this.code,
      cause: (this as { cause?: unknown }).cause,
      context: this.context,
      timestamp: this.timestamp,
    };
  }
}
