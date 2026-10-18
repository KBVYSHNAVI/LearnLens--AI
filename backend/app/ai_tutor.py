import os
import httpx
from app.config import settings

SYSTEM_PROMPT = (
    "You are LearnLens AI Placement Mentor. Explain concepts, give step-by-step dry runs, "
    "and progressive hints (Level 1: nudge, Level 2: algorithm, Level 3: pseudocode). "
    "Support Telugu with English technical terms when requested."
)

# ── Communication Coach personas ──────────────────────────────────────────────
INTERVIEW_PERSONA = (
    "You are Alex, a senior technical interviewer at a top product company (Google/Amazon level). "
    "Your job is to conduct a realistic mock interview. "
    "Ask ONE question at a time, then wait for the candidate's response. "
    "After each answer, give brief constructive feedback (1-2 lines), then ask the next question. "
    "Track the conversation and build follow-up questions based on previous answers. "
    "End with an overall performance summary when the user says 'end interview' or after 8 exchanges. "
    "Be professional, slightly challenging but encouraging."
)

DEBATE_PERSONA = (
    "You are Jordan, an expert debater and communication coach. "
    "Your job is to engage in a structured debate with the user. "
    "When a topic is given, take the OPPOSITE side from the user. "
    "Present strong counter-arguments after each user point. "
    "Give a score (1-10) for each of the user's arguments: clarity, logic, evidence. "
    "At the end, declare a winner and give tips to improve debate skills. "
    "Be confident, articulate, and push the user to think harder."
)

GD_PERSONA = (
    "You are a Group Discussion facilitator and also play 2-3 other participant characters. "
    "Simulate a realistic GD session where multiple participants discuss a topic. "
    "Participants: Riya (aggressive, confident), Dev (analytical, data-driven), Priya (moderate, balancing). "
    "After the user speaks, have 1-2 participants respond naturally, then invite the user to continue. "
    "After every 4 exchanges, give the user a private coaching tip (in [COACH TIP: ...] format). "
    "End with individual evaluation: communication, leadership, content, listening."
)


def generate_offline_tutor_response(action, topic_title, question_title, code_context,
                                     error_context, language, preferred_language_mode, hint_level):
    is_telugu = preferred_language_mode.lower() == "telugu"

    if action == "progressive_hint":
        if hint_level == 1:
            reply = ("స్థాయి 1 సలహా: ఒకే పాస్‌లో ఆలోచించండి. ఏ స్టేట్ ట్రాక్ చేయాలి?"
                     if is_telugu else
                     "Level 1 Hint: Consider a single pass. What state do you need to track?")
        elif hint_level == 2:
            reply = ("స్థాయి 2: ఒకే లూప్‌లో ట్రాకర్ అప్‌డేట్ చేయండి. O(N) టైమ్, O(1) స్పేస్."
                     if is_telugu else
                     "Level 2 Hint: Use a running tracker updated in one loop. O(N) time, O(1) space.")
        else:
            reply = ("స్థాయి 3 సూడోకోడ్:\n```python\nres = arr[0]\nfor x in arr[1:]:\n    if x > res: res = x\nreturn res\n```"
                     if is_telugu else
                     "Level 3 Pseudocode:\n```python\nif not arr: return None\nres = arr[0]\nfor x in arr[1:]:\n    if x > res: res = x\nreturn res\n```")
        follow = ["Can you give me the next hint?", "What is the time complexity?"]

    elif action == "explain_concept":
        reply = f"**{topic_title}** is fundamental. Practice dry runs and edge cases. Ask for a step-by-step trace."
        follow = ["Show me a dry run", "What are common mistakes?"]

    elif action == "dry_run":
        reply = "Trace: arr=[3,7,2,9,5] -> best=3->7->7->9->9. Result: 9. O(N) time, O(1) space."
        follow = ["Explain complexity", "Show edge cases"]

    elif action == "explain_error":
        reply = f"**Error:** {error_context or 'Output mismatch'}.\nCheck: 0-indexed bounds, init values, return-vs-print."
        follow = ["Help me fix it", "Give a hint"]

    else:
        reply = "Hi! I'm your LearnLens AI Mentor. Ask me to explain concepts, do dry runs, or give progressive hints."
        follow = ["Explain Arrays", "Give me a practice problem"]

    return {"reply": reply, "action_type": action, "hint_level": hint_level,
            "suggested_follow_ups": follow, "is_offline_mode": True}


