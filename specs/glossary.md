# Project Glossary

## Adaptive Word Weight

**Definition:** A calculated score that influences how likely a word is to appear in a child's future spelling prompts.

**Context:** Used by the word selection logic to increase repetition for difficult words and reduce repetition for mastered words.

**Example:** If Maya misses `because` twice in one week, the system raises that word's adaptive word weight so it appears again sooner than a mastered word like `cat`.

**Related Terms:** Age Band, Mastery Score, Spelling Session, Word Catalog

## Age Band

**Definition:** A vocabulary grouping aligned to an expected school-age or grade range.

**Context:** Used to bias word selection toward words that are appropriate for a child's age while still allowing some easier review words and some stretch words.

**Example:** A child born in 2018 may primarily receive words from a grade-school beginner age band with occasional easier or harder words.

**Related Terms:** Adaptive Word Weight, Child Profile, Mastery Score, Word Catalog

## Child Profile

**Definition:** A saved player identity for one child, including their birthdate, profile picture, progress, and spelling history.

**Context:** Each child uses a separate profile so the app can personalize words, rewards, and performance tracking independently through the household server.

**Example:** `Luna`, born `2017-04-12`, has her own avatar, level, rank, and recent spelling sessions separate from her sibling.

**Related Terms:** Age Band, Household Server, Profile Picture, Rank, Reward, Spelling Session

## Household Server

**Definition:** The home-hosted backend service and database that store family data for Spelling Wizard.

**Context:** Used to keep child profiles, spelling history, rewards, and word progress shared across devices in the household instead of storing them only in one browser.

**Example:** A child starts a session on an iPad in the kitchen and later sees the same updated level and recent missed words on a laptop because both devices use the same household server.

**Related Terms:** Child Profile, Reward, Spelling Session

## Mastery Score

**Definition:** A per-child, per-word measure of how confidently the child can spell a word based on correctness, number of attempts, and recency.

**Context:** Used to reduce repetition for words the child knows well and increase repetition for words they are still learning.

**Example:** After spelling `friend` correctly on the first try in four recent sessions, a child has a high mastery score for that word.

**Related Terms:** Adaptive Word Weight, Age Band, Spelling Attempt, Word Catalog

## Profile Picture

**Definition:** A child-selected avatar image associated with a child profile.

**Context:** Used on the profile picker and child dashboard to make the app feel personal and fun.

**Example:** A child uploads a smiling dragon image and uses it as their profile picture on the home screen.

**Related Terms:** Child Profile

## Rank

**Definition:** A named progression tier earned every third level to celebrate a child's long-term advancement.

**Context:** Rank provides a bigger milestone than leveling and is tied to a larger reward payout.

**Example:** After reaching level 3, a child advances from `Spark` to `Scroll Keeper` and earns the rank-up reward.

**Related Terms:** Child Profile, Reward

## Reward

**Definition:** A tracked prize earned when a child levels up or reaches a rank milestone.

**Context:** Rewards are used to reinforce progress, including the Robux-based reward system defined for this app.

**Example:** Reaching 100 total points grants a level-up reward of 100 Robux; every third level grants the rank-up reward instead.

**Related Terms:** Child Profile, Rank

## Spelling Attempt

**Definition:** One submitted spelling answer for a prompted word within a session.

**Context:** Each word allows up to three spelling attempts, and the awarded points depend on which attempt was correct.

**Example:** On her second spelling attempt for `purple`, a child types the correct answer and earns 2 points.

**Related Terms:** Mastery Score, Spelling Session

## Spelling Session

**Definition:** A continuous play session in which a child is prompted with words, hears them spoken aloud, and submits spellings.

**Context:** Sessions track prompts, attempts, points earned, and outcomes for history and personalization.

**Example:** A child completes a 15-word spelling session after school and later reviews the missed words from that session.

**Related Terms:** Adaptive Word Weight, Child Profile, Spelling Attempt

## Word Catalog

**Definition:** The structured collection of spelling words and metadata used by the app.

**Context:** The catalog stores each word along with age-band and difficulty metadata so the app can choose suitable prompts.

**Example:** The word catalog stores `elephant` with tags for age suitability, difficulty, and spelling pattern.

**Related Terms:** Adaptive Word Weight, Age Band, Mastery Score
