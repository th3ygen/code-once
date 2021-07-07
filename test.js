const str = 'c928d6b4-7f9c-4f26-b774-a563ebe49d9a';

let res = '';
for (const c of str) {
    res += (c === '-') ? '-' : 'x'; 
}

console.log(res);