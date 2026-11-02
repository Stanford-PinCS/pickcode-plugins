# This code places an atom's electrons into subshells, lowest energy first.
# Change atomicNumber, then fix the while loop so bigger atoms fill correctly.

atomicNumber = 26
electronsLeft = atomicNumber
subshell = 0  # 0 is 1s, 1 is 2s, 2 is 2p, 3 is 3s, ...

while electronsLeft > 0:
    capacity = getCapacity(subshell)  # how many electrons this subshell holds
    if electronsLeft >= capacity:
        placeElectrons(subshell, capacity)
        electronsLeft = electronsLeft - capacity
    else:
        placeElectrons(subshell, electronsLeft)
        electronsLeft = 0
    subshell = subshell + 1

# Draw the orbital diagram, one electron at a time.
drawOrbitals(atomicNumber)
