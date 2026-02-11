function resulting_nh3() {

    let h2 = 0;
    let n2 = 0;

    let nh3_made = 0;
    let limiting = "???"; // write "n2" or "h2" or "None"

    // How much NH3 could we make if ONLY N2 limited us?
    // const nh3_from_n2 = n2 * 2;

    // How much NH3 could we make if ONLY H2 limited us?
    // const nh3_from_h2 = h2 * (2/3);

    return [h2, n2, nh3_made, limiting];
}

proceed(resulting_nh3);