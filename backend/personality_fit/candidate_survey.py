# file: backend/personality_fit/candidate_survey.py
"""
Generates HEXACOG personality + environment preference scores
for a given candidate.

This version is production-ready:
- No blocking input()
- Works as a callable function in FastAPI
- Still supports optional local testing
"""

import json
import numpy as np
from pathlib import Path

# ======= NORMALIZATION UTILITIES =======

def normalize_likert(value: int, reverse: bool = False) -> float:
    """
    Convert a 1–5 Likert response into a normalized 0–1 score.
    Automatically reverses if reverse=True.
    """
    v = max(1, min(5, int(value)))  # clamp within 1–5
    q = (v - 1) / 4.0
    return 1.0 - q if reverse else q


def score_trait(responses: list[int], reverse_flags: list[bool]) -> float:
    """
    Compute trait score (0–100) given lists of responses and reverse flags.
    """
    vals = [
        normalize_likert(v, rev)
        for v, rev in zip(responses, reverse_flags)
        if isinstance(v, (int, float))
    ]
    return round(100.0 * float(np.mean(vals)), 2) if vals else 50.0


def score_env(responses: list[int], reverse_flags: list[bool]) -> float:
    """
    Compute environment preference score (0–1 scale).
    """
    vals = [
        normalize_likert(v, rev)
        for v, rev in zip(responses, reverse_flags)
        if isinstance(v, (int, float))
    ]
    return round(float(np.mean(vals)), 3) if vals else 0.5


# ======= SURVEY BANKS =======

# Each trait/environment now only defines the prompts and reverse flags.
# The actual user responses will come from the front end or API.
CANDIDATE_TRAITS = {
    "H": [
        ("I would return extra change a cashier gave me by mistake.", False),
        ("I sometimes exaggerate my achievements to impress people.", True),
        ("I avoid taking credit for ideas that are not fully mine.", False),
        ("I would misuse company resources if it helped me meet goals.", True),
        ("I prefer to work in systems where everyone is held equally accountable.", False),
        ("I am uncomfortable when others praise me excessively.", False),
        ("I dislike bending rules, even for efficiency.", False),
    ],
    "S": [
        ("I stay composed during sudden emergencies.", False),
        ("Criticism makes me anxious for a long time.", True),
        ("I recover quickly from disappointment.", False),
        ("When problems pile up, I can still think clearly.", False),
        ("Minor setbacks often ruin my day.", True),
        ("I perform well in unpredictable situations.", False),
        ("I tend to ruminate about what went wrong yesterday.", True),
    ],
    "X": [
        ("I gain energy from meeting new people.", False),
        ("I prefer working quietly rather than being around chatter.", True),
        ("I enjoy persuading others to my point of view.", False),
        ("I feel drained after long social events.", True),
        ("I naturally take the lead when groups need direction.", False),
        ("I express enthusiasm easily when discussing ideas.", False),
        ("I prefer writing emails to talking face-to-face.", True),
    ],
    "A": [
        ("I stay polite even when others are rude.", False),
        ("I feel a strong need to compete with my coworkers.", True),
        ("I try to understand people before judging them.", False),
        ("I get irritated quickly when people are inefficient.", True),
        ("I avoid embarrassing others, even if they’re wrong.", False),
        ("I enjoy mentoring or helping others improve.", False),
        ("I find it satisfying to 'win' arguments.", True),
    ],
    "C": [
        ("I double-check my work for errors before submission.", False),
        ("I leave small tasks unfinished if they’re boring.", True),
        ("I keep personal and work materials well organized.", False),
        ("I create schedules and actually follow them.", False),
        ("I work best under strict deadlines.", False),
        ("I sometimes ignore instructions if I think my way is faster.", True),
        ("I dislike vague expectations at work.", False),
        ("I finish projects even when I lose interest.", False),
    ],
    "O": [
        ("I enjoy learning about topics outside my expertise.", False),
        ("I prefer tasks that have only one correct answer.", True),
        ("I quickly adapt to new software or tools.", False),
        ("I get excited by abstract discussions about 'why' or 'how'.", False),
        ("I avoid taking risks with untested ideas.", True),
        ("I find art, design, or storytelling inspiring.", False),
        ("I prefer to stick to proven routines.", True),
    ],
    "G": [
        ("I work steadily toward goals that may take years to achieve.", False),
        ("I often change my interests when something new catches my attention.", True),
        ("I stay committed even when progress is slow.", False),
        ("I abandon tasks when obstacles appear insurmountable.", True),
        ("I motivate myself through setbacks without outside pressure.", False),
        ("Once I decide on a plan, I follow through completely.", False),
    ],
}

