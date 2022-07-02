function aa() {};

let prop = {
    fn: 'aa',
    name: 'bb'
}

aa.prototype = prop;

let a = new aa();


let b = new aa();

a.fn = 'fn'
prop.fn = 'dd'

console.log(a.__proto__ === prop);
console.log(a);
console.log(b);