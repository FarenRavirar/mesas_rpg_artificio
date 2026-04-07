"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishService = void 0;
exports.publishService = {
    resolvePublishAt(editorialStatus, publishMode) {
        if (editorialStatus === 'accepted' && publishMode === 'auto_publish') {
            return new Date();
        }
        return null;
    },
};
