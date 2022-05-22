export type ActionMethod<T = any> = (...args: any[]) => Promise<T> | T;
