export type FromRuntimeMessage = {
    setValue?: string;
    nh3_made?: number;
    n2_left?: number;
    h2_left?: number;
    limiting?: string;
};

export type ToRuntimeMessage = {
    sendValue: string;
};
