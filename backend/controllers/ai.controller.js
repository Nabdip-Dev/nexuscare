// ai.controller.js - Rule-based AI features (no external API required)

const SYMPTOM_CONDITIONS = {
  fever: ['Flu', 'COVID-19', 'Malaria', 'Typhoid', 'Common Cold'],
  cough: ['Bronchitis', 'Pneumonia', 'COVID-19', 'Asthma', 'Common Cold'],
  'chest pain': ['Angina', 'Heart Attack', 'Costochondritis', 'GERD', 'Pleuritis'],
  headache: ['Migraine', 'Tension Headache', 'Hypertension', 'Sinusitis', 'Dehydration'],
  fatigue: ['Anemia', 'Diabetes', 'Hypothyroidism', 'Depression', 'Chronic Fatigue Syndrome'],
  'shortness of breath': ['Asthma', 'COPD', 'Heart Failure', 'Pulmonary Embolism', 'Anxiety'],
  nausea: ['Gastritis', 'Food Poisoning', 'Pregnancy', 'Migraine', 'Appendicitis'],
  dizziness: ['Vertigo', 'Hypertension', 'Anemia', 'Inner Ear Infection', 'Dehydration'],
  'sore throat': ['Pharyngitis', 'Tonsillitis', 'Strep Throat', 'Common Cold', 'Flu'],
  'abdominal pain': ['Appendicitis', 'Gastritis', 'IBS', 'UTI', 'Gallstones'],
  rash: ['Eczema', 'Allergic Reaction', 'Chickenpox', 'Psoriasis', 'Contact Dermatitis'],
  'joint pain': ['Arthritis', 'Gout', 'Lupus', 'Bursitis', 'Lyme Disease'],
  'back pain': ['Muscle Strain', 'Herniated Disc', 'Sciatica', 'Kidney Stones', 'Spondylosis'],
  swelling: ['Edema', 'Lymphedema', 'Deep Vein Thrombosis', 'Cellulitis', 'Allergic Reaction'],
  'frequent urination': ['Diabetes', 'UTI', 'Overactive Bladder', 'Prostate Issues', 'Pregnancy']
};

const SEVERITY_INDICATORS = {
  emergency: ['chest pain', 'shortness of breath', 'severe headache', 'loss of consciousness', 'stroke symptoms'],
  high: ['fever', 'chest pain', 'abdominal pain', 'swelling'],
  medium: ['cough', 'nausea', 'dizziness', 'joint pain', 'back pain'],
  low: ['headache', 'fatigue', 'sore throat', 'rash', 'frequent urination']
};

const getSeverity = (symptoms) => {
  const lowerSymptoms = symptoms.map(s => s.toLowerCase());
  if (lowerSymptoms.some(s => SEVERITY_INDICATORS.emergency.some(e => s.includes(e)))) return 'emergency';
  if (lowerSymptoms.some(s => SEVERITY_INDICATORS.high.some(e => s.includes(e)))) return 'high';
  if (lowerSymptoms.some(s => SEVERITY_INDICATORS.medium.some(e => s.includes(e)))) return 'medium';
  return 'low';
};

// Symptom Checker
exports.checkSymptoms = async (req, res, next) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ success: false, message: 'Symptoms array is required.' });
    }

    const conditionScores = {};
    const matchedSymptoms = [];

    symptoms.forEach(symptom => {
      const lower = symptom.toLowerCase().trim();
      Object.entries(SYMPTOM_CONDITIONS).forEach(([key, conditions]) => {
        if (lower.includes(key) || key.includes(lower)) {
          matchedSymptoms.push(key);
          conditions.forEach(condition => {
            conditionScores[condition] = (conditionScores[condition] || 0) + 1;
          });
        }
      });
    });

    const sorted = Object.entries(conditionScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([condition, score]) => ({
        condition,
        probability: Math.min(Math.round((score / symptoms.length) * 100), 85),
        description: getConditionDescription(condition)
      }));

    const severity = getSeverity(symptoms);
    const recommendations = getRecommendations(severity, matchedSymptoms);

    res.json({
      success: true,
      data: {
        possibleConditions: sorted,
        severity,
        recommendations,
        disclaimer: 'This is an AI-assisted analysis for informational purposes only. Please consult a qualified doctor for proper diagnosis and treatment.',
        shouldSeekEmergency: severity === 'emergency'
      }
    });
  } catch (error) { next(error); }
};

