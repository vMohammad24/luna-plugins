import { actions } from "@neptune";
import { Message, Severity } from "neptune-types/tidal";
import type { Signal } from "./Signal";

type LoggerFunc = (...data: any[]) => void;
type MessengerFunc = (messageInfo: Message) => void;

type Logger<T extends LoggerFunc = LoggerFunc> = {
	(...data: Parameters<T>): undefined;
	withContext(...context: Parameters<T>): {
		(...data: Parameters<T>): undefined;
		/** Throw data after logging */
		throw: (...data: Parameters<T>) => undefined;
	};
};
type Messenger = {
	(message: unknown): undefined;
	withContext(context: string): {
		(message: unknown): undefined;
		/** Throw message after logging */
		throw: (message: unknown) => undefined;
	};
};

export const Tracer = (source: string, errSignal?: Signal<string | undefined>) => {
	const createLogger = <T extends LoggerFunc>(logger: T): Logger<T> => {
		const _logger = (...data: Parameters<T>) => {
			logger(source, ...data);
			return undefined;
		};
		_logger.withContext = (...context: Parameters<T>) => {
			const logWithContext = (...data: Parameters<T>) => {
				logger(source, ...context, ...data);
				return undefined;
			};
			logWithContext.throw = (...data: Parameters<T>) => {
				logWithContext(...data);
				throw data?.[0];
			};
			return logWithContext;
		};

		return _logger;
	};

	const log = createLogger(console.log);
	const warn = createLogger(console.warn);
	const err = createLogger(
		errSignal
			? (source, ...args) => {
					console.error(source, ...args);
					errSignal._ = args
						.map((arg) => {
							if (arg instanceof Error) return arg.message;
							if (typeof arg === "object") return "";
							return String(arg);
						})
						.join(" ");
			  }
			: console.error
	);
	const debug = createLogger(console.debug);

	const createMessager = (logger: Logger, messager: MessengerFunc, severity: Severity): Messenger => {
		const _messager = (message: unknown) => {
			logger(message);
			messager({ message: `${source} - ${message}`, category: "OTHER", severity });
			return undefined;
		};
		_messager.withContext = (context: string) => {
			const loggerWithContext = logger.withContext(context);
			const msgWithContext = (message: unknown) => {
				loggerWithContext(message);
				if (message instanceof Error) message = message.message;
				messager({ message: `${source} (${context}) - ${message}`, category: "OTHER", severity });
				return undefined;
			};
			msgWithContext.throw = (message: unknown) => {
				msgWithContext(message);
				throw message;
			};
			return msgWithContext;
		};
		return _messager;
	};

	return {
		log,
		warn,
		err,
		debug,
		msg: {
			log: createMessager(log, actions.message.messageInfo, "INFO"),
			warn: createMessager(warn, actions.message.messageWarn, "WARN"),
			err: createMessager(err, actions.message.messageError, "ERROR"),
		},
	};
};
