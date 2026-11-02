/** Every message the student's code can send to this plugin. */
export type Message = {
    type: "showSynapse";
    /** mV each burst of neurotransmitter adds: positive excites, negative inhibits. */
    signals: readonly number[];
    /** mV the receiving neuron must reach to fire. */
    threshold: number;
    /** The student's if statement's answer: does the receiving neuron fire? */
    fires: boolean;
};
