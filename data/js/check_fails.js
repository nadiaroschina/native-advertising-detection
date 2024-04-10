const fs = require("fs");

const dir = fs.readdirSync("../generated_data");

dir.forEach((value) => {
    if (!value.startsWith("text")) {
        return;
    }
    const data = fs.readFileSync("../generated_data/" + value).toString().toLowerCase();
    if (/undefined/.test(data) || /реклам/.test(data)) {
        fs.rmSync("../generated_data/" + value);
    }
});
