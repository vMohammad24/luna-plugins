import { memoize } from "@inrixia/helpers";
import { actions } from "@neptune";
import { Message, Severity } from "neptune-types/tidal";

type LoggerFunc = (...data: any[]) => void;
type MessengerFunc = (messageInfo: Message) => void;

type Logger<T extends LoggerFunc = LoggerFunc> = {
	(...data: Parameters<T>): undefined;
	withContext(...context: Parameters<T>): (...data: Parameters<T>) => undefined;
};
type Messenger = {
	(message: unknown): undefined;
	withContext(context: string): (message: unknown) => undefined;
};

export const Tracer = memoize((source: string) => {
	const createLogger = <T extends LoggerFunc>(logger: T): Logger<T> => {
		const _logger = (...data: Parameters<T>) => {
			logger(source, ...data);
			return undefined;
		};
		_logger.withContext =
			(...context: Parameters<T>) =>
			(...data: Parameters<T>) => {
				logger(source, ...context, ...data);
				return undefined;
			};
		return _logger;
	};

	const log = createLogger(console.log);
	const warn = createLogger(console.warn);
	const err = createLogger(console.error);
	const debug = createLogger(console.debug);

	const createMessager = (logger: Logger, messager: MessengerFunc, severity: Severity): Messenger => {
		const _messager = (message: unknown) => {
			logger(message);
			messager({ message: `${source} - ${message}`, category: "OTHER", severity });
			return undefined;
		};
		_messager.withContext = (context: string) => {
			const loggerWithContext = logger.withContext(context);
			return (message: unknown) => {
				loggerWithContext(message);
				if (message instanceof Error) message = message.message;
				messager({ message: `${source} (${context}) - ${message}`, category: "OTHER", severity });
				return undefined;
			};
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
});
