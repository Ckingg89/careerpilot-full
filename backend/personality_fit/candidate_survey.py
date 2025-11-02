# file: candidate_survey.py
import json
import numpy as np

def ask_likert(prompt: str) -> int:
    while True:
        try:
            v = int(input(f"{prompt}  (1–5): "))
            if 1 <= v <= 5:
                return v
        except ValueError:
            pass
        print("Please enter a whole number between 1 and 5.")

def normalize_likert(v: int) -> float:
    return (v - 1) / 4.0

def score_trait(items):
    vals = []
    for text, is_rev in items:
        v = ask_likert(text)
        q = normalize_likert(v)
        if is_rev:
            q = 1.0 - q
        vals.append(q)
    return 100.0 * float(np.mean(vals))

def score_env(items):
    vals = []
    for text, is_rev in items:
        v = ask_likert(text)
        q = normalize_likert(v)
        if is_rev:
            q = 1.0 - q
        vals.append(q)
    return float(np.mean(vals))

# ======= SURVEY BANKS =======

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

print("\n=== CANDIDATE SURVEY: HEXACOG + ENV PREFERENCES ===")

user_traits = {t: round(score_trait(items), 2) for t, items in CANDIDATE_TRAITS.items()}
user_env = {dim: round(score_env(items), 3) for dim, items in CANDIDATE_ENV.items()}

output = {"traits": user_traits, "environment": user_env}
print("\n✅ Candidate survey complete.\n")
print(json.dumps(output, indent=2))

with open("candidate_scores.json", "w") as f:
    json.dump(output, f, indent=2)
print("\n✅ Saved as candidate_scores.json\n")
