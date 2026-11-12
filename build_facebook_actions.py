# Copyright (c) 2026 Rafael Arciniegas

import json
import re
from collections import defaultdict
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
SOURCE = PROJECT_DIR / 'agent-reach-facebook-reels.jsonl'
OUTPUT = PROJECT_DIR / 'facebook-video-suggested-actions.md'
PROFILE = 'https://www.facebook.com/profile.php?id=100091065962204'

MANUAL = {
    '2313395599446596': """You added Sign in with Google. Your AI left the redirect wide open.
Someone just sent your users a login link that delivers their token to a server you have never seen. The user thinks they logged in. The attacker has their access token. Lock redirect URIs to exact registered URLs. Enforce a state parameter on every OAuth request. Scope token permissions to the minimum your app needs.
Your users trust that login button. Make sure it only works for you.
#vibecoding #aidirectedengineering #oauth #security #production""",
    '1355640899480321': """One kid with a laptop can take your entire product offline right now.
Not a nation-state hacker. A teenager with a YouTube tutorial and a loop that sends 10,000 requests per second. Your app goes dark. Every customer. Every transaction. Gone. Because your AI never built a firewall.
Direct your AI to fix that today by configuring a web application firewall and DDoS protection.
#vibecoding #aidirectedengineering #ddos #waf #production""",
    '955038200490096': """Most people think full-stack means frontend and backend. That is 2 layers out of 13.
The real production stack includes auth, hosting, cloud infrastructure, CI/CD, security, rate limiting, caching, load balancing, error tracking, and disaster recovery, and most vibe-coded apps ship with none of it.
Audit the full production stack and add the missing layers before scaling beyond a prototype.
#VibeCoding #FullStackDevelopment #AIProductDesign #ShipIt #BuildInPublic""",
    '2453888091739501': """Dev, staging, production, all in the same place: your laptop. You are testing and breaking everything live.
Separate development, staging, and production environments. Do not test changes in production.
#deployment #vibecoding #devops #buildinpublic #staging""",
    '1641258503970712': """Every morning before I open email, before Slack, before I talk to anyone, my AI gives me a briefing. It changed how I run my entire day and business.
Create an AI morning briefing before opening email or Slack. Pull the calendar with context on every meeting, including participants, the previous discussion, and preparation needs. Check priorities against the schedule and flag anything likely to slip through the cracks.
#RunningOnAI #MorningRoutine #AIProductivity #CEOLife #WorkSmarter""",
    '2065639224277843': """74% of companies cannot measure their AI ROI. Establish a measurable AI ROI process instead of treating adoption as sufficient. The public caption promises a fix but does not expose the reel's detailed steps.
#AIStrategy #ROI #DataDriven #DigitalTransformation #AIReadiness""",
}

ACTION_OVERRIDES = {
    '2662470054214218': [],
    '914947007921122': [],
    '1362878112226436': [
        'Install server-only to prevent server code from entering the client bundle.',
        'Separate server and client files.',
        'Scan the production build for leaked secrets.',
    ],
    '1441518108033051': [
        'Create a customization cost model before writing code.',
        'Prefer configuration to client-specific code branches.',
        'Productize a customization once three clients request it.',
    ],
    '2844157235957543': [
        'Clear stale MCPs, instruction files, skills, and automations every 90–100 days.',
        'Rebuild the AI context stack cleanly for the current model.',
    ],
    '28139612022347541': [
        'Use community activity, website traffic, and purchase data to decide what to build next.',
        'Create a closed loop in which an audit finds the issue, a skill fixes it, and a rerun verifies the result.',
    ],
    '2414419955700203': [
        'Sort every task into one of three buckets before automating it.',
        'Automate tasks the team hates.',
        'Augment enjoyable tasks when volume is the problem.',
        'Protect identity-critical tasks and do not automate them.',
    ],
    '1860061527978293': [
        'Record every sales call.',
        'Give the recording to an AI chief of staff to extract scope, needs, budget, timeline, and risks.',
        'Have the AI draft a statement of work from the actual conversation.',
        'Review, edit, and send the proposal the same day.',
    ],
    '1714468026504828': [
        'Add an out-of-scope section to every proposal, covering common exclusions such as hosting, third-party API costs, content, maintenance, training, and migration.',
        'Define a change-order process for requesting, estimating, pricing, and approving added scope.',
        'Write measurable acceptance criteria for every deliverable.',
    ],
}

