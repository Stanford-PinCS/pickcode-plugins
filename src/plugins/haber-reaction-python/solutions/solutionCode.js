function resulting_nh3() {

    let h2 = 5;
    let n2 = 3;
    let needed_n2 = h2 / 3;

    let nh3_from_n2 = n2 * 2;
    let nh3_from_h2 = h2 * (2 / 3);

    let nh3_made = 0;
    let limiting = ""; // write "n2" or "h2" or "None"

    if (nh3_from_n2 < nh3_from_h2) {
        nh3_made = nh3_from_n2;
        limiting = "n2";
    } else if (nh3_from_h2 < nh3_from_n2) {
        nh3_made = nh3_from_h2;
        limiting = "h2";
    } else {
        nh3_made = nh3_from_n2;
        limiting = "None";
    }

    return {
        "h2_reactant_amount": h2,
        "n2_reactant_amount": n2,
        "nh3_product_made": nh3_made,
        "limiting_reactant": limiting
    };
}

proceed(resulting_nh3);
