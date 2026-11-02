// This code copies a DNA template strand, one base at a time.
// Add the missing pairing rules to pairBase, then press Run.

let templateStrand = "ATGCGTACCTAG";

// Returns the base that pairs with the given base.
function pairBase(base) {
    if (base === "A") {
        return "T";
    }
    return "?";
}

// Build the new strand: one pairBase call for each index i.
let newStrand = "";
for (let i = 0; i < templateStrand.length; i++) {
    newStrand = newStrand + pairBase(templateStrand[i]);
}

// Send both strands to the replication fork.
replicateDNA(templateStrand, newStrand);
