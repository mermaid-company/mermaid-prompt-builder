/**
 * Logger Utility
 *
 * Structured logging with component prefixes.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  component: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

const LOG_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m", // Green
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
};

const RESET = "\x1b[0m";

function formatLog(entry: LogEntry): string {
  const color = LOG_COLORS[entry.level];
  const prefix = `${color}[${entry.level.toUpperCase()}]${RESET}`;
  const component = `\x1b[35m[${entry.component}]${RESET}`;
  const time = `\x1b[90m${entry.timestamp}${RESET}`;

  let output = `${prefix} ${component} ${time} ${entry.message}`;

  if (entry.data) {
    output += `\n${JSON.stringify(entry.data, null, 2)}`;
  }

  return output;
}

/**
 * Create a logger for a specific component
 */
export function createLogger(component: string) {
  const log = (
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ) => {
    const entry: LogEntry = {
      level,
      component,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    const formatted = formatLog(entry);

    switch (level) {
      case "debug":
        if (process.env.NODE_ENV === "development") {
          console.debug(formatted);
        }
        break;
      case "info":
        console.info(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "error":
        console.error(formatted);
        break;
    }

    return entry;
  };

  return {
    debug: (message: string, data?: Record<string, unknown>) =>
      log("debug", message, data),
    info: (message: string, data?: Record<string, unknown>) =>
      log("info", message, data),
    warn: (message: string, data?: Record<string, unknown>) =>
      log("warn", message, data),
    error: (message: string, data?: Record<string, unknown>) =>
      log("error", message, data),
  };
}

/**
 * Default application logger
 */
export const logger = createLogger("app");
