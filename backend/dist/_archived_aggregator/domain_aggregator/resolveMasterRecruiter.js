"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMasterRecruiter = void 0;
const clean = (value) => {
    if (!value)
        return null;
    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized.length > 0 ? normalized : null;
};
const extractMentionLike = (value) => {
    const mention = value.match(/@([\w.-]{2,})/);
    if (!mention)
        return null;
    return clean(mention[1] ?? null);
};
const extractMasterName = (masterText) => {
    const safeMaster = clean(masterText);
    if (!safeMaster)
        return null;
    const mentionLike = extractMentionLike(safeMaster);
    if (mentionLike)
        return mentionLike;
    const withoutLabel = safeMaster.replace(/^mestre\s*[:\-]?\s*/i, '').trim();
    const withoutMarkdown = withoutLabel.replace(/[*_`~]/g, '').trim();
    return clean(withoutMarkdown);
};
const normalizeName = (value) => {
    if (!value)
        return null;
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s._-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};
const resolveMasterRecruiter = (params) => {
    const recruiterName = clean(params.recruiterName);
    const masterFromText = extractMasterName(params.masterText);
    const mentions = params.rawMentions.map(clean).filter((value) => Boolean(value));
    const recruiterNormalized = normalizeName(recruiterName);
    const masterNormalized = normalizeName(masterFromText);
    let actualGmName = masterFromText;
    let publisherRole = 'gm';
    let isAmbiguous = false;
    if (masterNormalized && recruiterNormalized && masterNormalized !== recruiterNormalized) {
        publisherRole = 'announcer';
    }
    if (!masterFromText && mentions.length === 1) {
        const mentionName = mentions[0];
        const mentionNormalized = normalizeName(mentionName);
        if (mentionNormalized && recruiterNormalized && mentionNormalized !== recruiterNormalized) {
            actualGmName = mentionName;
            publisherRole = 'announcer';
        }
    }
    if (mentions.length > 1) {
        isAmbiguous = true;
    }
    if (!actualGmName && publisherRole === 'announcer') {
        isAmbiguous = true;
    }
    return {
        recruiterName,
        masterText: clean(params.masterText),
        publisherRole,
        actualGmName,
        isAmbiguous,
    };
};
exports.resolveMasterRecruiter = resolveMasterRecruiter;
