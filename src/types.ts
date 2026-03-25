export type TAction<T, R extends (...arg: any[]) => any> = (q: T) => ReturnType<R>;
