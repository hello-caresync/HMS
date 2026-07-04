import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const classifications = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "General Medicine",
  "Oncology",
  "Gastroenterology",
  "Pulmonology",
  "Nephrology",
  "Endocrinology",
  "Dermatology",
  "Ophthalmology",
  "ENT",
  "Psychiatry",
  "Rheumatology",
];

const diseases = {
  Cardiology: [
    "Hypertension",
    "Coronary Artery Disease",
    "Atrial Fibrillation",
    "Heart Failure",
    "Angina Pectoris",
    "Cardiomyopathy",
    "Pericarditis",
    "Valvular Heart Disease",
    "Peripheral Artery Disease",
    "Deep Vein Thrombosis",
  ],
  Neurology: [
    "Migraine",
    "Epilepsy",
    "Parkinson Disease",
    "Multiple Sclerosis",
    "Stroke",
    "Alzheimer Disease",
    "Neuropathy",
    "Bell Palsy",
    "Meningitis",
    "Sciatica",
  ],
  Pediatrics: [
    "Neonatal Jaundice",
    "Pediatric Asthma",
    "Kawasaki Disease",
    "Croup",
    "Hand Foot Mouth Disease",
    "Pediatric Diabetes",
    "Growth Hormone Deficiency",
    "Congenital Heart Defect",
    "Pediatric Epilepsy",
    "Failure to Thrive",
  ],
  Orthopedics: [
    "Osteoarthritis",
    "Rheumatoid Arthritis",
    "Anterior Cruciate Ligament Tear",
    "Herniated Disc",
    "Carpal Tunnel Syndrome",
    "Rotator Cuff Injury",
    "Hip Fracture",
    "Scoliosis",
    "Plantar Fasciitis",
    "Tennis Elbow",
  ],
  "General Medicine": [
    "Type 2 Diabetes Mellitus",
    "Viral Fever",
    "Typhoid",
    "Dengue Fever",
    "Malaria",
    "Anemia",
    "Hypothyroidism",
    "Hyperlipidemia",
    "Urinary Tract Infection",
    "Gastroenteritis",
  ],
  Oncology: [
    "Breast Cancer",
    "Lung Cancer",
    "Colorectal Cancer",
    "Prostate Cancer",
    "Leukemia",
    "Lymphoma",
    "Pancreatic Cancer",
    "Ovarian Cancer",
    "Cervical Cancer",
    "Melanoma",
  ],
  Gastroenterology: [
    "Irritable Bowel Syndrome",
    "Crohn Disease",
    "Ulcerative Colitis",
    "Gastroesophageal Reflux Disease",
    "Peptic Ulcer Disease",
    "Hepatitis B",
    "Cirrhosis",
    "Pancreatitis",
    "Celiac Disease",
    "Gallstones",
  ],
  Pulmonology: [
    "Chronic Obstructive Pulmonary Disease",
    "Asthma",
    "Pulmonary Fibrosis",
    "Pneumonia",
    "Tuberculosis",
    "Bronchiectasis",
    "Pulmonary Embolism",
    "Sleep Apnea",
    "Lung Cancer Screening",
    "Pleural Effusion",
  ],
  Nephrology: [
    "Chronic Kidney Disease",
    "Acute Kidney Injury",
    "Nephrotic Syndrome",
    "Polycystic Kidney Disease",
    "Kidney Stones",
    "Glomerulonephritis",
    "Diabetic Nephropathy",
    "Hypertensive Nephropathy",
    "Renal Artery Stenosis",
    "Dialysis Care",
  ],
  Endocrinology: [
    "Type 1 Diabetes Mellitus",
    "Graves Disease",
    "Hashimoto Thyroiditis",
    "Cushing Syndrome",
    "Addison Disease",
    "Polycystic Ovary Syndrome",
    "Osteoporosis",
    "Hyperparathyroidism",
    "Acromegaly",
    "Diabetic Ketoacidosis",
  ],
  Dermatology: [
    "Psoriasis",
    "Eczema",
    "Acne Vulgaris",
    "Melanoma Screening",
    "Vitiligo",
    "Rosacea",
    "Shingles",
    "Cellulitis",
    "Fungal Skin Infection",
    "Contact Dermatitis",
  ],
  Ophthalmology: [
    "Cataract",
    "Glaucoma",
    "Diabetic Retinopathy",
    "Macular Degeneration",
    "Conjunctivitis",
    "Dry Eye Syndrome",
    "Retinal Detachment",
    "Uveitis",
    "Strabismus",
    "Myopia Progression",
  ],
  ENT: [
    "Chronic Sinusitis",
    "Otitis Media",
    "Tonsillitis",
    "Hearing Loss",
    "Vertigo",
    "Nasal Polyps",
    "Laryngitis",
    "Sleep Apnea ENT",
    "Deviated Nasal Septum",
    "Tinnitus",
  ],
  Psychiatry: [
    "Major Depressive Disorder",
    "Generalized Anxiety Disorder",
    "Bipolar Disorder",
    "Schizophrenia",
    "Obsessive Compulsive Disorder",
    "Post Traumatic Stress Disorder",
    "Attention Deficit Hyperactivity Disorder",
    "Panic Disorder",
    "Insomnia Disorder",
    "Alcohol Use Disorder",
  ],
  Rheumatology: [
    "Systemic Lupus Erythematosus",
    "Gout",
    "Ankylosing Spondylitis",
    "Sjogren Syndrome",
    "Vasculitis",
    "Fibromyalgia",
    "Psoriatic Arthritis",
    "Polymyalgia Rheumatica",
    "Scleroderma",
    "Rheumatic Fever",
  ],
};

