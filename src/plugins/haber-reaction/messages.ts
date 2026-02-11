export type FromRuntimeMessage = {
    setValue?: string;
    // Input values fed to the student function
    input_n2?: number;
    input_h2?: number;
    // True computed values (from stoichiometry: N₂ + 3H₂ → 2NH₃)
    true_nh3?: number;
    true_limiting?: string;
    n2_consumed?: number;
    h2_consumed?: number;
    n2_remaining?: number;
    h2_remaining?: number;
    // Student's returned answers
    student_nh3?: number;
    student_limiting?: string;
    // Correctness checks
    nh3_correct?: boolean;
    limiting_correct?: boolean;
};

export type ToRuntimeMessage = {
    sendValue: string;
};
