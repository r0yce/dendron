export enum LOG_LEVEL {
  DEBUG = "DEBUG",
  INFO = "INFO",
  ERROR = "ERROR",
}

const levelRank: Record<LOG_LEVEL, number> = {
  [LOG_LEVEL.DEBUG]: 0,
  [LOG_LEVEL.INFO]: 1,
  [LOG_LEVEL.ERROR]: 2,
};

let currentLevel = LOG_LEVEL.INFO;

export type FrontendLogger = {
  log: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

function shouldLog(level: LOG_LEVEL): boolean {
  return levelRank[level] >= levelRank[currentLevel];
}

export function createLogger(name: string): FrontendLogger {
  const prefix = `[${name}]`;

  const write =
    (level: LOG_LEVEL, writer: (...args: unknown[]) => void) =>
    (...args: unknown[]) => {
      if (shouldLog(level)) {
        writer(prefix, ...args);
      }
    };

  return {
    log: write(LOG_LEVEL.INFO, console.log.bind(console)),
    debug: write(LOG_LEVEL.DEBUG, console.debug.bind(console)),
    info: write(LOG_LEVEL.INFO, console.info.bind(console)),
    warn: write(LOG_LEVEL.INFO, console.warn.bind(console)),
    error: write(LOG_LEVEL.ERROR, console.error.bind(console)),
  };
}

export function setLogLevel(lvl: LOG_LEVEL): void {
  currentLevel = lvl;
}