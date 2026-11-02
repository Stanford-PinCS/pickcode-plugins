// Hidden helper. Checks both strands, then sends them to the replication fork.
function replicateDNA(templateStrand, newStrand) {
    if (typeof templateStrand !== "string" || !/^[ATGC]+$/.test(templateStrand)) {
        throw new Error(
            'templateStrand should be a string of the capital letters A, T, G and C, like "ATGC".'
        );
    }
    if (templateStrand.length > 40) {
        throw new Error(
            `templateStrand has ${templateStrand.length} bases. Use 40 bases or fewer so the fork fits on screen.`
        );
    }
    if (typeof newStrand !== "string") {
        throw new Error("newStrand should be a string of letters, built by your for loop.");
    }
    if (newStrand.length !== templateStrand.length) {
        throw new Error(
            `newStrand has ${newStrand.length} letters, but templateStrand has ${templateStrand.length} bases. ` +
                "Make sure your loop runs once per base and pairBase always returns one letter."
        );
    }
    showReplication(templateStrand, newStrand);
}
