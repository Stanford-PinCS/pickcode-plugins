function resulting_nh3() {

    let h2 = 5;
    let n2 = 3;
    // TODO 3: define needed_n2 here

    // TODO 1: define nh3_made variables here

    let nh3_made = 0;
    let limiting = ""; // write "n2" or "h2" or "None"

    // TODO 2: write if statements here

    return {
        "h2_reactant_amount": h2, 
        "n2_reactant_amount": n2, 
        "nh3_product_made": nh3_made, 
        "limiting_reactant": limiting
    };
}

proceed(resulting_nh3);