AREAS = [
    ('Security, privacy, and identity', [
        ('Authentication, authorization, and sessions', r'auth|oauth|login|password|session|jwt|token|clerk|auth0|pkce|role|permission|ownership|admin route|reset link'),
        ('Application and API security', r'attack|vulnerab|security|xss|csrf|cors|injection|sanitize|validation|zod|graphql|webhook|signature|ssrf|redirect|header|clickjack|frame-options|api key|secret|waf|ddos|firewall|bot|rate limit'),
        ('Data protection and tenant isolation', r'privacy|breach|encrypt|rls|row level|tenant|data access|database record|delete their account|service role|public tables'),
        ('Supply chain and client security', r'npm|dependency|third-party script|mobile app|certificate pin|dns|subdomain|prompt.*scrap|oast'),
    ]),
    ('Production engineering and DevOps', [
        ('Deployment, environments, and release control', r'deploy|deployment|staging|production environment|ci/cd|cicd|pull request|rollback|app store|apple|github|branch|commit'),
        ('Reliability, observability, and incident readiness', r'observab|monitor|logging|error budget|burn rate|alert|outage|incident|fallback|disaster|backup|status page|happy path|error handling|uptime'),
        ('Performance, scaling, and infrastructure', r'scal|performance|cache|caching|load balanc|index|query|redis|cloudflare|vps|hosting|serverless|replica|consistency|rate limit|api limit|infrastructure'),
        ('Architecture, APIs, and databases', r'architect|database|postgres|supabase|firebase|neon|convex|api|schema|migration|multi-tenant|multitenant|webhook|versioning|endpoint|full-stack|production stack'),
    ]),
    ('AI engineering and agent operations', [
        ('Model selection, routing, and cost control', r'model|token cost|ai bill|prompt caching|batch api|model tier|routing layer|credits|open weight|vendor sdk'),
        ('Agents, orchestration, and tool design', r'agent|orchestrat|multi-agent|mcp|cli|skill|chief of staff|bertha'),
        ('AI quality, testing, and secure delivery', r'ai code|vibe cod|builder|code review|second ai|production-ready|production ready|tech debt|audit'),
        ('AI context, memory, and data readiness', r'context|memory|data readiness|data was|integration|tools that do not talk|accuracy'),
    ]),
    ('AI adoption, workforce, and change', [
        ('Readiness, governance, and ownership', r'ai readiness|readiness|governance|ownership|shadow ai|guardrail|pilot|production|strategy'),
        ('Team adoption, training, and change management', r'adoption|resist|staff|team|hackathon|training|workforce|employee|day 14|gen z|leadership'),
        ('Personal and executive productivity', r'morning|briefing|meeting note|calendar|email|slack|proposal|research you|ceo|executive|productivity'),
        ('AI careers and capability building', r'career|job|hiring|candidate|builder|credibility|portfolio|learn|30 minutes today|security roles'),
    ]),
    ('Product, customers, and market', [
        ('Discovery, validation, and prioritization', r'discovery|validate|problem|feature|roadmap|priorit|customer|users|idea|feedback|research|build next'),
        ('User experience, onboarding, and retention', r'onboarding|time-to-value|retention|churn|signup|conversion|mobile-first|universal link|re-engagement|usage'),
        ('Positioning, distribution, and vertical products', r'distribution|vertical software|industry|market|sell|sales pitch|competitor|ads|product hunt|niche'),
        ('Build, buy, and platform decisions', r'build vs|build or buy|vendor selection|off-the-shelf|platform|managed|self-host|tool'),
    ]),
    ('Business operations, strategy, and economics', [
        ('ROI, measurement, and financial control', r'roi|return|cost|revenue|profit|invoice|financial|budget|measure|metrics|savings|price|pricing|fees'),
        ('Process automation and operating systems', r'automat|workflow|process|operation|back office|scheduling|admin|maintenance|meeting|email sequence'),
        ('Sales, marketing, and client management', r'sales|lead|proposal|prospect|client|marketing|conversion|deal|vendor|campaign'),
        ('Strategy, leadership, and operating model', r'business strategy|strategy|leadership|operating layer|priority|management|executive|direction'),
    ]),
    ('Compliance and risk governance', [
        ('Policies, regulation, and data governance', r'compliance|gdpr|privacy policy|terms of service|data processing agreement|regulation|legal|eu|law'),
        ('Assurance, controls, and enterprise readiness', r'soc 2|soc2|audit|enterprise deal|approval gate|risk|control|trust framework|baa'),
    ]),
]