const districts = [
  ["Bengaluru Urban", 85],
  ["Bengaluru Rural", 18],
  ["Mysuru", 42],
  ["Mangaluru", 38],
  ["Hubballi", 35],
  ["Dharwad", 28],
  ["Belagavi", 32],
  ["Ballari", 24],
  ["Vijayapura", 22],
  ["Shivamogga", 24],
  ["Davanagere", 22],
  ["Tumakuru", 24],
  ["Hassan", 20],
  ["Mandya", 18],
  ["Udupi", 20],
  ["Kalaburagi", 24],
  ["Raichur", 18],
  ["Koppal", 14],
  ["Chitradurga", 16],
  ["Chikkamagaluru", 16],
  ["Kodagu", 14],
  ["Ramanagara", 14],
  ["Chikkaballapur", 12],
  ["Kolar", 14],
  ["Yadgir", 10],
  ["Bidar", 14],
  ["Bagalkot", 14],
  ["Gadag", 10],
  ["Haveri", 12],
  ["Karwar", 12],
  ["Chamarajanagar", 10],
];

const prefixes = [
  "Apollo",
  "Fortis",
  "Manipal",
  "Aster",
  "Narayana",
  "Columbia Asia",
  "KIMS",
  "Sparsh",
  "BGS Global",
  "Sakra",
  "BGS",
  "SDM",
  "Victoria",
  "Bowring",
  "St Johns",
  "M S Ramaiah",
  "Cloudnine",
  "Rainbow",
  "HOSMAT",
  "Indira Gandhi",
  "Jayadeva",
  "NIMHANS",
  "Khushi",
  "Unity",
  "Sankara",
  "Dr Agarwals",
  "Vasan",
  "Lotus",
  "Motherhood",
  "Cauvery",
  "People Tree",
  "Sagar",
  "Trustwell",
  "SNN",
  "Gleneagles",
  "Regal",
  "City",
  "District",
  "Community",
  "Primary",
  "Rural",
  "Super Specialty",
  "Metro",
  "Prime",
  "Elite",
  "Care",
  "Life",
  "Health",
  "Med",
  "Global",
  "Central",
  "Sacred Heart",
  "Holy Family",
  "St Philomena",
  "Basaveshwara",
  "Vijayanagar",
  "Heritage",
  "Royal",
  "Sunrise",
  "Green City",
  "Lakeview",
  "Hilltop",
  "Coastal",
  "Malnad",
  "Deccan",
];

