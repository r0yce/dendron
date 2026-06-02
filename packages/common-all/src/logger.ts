export type DLogger = {
  name?: string | undefined;
  level: any;
  debug: (msg: any) => void;
  info: (msg: any) => void;
  error: (msg: any) => void;
};