CANDIDATE_ENV = {
    "structure": [
        ("I prefer clear procedures and written guidelines.", False),
        ("I enjoy flexibility more than strict rules.", True),
        ("I dislike ambiguous expectations.", False),
        ("I find comfort in routine, predictable processes.", False),
        ("I adapt easily when procedures change.", True),
        ("I perform better when tasks have precise checklists.", False),
    ],
    "sociality": [
        ("I gain energy from teamwork.", False),
        ("I prefer roles with minimal social interaction.", True),
        ("I communicate easily with people I just met.", False),
        ("I find daily collaboration stimulating.", False),
        ("I get mentally tired from too many meetings.", True),
        ("I enjoy supporting others to reach shared goals.", False),
    ],
    "stability": [
        ("I value consistency in my daily tasks.", False),
        ("Sudden changes at work throw me off balance.", False),
        ("I thrive in fast-changing environments.", True),
        ("Predictability helps me stay focused.", False),
        ("I like experimenting with new roles each month.", True),
        ("I appreciate steady, incremental improvement over constant change.", False),
    ],
    "creativity": [
        ("I look for opportunities to innovate.", False),
        ("I prefer implementing proven solutions.", True),
        ("Brainstorming new ideas excites me.", False),
        ("I find open-ended tasks frustrating.", True),
        ("I enjoy improving processes creatively.", False),
        ("I lose interest in repetitive work quickly.", False),
    ],
    "autonomy": [
        ("I prefer deciding how to approach my tasks.", False),
        ("I like being told exactly what to do.", True),
        ("I enjoy managing my own schedule.", False),
        ("I get uncomfortable when left unsupervised.", True),
        ("I take initiative without waiting for approval.", False),
        ("I prefer collaborative decision-making to individual authority.", False),
    ],
}

# ======= MAIN FUNCTION =======

def generate_candidate_profile(responses: dict[str, list[int]]) -> dict:
    """
    Takes a dict of responses (same structure as CANDIDATE_TRAITS & ENV)
    and returns computed scores for traits and environment.
    """
    traits_scores = {}
    env_scores = {}

    for trait, questions in CANDIDATE_TRAITS.items():
        prompts, reverses = zip(*questions)
        vals = responses.get(trait, [3] * len(prompts))
        traits_scores[trait] = score_trait(vals, reverses)

    for dim, questions in CANDIDATE_ENV.items():
        prompts, reverses = zip(*questions)
        vals = responses.get(dim, [3] * len(prompts))
        env_scores[dim] = score_env(vals, reverses)

    return {"traits": traits_scores, "environment": env_scores}


def save_profile(profile: dict, path: str = "candidate_scores.json"):
    """Persist candidate profile locally (for debugging)."""
    Path(path).write_text(json.dumps(profile, indent=2), encoding="utf-8")


# ======= LOCAL TESTING =======
if __name__ == "__main__":
    print("⚙️  Generating sample neutral profile (all 3/5 answers)...")
    sample_responses = {k: [3] * len(v) for k, v in {**CANDIDATE_TRAITS, **CANDIDATE_ENV}.items()}
    profile = generate_candidate_profile(sample_responses)
    save_profile(profile)
    print(json.dumps(profile, indent=2))
    print("\n✅ Saved as candidate_scores.json\n")
