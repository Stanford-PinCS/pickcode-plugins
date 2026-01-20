function resulting_nh3(n2, h2) {
    /**
     * Returns:
     *   nh3_made: moles NH3 produced
     *   n2_left:  moles N2 leftover
     *   h2_left:  moles H2 leftover
     *   limiting: which reactant limits ("N2", "H2", or "None" for perfect balance)
     */

    // How much NH3 could we make if ONLY N2 limited us?
    const nh3_from_n2 = n2 * 2;

    // How much NH3 could we make if ONLY H2 limited us?
    const nh3_from_h2 = h2 * (2/3);

    // TODO replace these! 
    let nh3_made = 0;
    let n2_left = n2;
    let h2_left = h2;
    let limiting = "???";

    return [nh3_made, n2_left, h2_left, limiting];
}

proceed(resulting_nh3);