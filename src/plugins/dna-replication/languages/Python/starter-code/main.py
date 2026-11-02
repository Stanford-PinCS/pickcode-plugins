# This code copies a DNA template strand, one base at a time.
# Add the missing pairing rules to pairBase, then press Run.

templateStrand = "ATGCGTACCTAG"

# Returns the base that pairs with the given base.
def pairBase(base):
    if base == "A":
        return "T"
    return "?"

# Build the new strand: one pairBase call for each index i.
newStrand = ""
for i in range(len(templateStrand)):
    newStrand = newStrand + pairBase(templateStrand[i])

# Send both strands to the replication fork.
replicateDNA(templateStrand, newStrand)
