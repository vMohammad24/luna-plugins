import { broadcast } from "./broadcast.native";

type LoggerFunc = (...data: any[]) => void;

type Logger<T extends LoggerFunc = LoggerFunc> = {
	(...data: Parameters<T>): undefined;
	withContext(...context: Parameters<T>): (...data: Parameters<T>) => undefined;
};

export const Tracer = (source: string) => {
	const createLogger = <T extends LoggerFunc>(logger: T): Logger<T> => {
		const _logger = (...data: Parameters<T>) => {
			logger(source, ...data);
			return undefined;
		};
		_logger.withContext =
			(...context: Parameters<T>) =>
			(...data: Parameters<T>) => {
				logger(source, context, ...data);
				return undefined;
			};
		return _logger;
	};

	const log = createLogger((...args) => broadcast("NEPTUNE_RENDERER_LOG", "log", ...args));
	const warn = createLogger((...args) => broadcast("NEPTUNE_RENDERER_LOG", "warn", ...args));
	const err = createLogger((...args) => broadcast("NEPTUNE_RENDERER_LOG", "error", ...args));
	const debug = createLogger((...args) => broadcast("NEPTUNE_RENDERER_LOG", "debug", ...args));

	return {
		log,
		warn,
		err,
		debug,
	};
};
