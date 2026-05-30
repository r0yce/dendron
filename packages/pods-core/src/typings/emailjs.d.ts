/**
 * Type shim for emailjs to avoid pulling in its broken .ts-based types.
 *
 * emailjs@3 ships "types": "./email.ts" (actual source .ts files, not .d.ts).
 * Those sources use Node's Timer in ways incompatible with @types/node@20+ / TS 5.5+
 * (clearTimeout overloads). This shim lets pods-core compile without ever loading
 * the library's own type graph.
 */
declare module "emailjs" {
  export class Message {
    constructor(opts: any);
  }
  export class SMTPClient {
    constructor(opts: any);
    sendAsync(message: Message): Promise<any>;
  }
}
