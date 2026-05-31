import { inject, injectable, TOKENS } from "../../di/inject";
import { EventEmitter } from "vscode";
import { DENDRON_COMMANDS } from "../../constants";

@injectable()
export class NoteLookupAutoCompleteCommand {
  static key = DENDRON_COMMANDS.LOOKUP_NOTE_AUTO_COMPLETE.key;

  constructor(
    @inject(TOKENS.AutoCompleteEventEmitter) private emitter: EventEmitter<void>
  ) {}

  run() {
    this.emitter.fire();
  }
}
