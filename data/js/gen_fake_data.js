const fs = require("fs");
const crypto = require("crypto");
const yaml = require("js-yaml");

const defaults = yaml.load(fs.readFileSync(`defaults.yaml`, "utf8"));

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

function createConfig() {
  return new Promise((resolve, reject) => {
    process.stdout.write("No config.yaml file found.\n");
    
    var sv = "";
    function getFolderID() {
      readline.question("Enter your Yandex.Cloud folder id: ", folder_id => {
        sv += `secrets:\n  folder_id: ${folder_id}\n`;
        getIAMToken();
      });
    }

    function getIAMToken() {
      readline.question("Enter your IAM token: ", iam_token => {
        sv += `  iam_token: ${iam_token}\n`;
        genPromptsTopicsSystem();
      });
    }

    function genPromptsTopicsSystem() {
      readline.question("Enter system prompt used to generate topics (empty line for default): ", str => {
        if (str !== "") {
          sv += `prompts:\n  gen_topics:\n    system: "${str}"\n`;
        } else {
          sv += `prompts:\n  gen_topics:\n    system: "${defaults.prompts.gen_topics.system.replaceAll("\"", "\\\"")}"\n`;
        }
        genPromptsTopicsUser();
      });
    }

    function genPromptsTopicsUser() {
      readline.question("Enter user prompt used to generate topics (empty line for default): ", str => {
        if (str !== "") {
          sv += `    user: "${str}"\n`;
        } else {
          sv += `    user: "${defaults.prompts.gen_topics.user.replaceAll("\"", "\\\"")}"\n`;
        }
        genPromptsTopicsTemperature();
      });
    }

    function genPromptsTopicsTemperature() {
      readline.question("Enter temperature used to generate topics (empty line for default): ", str => {
        if (str !== "") {
          sv += `    temperature: ${str}\n`;
        } else {
          sv += `    temperature: ${defaults.prompts.gen_topics.temperature}\n`;
        }
        genPromptsNewsSystem();
      });
    }

    function genPromptsNewsSystem() {
      readline.question("Enter system prompt used to generate news (empty line for default): ", str => {
        if (str !== "") {
          sv += `  gen_news:\n    system: "${str}"\n`;
        } else {
          sv += `  gen_news:\n    system: "${defaults.prompts.gen_news.system.replaceAll("\"", "\\\"")}"\n`;
        }
        genPromptsNewsTemperature();
      });
    }

    function genPromptsNewsTemperature() {
      readline.question("Enter temperature used to generate news (empty line for default): ", str => {
        if (str !== "") {
          sv += `    temperature: ${str}\n`;
        } else {
          sv += `    temperature: ${defaults.prompts.gen_news.temperature}\n`;
        }
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
    await createConfig();
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
          "temperature": config.prompts.gen_news.temperature,
          "maxTokens": "2000"
        },
        "messages": [
          {
            "role": "system",
            "text": config.prompts.gen_news.system
          },
          {
            "role": "user",
            "text": `Напиши новость про ${entry.event} в ${entry.city}. Умомяни в ней ${entry.item} бренда ${entry.brand}.`
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
      "temperature": config.prompts.gen_topics.temperature,
      "maxTokens": "4000"
    },
    "messages": [
      {
        "role": "system",
        "text": config.prompts.gen_topics.system
      },
      {
        "role": "user",
        "text": config.prompts.gen_topics.user
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
