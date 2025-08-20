export interface PluginStateBase {
  onMessage: (data: any) => void;
  onLog: ({
    logType,
    message,
  }: {
    logType: "log" | "error";
    message: string;
  }) => void;
}
