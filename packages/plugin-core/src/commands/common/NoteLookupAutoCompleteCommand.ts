import { inject, injectable } from "../../di/inject";
import { EventEmitter } from "vscode";
import { DENDRON_COMMANDS } from "../../constants";

@injectable()
export class NoteLookupAutoCompleteCommand {
  static key = DENDRON_COMMANDS.LOOKUP_NOTE_AUTO_COMPLETE.key;

  constructor(
    // @ts-expect-error - TS 5+ stricter decorator checking with tsyringe + legacy emitDecoratorMetadata
    @inject("AutoCompleteEventEmitter") private emitter: EventEmitter<void>
  ) {}

  run() {
    this.emitter.fire();
  }
}
