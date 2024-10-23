import { WebSocket } from "ws";

export const enum Role {
    Guest = 1 << 0,
    User = 1 << 1,
    Bot = 1 << 2,
    System = 1 << 3,
    Mod = 1 << 4,
    Admin = 1 << 5
};

export const enum MessageTypes {
    Normal = 0,
    Join = 1,
    Leave = 2,
    GoodPerson = 3,
    Bridge = 4,
	IncomingDM,
	OutgoingDM, // NOTE(PoolloverNathan): these are currently sent to clients as if the *recipient* sent the message, for backwards-compatibility
};

export interface ChatClient extends WebSocket {
    ipAddress: string;
    id?: string;
    roles?: number;
    username?: string;
    initialised?: boolean;
    lastHeartbeat: number;
    lastMessageTimestamp: number;
    last3MessageTimestamps: number[];
    device: string | null;
}

export type Payload = {
    op: number;
    d: any;
};

export type Opcode = {
    code: number;
    function: (client: ChatClient, d: any) => void;
};

export type MemberListUser = {
    username: string;
    id: string;
    roles: number;
};
