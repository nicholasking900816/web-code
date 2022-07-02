export function MergeCall(timeSpan = 100) {
    return function(prototype, name, desc) {
        let originFn = prototype[name];
        let timeout = null;
        desc.value = function(...args) {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                originFn.apply(this, args);
            }, timeSpan)
        }
    }
}