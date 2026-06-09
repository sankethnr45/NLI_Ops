import { pino } from "pino";
// Internal raw Pino instance. Not exposed to the rest of the application.
const pinoLogger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
        },
    },
});
/**
 * Custom logger abstraction to avoid tight coupling with a specific logging library.
 * It enforces structured metadata across all logging calls.
 */
export const logger = {
    info: (message, metadata) => {
        pinoLogger.info(metadata || {}, message);
    },
    warn: (message, metadata) => {
        pinoLogger.warn(metadata || {}, message);
    },
    error: (message, error, metadata) => {
        const errorPayload = { ...metadata };
        if (error instanceof Error) {
            errorPayload.error = {
                message: error.message,
                stack: error.stack,
                name: error.name
            };
        }
        else if (error !== undefined) {
            errorPayload.error = error;
        }
        pinoLogger.error(errorPayload, message);
    },
    debug: (message, metadata) => {
        pinoLogger.debug(metadata || {}, message);
    },
};
//# sourceMappingURL=logger.js.map