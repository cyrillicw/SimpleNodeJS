const express = require('express');
const fs = require('fs');
const readlineSync  = require('readline-sync');
const webSocket = require('ws')

let app = express();

app.use(express.urlencoded({'extended': false}));
app.use(express.json());
app.set('view engine', 'ejs')

app.get('/', function(req, res) {
    let names = read_db();
    res.render('view.ejs', {"names": names});
});

app.post('/add_long_name', function(request, response){
    let name = request.body.name;
    let birth_date = request.body.date;
    birth_date = birth_date.replace('0',"");
    let long_name = ""
    for (let i = 0; i < name.length; i++) {
        for (let j = 0; j < birth_date[i]; j++) {
            long_name += name[i];
        }
    }
    let entropy = getEntropy(long_name);
    add_to_db(long_name, entropy)
    // response.send(JSON.stringify({
    //     "name": long_name,
    //     "entropy": entropy
    // }));
    wss.clients.forEach((client) => {
        if (client.readyState === webSocket.OPEN) {
            client.send(JSON.stringify({
                "name": long_name,
                "entropy": entropy
            }));
        }
    });
});

function getEntropy(a) {
    let d = new Map();
    for (let i = 0; i < a.length; i++) {
        if (!d.has(a[i])) {
            d.set(a[i], 0);
        }
        d.set(a[i], d.get(a[i]) + 1);
    }
    let entropy = 0;
    for (let entry of d) {
        let v = entry[1];
        let p = v / a.length;
        entropy -= p * Math.log(p);
    }
    return entropy;
}

function add_to_db(long_name, entropy) {
    let stream = fs.createWriteStream("names.txt", {flags:'a'});
    stream.write(long_name + "," + entropy + "\n");
    stream.end()
}

function read_db() {
    let names = fs.readFileSync("names.txt", 'utf-8')
        .split('\n');
    if (names[names.length - 1] === "") {
        names.pop();
    }
    names = names.map((v, i, a) => {
        let h = v.split(",");
        return {"name": h[0], "entropy": h[1]};
    });
    return names;
}

const wss = new webSocket.Server({ port: 8080 })
app.listen(3000);