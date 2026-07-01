# ============================================
# Coin Flip Simulation: Law of Large Numbers
#
# >>> Change total_flips to see what happens! <<<
# Try 50, 500, or 5000.
# What happens to the blue line as you add more flips?
# ============================================

import random

total_flips = 50

heads_count = 0
proportions = []

for i in range(1, total_flips + 1):
    # Flip a coin: random.choice picks one item from the list
    flip = random.choice(["H", "T"])

    # Count it if it's Heads
    if flip == "H":
        heads_count += 1

    # What fraction of ALL flips so far were Heads?
    proportions.append(heads_count / i)

# Draw the target line at 0.50 (theoretical probability)
show_target(0.5)

# Plot the running proportion over time
plot_line(proportions)
