# A Latin word is a stem plus an ending. decline() joins them for you.
subject = decline("puell", "nominative")   # the girl does the action
obj = decline("ros", "accusative")         # the rose receives it
verb = "amat"                              # loves

# Draw the sentence. Look at the colored endings on the right.
show_sentence(subject, obj, verb)

# Now change the order of the words inside show_sentence() above,
# like show_sentence(obj, verb, subject), and run it again.
# Does the meaning change?