const suffixes = [
  "Hospital",
  "Medical Centre",
  "Super Specialty Hospital",
  "Multi Speciality Hospital",
  "Health City",
  "Institute of Medical Sciences",
  "Care Hospital",
  "Clinic and Diagnostic Centre",
  "Day Care Surgery Centre",
  "Trauma Centre",
  "Women and Children Hospital",
  "Cancer Institute",
  "Heart Institute",
  "Neuro Institute",
  "Orthopaedic Centre",
  "Eye Hospital",
  "ENT Centre",
  "Diabetes Centre",
  "Kidney Care Centre",
  "Pulmonary Centre",
];

let id = 1;
const hospitals = [];

for (const [district, count] of districts) {
  for (let i = 0; i < count; i++) {
    const prefix = prefixes[(id + i) % prefixes.length];
    const suffix = suffixes[(id * 3 + i) % suffixes.length];
    const area = district.split(" ")[0];
    const clsCount = 2 + (id % 4);
    const cls = [];
    for (let c = 0; c < clsCount; c++) {
      cls.push(classifications[(id + c) % classifications.length]);
    }
    const uniqueCls = [...new Set(cls)];
    const dis = [];
    for (const cl of uniqueCls) {
      const list = diseases[cl];
      dis.push(list[(id + dis.length) % list.length]);
      dis.push(list[(id + 1) % list.length]);
    }
    const uniqueDis = [...new Set(dis)];

    hospitals.push({
      id: `KA-HSP-${String(id).padStart(4, "0")}`,
      name: `${prefix} ${suffix} - ${area} Block ${i + 1}, ${district}`,
      district,
      classifications: uniqueCls,
      diseases: uniqueDis,
    });
    id += 1;
  }
}

const outPath = path.join(__dirname, "../app/lib/scheduleCheckInData.ts");

let output = `export const MEDICAL_CLASSIFICATIONS = ${JSON.stringify(classifications, null, 2)} as const;\n\n`;
output += `export type MedicalClassification = (typeof MEDICAL_CLASSIFICATIONS)[number];\n\n`;
output += `export const DISEASE_LOOKUP: Record<MedicalClassification, readonly string[]> = ${JSON.stringify(diseases, null, 2)};\n\n`;
output += `export type KarnatakaHospital = {\n  id: string;\n  name: string;\n  district: string;\n  classifications: MedicalClassification[];\n  diseases: string[];\n};\n\n`;
output += `export const KARNATAKA_HOSPITALS: readonly KarnatakaHospital[] = [\n`;

for (const hospital of hospitals) {
  output += `  { id: ${JSON.stringify(hospital.id)}, name: ${JSON.stringify(hospital.name)}, district: ${JSON.stringify(hospital.district)}, classifications: ${JSON.stringify(hospital.classifications)}, diseases: ${JSON.stringify(hospital.diseases)} },\n`;
}

output += `] as const;\n\n`;
output += `export function filterHospitalsByCriteria(\n  classification: MedicalClassification | '',\n  disease: string,\n): KarnatakaHospital[] {\n  if (disease) {\n    return KARNATAKA_HOSPITALS.filter((hospital) => hospital.diseases.includes(disease));\n  }\n  if (classification) {\n    return KARNATAKA_HOSPITALS.filter((hospital) => hospital.classifications.includes(classification));\n  }\n  return [...KARNATAKA_HOSPITALS];\n}\n`;

fs.writeFileSync(outPath, output);
console.log(`Generated ${hospitals.length} hospitals`);
console.log(`Generated ${Object.values(diseases).flat().length} diseases`);
