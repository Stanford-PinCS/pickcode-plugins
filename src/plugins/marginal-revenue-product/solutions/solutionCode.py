# This code decides how many pickers an apple orchard hires and draws their MRPs.
# Change pickersToHire so it hires only pickers who add more than they cost.

# Total product: crates of apples picked per day by 0 to 8 pickers.
totalProduct = [0, 20, 38, 53, 65, 74, 80, 83, 83]
price = 6   # the market price of apples, in dollars per crate
wage = 50   # the market wage, in dollars per picker per day

# Returns how many pickers the orchard hires. The loop hires them one at a time.
def pickersToHire(totalProduct, price, wage):
    pickers = 0
    # mp is the next picker's marginal product: how many crates that picker adds.
    mp = totalProduct[1] - totalProduct[0]
    # Keep hiring while the next picker's MRP, MP × P, is greater than the wage.
    while mp * price > wage:
        pickers = pickers + 1
        mp = totalProduct[pickers + 1] - totalProduct[pickers]
    return pickers

# Find how many pickers to hire, then draw each picker's MRP and the wage.
runHiring(totalProduct, price, wage, pickersToHire)
