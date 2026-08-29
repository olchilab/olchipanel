# OlchiPanel — Build-in-Public 자산 초안

작성: 2026-07-29 · 오너: `Master_D_Fable` · 상태: **초안 — 발행은 Mark(외부 게시=L5)** · 포지셔닝: 독학으로 AI 에이전트를 지휘해 실제 도구를 만드는 빌더 / 강점: 외부 API·키 없이 본인 모델 구독 안에서 작동

> **고지 규율(락 준수)**: "API 키·종량제 요금 없음" 주장에는 최소 한 번 **"본인 구독 사용 한도는 함께 소비되고, 한도·요금은 각 모델 정책을 따름"**을 같은 화면에 붙인다. 금지 문구 = 비용 0·무제한·완전무료·외부통신 없음. 글자수 제한으로 짧은 bio엔 고지를 다 못 넣으면, 전체 고지는 README·랜딩에 둔다(짧은 주장→상세 고지로 연결).

---

## A. 포지셔닝 앵커 (모든 자산의 기준)

- **한 줄(KR)**: 독학으로 AI 에이전트를 지휘해 실제 도구를 만드는 빌더 — 그 과정을 공개합니다.
- **한 줄(EN)**: Self-taught builder shipping real tools by directing AI agents. Building in public.
- **왜 이 포지션**: "정규 훈련 개발자" 잣대를 우회(빌더=출시가 자격), AI 오케스트레이션이라는 차별점을 살리고, "독학+AI로 짓기"라는 큰 청중을 부른다. 개발자 직위는 결과로 따라온다.

---

## B. GitHub 프로필 bio (짧게 — 약 160자)

**EN**
> Self-taught builder directing AI agents to ship real tools. Making OlchiPanel — a local panel that watches what AI does on your machine, running inside your own ChatGPT/Claude subscription (no API key). Building in public.

**KR**
> 독학 빌더. AI 에이전트를 지휘해 실제 도구를 만듭니다. OlchiPanel 제작 — AI가 내 컴퓨터에서 뭘 하는지 보여주는 로컬 패널, 내 ChatGPT/Claude 구독 안에서 작동(API 키 없이). #buildinpublic

*(bio는 짧아 고지 생략 — 프로필 고정 링크를 README/랜딩으로.)*

---

## C. olchipanel README 상단 블러브 (제품 얼굴)

> **OlchiPanel** — AI 에이전트가 당신 컴퓨터에서 무슨 일을 하는지 실시간으로 보여주는 로컬 상황판.
> **설치 부담도, API 키도, 쓸 때마다 쌓이는 요금도 없이** — 이미 쓰는 ChatGPT·Claude 구독 안에서 작동합니다.
>
> *지원되는 본인 구독의 사용 한도는 함께 소비되며, 한도·요금·초기화 주기는 각 모델 제품 정책을 따릅니다.*

**EN**
> **OlchiPanel** — a local situation board that shows, in real time, what AI agents are doing on your computer.
> **No API key, no per-use metered billing** — it runs inside the ChatGPT/Claude subscription you already have.
>
> *Your own subscription's usage limits are consumed; limits, pricing, and reset cadence follow each model provider's policy.*

---

## D. 첫 게시물 초안 (build-in-public — 팔지 말고 보여줘라)

> 원칙: 광고가 아니라 **여정·구체·정직**. 리드는 진짜 후크, 화면(패널 스크린샷/짧은 GIF) 1장 필수. 과장·별점 구걸 금지.

### D-1. 자기소개형 (X/Twitter, EN) — "누구이고 뭘 짓나"
> I'm not a formally-trained developer. I build software by directing AI agents — and I ship.
>
> Latest: **OlchiPanel**, a local panel that shows what the AI is actually doing on your machine, so you can watch and trust it.
>
> The part I like most: no API key, no metered bill. It runs inside the ChatGPT/Claude subscription you already pay for.
>
> Building in public 👇 [스크린샷/GIF]

### D-2. 강점 후크형 (X/Twitter, EN) — "왜 다른가"
> Most "AI that does things on your PC" apps demand an API key + a metered bill you can't predict.
>
> OlchiPanel doesn't. It logs into the ChatGPT/Claude subscription you already have and works inside that.
>
> (Your subscription's usage limits are consumed — limits/pricing follow the model's own policy.)
>
> Watch it work, in real time: [GIF]

### D-3. 국내형 (긱뉴스/velog 스타일, KR) — "Show: 만든 것 공개"
> **[Show] 내 구독 안에서 도는 로컬 AI 작업 패널 — OlchiPanel**
>
> 저는 정규로 개발을 배운 사람이 아니라, AI 에이전트를 지휘해서 실제 도구를 만드는 빌더입니다. 그 과정을 공개하고 있어요.
>
> OlchiPanel은 AI 에이전트가 내 컴퓨터에서 지금 뭘 하는지 실시간으로 보여주는 로컬 상황판입니다. 핵심은 **API 키를 만들 필요도, 작업마다 요금이 쌓이지도 않는다**는 점 — 이미 쓰는 ChatGPT·Claude 구독으로 로그인해 그 안에서 작동합니다. (본인 구독 사용 한도는 함께 소비되고, 한도·요금은 각 모델 정책을 따릅니다.)
>
> 오픈소스(AGPL-3.0)로 공개 중이고, 피드백 환영합니다. [링크·스크린샷]

---

## E. 발행 운영 메모 (Mark용)

- **어디**: 개발자 평판=X(주력)·GitHub 프로필. 국내=긱뉴스·velog. 큰 한 방=Hacker News "Show HN"(제품이 매끄러워진 뒤).
- **무엇을**: 완성품만 말고 **과정**(오늘 뭘 정했다·뭘 버렸다·숫자)을 꾸준히. 그게 청중을 만든다.
- **정체성**: 개발자인 척 X. "독학+AI로 짓는 빌더"를 당당히. 첫 CS 질문에 들통날 게 없어 오히려 안전.
- **자산**: 게시마다 패널 스크린샷/GIF 1장. 텍스트만은 약하다.
- **고지**: "키·요금 없음" 말할 때 상세 고지는 README/랜딩으로 링크. 금지 문구 사용 금지.

## 다음
Mark 승인 시: (1) README 상단 블러브 C를 실제 README에 적용(현재 dev, 릴리스=Mark) (2) bio·첫 글은 Mark가 발행. 필요하면 스크린샷/GIF 캡처는 제가 준비.
