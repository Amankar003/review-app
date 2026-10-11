import os
import random

from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system",
     "You write short, natural Google reviews (2-3 sentences) in first person, "
     "as a real customer. Mention ONLY the points provided. Rating given by customer is {rating} out of 5 stars. "
     "Match the tone to the rating (5-star is enthusiastic and highly satisfied, 4-star is positive and polite). "
     "Do not invent facts, names, or prices. No emojis, hashtags or quotation marks. Sound casual "
     "and genuine, not like a marketing ad. "
     "Write the review in the requested language: if 'Hindi', write in natural Devanagari Hindi; if 'Hinglish', write in conversational Roman Hindi/Hinglish; if 'English', write in English. "
     "Return ONLY the review text."),
    ("human",
     "Business: {name}\nRating: {rating} stars\nLanguage: {language}\nPoints selected by customer: {points}"),
])


def _build_chain():
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("GROK_API_KEY")
    if not api_key:
        return None
    llm = ChatGroq(
        groq_api_key=api_key,
        model_name=os.getenv("GROQ_MODEL") or os.getenv("GROK_MODEL") or "openai/gpt-oss-120b",
        temperature=0.7,
        max_tokens=300,
    )
    return prompt | llm | StrOutputParser()


chain = _build_chain()


def _fallback(name: str, picked: list[str], rating: int = 5, language: str = "English") -> str:
    lang_lower = (language or "").lower()
    if "hindi" in lang_lower and "hinglish" not in lang_lower:
        opener = f"{name} ke sath mera anubhav bahut accha raha."
        closer = "Main sabhi ko recommend karunga."
        return f"{opener} {', '.join(p for p in picked)}. {closer}"
    elif "hinglish" in lang_lower:
        opener = f"{name} ke sath experience bohot accha raha."
        closer = "Definitely recommend karunga sabhi ko!"
        return f"{opener} Sab kuch kafi {', '.join(p.lower() for p in picked)} tha. {closer}"
    else:
        opener = random.choice([
            f"Had a great experience with {name}.",
            f"Really impressed with my experience at {name}.",
            f"Very happy with the service from {name}.",
        ])
        closer = random.choice(["Would definitely recommend!", "Truly professional and reliable.", "Highly recommended."])
        return f"{opener} Everything felt {', '.join(p.lower() for p in picked)}. {closer}"


def generate_review(name: str, language: str, picked: list[str], rating: int = 5) -> str:
    global chain
    if chain is None:
        chain = _build_chain()
    if chain is None:
        return _fallback(name, picked, rating, language)
    try:
        text = chain.invoke({
            "name": name,
            "rating": rating,
            "language": language or "English",
            "points": ", ".join(picked)
        }).strip()
        return text or _fallback(name, picked, rating, language)
    except Exception as e:
        print("LLM error:", e)
        return _fallback(name, picked, rating, language)
