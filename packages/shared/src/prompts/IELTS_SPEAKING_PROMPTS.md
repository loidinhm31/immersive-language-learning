# IELTS Speaking Prompts Documentation

Documentation for all system prompts and assessment tooling used in the Immersive Language Learning app's IELTS Speaking practice feature.

---

## 1. Overview: IELTS Speaking Test Structure

The IELTS Speaking test is an 11-14 minute face-to-face assessment conducted by a trained examiner. It has three parts:

| Part | Name | Duration | Format |
|------|------|----------|--------|
| 1 | Interview | 4-5 min | Examiner asks questions about familiar topics |
| 2 | Individual Long Turn | 3-4 min | Candidate speaks for 1-2 min on a given topic (with 1 min preparation) |
| 3 | Two-Way Discussion | 4-5 min | Examiner asks more abstract questions related to Part 2's topic |

In the app, each part is implemented as a separate page connected to the Gemini Live API for real-time voice conversation.

---

## 2. Assessment Criteria

All three parts are assessed using the **same four criteria**, each scored on a band scale of 0-9:

### Fluency and Coherence (FC)
Ability to talk with normal levels of continuity, rate, and effort; linking ideas together to form coherent speech.

**Key indicators:**
- Speech rate and continuity (absence of false starts, backtracking, functionless repetitions, word-searching pauses)
- Logical sequencing of ideas
- Clear marking of stages with discourse markers and fillers
- Relevance to the topic
- Use of cohesive devices (connectors, pronouns, conjunctions)

### Lexical Resource (LR)
Range of vocabulary, precision of meanings expressed, and ability to paraphrase.

**Key indicators:**
- Variety of words used
- Adequacy and appropriacy of word choice (referential meaning, style, collocation, attitude)
- Ability to paraphrase when lacking a specific word

### Grammatical Range and Accuracy (GRA)
Accurate and appropriate use of syntactic forms and range of grammatical resources.

**Key indicators of range:** sentence length, subordinate clauses, verb phrase complexity (aspect, modality, passive), pre/post-modification, sentence structure variety.

**Key indicators of accuracy:** error density, communicative effect of errors.

### Pronunciation (P)
Accurate and sustained use of phonological features to convey meaningful messages.

**Key indicators:**
- Chunking within sentences
- Rhythm, stress-timing, linking, elision
- Emphatic and contrastive stress and intonation
- Word and phoneme production
- Overall accent effect on intelligibility

---

## 3. Band Descriptors Summary

| Band | Label | FC | LR | GRA | P |
|------|-------|----|----|-----|---|
| **9** | Expert | Fluent, only rare content-related hesitation. Fully coherent and appropriate. | Total flexibility, precise use. Sustained accurate & idiomatic language. | Precise and accurate at all times (apart from native-like 'mistakes'). | Full range of phonological features. Effortlessly understood. |
| **8** | Very Good | Fluent, occasional repetition/self-correction. Coherent and relevant. | Wide resource, readily flexible. Skilful use of less common/idiomatic items. | Wide range, flexibly used. Majority error-free. | Wide range of features. Easily understood throughout. |
| **7** | Good | Long turns without noticeable effort. Some hesitation mid-sentence. Flexible discourse markers. | Flexible discussion of variety of topics. Some less common/idiomatic items. | Range of structures flexibly used. Error-free sentences frequent. | Displays features of band 6 and some of band 8. |
| **6** | Competent | Willingness to produce long turns. Coherence lost at times. Range of discourse markers. | Sufficient for lengthy discussion. May be inappropriate but meaning clear. | Mix of short/complex forms. Errors in complex structures rarely impede communication. | Variable control. Generally understood without much effort. |
| **5** | Modest | Can keep going but relies on repetition/self-correction/slow speech. | Sufficient for familiar/unfamiliar topics but limited flexibility. | Basic forms fairly well controlled. Complex structures attempted but limited. | Displays features of band 4 and some of band 6. |
| **4** | Limited | Noticeable pauses. Slow with frequent repetition. Simple sentence linking. | Basic meaning only on unfamiliar topics. Frequent errors in word choice. | Basic forms and short utterances. Turns short, structures repetitive. | Limited range. Understanding requires some effort. |
| **3** | Extremely Limited | Frequent long pauses. Limited linking. Cannot convey basic message. | Limited to simple vocabulary for personal information. | Basic forms attempted but numerous errors. | Some features of band 2 and some of band 4. |
| **2** | Intermittent | Lengthy pauses before nearly every word. | Very limited. Isolated words or memorised utterances. | No evidence of basic sentence forms. | Few acceptable features. Often unintelligible. |
| **1** | Non-user | Totally incoherent. | No resource bar isolated words. | No rateable language unless memorised. | Occasional recognisable words/phonemes. Unintelligible. |

---

## 4. Part 1 Prompt: Interview

**File:** `packages/shared/src/prompts/ielts.ts` > `buildIeltsPart1Prompt(topic, fromLanguage)`

