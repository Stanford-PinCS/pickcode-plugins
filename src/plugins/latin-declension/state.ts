import { action, observable } from "mobx";
import { Message } from "./messages";

/** All plugin state. No JSX, no formatting, no colors in this file. */
export class State {
  @observable accessor words: string[] = [];
  @observable accessor endings: string[] = [];
  @observable accessor roles: string[] = [];

  /** Runs once before the student's code. */
  public init = () => {
    this.words = [];
    this.endings = [];
    this.roles = [];
  };

  /**
   * The runtime also forwards the student's print() output and Python errors
   * here as { type: "log" } messages, so this must ignore message types it
   * doesn't know. Throwing on them would hide the student's error messages.
   */
  @action
  public onMessage = (m: Message) => {
    if (m.type === "drawSentence") {
      this.words = Array.from(m.words);
      this.endings = Array.from(m.endings);
      this.roles = Array.from(m.roles);
    }
  };
}

export default State;
