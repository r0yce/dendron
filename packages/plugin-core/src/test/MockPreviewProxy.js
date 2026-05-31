"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockPreviewProxy = void 0;
/**
 * Mock Preview Proxy. This should accurately reflect state of visible and open
 * properties without actually requiring a vscode webview for testing.
 */
class MockPreviewProxy {
    _isVisible = false;
    _isOpen = false;
    _isLocked = false;
    async show(_note) {
        this._isVisible = true;
        this._isOpen = true;
    }
    hide() {
        this._isOpen = false;
        this._isVisible = false;
    }
    isVisible() {
        return this._isVisible;
    }
    isOpen() {
        return this._isOpen;
    }
    lock(_noteId) {
        this._isLocked = true;
    }
    unlock() {
        this._isLocked = false;
    }
    isLocked() {
        return this._isLocked;
    }
}
exports.MockPreviewProxy = MockPreviewProxy;
//# sourceMappingURL=MockPreviewProxy.js.map