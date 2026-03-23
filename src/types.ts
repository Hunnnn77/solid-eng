export type TAction<R extends (...arg: any[]) => any> = (q: string) => ReturnType<R>;
