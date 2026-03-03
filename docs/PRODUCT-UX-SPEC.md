# FEELREAL — Product & UX Specification for AI Agent

## Product Vision

FeelReal is a personality-centric social network focused on identity, presence, and connection rather than content feeds.

The core idea:
Users express who they are, what they feel, and what they are doing right now.  
Profiles are living identity spaces, not static pages.

The experience should feel:
- personal
- expressive
- alive
- customizable
- emotionally engaging
- modern and premium

NOT information-dense.  
NOT corporate.  
NOT minimalistic-boring.

---

## Core UX Model (Very Important)

The entire app must follow this mental model:

1. **Profile** → who you are  
2. **Now** → what you are doing  
3. **Feed** → what people share  
4. **Discover** → who/what fits you  
5. **Chats** → conversations  

These are the 5 main tabs of the product.

**Do NOT merge them.**  
**Do NOT mix responsibilities.**

---

## Navigation Structure

Bottom navigation bar contains:

- **Feed**
- **Now**
- **Create**
- **Chats**
- **Discover**

**Profile** is accessed via **avatar button in the top-right corner** globally.

Rationale:
- Profile is personal space → accessed via identity (avatar).
- Chats need dedicated tab → strong social loop.
- Feed stays central.
- Create stays central.
- Discover stays separate.

---

## Profile (Identity Space)

Profile is a **modular identity canvas**.  
Users can customize and arrange blocks.

Profile contains:
- avatar
- name
- status
- vibe / personality
- active now indicators
- custom blocks

Blocks can include:
- Music
- Games
- Interests
- Bio
- Links
- Photos
- Favorites
- Quotes
- Stats
- Mood
- Custom text

Blocks are **large, visual, rounded cards**.  
Grid layout. Reorderable. Optional. Not dense lists.

Profile must feel: **expressive, aesthetic, unique.**

NOT LinkedIn. NOT Facebook. NOT text-heavy.

---

## Now (Live Presence)

Now shows **real-time activity**:
- listening music
- playing game
- mood
- status
- online
- activity timeline

This is **dynamic identity**.

- **Profile** = static identity  
- **Now** = live identity  

Important: **keep separate.**

---

## Feed

Feed shows:
- friend posts
- activity events
- profile updates
- AI-suggested people/posts

Cards **large and visual**. No dense text streams.

Feed prioritizes: **people > content.**

---

## Discover

Discover is **recommendation space**.

Contains:
- similar people
- compatible personalities
- suggested friends
- new profiles
- trends

AI relevance allowed here.

**Do NOT place Discover inside Feed.**

---

## Chats (Very Important)

Chats is a **full tab** like Telegram/Instagram DMs.

Contains:
- conversations list
- search
- online indicators
- typing state
- unread badges

Chat screen:
- messages
- media
- profile preview
- activity preview
- quick reactions

Chats must feel: **fast, private, social, alive.**

Chats are core retention loop.

---

## AI Integration

AI should **NOT dominate UI**.  
AI should **assist identity**.

AI functions:
1. Personality summary
2. Vibe description
3. Profile suggestions
4. Compatibility scoring
5. Bio generation
6. Interests inference
7. Visual theme suggestions

**AI entry points:**
- glowing AI button on **Feed** header  
  **OR**
- glowing AI button on **Profile** header  

**NOT both.**

AI button should be: **iridescent, animated, eye-catching, premium.**

---

## Visual Design System

Style:
- soft glass
- gradients
- depth
- glow accents
- rounded cards
- airy spacing
- large elements

Avoid:
- dense lists
- thin text
- tight spacing
- small tap targets
- monochrome flat

Cards:
- large radius
- shadow or glow
- subtle gradient
- comfortable padding

Typography:
- modern sans
- clear hierarchy
- large headers
- readable body

Spacing: **generous, breathing, calm.**

---

## Interaction Principles

1. One purpose per screen.
2. Large touch targets.
3. Identity first.
4. Visual hierarchy obvious.
5. Motion subtle but present.

---

## Layout Rules

- Never place too many small items.
- Prefer fewer large cards.
- Scrolling should feel natural.
- No hidden dense menus.

---

## What NOT to Do

- Do NOT merge Profile and Now.
- Do NOT put Chats inside Profile.
- Do NOT overload Feed with widgets.
- Do NOT create tiny UI elements.
- Do NOT create settings-like screens.
- Do NOT use table layouts.
- Do NOT create enterprise UI.

---

## Priorities for Implementation

### Phase 1
- navigation skeleton
- Feed
- Profile blocks
- Chats basic
- Now activity
- avatar access

### Phase 2
- block editor
- AI personality
- Discover
- live activity

### Phase 3
- compatibility
- themes
- profile sharing
- advanced chat

---

## Product Feel

FeelReal should feel like: **a living identity space**, not a content platform.

Users should feel: *“This is me.”*

---

## Final Rule

If unsure where something belongs:

| Belongs to | Place in    |
|-----------|-------------|
| identity  | Profile     |
| live state| Now         |
| people content | Feed   |
| recommendations | Discover |
| conversation | Chats   |

**Never break this mapping.**