// Health Risk Analysis
exports.analyzeHealthRisk = async (req, res, next) => {
  try {
    const { age, weight, height, bloodPressure, bloodSugar, cholesterol, smokingStatus, exerciseFrequency, familyHistory } = req.body;

    let riskScore = 0;
    const riskFactors = [];
    const recommendations = [];

    // BMI calculation
    if (weight && height) {
      const bmi = weight / ((height / 100) ** 2);
      if (bmi > 30) { riskScore += 25; riskFactors.push({ factor: 'Obesity', severity: 'high', value: `BMI: ${bmi.toFixed(1)}` }); recommendations.push('Aim for a healthy BMI through diet and exercise.'); }
      else if (bmi > 25) { riskScore += 10; riskFactors.push({ factor: 'Overweight', severity: 'medium', value: `BMI: ${bmi.toFixed(1)}` }); recommendations.push('Consider weight management strategies.'); }
    }

    // Age risk
    if (age > 60) { riskScore += 20; riskFactors.push({ factor: 'Age', severity: 'medium', value: `${age} years` }); recommendations.push('Regular health screenings are crucial at your age.'); }
    else if (age > 40) { riskScore += 10; riskFactors.push({ factor: 'Age', severity: 'low', value: `${age} years` }); }

    // Blood pressure
    if (bloodPressure) {
      const [sys, dia] = bloodPressure.split('/').map(Number);
      if (sys > 140 || dia > 90) { riskScore += 20; riskFactors.push({ factor: 'High Blood Pressure', severity: 'high', value: bloodPressure }); recommendations.push('Monitor and manage blood pressure with medication and lifestyle changes.'); }
    }

    // Blood sugar
    if (bloodSugar > 126) { riskScore += 25; riskFactors.push({ factor: 'Elevated Blood Sugar', severity: 'high', value: `${bloodSugar} mg/dL` }); recommendations.push('Consult an endocrinologist for diabetes management.'); }
    else if (bloodSugar > 100) { riskScore += 10; riskFactors.push({ factor: 'Pre-diabetic Range', severity: 'medium', value: `${bloodSugar} mg/dL` }); }

    // Smoking
    if (smokingStatus === 'current') { riskScore += 30; riskFactors.push({ factor: 'Smoking', severity: 'high', value: 'Current smoker' }); recommendations.push('Quit smoking immediately. Seek cessation support.'); }

    // Exercise
    if (exerciseFrequency === 'never') { riskScore += 15; riskFactors.push({ factor: 'Sedentary Lifestyle', severity: 'medium', value: 'No exercise' }); recommendations.push('Aim for at least 150 minutes of moderate exercise weekly.'); }

    // Family history
    if (familyHistory?.includes('heart_disease')) { riskScore += 15; riskFactors.push({ factor: 'Family History: Heart Disease', severity: 'high', value: 'Genetic risk' }); }
    if (familyHistory?.includes('diabetes')) { riskScore += 10; riskFactors.push({ factor: 'Family History: Diabetes', severity: 'medium', value: 'Genetic risk' }); }

    const cappedScore = Math.min(riskScore, 100);
    const riskLevel = cappedScore >= 70 ? 'high' : cappedScore >= 40 ? 'medium' : 'low';

    if (recommendations.length === 0) recommendations.push('Maintain your healthy lifestyle. Schedule regular check-ups.');

    res.json({
      success: true,
      data: {
        riskScore: cappedScore,
        riskLevel,
        riskFactors,
        recommendations,
        disclaimer: 'This health risk assessment is for informational purposes only and does not constitute medical advice.'
      }
    });
  } catch (error) { next(error); }
};

