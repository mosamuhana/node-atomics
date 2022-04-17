export interface IEditor<T> {
	get value(): T;
	set value(value: T);
}

export interface IBoolEditor extends IEditor<boolean> {
	get value(): boolean;
	set value(value: boolean);
	not(): boolean;
}
