# ============================================
# Dice Roll Simulation: Law of Large Numbers
#
# This time there are TWO things to experiment with:
#   1. total_rolls  — how many times to roll the die
#   2. num_sides    — how many sides the die has
#
# Start with num_sides = 6 and total_rolls = 100.
# Then crank total_rolls up to 10000. What happens?
# Now try num_sides = 12 or 20. Does LLN still work?
# ============================================

import random

total_rolls = 100
num_sides = 6

# One counter for each face of the die
face_counts = [0] * num_sides

for i in range(total_rolls):
    # Roll the die: random integer from 1 to num_sides
    roll = random.randint(1, num_sides)

    # Add 1 to that face's counter
    face_counts[roll - 1] += 1

# Convert counts to percentages
percentages = [(count / total_rolls) * 100 for count in face_counts]

# The expected percentage for a fair die
show_target(100 / num_sides)
show_bars(percentages)
