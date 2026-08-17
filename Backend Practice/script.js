// alert("hello");

// Fundamentals of JavaScript:- 
// Array and object
// function return
// async js coding

// var arr = [1,2,3,4,"shaurya", [], {}];
// for each, map, filter, find, IndexOf

// arr.forEach(function(val) {
//     console.log(val + "hello");
// });

// var newarr = arr.map(function(val) {
//     return val*3;
// });

// console.log(newarr);


// var ans = arr.filter(function(val) {
//     if (arr > 3) {
//         return true;
//     }
//     else {
//         return false;
//     }
// })

// console.log(ans);


// var findnum = arr.find(function(x) {
//     if (x === 2) {
//         return x;
//     }
// });

// console.log(findnum);

// var findIndex = arr.indexOf(function(x) {
//     if (x == 12) {
//         return x;
//     }
//     else {
//         return -1;
//     }
// });

// console.log(findIndex);


// indexOf(num);

async function getUser() {
    var blob = await fetch(`https://randomuser.me/api/`);
    var res = await blob.json();

    console.log(res);
}

getUser();

// line by line code chale isey kahte hai synchronous
// jo bhi code async nature ka ho, usey side stack mein bhej do and agle code ko chalao jo bhi sync nature ka ho, jab bhi saara syn code chal jaaye, tab check karo ki async code complete hua ya nahi and agar wo complete hua ho to usey main stack mein laao and chala do