// Report Analysis (highlights abnormal values from text input)
exports.analyzeReport = async (req, res, next) => {
  try {
    const { reportType, values } = req.body;

    const normalRanges = {
      hemoglobin: { min: 12, max: 17, unit: 'g/dL', label: 'Hemoglobin' },
      wbc: { min: 4000, max: 11000, unit: '/μL', label: 'White Blood Cells' },
      platelets: { min: 150000, max: 400000, unit: '/μL', label: 'Platelets' },
      glucose: { min: 70, max: 100, unit: 'mg/dL', label: 'Blood Glucose (Fasting)' },
      creatinine: { min: 0.6, max: 1.2, unit: 'mg/dL', label: 'Creatinine' },
      sodium: { min: 136, max: 145, unit: 'mEq/L', label: 'Sodium' },
      potassium: { min: 3.5, max: 5.0, unit: 'mEq/L', label: 'Potassium' },
      cholesterol: { min: 0, max: 200, unit: 'mg/dL', label: 'Total Cholesterol' },
      triglycerides: { min: 0, max: 150, unit: 'mg/dL', label: 'Triglycerides' },
      hdl: { min: 40, max: 999, unit: 'mg/dL', label: 'HDL Cholesterol' },
      ldl: { min: 0, max: 100, unit: 'mg/dL', label: 'LDL Cholesterol' },
      tsh: { min: 0.4, max: 4.0, unit: 'mIU/L', label: 'TSH (Thyroid)' },
      hba1c: { min: 0, max: 5.7, unit: '%', label: 'HbA1c' }
    };

    const results = [];
    const abnormal = [];

    Object.entries(values || {}).forEach(([key, val]) => {
      const range = normalRanges[key.toLowerCase()];
      if (!range) return;
      const numVal = parseFloat(val);
      if (isNaN(numVal)) return;

      const status = numVal < range.min ? 'low' : numVal > range.max ? 'high' : 'normal';
      const result = {
        parameter: range.label,
        value: `${numVal} ${range.unit}`,
        normalRange: `${range.min}–${range.max} ${range.unit}`,
        status
      };
      results.push(result);
      if (status !== 'normal') abnormal.push(result);
    });

    const summary = abnormal.length === 0
      ? 'All parameters are within normal range.'
      : `${abnormal.length} parameter(s) are outside normal range and require medical attention.`;

    res.json({
      success: true,
      data: {
        results,
        abnormalValues: abnormal,
        summary,
        disclaimer: 'This analysis is for informational purposes only. Consult your doctor for interpretation.'
      }
    });
  } catch (error) { next(error); }
};

function getConditionDescription(condition) {
  const descriptions = {
    'Flu': 'Viral infection causing fever, body aches, and respiratory symptoms.',
    'COVID-19': 'Respiratory illness caused by the SARS-CoV-2 virus.',
    'Migraine': 'Severe recurring headache often with nausea and light sensitivity.',
    'Hypertension': 'High blood pressure that can lead to serious health complications.',
    'Diabetes': 'Metabolic disease characterized by high blood sugar levels.',
    'Asthma': 'Chronic respiratory condition causing airway inflammation and breathing difficulty.',
    'Gastritis': 'Inflammation of the stomach lining causing discomfort and nausea.'
  };
  return descriptions[condition] || `A medical condition requiring professional evaluation.`;
}

function getRecommendations(severity, symptoms) {
  const base = ['Consult a healthcare professional for proper diagnosis.', 'Keep a symptom diary to track changes.'];
  if (severity === 'emergency') return ['Seek emergency medical care immediately.', 'Call emergency services (911) if needed.'];
  if (severity === 'high') return [...base, 'Schedule an appointment with a doctor today.', 'Monitor symptoms closely.'];
  if (severity === 'medium') return [...base, 'Book an appointment within the next few days.', 'Rest and stay hydrated.'];
  return [...base, 'Monitor symptoms for a few days.', 'Maintain good hygiene and hydration.'];
}