**Parameters:**
- `topic` (string): The primary topic area (e.g., "Work & Studies", "Hometown")
- `fromLanguage` (string): Candidate's first language

**Session duration:** 300 seconds (5 min)

### Prompt Design

The Part 1 prompt instructs the AI examiner to follow the standard IELTS Part 1 protocol:

1. **Introduction (30 seconds):** Introduce as examiner, ask candidate's name
2. **Topic Questions (3.5-4 minutes):** Ask questions about 2-3 familiar topic areas
   - Start with simple, factual questions
   - Progress to opinion-based questions
   - 3-4 questions per topic area
   - Natural transition to secondary topics if time allows
3. **Question Style:**
   - Clear, direct questions with natural follow-ups
   - No correction, vocabulary help, or performance feedback
   - Prompt for elaboration on short answers
   - Gentle redirection if off-topic

### Design Choices

- The prompt explicitly forbids teaching or correcting during the test (matching real IELTS examiner behavior)
- Secondary topic areas are suggested (daily routine, hometown, work/studies, hobbies) so the AI doesn't run out of questions
- Time management is specified: ~4-5 minutes before calling the assessment tool
- Professional but friendly tone is specified to match the real test experience

---

## 5. Part 2 Prompt: Individual Long Turn

**File:** `packages/shared/src/prompts/ielts.ts` > `buildIeltsPart2Prompt(cueCard, fromLanguage)`

**Parameters:**
- `cueCard` (IeltsCueCard): Contains `topic`, `bulletPoints[]`, and `followUp`
- `fromLanguage` (string): Candidate's first language

**Session duration:** 240 seconds (4 min for speaking + follow-up)

### Unique Client-Side Flow

Part 2 has a unique 3-phase UI flow managed client-side:

1. **Cue Card Display** (pre-session): Full-screen cue card shown to candidate
2. **Preparation** (60 seconds): Local countdown timer, no Gemini connection
3. **Speaking + Follow-up** (Gemini session): AI examiner conducts the assessment

The preparation phase is handled entirely client-side. The AI prompt is informed that "THE CANDIDATE HAS JUST COMPLETED 1 MINUTE OF PREPARATION TIME."

### Prompt Design

1. **Begin Speaking:** Tell candidate preparation time is up, read topic aloud, invite them to begin
2. **Candidate's Long Turn (1-2 min):**
   - Do NOT interrupt the monologue
   - Prompt if they stop before 1 minute
   - Signal stop at approximately 2 minutes
3. **Rounding-off Questions (30 sec):** 1-2 brief follow-up questions

### Part 2 Specific Assessment Focus

The prompt adds specific assessment guidance beyond the standard criteria:
- Ability to organize and sustain a long turn (not just short answers)
- Use of discourse markers to structure the monologue
- Topic development with relevant detail and examples
- Ability to address all bullet points on the task card
- Coherent linking between parts of the response

### Design Choices

- The cue card is formatted with clear visual separation in the prompt
- The examiner is told to allow natural pauses and not rush
- Time boundaries are explicit: minimum 1 min, maximum 2 min for the monologue
- Rounding-off questions are kept simple (not extended) per IELTS protocol

---

## 6. Part 3 Prompt: Two-Way Discussion

**File:** `packages/shared/src/prompts/ielts.ts` > `buildIeltsPart3Prompt(topic, fromLanguage)`

**Parameters:**
- `topic` (string): Abstract discussion theme (e.g., "Education & Learning", "Technology & Society")
- `fromLanguage` (string): Candidate's first language

**Session duration:** 300 seconds (5 min)

### Prompt Design

1. **Introduction:** Transition naturally into the discussion
2. **Discussion Questions (4-5 min):** 4-6 questions building in complexity

### Question Type Taxonomy

The prompt specifies six question types to ensure variety:

| Type | Example Pattern |
|------|----------------|
| Analysis | "Why do you think...?", "What are the reasons for...?" |
| Comparison | "How does X compare to Y?", "What are the differences between...?" |
| Speculation | "What might happen if...?", "How do you think X will change in the future?" |
| Evaluation | "To what extent do you agree that...?", "What are the advantages and disadvantages of...?" |
| Hypothetical | "If you could change one thing about X, what would it be?" |
| Opinion | "Some people believe that... What is your view?" |

### Part 3 Specific Assessment Focus

- Ability to express and justify opinions on abstract topics
- Use of speculative and hypothetical language (would, could, might, if)
- Discussing topics at an abstract level (beyond personal experience)
- Range and flexibility of language for complex ideas
- Logical development and coherence of arguments
- Considering multiple perspectives

### Design Choices

- The prompt explicitly rejects yes/no answers, requiring the AI to follow up with "Why?" or "Can you elaborate?"
- Questions should build in complexity throughout the discussion
- If a candidate struggles, the examiner can rephrase but not simplify the cognitive demand
- The tone is that of an intellectual conversation, not an interrogation

---

## 7. Assessment Tool Schema

All three parts use the same function-calling tool: `complete_ielts_assessment`

**File:** `packages/ui/src/components/pages/IeltsChatPage.tsx` > `buildIeltsAssessmentTool()`

