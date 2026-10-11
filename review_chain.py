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
    points_str = ", ".join(picked) if picked else "honesty and professionalism"
    
    if "hindi" in lang_lower and "hinglish" not in lang_lower:
        openers = [
            f"{name} के साथ मेरा अनुभव बहुत ही शानदार और संतोषजनक रहा।",
            f"{name} की टीम से प्रॉपर्टी सलाह लेकर बहुत खुशी हुई।",
            f"मैं {name} की सेवा और मार्गदर्शन से बेहद संतुष्ट हूँ।",
        ]
        closers = [
            "पूरी प्रक्रिया बहुत पारदर्शी रही, मैं सभी को इनकी सेवा लेने की सलाह दूंगा।",
            "इनकी ईमानदार सलाह और सहयोग वास्तव में सराहनीय है। 5 स्टार!",
            "प्रॉपर्टी से जुड़ी किसी भी आवश्यकता के लिए यह सबसे बेहतरीन विकल्प है।",
        ]
        return f"{random.choice(openers)} खासतौर पर इनकी {points_str} बहुत अच्छी लगी। {random.choice(closers)}"
    elif "hinglish" in lang_lower:
        openers = [
            f"{name} ke sath mera experience bohot hi badhiya raha!",
            f"{name} ki team ke sath deal karke kaafi accha laga.",
            f"Recently {name} se property guidance li, aur service sach me top class thi.",
        ]
        closers = [
            "Definitely recommend karunga sabhi ko. Full 5 stars!",
            "Bohot honest aur reliable guidance mili, thank you so much!",
            "Smooth process aur trustworthy staff, strongly recommended!",
        ]
        return f"{random.choice(openers)} Khas taur par inki {', '.join(p.lower() for p in picked)} ne impress kiya. {random.choice(closers)}"
    else:
        openers = [
            f"Had an outstanding experience with {name}!",
            f"Really impressed with the quality and transparency at {name}.",
            f"Very happy with the overall service and support from {name}.",
        ]
        closers = [
            "Would definitely recommend them to anyone looking for trusted property advisory!",
            "Truly professional, dependable, and genuine. 5 stars!",
            "The entire experience was seamless and stress-free. Highly recommended!",
        ]
        return f"{random.choice(openers)} Their team provided exceptional guidance with {', '.join(p.lower() for p in picked)}. {random.choice(closers)}"


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
        print("LLM error:", repr(e))
        return _fallback(name, picked, rating, language)