ACTION_START = re.compile(
    r'^(?:direct|ask|tell|have) (?:your|the|an?) ai\b|^(?:start|stop|use|add|build|create|run|test|verify|audit|check|lock|enforce|scope|store|return|reject|sanitize|render|rotate|regenerate|filter|document|track|measure|define|separate|deploy|configure|limit|validate|enable|disable|restrict|move|replace|remove|install|encrypt|pin|hardcode|whitelist|protect|draft|set|expire|invalidate|scan|route|cache|compress|automate|push|record|transcribe|summarize|match|ship|sandbox|demo|sell|review|monitor|log|alert|prioritize|choose|map|identify|assign|train|align|establish|adopt|avoid|fix|implement|generate|hash|send|evaluate|preserve|compare|research|flag|pull|calculate|instrument|baseline|benchmark|centralize|isolate|allowlist|deny|sign|version|sunset|migrate|write|design|fund|schedule|practice|learn|pick|spend|make sure|do not|don\'t|never|before you|when the math|one clear|one owner|one low-risk|short-lived|approval gates|separate logs|time-to-value|progressive disclosure|re-engagement|feature flags|configuration|tenant-|per-tenant|request signing|api versioning|sunset headers|abstraction layer|baa audit|migration runway|signature verification|idempotency|secrets in|certificate pinning|deep link validation|read-after-write|replica lag|conflict resolution|prompt caching)(?:\b|-)',
    re.I,
)
ACTION_CONTAINS = re.compile(r'\b(?:should|must|have to|cannot wait|can draft|can automate)\b', re.I)
PROMO = re.compile(r'^(?:dm\b|comment\b|take our|link in|follow\b|share\b|swipe\b|watch\b|hashtag)', re.I)
NOUN_DIRECTIVE = re.compile(r'^(?:short expiration|refresh rotation|token revocation|approval gates|separate logs|feature flags|configuration inheritance|tenant-aware|per-tenant|tenant-isolated|tenant-scoped|request signing|api versioning|sunset headers|abstraction layer|baa audit|migration runway|time-to-value|progressive disclosure|re-engagement triggers|defined error budget|burn rate alerting|business cost|dependency audit|environment variable isolation|signature verification|idempotency|endpoint protection|secrets in|certificate pinning|deep link validation|read-after-write|replica lag|conflict resolution|prompt caching|batch apis|model tiering|one clear business problem|one owner|one low-risk experiment)', re.I)

def clean_text(text):
    text = text.replace('’', "'").replace('“', '"').replace('”', '"')
    text = re.sub(r'(?m)^\s*-\s*MM\s*$', '', text, flags=re.I)
    text = re.sub(r'(?<!\w)#[A-Za-z0-9_]+', '', text)
    text = re.sub(r'\bDM Keyword:.*$', '', text, flags=re.I)
    text = re.sub(r'\s+', ' ', text).strip(' `-')
    text = text.replace('Y our ', 'Your ')
    return text

def fragments(text):
    text = clean_text(text)
    text = re.sub(r'\s*[•▪◦]\s*', '. ', text)
    text = re.sub(r'(?<=[.!?])\s+', '\n', text)
    text = re.sub(r'\s+(?=(?:Step\s+\d+|\d+[.)])\s)', '\n', text, flags=re.I)
    return [x.strip(' -:;') for x in text.split('\n') if x.strip(' -:;')]

def normalize_action(s):
    s = re.sub(r'^(?:Direct|Ask|Tell) your AI to\s+', '', s, flags=re.I)
    s = re.sub(r'^(?:Have) your AI\s+', '', s, flags=re.I)
    s = re.sub(r'\s+(?:DM|Comment)\s+\w+.*$', '', s, flags=re.I)
    s = s.strip(' `-')
    if s:
        s = s[0].upper() + s[1:]
    if s and s[-1] not in '.!?': s += '.'
    return s

def get_actions(text):
    fs = fragments(text)
    actions=[]
    cue=False
    for s in fs:
        if PROMO.search(s):
            continue
        explicit = bool(ACTION_START.search(s) or ACTION_CONTAINS.search(s))
        colon_action = re.search(r':\s*((?:pick|spend|start|use|add|build|create|run|test|verify|audit|set|define|measure|automate)\b.*)', s, re.I)
        if colon_action:
            s = colon_action.group(1)
            explicit = True
        if explicit:
            cue=True
        # Once directives start, compact noun-phrase directives usually continue the list.
        continuation = cue and bool(NOUN_DIRECTIVE.search(s))
        if explicit or continuation:
            a=normalize_action(s)
            if len(a.split()) >= 2 and a not in actions:
                actions.append(a)
    return actions