```typescript
{
  name: "complete_ielts_assessment",
  description: "Call this tool when the IELTS Speaking assessment is complete. Provide detailed band scores and feedback for each criterion based on the official IELTS band descriptors.",
  parameters: {
    type: "OBJECT",
    properties: {
      // Per-criterion scoring (4 criteria x 2 fields each)
      fluency_and_coherence_band:     { type: "NUMBER", description: "Band score 0-9" },
      fluency_and_coherence_comment:  { type: "STRING", description: "Detailed comment with specific examples" },
      lexical_resource_band:          { type: "NUMBER", description: "Band score 0-9" },
      lexical_resource_comment:       { type: "STRING", description: "Detailed comment with specific examples" },
      grammatical_range_and_accuracy_band:    { type: "NUMBER", description: "Band score 0-9" },
      grammatical_range_and_accuracy_comment: { type: "STRING", description: "Detailed comment with specific examples" },
      pronunciation_band:             { type: "NUMBER", description: "Band score 0-9" },
      pronunciation_comment:          { type: "STRING", description: "Detailed comment with specific examples" },

      // Overall assessment
      overall_comments: {
        type: "ARRAY", items: { type: "STRING" },
        description: "2-3 general observations about overall ability"
      },

      // Detailed feedback
      grammar_corrections: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            user_said:   { type: "STRING", description: "What the candidate said" },
            issue:       { type: "STRING", description: "The grammar/vocabulary issue" },
            correction:  { type: "STRING", description: "The correct form" }
          },
          required: ["user_said", "issue", "correction"]
        },
        description: "Notable grammar and vocabulary errors"
      },
      pronunciation_notes: {
        type: "ARRAY", items: { type: "STRING" },
        description: "Specific pronunciation issues (word stress, intonation, sounds)"
      },
      topics_covered: {
        type: "ARRAY", items: { type: "STRING" },
        description: "Topic areas covered during the assessment"
      }
    },
    required: [
      "fluency_and_coherence_band", "fluency_and_coherence_comment",
      "lexical_resource_band", "lexical_resource_comment",
      "grammatical_range_and_accuracy_band", "grammatical_range_and_accuracy_comment",
      "pronunciation_band", "pronunciation_comment",
      "overall_comments", "topics_covered"
    ]
  }
}
```

### Band Score Processing

Band scores returned by the AI are clamped to the valid range [0, 9] using `clampBand()`. The overall band is computed client-side as the average of the 4 criteria, rounded to the nearest 0.5 (matching official IELTS rules).

```typescript
function clampBand(v: number): number {
    return Math.max(0, Math.min(9, Math.round(v * 2) / 2));
}

function calculateOverallBand(scores): number {
    const avg = (FC + LR + GRA + P) / 4;
    return Math.round(avg * 2) / 2;
}
```

---

## 8. Scoring Notes & Calibration

These notes are appended to every prompt to ensure consistent, realistic scoring:

- A candidate must **fully fit** the positive features of the descriptor at a particular level
- Most candidates score between **4-7**. Only give 8-9 for truly exceptional speakers
- Include **specific examples** from the conversation in comments for each criterion
- The overall band is the **average of 4 criteria**, rounded to nearest 0.5
- The AI must act as a professional IELTS examiner: **do NOT teach, correct, or help** during the test

### Part-Specific Scoring Guidance

| Part | Additional Focus Areas |
|------|----------------------|
| Part 1 | Ability to answer familiar topic questions with appropriate detail; natural conversation flow |
| Part 2 | Sustained monologue organization; discourse markers for structuring; addressing all cue card bullet points; topic development with relevant detail |
| Part 3 | Abstract reasoning; expressing and justifying opinions; speculative/hypothetical language; logical argument development; considering multiple perspectives |

---

## 9. Shared Constants

### Predefined Topics & Cue Cards

**File:** `packages/shared/src/types/ielts.ts`

| Constant | Count | Usage |
|----------|-------|-------|
| `IELTS_PART1_TOPICS` | 20 | Familiar topic chips for Part 1 setup (Work & Studies, Hometown, Family, etc.) |
| `IELTS_PART2_CUE_CARDS` | 15 | Predefined cue cards for Part 2 (Describe a book, a place, a person, etc.) |
| `IELTS_PART3_TOPICS` | 18 | Abstract discussion themes for Part 3 (Education, Technology & Society, Environment, etc.) |

### Band Labels

| Band | Label |
|------|-------|
| 9 | Expert |
| 8 | Very Good |
| 7 | Good |
| 6 | Competent |
| 5 | Modest |
| 4 | Limited |
| 3 | Extremely Limited |
| 2 | Intermittent |
| 1 | Non-user |
| 0 | Did not attempt |

---

## 10. References

- [IELTS Speaking Band Descriptors (Public Version)](https://www.ielts.org/for-researchers/test-statistics/band-score-descriptors)
- IELTS Speaking Key Assessment Criteria (internal reference PDF)
- Cambridge IELTS Practice Tests (for cue card and topic examples)
