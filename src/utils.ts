export function toTypedArray<T>(Type: any, arr?: any): T | undefined {
    if (arr != null) {
        const bytes: number = Type.BYTES_PER_ELEMENT;
        const name: string = Type.name;
        if (arr instanceof SharedArrayBuffer) {
            if (arr.byteLength % bytes !== 0) {
                throw new Error(`SharedArrayBuffer must be a multiple of ${name}.BYTES_PER_ELEMENT ${bytes} bytes long`);
            }
            return new Type(arr) as T;
        } else if (arr instanceof Type) {
            if (!(arr.buffer instanceof SharedArrayBuffer)) {
                throw new Error('Invalid typed array buffer, must be instanceof SharedArrayBuffer');
            }
            return arr as T;
        } else {
            throw new Error(`Invalid parameter, must be SharedArrayBuffer or ${name}`);
        }
    }
    return undefined;
}
