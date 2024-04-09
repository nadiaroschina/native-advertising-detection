import requests
from time import sleep

  
def retry_yandex_gpt_factory(retries=2):
    def retry_yandex_gpt(func):
        def wrapper_retry_yandex_gpt(*args, **kwargs):
            for retry in range(retries):
                res = func(*args, **kwargs)
                if (res.status_code) == 200:
                    return res.json()
                else:
                    print(f"Request failed {res.status_code}: {res.json()}, retry number: {retry + 1}")
                    if res.status_code == 429:
                        sleep(5)

        return wrapper_retry_yandex_gpt

    return retry_yandex_gpt

    
class Message:
    def __init__(self, role: str, text: str):
        self.role = role
        self.text = text


class AsyncYandexGpt:

    def __init__(self, api_key: str, model_uri: str):
        self.api_key = api_key
        self.model_uri = model_uri

    def get_headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Api-Key {self.api_key}",
            "x-data-logging-enabled": "false"
        }
    

    @retry_yandex_gpt_factory(5)
    def completion(self, messages: list[Message]):
        url = "https://llm.api.cloud.yandex.net/foundationModels/v1/completionAsync"
        data = {
            "modelUri": self.model_uri,
            "completionOptions": {
                "stream": False,
                "temperature": 0.6,
                "maxTokens": 8000
            },
            "messages": [{"role": msg.role, "text": msg.text} for msg in messages]
        }
        return requests.post(url, json=data, headers=self.get_headers())

    def get_operation(self, operation_id: str):
        url = "https://operation.api.cloud.yandex.net/operations/" + operation_id
        return requests.get(url, headers=self.get_headers()).json()

    def sync_completion(self, messages: list[Message], max_wait_secs: int):
        operation_id = self.completion(messages)['id']
        for _ in range(max_wait_secs):
            res = self.get_operation(operation_id)
            if res["done"]:
                return res
            sleep(1)


def gen_fake_add(gpt: AsyncYandexGpt, text: str) -> str | None:

    user_prompt = f'Придумай текст рекламы какого-нибудь продукта, используя данные из этой новостной статьи. \
        Самостоятельно придумай релевантный продукт и название бренда.\n{text}'
    system_prompt = """Ответ должен быть в таком формате:

    Бренд: <название придуманного бренда>
    Продукт: <названиие придуманного продукта>
    Реклама: <текст c рекламой продукта>
    """
    system_msg = Message('system', system_prompt)
    user_msg = Message('user', user_prompt)
    response = gpt.sync_completion(messages=[system_msg, user_msg], max_wait_secs=120)

    if not response['done']:
        return None
    else:
        text = response['response']['alternatives'][0]['message']['text']
        if 'Реклама:' not in text:
            return None
        ad_text = text.split('Реклама:')[1]
        processed_ad_text = []
        prev_symb = '\n'
        for symb in ad_text:
            if not (
                (symb == '*')
                or (symb == '\n' and prev_symb == '\n')
            ):
                processed_ad_text.append(symb)
            prev_symb = symb
        return ''.join(processed_ad_text)
