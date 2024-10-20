import { WebSocketServer } from "ws";
import { ChatClient, Opcode, Payload, Role } from "./utils/types";
//import { config } from "./config";
import { sendMessage } from "./modules/messageSending";
import { accountInitialisation } from "./opcodes/accountInitialisation";
import { receivedMessage } from "./opcodes/receivedMessage";
import { heartbeat } from "./opcodes/heartbeat";
import { generateID } from "./utils/ids";
import { history } from "./modules/history";

export const wss = new WebSocketServer({ port: 8928 });

const opcodes: Opcode[] = [
    {
        code: 0,
        function: receivedMessage
    },
    {
        code: 1,
        function: accountInitialisation
    },
    {
        code: 2,
        function: heartbeat
    }
];

wss.on("connection", function connection(ws: ChatClient, req) {
    ws.ipAddress = req.headers["cf-connecting-ip"]?.toString() || req.socket.remoteAddress!;
    ws.on("error", console.error);

    ws.on("close", function close() {
        if (ws.initialised)
            sendMessage({
                userInfo: {
                    username: "System",
                    roles: Role.System,
                    id: "1"
                },
                content: `${ws.username} has left the chat.\nCurrently ${wss.clients.size} user${
                    wss.clients.size === 1 ? " is" : "s are"
                } online.`,
                id: generateID(),
                device: null,
                timestamp: Date.now()
            });
    });

    ws.on("message", async function message(data) {
        try {
            const payload: Payload = JSON.parse(data.toString());
            const opcode = opcodes.find((o) => o.code === payload.op);
            if (!opcode) throw "Invalid opcode received";
            if (opcode.code !== 1 && opcode.code !== 2 && !ws.initialised)
                throw "Attempt to use ws without init";
            opcode.function(ws, payload.d);
        } catch (e) {
            console.error(e);
            ws.close();
        }
    });

    // Initialise client and send system message
    ws.roles = Role.Guest;
    ws.lastHeartbeat = Date.now();
    ws.send(
        JSON.stringify({
            op: 3,
            d: {
                history
            }
        })
    );

    setInterval(() => {
        if (ws.lastHeartbeat + 10000 < Date.now()) {
            ws.close();
        } else {
            ws.send(
                JSON.stringify({
                    op: 2,
                    d: {}
                })
            );
        }
    }, Math.floor(Math.random() * 10000) + 1000);
});

process.on("unhandledRejection", (reason, promise) => {});
