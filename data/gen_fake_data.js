const fs = require("fs");

async function genNews(idx) {
    const sfd = fs.openSync("secrets.json", "r");
    const secrets = JSON.parse(fs.readFileSync(sfd));
    fs.closeSync(sfd);

    const pfd = fs.openSync(`generated_data/prompts/prompts${idx.toString().padStart(3, '0')}.json`, "r");
    try {
        const textdata = fs.readFileSync(pfd).toString();
        const x = textdata.indexOf('[');
        const y = textdata.lastIndexOf(']');
        const data = `{ "data": ${textdata.substring(x, y + 1)} }`;
        console.log(data);
        const prompts = JSON.parse(data);
        fs.closeSync(pfd);

        console.log(prompts.data.length);
        for (var i = 0; i < prompts.data.length; i++) {
            const entry = prompts.data[i];

            console.log(i);
            console.log(entry);

            var prompt = {
                "modelUri": `gpt://${secrets.folder_id}/yandexgpt-pro`,
                "completionOptions": {
                    "stream": false,
                    "temperature": 0.5,
                    "maxTokens": "2000"
                },
                "messages": [
                    {
                        "role": "system",
                        "text": "Напиши скрытую рекламу для продукта, указанного пользователем. Текст должен не более, чем из 250 слов. Используй название бренда, который нужно прорекламировать, ровно один раз. Текст может выглядеть как, например, новостная статья. Текст должен быть в развлекательном стиле. Не добавляй никаких примечаний."
                    },
                    {
                        "role": "user",
                        "text": `Напиши новость про ${entry.event} в ${entry.city}. Включи в неё рекламу ${entry.item} бренда ${entry.brand}.`
                    }
                ]
            };

            const res = await fetch("https://llm.api.cloud.yandex.net/foundationModels/v1/completion", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${secrets.iam_token}`,
                    'x-folder-id': secrets.folder_id
                },
                body: JSON.stringify(prompt)
            });

            const content = await res.text();
            const text = JSON.parse(content).result.alternatives[0].message.text;

            for (var j = 1; j < 1000; j++) {
                if (!fs.existsSync(`generated_data/text${j.toString().padStart(3, '0')}.txt`)) {
                    console.log(j);
                    var fd = fs.openSync(`generated_data/text${j.toString().padStart(3, '0')}.txt`, "w");
                    fs.writeFileSync(fd, text);
                    fs.closeSync(fd);
                    break;
                }
            }
        }
    } catch {
        console.log("failure");
    }
}

async function genNewsTopics() {
    const sfd = fs.openSync("secrets.json", "r");
    const secrets = JSON.parse(fs.readFileSync(sfd));
    fs.closeSync(sfd);

    var prompt = {
        "modelUri": `gpt://${secrets.folder_id}/yandexgpt-pro`,
        "completionOptions": {
            "stream": false,
            "temperature": 0.8,
            "maxTokens": "4000"
        },
        "messages": [
            {
                "role": "system",
                "text": "Форматируй ответ на запрос как json, содержащий массив из десяти json-объектов, каждый из которых имеет четыре поля \"event\", \"city\", \"item\" и \"brand\"."
            },
            {
                "role": "user",
                "text": "Сгенерируй 10 пар \"событие\" - \"услуга или товар, который можно прорекламировать в новости о данном событии\". Указывай город, в котором проходит событие, и название бренда, оказывающего данную услугу или производящего данный товар. Название бренда может быть вымышленным или реально существующим. Название бренда может быть на английском или русском языке. Пример одного ответа: { \"event\": \"Концерт рок-группы Угли\", \"city\": \"Москва\", \"item\": \"Электрогитары\", \"brand\": \"StrongMusic\" }"
            }
        ]
    };

    const res = await fetch("https://llm.api.cloud.yandex.net/foundationModels/v1/completion", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secrets.iam_token}`,
            'x-folder-id': secrets.folder_id
        },
        body: JSON.stringify(prompt)
    });

    const content = await res.text();
    const text = JSON.parse(content).result.alternatives[0].message.text;

    for (var j = 1; j < 1000; j++) {
        if (!fs.existsSync(`generated_data/prompts/prompts${j.toString().padStart(3, '0')}.json`)) {
            console.log(j);
            var fd = fs.openSync(`generated_data/prompts/prompts${j.toString().padStart(3, '0')}.json`, "w");
            fs.writeFileSync(fd, text);
            fs.closeSync(fd);
            break;
        }
    }
}

async function main() {
    for (var i = 1; i <= 10; i++) {
        await genNews(i);
    }
}

main();