def context_for(text, actions):
    fs=fragments(text)
    picked=[]
    aset={a.rstrip('.!?').lower() for a in actions}
    for s in fs:
        if PROMO.search(s) or ACTION_START.search(s): continue
        if s.rstrip('.!?').lower() in aset: continue
        if len(s.split()) < 3: continue
        picked.append(s)
        if sum(len(x) for x in picked) > 210 or len(picked)==2: break
    c=' '.join(picked).strip()
    return c[:360].rstrip() + ('…' if len(c)>360 else '')

def title_for(text):
    fs=fragments(text)
    s=fs[0] if fs else 'Suggested action'
    s=re.sub(r'^(?:An attacker just|Someone just|Your AI|Your app|You)\s+', '', s, flags=re.I)
    return s[:88].rstrip(' ,.:;') + ('…' if len(s)>88 else '')

def classify(text):
    low=text.lower()
    best=None
    for ai,(area, contexts) in enumerate(AREAS):
        for ci,(ctx,pat) in enumerate(contexts):
            score=len(re.findall(pat,low,re.I))
            if score and (best is None or score>best[0]): best=(score,ai,ci)
    if best is None:
        return ('Business operations, strategy, and economics', 'Strategy, leadership, and operating model')
    return AREAS[best[1]][0], AREAS[best[1]][1][best[2]][0]

rows=[]
for line in SOURCE.read_text().splitlines():
    try: row=json.loads(line)
    except Exception: continue
    if not row.get('id') or not row.get('text'): continue
    rows.append(row)
best={}
for row in rows:
    if row['id'] not in best or len(row['text'])>len(best[row['id']]['text']): best[row['id']]=row
for rid,text in MANUAL.items(): best[rid]={'id':rid,'text':text}

grouped=defaultdict(list)
omitted=[]
seen={}
for rid,row in best.items():
    text=row['text']
    acts=ACTION_OVERRIDES.get(rid, get_actions(text))
    if not acts:
        omitted.append((rid,title_for(text),clean_text(text)))
        continue
    # Merge exact repeated recommendations, retaining all source reels.
    key='|'.join(a.lower() for a in acts)
    if key in seen:
        seen[key]['ids'].append(rid)
        continue
    area,ctx=classify(text+' '+' '.join(acts))
    item={'ids':[rid], 'title':title_for(text), 'context':context_for(text,acts), 'actions':acts}
    seen[key]=item
    grouped[(area,ctx)].append(item)

lines=[]
lines += [
    '# Suggested actions from The Faction Group LLC Facebook videos', '',
    f'- **Source profile:** [{PROFILE}]({PROFILE})',
    '- **Collection date:** 2026-09-22',
    f'- **Coverage:** {len(best)} reels indexed; {sum(len(v) for v in grouped.values())} distinct actionable recommendations extracted after exact-repeat consolidation. {len(omitted)} reels whose public descriptions contain no explicit action were excluded.',
    '- **Method:** Actions come from the reels’ public written descriptions. Each entry keeps the operational context and links back to its source reel. Promotional calls to comment, follow, or send a direct message were excluded.',
    '- **Reading guide:** Numbered entries are distinct recommendations; bullets state the concrete actions. Entries with multiple source links were repeated across reels.', '',
]

area_num=0
entry_total=0
for area, contexts in AREAS:
    area_items=sum((len(grouped.get((area,c),[])) for c,_ in contexts),0)
    if not area_items: continue
    area_num+=1
    lines += [f'## {area_num}. {area}', '']
    ctx_num=0
    for ctx,_ in contexts:
        items=grouped.get((area,ctx),[])
        if not items: continue
        ctx_num+=1
        lines += [f'### {area_num}.{ctx_num}. {ctx}', '']
        for n,item in enumerate(items,1):
            entry_total+=1
            links=', '.join(f'[video {i+1}](https://www.facebook.com/reel/{rid})' for i,rid in enumerate(item['ids']))
            lines += [f'{n}. **{item["title"]}** ({links})']
            if item['context']:
                lines += [f'   - **Context:** {item["context"]}']
            lines += ['   - **Suggested actions:**']
            for a in item['actions']:
                lines += [f'     - {a}']
            lines += ['']

OUTPUT.write_text('\n'.join(lines).rstrip()+'\n')
print(json.dumps({'indexed':len(best),'distinct_action_entries':entry_total,'omitted':len(omitted),'output':str(OUTPUT)},indent=2))
