from scipy.spatial import distance
import openai
import numpy as np
from dotenv import load_dotenv
import os
import sys

load_dotenv()
openai.api_key = os.environ.get("OPENAI_API_KEY")


def get_cosine_similarity(embedding_1: np.ndarray, embedding_2: np.ndarray) -> float:
    return distance.cosine(embedding_1, embedding_2)


def get_embedding(text: str, model: str = "text-embedding-ada-002") -> np.ndarray:
    text = text.replace("\n", " ")
    return np.array(
        openai.Embedding.create(input=[text], model=model)["data"][0]["embedding"]
    )


if __name__ == "__main__":
    clicked_word, words_to_compare = sys.argv[0], sys.argv[1:]
    min_dist, min_word = 0, None
    clicked_word_embedding = get_embedding(clicked_word)
    for word in words_to_compare:
        cur_dist = get_cosine_similarity(get_embedding(word), clicked_word_embedding)
        if cur_dist > min_dist:
            min_dist = cur_dist
            min_word = word

    print(f"Did you mean to click: {min_word}?")
