const fs = require("fs");
const crypto = require("crypto");
const yaml = require('js-yaml');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

function createSecrets() {
  return new Promise((resolve, reject) => {
    process.stdout.write("No config.yaml file found.\n");
    
    var sv = "secrets:\n";
    function getFolderID() {
      readline.question("Enter your Yandex.Cloud folder id: ", folder_id => {
        sv += `  folder_id: ${folder_id}\n`;
        getIAMToken();
      });
    }

    function getIAMToken() {
      readline.question("Enter your IAM token: ", iam_token => {
        sv += `  iam_token: ${iam_token}\n`;
        createFile();
      });
    }

    function createFile() {
      const fd = fs.openSync("config.yaml", "w");
      sv += `generated_data_path: "../generated_data"`;
      fs.writeFileSync(fd, sv);
      fs.closeSync(fd);
      resolve(0);
    }

    getFolderID();
  });
}

async function getConfig() {
  if (!fs.existsSync("config.yaml")) {
    await createSecrets();
  }
  return yaml.load(fs.readFileSync("config.yaml", 'utf8'));
}

async function genNews(name) {
  const config = await getConfig();

  const pfd = fs.openSync(`${config.generated_data_path}/prompts/${name}`, "r");
  try {
    const textdata = fs.readFileSync(pfd).toString();
    const x = textdata.indexOf('[');
    const y = textdata.lastIndexOf(']');
    const data = `{ "data": ${textdata.substring(x, y + 1)} }`;
    const prompts = JSON.parse(data);
    fs.closeSync(pfd);

    for (var i = 0; i < prompts.data.length; i++) {
      const entry = prompts.data[i];

      var prompt = {
        "modelUri": `gpt://${config.secrets.folder_id}/yandexgpt-pro`,
        "completionOptions": {
          "stream": false,
          "temperature": 0.65,
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
          'Authorization': `Bearer ${config.secrets.iam_token}`,
          'x-folder-id': config.secrets.folder_id
        },
        body: JSON.stringify(prompt)
      });

      const content = await res.text();
      const text = JSON.parse(content).result.alternatives[0].message.text;

      const name = `text${crypto.randomBytes(10).toString('hex')}.txt`;
      var fd = fs.openSync(`${config.generated_data_path}/${name}`, "w");
      fs.writeFileSync(fd, text);
      fs.closeSync(fd);
      console.log(`Created ${config.generated_data_path}/${name}`);
    }
  } catch {
    console.log("failure");
  }
}

async function genNewsTopics() {
  const config = await getConfig();

  var prompt = {
    "modelUri": `gpt://${config.secrets.folder_id}/yandexgpt-pro`,
    "completionOptions": {
      "stream": false,
      "temperature": 0.6,
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
      'Authorization': `Bearer ${config.secrets.iam_token}`,
      'x-folder-id': config.secrets.folder_id
    },
    body: JSON.stringify(prompt)
  });

  const content = await res.text();
  const text = JSON.parse(content).result.alternatives[0].message.text;

  if (!fs.existsSync(`${config.generated_data_path}`)) {
    fs.mkdirSync(`${config.generated_data_path}`);
  }
  if (!fs.existsSync(`${config.generated_data_path}/prompts`)) {
    fs.mkdirSync(`${config.generated_data_path}/prompts`);
  }
  const name = crypto.randomBytes(10).toString('hex');
  const fd = fs.openSync(`${config.generated_data_path}/prompts/${name}`, 'w');
  fs.writeFileSync(fd, text);
  fs.closeSync(fd);
  console.log(`Created ${config.generated_data_path}/prompts/${name}`);
  return name;
}

async function main() {
  for (var i = 0; i < 10; i++) {
    const name = await genNewsTopics();
    await genNews(name);
  }
  readline.close();
  readline.removeAllListeners();
}

main();
