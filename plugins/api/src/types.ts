export type ActionData = Record<string, unknown>;
export type ActionResponse = Record<string, unknown> | void | unknown;
export type ActionHandler = (data: ActionData) => ActionResponse | Promise<ActionResponse>;

export interface ActionSchema {
    param?: string;
    validate: (value: unknown) => boolean;
}

export interface WsSubscription {
    fields: Set<string>;
    all: boolean;
}

export interface WsMessage extends ActionData {
    action: string;
    fields?: string[];
    all?: boolean;
    mode?: number;
    shuffle?: boolean;
    time?: number;
    volume?: string | number;
    itemId?: string;
}

export interface ActionResult {
    success: boolean;
    response?: Record<string, unknown>;
}
