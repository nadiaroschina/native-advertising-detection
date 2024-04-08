const fs = require("fs");

async function genNews() {
    const sfd = fs.openSync("secrets.json", "r");
    const secrets = JSON.parse(fs.readFileSync(sfd));
    fs.closeSync(sfd);

    const pfd = fs.openSync("prompts.json", "r");
    const prompts = JSON.parse(fs.readFileSync(pfd));
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
                    //"text": `Напиши новость про ${entry.event}. Включи в неё рекламу ${entry.item.product} бренда ${entry.item.brand}.`
                    //"text": `Напиши новость про ${entry.event} в ${entry.item.city}. Включи в неё рекламу ${entry.item.brand}.`
                    //"text": `Напиши новость про ${entry.event} в ${entry.item.city}. Включи в неё рекламу ${entry.item.service} бренда ${entry.item.brand}.`
                    //"text": `Напиши новость про ${entry.event} в ${entry.item["город"]}. Прорекламируй какой-нибудь товар бренда ${entry.item["бренд"]}.`
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
}

async function genNewsTopics() {
    const sfd = fs.openSync("secrets.json", "r");
    const secrets = JSON.parse(fs.readFileSync(sfd));
    fs.closeSync(sfd);

    var prompt = {
        "modelUri": `gpt://${secrets.folder_id}/yandexgpt-pro`,
        "completionOptions": {
            "stream": false,
            "temperature": 0.5,
            "maxTokens": "4000"
        },
        "messages": [
            {
                "role": "system",
                "text": "Форматируй ответ на запрос как json, содержащий массив из десяти json-объектов, каждый из которых имеет два поля \"event\" и \"item\"."
            },
            {
                "role": "user",
                //"text": "Сгенерируй 10 пар \"событие\" - \"услуга, которую можно прорекламировать в новости о данном событии\". Указывай город, в котором проходит событие, и название бренда, оказывающего данную услугу. Название бренда может быть вымышленным."
                //"text": "Сгенерируй 10 пар \"событие\" - \"товар, который можно прорекламировать в новости о данном событии\". Указывай город, в котором проходит событие, и название бренда, производящего данный товар. Название бренда может быть вымышленным."
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

    var fd = fs.openSync(`prompts.json`, "w");
    fs.writeFileSync(fd, text);
    fs.closeSync(fd);
}

genNewsTopics();

/*
Instruction:
0. Save your folder id and iam key in `secrets.json` in format `{ "folder_id": "...", "iam_token": "..." }`
1. Run genNewsTopics() to generate `prompts.json`
2. Edit `prompts.json` so that it looks like `{ "data": [...] }`
3. Run genNews() to generate news in folder `generated_data`
4. Sometimes edit prompts in genNewsTopics() and genNews()
*/
