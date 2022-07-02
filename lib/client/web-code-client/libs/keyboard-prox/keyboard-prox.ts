export class KeyBoardProx {
    private keydownListenerListMap = {};
    private inceptAllQueue = [];
    private beforeAllCbs = []; 

    private keydownListener = (event) => {
        let fullKey = ['altKey','ctrlKey','shiftKey'].reduce((result, key) => {
            if(event[key]) {
                result += (result ? ';' + key : key)
            }
            return result;
        } , '');
        fullKey = fullKey ? fullKey + ';' + event.key : event.key;
        let list = this.keydownListenerListMap[fullKey];
        if(!list) return;
        if (this.inceptAllQueue.length && !this.inceptAllQueue.every(cb => cb(event))) return;
        this.beforeAllCbs.forEach(fn => fn(event));
        list.forEach(listener => listener(event))
    }

    remove(keyName, listener: Function) {

    }

    inceptAll(cb: Function) {
        this.inceptAllQueue.push(cb);
    }

    destroy() {

    }

    beforeAll(cb: Function) {
        this.beforeAllCbs.push(cb);
    }

    onKeydown(keyName: string, listener: Function, sideKey: string = '') {
        let fullKeyName = sideKey ? sideKey + ';' + keyName : keyName;
        if(!this.keydownListenerListMap[fullKeyName]) this.keydownListenerListMap[fullKeyName] = [];
        this.keydownListenerListMap[fullKeyName].push(listener);
    }

    onKeyup() {

    }

    onKeypress() {

    }

    constructor() {
        document.addEventListener('keydown', this.keydownListener);
    }
}