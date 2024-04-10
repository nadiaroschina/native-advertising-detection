const fs = require("fs");

const dir = fs.readdirSync("../generated_data");

dir.forEach((value) => {
    if (value === "prompts" || value === ".gitignore") {
        return;
    }
    const data = fs.readFileSync(value);
    console.log(data);
});
