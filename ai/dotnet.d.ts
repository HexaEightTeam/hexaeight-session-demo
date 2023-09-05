export interface Assembly {
    name: string;
    data: Uint8Array | string;
}
export interface BootData {
    wasm: Uint8Array | string;
    assemblies: Assembly[];
    entryAssemblyName: string;
}
export declare enum BootStatus {
    Standby = "Standby",
    Booting = "Booting",
    Terminating = "Terminating",
    Booted = "Booted"
}
export declare function getBootStatus(): BootStatus;
export declare function boot(): Promise<void>;
export declare function terminate(): Promise<void>;
export declare class Event<T extends any[]> implements EventBroadcaster<T>, EventSubscriber<T> {
    private readonly handlers;
    broadcast(...args: [...T]): void;
    subscribe(handler: (...args: [...T]) => void): void;
    unsubscribe(handler: (...args: [...T]) => void): void;
}
export interface EventBroadcaster<T extends any[]> {
    broadcast: (...args: [...T]) => void;
}
export interface EventSubscriber<T extends any[]> {
    subscribe: (handler: (...args: [...T]) => void) => void;
    unsubscribe: (handler: (...args: [...T]) => void) => void;
}
export declare const invoke: <T>(assembly: string, method: string, ...args: any[]) => T;
export declare const invokeAsync: <T>(assembly: string, method: string, ...args: any[]) => Promise<T>;
export declare const createObjectReference: (object: any) => any;
export declare const disposeObjectReference: (objectReference: any) => void;
export declare const createStreamReference: (buffer: Uint8Array | any) => any;
export namespace HexaEight {
    export function Login(userid: string, logintype: string, data: string): Promise<string>;
    export function Logout(userid: string): Promise<string>;
    export function CompleteLoginProcessDirect(userid: string): Promise<string>;
    export function InitializeClientId(userid: string, xclientid: string): Promise<boolean>;
    export function SetTokenServerURL(userid: string, tokenserverurl: string): Promise<boolean>;
    export function InitiateHexaEightSessionDirect(userid: string, emailid: string): Promise<boolean>;
    export function CompleteLoginProcessDirectUsingCaptchaCode(userid: string, captchacode: string): Promise<string>;
    export function FetchLoggedInUser(userid: string): string;
    export function FetchAppName(userid: string): string;
    export function FetchResourceIdentity(userid: string): string;
    export function ProtectMessage(userid: string, privatemessage: string): string;
    export function DecipherMessage(userid: string, protectedmessage: string): string;
    export function GetUserID(userid: string, clientid: string, seed: string): string;
    export function GetPeerId(userid: string, clientid: string, destination: string): string;
    export function EncryptTextMessage(userid: string, destination: string, textmessage: string): Promise<string>;
    export function ClearDestination(userid: string, destination: string): Promise<string>;
    export function encrypturl(userid: string, url: string): Promise<string>;
    export function DecryptBytes(userid: string, destination: string, data: Uint8Array): Promise<Uint8Array>;
    export function EncryptBytes(userid: string, destination: string, data: Uint8Array): Promise<Uint8Array>;
    export function fetch(userid: string, url: string, mode: string, body: string): Promise<Uint8Array>;
    export function fetch2(userid: string, url: string, mode: string, body: Uint8Array): Promise<Uint8Array>;
    export function FetchDestination(userid: string, url: string): Promise<string>;
    export function ClearDestinationURL(url: string): Promise<boolean>;
    export function DecryptTextMessage(userid: string, encryptedmessage: string): Promise<string>;
    export function VerifyMessage(userid: string, encryptedmessage: string): string;
    export function GetAuthQRCode(userid: string): Promise<string>;
    export function GetAuthQRCodeDesktopURL(userid: string): string;
    export function GetAuthQRCodeMobileURL(userid: string): string;
    export function GetCaptchaCode(userid: string): string;
    export function GetCaptchaCodeDesktopURL(userid: string): string;
    export function GetCaptchaCodeMobileURL(userid: string): string;
}
