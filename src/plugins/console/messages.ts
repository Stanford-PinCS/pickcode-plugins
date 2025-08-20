export type OutputMessage = {
  output: string;
};
export type InputMessage = {
  input: string;
};
export type ErrorMessage = {
  error: string;
};
export type FromRuntimeMessage = OutputMessage | InputMessage | ErrorMessage;

export type ToRuntimeMessage = {
  input: string;
};
