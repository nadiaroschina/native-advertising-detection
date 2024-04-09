from query_to_gpt import query_to_gpt


def get_fake_add_from_text(text: str) -> str | None:

    user_prompt = f'Придумай текст рекламы какого-нибудь продукта, используя данные из этой новостной статьи. \
        Самостоятельно придумай релевантный продукт и название бренда.\n{text}'

    system_prompt = """Ответ должен быть в таком формате:

    Бренд: <название придуманного бренда>
    Продукт: <названиие придуманного продукта>
    Реклама: <текст c рекламой продукта>
    """

    try:
        response = query_to_gpt(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.6
        )
        lines = (response.split('Реклама:')[1]).split('\n\n')
        lines = [line for line in lines if line.strip() not in ('*', '**')]
        return '\n'.join(lines)

    except Exception:
        return None
