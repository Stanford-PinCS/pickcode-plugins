export type OutputMessage = {
  output: string;
};
export type InputMessage = {
  input: string;
};
export type FromRuntimeMessage = OutputMessage | InputMessage;

export type ToRuntimeMessage = {
  input: string;
};
