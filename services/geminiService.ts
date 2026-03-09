
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAgroAdvice = async (prompt: string, context?: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tu es un expert agronome africain senior. Réponds de manière précise, adaptée au contexte africain (climat, types de sols, moyens financiers).
      
      Question de l'utilisateur: ${prompt}
      ${context ? `Contexte supplémentaire: ${context}` : ''}`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Désolé, je rencontre une difficulté technique. Veuillez réessayer plus tard.";
  }
};

export const diagnosePlant = async (imageBase64: string, mimeType: string = 'image/jpeg') => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: "Diagnostique cette plante. Donne le nom de la maladie, les symptômes, et surtout les solutions bio et chimiques adaptées au contexte africain." }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Diagnosis Error:", error);
    return "Échec du diagnostic. Assurez-vous qu'elle est bien éclairée.";
  }
};

export const getDiseaseInfo = async (diseaseName: string, cropName?: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `En tant qu'expert phytopathologiste africain, génère une fiche technique complète sur la maladie : "${diseaseName}" ${cropName ? `spécifiquement pour la culture de : ${cropName}` : ''}.
      La fiche doit inclure :
      1. Une description simple.
      2. Les symptômes visuels (feuilles, tiges, fruits).
      3. Des solutions de lutte biologique (préparation locales comme le neem, bicarbonate, etc.).
      4. Des solutions chimiques (matières actives efficaces et précautions).
      
      Réponds uniquement en format JSON structuré.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            bioTreatments: { type: Type.ARRAY, items: { type: Type.STRING } },
            chemicalTreatments: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["description", "symptoms", "bioTreatments", "chemicalTreatments"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Disease Info Error:", error);
    return null;
  }
};

export const generateCropItinerary = async (crop: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Génère un itinéraire technique complet et chronologique pour la culture de: ${crop} en Afrique.
      Inclus les étapes clés : préparation du sol, semis, fertilisation (N-P-K), sarclage, traitement phytosanitaire et récolte.
      Pour chaque étape, donne une description précise et le nombre de jours recommandés APRÈS le semis (J+X).
      
      Réponds uniquement en format JSON structuré.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              daysFromStart: { type: Type.NUMBER }
            },
            required: ["description", "daysFromStart"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Itinerary Generation Error:", error);
    return null;
  }
};

export const getFertilizerAdvice = async (crop: string, step: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `En tant qu'expert agronome africain, suggère les types d'engrais (NPK, urée, fumure organique, compost, engrais foliaire, etc.) les plus adaptés pour la culture de "${crop}" spécifiquement pour l'étape : "${step}".
      Réponds avec des dosages indicatifs (ex: kg/ha) adaptés aux réalités du terrain en Afrique.
      Format de réponse : Court, structuré en points, maximum 100 mots.`,
      config: {
        temperature: 0.5,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Fertilizer Advice Error:", error);
    return "Erreur lors de la récupération des conseils d'engrais.";
  }
};

export const getCropFertilizationPlan = async (crop: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `En tant qu'expert agronome africain, génère un plan de fertilisation global pour la culture de "${crop}".
      Détaille les besoins à chaque phase (fond, croissance, floraison/fructification).
      Inclus les types d'engrais (organique et minéral comme NPK, Urée) et les quantités recommandées pour un petit exploitant.
      Format de réponse : Texte structuré clair et concis.`,
      config: {
        temperature: 0.5,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Global Fertilizer Plan Error:", error);
    return null;
  }
};

export const getCropProtectionPlan = async (crop: string, steps?: any[]) => {
  try {
    const stepsContext = steps && steps.length > 0 
      ? `Voici les étapes prévues de l'itinéraire technique : ${steps.map(s => `${s.description} (prévue le ${s.deadline})`).join(', ')}.`
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `En tant qu'expert en protection des végétaux en Afrique, génère un calendrier de traitement global contre les ravageurs et maladies pour la culture de "${crop}".
      ${stepsContext}
      Liste les principaux ennemis (insectes, champignons, adventices) par stade de croissance en te basant si possible sur les étapes fournies.
      Suggère des traitements préventifs et curatifs (méthodes bio, extraits végétaux comme le neem, et solutions conventionnelles).
      Format de réponse : Texte structuré, clair et orienté action pour un agriculteur.`,
      config: {
        temperature: 0.5,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Global Protection Plan Error:", error);
    return null;
  }
};
