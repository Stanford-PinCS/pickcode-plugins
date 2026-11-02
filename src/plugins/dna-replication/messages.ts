/** Every message the student's code can send to this plugin. */
export type Message = {
    type: "showReplication";
    /** The strand polymerase reads, only the letters A, T, G and C. */
    templateStrand: string;
    /** The strand the student's loop built, one letter per template base. */
    newStrand: string;
};
