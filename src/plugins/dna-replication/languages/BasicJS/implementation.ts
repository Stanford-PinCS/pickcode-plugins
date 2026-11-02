import { Message } from "../../messages";

const MAX_BASES = 40;

function checkStrands(templateStrand: unknown, newStrand: unknown) {
    if (typeof templateStrand !== "string" || !/^[ATGC]+$/.test(templateStrand)) {
        throw new Error(
            'showReplication expects templateStrand to be a string of the capital letters A, T, G and C, like "ATGC".'
        );
    }
    if (templateStrand.length > MAX_BASES) {
        throw new Error(
            `showReplication can draw up to ${MAX_BASES} bases, but templateStrand has ${templateStrand.length}.`
        );
    }
    if (typeof newStrand !== "string") {
        throw new Error("showReplication expects newStrand to be a string of letters.");
    }
    if (newStrand.length !== templateStrand.length) {
        throw new Error(
            `showReplication expects one new letter per template base: newStrand has ${newStrand.length} letters, but templateStrand has ${templateStrand.length} bases.`
        );
    }
    return { templateStrand, newStrand };
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Animates a replication fork copying `templateStrand`, adding the
         * letters of `newStrand` one per step. Any letter that isn't the
         * correct partner (A-T, G-C) is drawn as a flagged mismatch.
         * Python: show_replication(templateStrand, newStrand)
         */
        showReplication: (templateStrand: unknown, newStrand: unknown) => {
            sendMessage({
                type: "showReplication",
                ...checkStrands(templateStrand, newStrand),
            });
        },
    });
};

export default createExports;
