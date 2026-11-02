// This code copies a DNA template strand, one base at a time.
// Add the missing pairing rules to pairBase, then press Run.

let mutationRate = 0.2;
let templateStrand = "ATGGCCATTGTAATGGGCCG";

// Returns the base that pairs with the given base.
function pairBase(base) {
    if (base === "A") {
        return "T";
    } else if (base === "T") {
        return "A";
    } else if (base === "G") {
        return "C";
    } else if (base === "C") {
        return "G";
    }
    return "?";
}

// Build the new strand: one pairBase call for each index i.
let newStrand = "";
let gcCount = 0;
for (let i = 0; i < templateStrand.length; i++) {
    let newBase = pairBase(templateStrand[i]);
    if (Math.random() < mutationRate) {
        newBase = "A";
    }
    newStrand = newStrand + newBase;
    if (templateStrand[i] === "G" || templateStrand[i] === "C") {
        gcCount = gcCount + 1;
    }
}
console.log(gcCount);

// Send both strands to the replication fork.
replicateDNA(templateStrand, newStrand);
