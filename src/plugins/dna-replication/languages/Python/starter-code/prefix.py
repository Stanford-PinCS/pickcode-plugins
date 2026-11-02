# Hidden helper. Checks both strands, then sends them to the replication fork.

def replicateDNA(templateStrand, newStrand):
    if (
        not isinstance(templateStrand, str)
        or len(templateStrand) == 0
        or any(base not in "ATGC" for base in templateStrand)
    ):
        raise ValueError(
            'templateStrand should be a string of the capital letters A, T, G and C, like "ATGC".'
        )
    if len(templateStrand) > 40:
        raise ValueError(
            f"templateStrand has {len(templateStrand)} bases. "
            "Use 40 bases or fewer so the fork fits on screen."
        )
    if not isinstance(newStrand, str):
        raise TypeError("newStrand should be a string of letters, built by your for loop.")
    if len(newStrand) != len(templateStrand):
        raise ValueError(
            f"newStrand has {len(newStrand)} letters, but templateStrand has "
            f"{len(templateStrand)} bases. Make sure your loop runs once per base "
            "and pairBase always returns one letter."
        )
    show_replication(templateStrand, newStrand)
