# Hidden helpers. decline() builds a Latin word from a stem and a case.
# show_sentence() draws the words, with each ending colored by its job.

_ENDINGS = {
    "nominative": ("a", "subject"),
    "accusative": ("am", "object"),
    "genitive": ("ae", "other"),
}
_known = {}


def decline(stem, case):
    if case not in _ENDINGS:
        raise ValueError(
            f"decline doesn't know the case {case!r}. Try \"nominative\", \"accusative\", or \"genitive\"."
        )
    ending, role = _ENDINGS[case]
    word = stem + ending
    _known[word] = (ending, role)
    return word


def show_sentence(*words):
    if len(words) == 0:
        raise ValueError("show_sentence needs at least one word, like show_sentence(subject, obj, verb).")
    endings = []
    roles = []
    for word in words:
        ending, role = _known.get(word, ("", "verb"))
        endings.append(ending)
        roles.append(role)
    draw_sentence(list(words), endings, roles)
