"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeResponse = makeResponse;
exports.asyncLoopOneAtATime = asyncLoopOneAtATime;
exports.asyncLoop = asyncLoop;
function makeResponse(resp) {
    return Promise.resolve({
        ...resp,
    });
}
/**
 * Loop through iterable one element at a time and await on async callback at every iteration
 *  ^a7sx98zzqg5y
 */
async function asyncLoopOneAtATime(things, cb) {
    const returnValues = [];
    for (const thing of things) {
        // eslint-disable-next-line no-await-in-loop
        returnValues.push(await cb(thing));
    }
    return returnValues;
}
/**
 * Loop through iterable in parallel
 * @param things
 * @param cb
 * @returns
 */
async function asyncLoop(things, cb) {
    return Promise.all(things.map((t) => cb(t)));
}
//# sourceMappingURL=helpers.js.map