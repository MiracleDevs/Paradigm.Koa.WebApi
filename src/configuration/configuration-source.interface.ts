export interface IConfigurationSource<T = any> {
    get(): Promise<T>;
}