async def ask_ai_tutor(action, topic_title="DSA", question_title="Problem", code_context="",
                        error_context="", language="python", preferred_language_mode="english",
                        hint_level=1, custom_prompt=""):
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return generate_offline_tutor_response(action, topic_title, question_title, code_context,
                                                error_context, language, preferred_language_mode, hint_level)

    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{settings.GEMINI_MODEL}:generateContent?key={api_key}")
    payload = {
        "contents": [{"role": "user", "parts": [
            {"text": SYSTEM_PROMPT},
            {"text": (f"Topic:{topic_title}\nQuestion:{question_title}\nLang:{language}\n"
                      f"Action:{action}\nMode:{preferred_language_mode}\n"
                      f"Code:\n{code_context}\nError:{error_context}\nAsk:{custom_prompt}")}
        ]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1024}
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as c:
            r = await c.post(url, json=payload)
            if r.status_code == 200:
                cands = r.json().get("candidates", [])
                if cands:
                    return {"reply": cands[0]["content"]["parts"][0]["text"],
                            "action_type": action, "hint_level": hint_level,
                            "suggested_follow_ups": ["Explain line by line", "Time complexity?", "Similar question?"],
                            "is_offline_mode": False}
    except Exception:
        pass

    return generate_offline_tutor_response(action, topic_title, question_title, code_context,
                                            error_context, language, preferred_language_mode, hint_level)


async def ask_communication_coach(
    mode: str,           # "interview" | "debate" | "group_discussion"
    topic: str,
    user_message: str,
    history: list,       # [{"role": "user"|"assistant", "content": "..."}]
    role: str = "SDE-1",
    preferred_language: str = "english"
) -> dict:
    """
    Multi-turn AI communication coach for mock interview, debate, and GD.
    history is the full conversation so far (without system prompt).
    """
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    persona_map = {
        "interview": INTERVIEW_PERSONA,
        "debate": DEBATE_PERSONA,
        "group_discussion": GD_PERSONA,
    }
    persona = persona_map.get(mode, INTERVIEW_PERSONA)

    lang_note = ""
    if preferred_language.lower() == "telugu":
        lang_note = " Respond in Telugu (తెలుగు) but keep technical terms in English."

    system_text = persona + lang_note

    if not api_key:
        # Offline fallback per mode
        fallbacks = {
            "interview": (
                f"**Alex (Interviewer):** Thanks for that answer. "
                f"Let me ask you about {topic}. "
                f"Can you explain the time complexity of your approach and how you'd optimize it further?"
            ),
            "debate": (
                f"**Jordan (Opponent):** Interesting point, but consider this — "
                f"the data actually suggests the opposite. {topic} has shown measurable downsides "
                f"that your argument overlooks. Score for your last point: Clarity 6/10, Logic 5/10. "
                f"Can you defend your position with concrete evidence?"
            ),
            "group_discussion": (
                f"**Riya:** I agree with some of your points, but we're missing the bigger picture here.\n"
                f"**Dev:** Statistically speaking, {topic} has a 40% impact on outcomes — "
                f"we need data to back this up.\n"
                f"[COACH TIP: Try to acknowledge others' points before adding yours — it shows active listening.]\n"
                f"What's your take on this perspective?"
            ),
        }
        reply = fallbacks.get(mode, "Please provide your Gemini API key for full AI responses.")
        return {"reply": reply, "mode": mode, "is_offline": True}

    # Build Gemini contents array from history
    contents = [{"role": "user", "parts": [{"text": system_text + f"\n\nTopic: {topic}\nRole: {role}"}]},
                {"role": "model", "parts": [{"text": "Understood. I'm ready to begin. Let's start."}]}]

    for msg in history:
        role_key = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role_key, "parts": [{"text": msg["content"]}]})

    # Add current user message
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{settings.GEMINI_MODEL}:generateContent?key={api_key}")
    payload = {
        "contents": contents,
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024}
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as c:
            r = await c.post(url, json=payload)
            if r.status_code == 200:
                cands = r.json().get("candidates", [])
                if cands:
                    text = cands[0]["content"]["parts"][0]["text"]
                    return {"reply": text, "mode": mode, "is_offline": False}
    except Exception:
        pass

    # Fallback on error
    return {
        "reply": "I'm having trouble connecting. Please check your API key or try again.",
        "mode": mode,
        "is_offline": True
    }
