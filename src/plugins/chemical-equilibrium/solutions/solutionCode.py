# The reaction N2O4 <=> 2NO2, starting from these concentrations (mol/L).
# Read it, then press Run. The steps ask you to change the values and chooseDirection.

startN2O4 = 0.4
startNO2 = 0.8
K = 0.36
addN2O4 = 0.5  # extra N2O4 to add after it settles

# Return "forward", "reverse", or "equilibrium".
def chooseDirection(Q, K):
    if abs(Q - K) < 0.01:
        return "equilibrium"
    elif Q < K:
        return "forward"
    else:
        return "reverse"

# Run the reaction, asking chooseDirection which way to go on every pass.
runReaction(startN2O4, startNO2, K, addN2O4, chooseDirection)
