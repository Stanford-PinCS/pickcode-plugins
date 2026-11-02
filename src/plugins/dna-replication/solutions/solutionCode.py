# This code copies a DNA template strand, one base at a time.
# Add the missing pairing rules to pairBase, then press Run.

import random
mutationRate = 0.2
templateStrand = "ATGGCCATTGTAATGGGCCG"

# Returns the base that pairs with the given base.
def pairBase(base):
    if base == "A":
        return "T"
    elif base == "T":
        return "A"
    elif base == "G":
        return "C"
    elif base == "C":
        return "G"
    return "?"

# Build the new strand: one pairBase call for each index i.
newStrand = ""
gcCount = 0
for i in range(len(templateStrand)):
    newBase = pairBase(templateStrand[i])
    if random.random() < mutationRate:
        newBase = "A"
    newStrand = newStrand + newBase
    if templateStrand[i] == "G" or templateStrand[i] == "C":
        gcCount = gcCount + 1
print(gcCount)

# Send both strands to the replication fork.
replicateDNA(templateStrand, newStrand)
