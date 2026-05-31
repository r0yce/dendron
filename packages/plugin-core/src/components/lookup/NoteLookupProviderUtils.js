"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteLookupProviderUtils = void 0;
const engine_server_1 = require("@dendronhq/engine-server");
class NoteLookupProviderUtils {
    static cleanup(opts) {
        const { id, controller } = opts;
        controller.onHide();
        engine_server_1.HistoryService.instance().remove(id, "lookupProvider");
    }
    static subscribe(opts) {
        const { id, controller, logger, onDone, onError, onChangeState, onHide } = opts;
        return new Promise((resolve) => {
            engine_server_1.HistoryService.instance().subscribev2("lookupProvider", {
                id,
                listener: async (event) => {
                    if (event.action === "done") {
                        if (onDone) {
                            const out = await onDone(event);
                            NoteLookupProviderUtils.cleanup({ id, controller });
                            resolve(out);
                        }
                        else {
                            resolve(event);
                        }
                    }
                    else if (event.action === "error") {
                        if (onError) {
                            const out = await onError(event);
                            resolve(out);
                        }
                        else {
                            const error = event.data.error;
                            logger.error({ error });
                            resolve(undefined);
                        }
                    }
                    else if (event.action === "changeState") {
                        if (onChangeState) {
                            const out = await onChangeState(event);
                            resolve(out);
                        }
                        else {
                            const data = event.data;
                            if (data.action === "hide") {
                                if (onHide) {
                                    const out = await onHide(event);
                                    resolve(out);
                                }
                                else {
                                    logger.info({
                                        ctx: id,
                                        msg: "changeState.hide event received.",
                                    });
                                    resolve(undefined);
                                }
                            }
                            else {
                                logger.error({
                                    ctx: id,
                                    msg: "invalid changeState action received.",
                                });
                                resolve(undefined);
                            }
                        }
                    }
                    else {
                        logger.error({
                            ctx: id,
                            msg: `unexpected event: ${event.action}`,
                            event,
                        });
                        resolve(undefined);
                    }
                },
            });
        });
    }
}
exports.NoteLookupProviderUtils = NoteLookupProviderUtils;
//# sourceMappingURL=NoteLookupProviderUtils.js.map