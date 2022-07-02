import { FileObject } from "../File/FileObject";

export class Directory {
    unfold = false
    constructor(
        public path: string,
        public name: string,
        public parent?: Directory,
        public children?: Array<Directory | FileObject>
    ) {

    }

    static fromServerData(data: any) {
        function geDir(data, parent) {
            const dir: Directory = new Directory(data.path, data.name, parent);
            const children = data.children.sort(((item1, item2) => item1.sortIndex - item2.sortIndex))
            dir.children = children.map(item => {
                if (item.type === 'file') {
                    return new FileObject(item.path, item.name, dir)
                } else if (item.type === 'directory') {
                    return geDir(item, dir);
                }
            })
            return dir;
        }
        return geDir(data, null);
    }
   
}