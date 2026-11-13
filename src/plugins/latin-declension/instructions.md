# Who Did What to Whom?

In Latin, the ending of a word tells you its job in the sentence. The order of the words doesn't matter.

## What you'll do

- Build Latin words by joining a stem and an ending
- Scramble the word order
- Watch the colored endings on the right stay attached to each word's job

## Try it

1. Run the starter code and look at the colored endings on the right.
2. Change the order of the words inside `show_sentence(...)`, then run it again.
3. Change `"nominative"` and `"accusative"` between the two nouns so the rose loves the girl.

## Think about it

- When you scrambled the words, what told you who was doing the loving?
- English uses word order to show who does what. What does Latin use instead?

## Functions you can use

| Function                 | What it does                                          |
| ------------------------ | ----------------------------------------------------- |
| `decline(stem, case)`    | Joins a stem and a case ending into one Latin word    |
| `show_sentence(w1, w2, ...)` | Draws your words in order, with colored endings   |
