export type TriageSpecialty =
  | "General Medicine"
  | "Cardiology"
  | "Neurology"
  | "Pediatrics"
  | "Orthopedics";

export type TriageResult = {
  assessment: string;
  recommendedSpecialty: TriageSpecialty;
  confidence: string;
};

export const TRIAGE_SYSTEM_PROMPT = `You are an AI Clinical Triage Assistant. Analyze the patient's symptom description.

Your task is to output only a valid JSON object with the following structure:
{
"assessment": "Provide a 1-sentence clinical summary of the reported symptoms.",
"recommendedSpecialty": "Choose exactly one from: 'General Medicine', 'Cardiology', 'Neurology', 'Pediatrics', or 'Orthopedics'.",
"confidence": "Provide a percentage score based on symptom clarity."
}

If the symptoms are unclear, default to 'General Medicine'.`;

export function buildTriageUserPrompt(symptoms: string): string {
  return `${TRIAGE_SYSTEM_PROMPT}\n\nPatient Input: ${symptoms.trim()}`;
}

const SPECIALTY_RULES: {
  specialty: TriageSpecialty;
  keywords: string[];
  assessment: string;
}[] = [
  {
    specialty: "Cardiology",
    keywords: [
      "chest pain",
      "chest tightness",
      "heart",
      "palpitation",
      "palpitations",
      "hypertension",
      "blood pressure",
      "shortness of breath",
      "breathless",
      "dyspnea",
      "arm pain",
      "cardiac",
      "angina",
      "irregular heartbeat",
    ],
    assessment:
      "Cardiovascular symptoms such as chest discomfort or exertional breathlessness warrant cardiology evaluation.",
  },
  {
    specialty: "Neurology",
    keywords: [
      "headache",
      "migraine",
      "seizure",
      "numbness",
      "tingling",
      "dizziness",
      "vertigo",
      "stroke",
      "paralysis",
      "tremor",
      "memory loss",
      "confusion",
      "facial droop",
      "weakness on one side",
    ],
    assessment:
      "Neurological features such as headache, dizziness, or focal weakness suggest a neurology review.",
  },
  {
    specialty: "Pediatrics",
    keywords: [
      "child",
      "infant",
      "baby",
      "toddler",
      "newborn",
      "pediatric",
      "years old",
      "year old",
      "month old",
      "vaccination",
      "school-age",
    ],
    assessment:
      "Symptoms reported in a pediatric context are best evaluated by a pediatrics specialist.",
  },
  {
    specialty: "Orthopedics",
    keywords: [
      "joint pain",
      "knee pain",
      "ankle",
      "fracture",
      "sprain",
      "back pain",
      "bone",
      "shoulder pain",
      "hip pain",
      "wrist",
      "fall",
      "injury",
      "swelling",
      "unable to walk",
      "bear weight",
      "stiffness",
      "arthritis",
    ],
    assessment:
      "Musculoskeletal pain or post-injury symptoms indicate an orthopedics assessment.",
  },
];

function mentionsPediatricAge(normalized: string): boolean {
  const ageMatch = normalized.match(/(\d{1,2})\s*(year|yr|month|mo)\s*old/);
  if (!ageMatch) {
    return false;
  }

  const value = Number(ageMatch[1]);
  const unit = ageMatch[2];

  if (unit.startsWith("month") || unit === "mo") {
    return value <= 216;
  }

  return value <= 17;
}

export function triageSymptoms(symptoms: string): TriageResult {
  const trimmed = symptoms.trim();

  if (!trimmed) {
    return {
      assessment:
        "No symptom details were provided; a general medicine consultation is recommended for initial evaluation.",
      recommendedSpecialty: "General Medicine",
      confidence: "40%",
    };
  }

  const normalized = trimmed.toLowerCase();
  let bestMatch: { specialty: TriageSpecialty; score: number; assessment: string } | null =
    null;

  for (const rule of SPECIALTY_RULES) {
    const matchedKeywords = rule.keywords.filter((keyword) =>
      normalized.includes(keyword),
    );
    const score = matchedKeywords.length;

    if (score === 0) {
      continue;
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        specialty: rule.specialty,
        score,
        assessment: rule.assessment,
      };
    }
  }

  if (mentionsPediatricAge(normalized)) {
    return {
      assessment:
        "Symptoms in a young patient suggest pediatric care for age-appropriate evaluation.",
      recommendedSpecialty: "Pediatrics",
      confidence: bestMatch ? "86%" : "78%",
    };
  }

  if (!bestMatch) {
    return {
      assessment:
        "Non-specific symptoms were reported; general medicine is appropriate for initial triage and workup.",
      recommendedSpecialty: "General Medicine",
      confidence: "55%",
    };
  }

  const confidence =
    bestMatch.score >= 3 ? "92%" : bestMatch.score === 2 ? "84%" : "72%";

  return {
    assessment: bestMatch.assessment,
    recommendedSpecialty: bestMatch.specialty,
    confidence,
  };
}
