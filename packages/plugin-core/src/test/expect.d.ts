export declare function expect(value: any): {
    /**
     * NOTE: This method currently only works for checking object properties.
     *
     * Such as:
     * var object = { 'user': 'fred', 'age': 40 };
     * _.isMatch(object, { 'age': 40 });
     * // => true
     * _.isMatch(object, { 'age': 36 });
     * // => false
     * */
    toContain: (value2: any) => void;
    toEqual: (value2: any) => void;
    toNotEqual: (value2: any) => void;
    toBeTruthy: () => void;
    toBeFalsy: () => void;
    /**
     *  Pass examples:
     *  <pre>
     *  await expect(() => { throw new Error(); }).toThrow(); // Passes exception thrown
     *  await expect(() => { throw new Error(`hi world`); }).toThrow(`hi`); // Passes regex matches
     *  </pre>
     *
     *  Failure examples:
     *  <pre>
     *  await expect(() => {  }).toThrow(); // Fails (no exception thrown)
     *  await expect(() => { throw new Error(`hi`); }).toThrow(`hi world`); // Fails regex does not match
     *  </pre>
     * */
    toThrow: (regex?: string) => Promise<void>;
};
