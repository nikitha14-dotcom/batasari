"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
] as const;
export type LanguageCode = typeof LANGUAGES[number]["code"];

const EN: Record<string, string> = {
  "language": "Website language", "home": "Home", "cityGuide": "City guide", "movePlanner": "Move planner",
  "compareCities": "Compare cities", "makeMove": "Make an informed move", "compareTitle": "Compare Indian cities",
  "compareIntro": "Put the city details currently available in Batasari side by side. Choose up to four destinations to compare their regional and language context.",
  "transparent": "Transparent by design", "transparentText": "We only show fields in the curated city directory. We do not estimate rent, living costs, salaries, job availability, climate, or transport quality without a sourced dataset.",
  "step1": "STEP 1", "chooseCities": "Choose cities", "selected": "selected", "searchCity": "Search by city, state or region",
  "searchPlaceholder": "Try Surat or Gujarat", "loadingCities": "Loading the supported city directory…", "tryAgain": "Try again",
  "noMatch": "No cities match that search.", "source": "Source: Batasari curated India city directory · Retrieved",
  "step2": "STEP 2", "sideBySide": "Side-by-side comparison", "clear": "Clear selection", "startCompare": "Your comparison starts here",
  "selectHint": "Select at least one city above. Add two or more to compare their details side by side.",
  "whatCompare": "What to compare", "location": "Location", "state": "State / territory", "region": "Region", "local": "Local context",
  "languages": "Languages listed", "currency": "Currency", "timezone": "Time zone", "research": "Research still needed",
  "notAvailable": "Not available in verified data", "cost":"Cost of living and monthly budget", "rent":"Typical rent and housing availability", "jobs":"Employment opportunities and current job openings", "climate":"Climate and seasonal conditions", "transport":"Public transport and connectivity", "lifestyle":"Lifestyle and neighbourhood amenities", "disclaimer": "Directory fields are descriptive, not a city ranking or recommendation. Confirm local conditions and current costs independently before making a relocation decision.",
  "usePlan": "Use a city in your move plan", "locationLabel": "Location", "profile": "Profile", "myMove": "My move",
  "movingServices": "Moving services", "stayDocs": "Stay & documents", "checklist": "Checklist", "faq": "FAQ",
  "privacy": "Privacy Statement", "support": "Contact Support", "feedback": "Feedback", "signOut": "Log out",
};
const DICT: Record<Exclude<LanguageCode, "en">, Record<string, string>> = {
  te: {
    cost:"జీవన వ్యయం మరియు నెలవారీ బడ్జెట్",rent:"సాధారణ అద్దె మరియు గృహ లభ్యత",jobs:"ఉద్యోగ అవకాశాలు మరియు ప్రస్తుత ఖాళీలు",climate:"వాతావరణం మరియు ఋతు పరిస్థితులు",transport:"ప్రజా రవాణా మరియు అనుసంధానం",lifestyle:"జీవనశైలి మరియు పరిసర సదుపాయాలు",
    language:"వెబ్‌సైట్ భాష",home:"హోమ్",cityGuide:"నగర మార్గదర్శి",movePlanner:"తరలింపు ప్రణాళిక",compareCities:"నగరాలను పోల్చండి",
    makeMove:"సమాచారంతో మీ తరలింపును ప్లాన్ చేయండి",compareTitle:"భారతీయ నగరాలను పోల్చండి",compareIntro:"బతసారిలో అందుబాటులో ఉన్న నగర వివరాలను పక్కపక్కన చూడండి. ప్రాంతం మరియు భాషల వివరాల కోసం గరిష్ఠంగా నాలుగు నగరాలను ఎంచుకోండి.",
    transparent:"పారదర్శక సమాచారం",transparentText:"ధృవీకరించిన నగర డైరెక్టరీలో ఉన్న వివరాలనే చూపిస్తాము. ఆధారాలు లేని అద్దె, జీవన వ్యయం, జీతాలు, ఉద్యోగాలు, వాతావరణం లేదా రవాణా నాణ్యతను అంచనా వేయము.",
    step1:"దశ 1",chooseCities:"నగరాలను ఎంచుకోండి",selected:"ఎంచుకున్నారు",searchCity:"నగరం, రాష్ట్రం లేదా ప్రాంతం ద్వారా వెతకండి",searchPlaceholder:"సూరత్ లేదా గుజరాత్ ప్రయత్నించండి",
    loadingCities:"నగరాల జాబితా లోడ్ అవుతోంది…",tryAgain:"మళ్లీ ప్రయత్నించండి",noMatch:"ఈ శోధనకు నగరాలు లేవు.",source:"మూలం: బతసారి భారత నగరాల జాబితా · పొందిన సమయం",
    step2:"దశ 2",sideBySide:"పక్కపక్కన పోలిక",clear:"ఎంపికను తొలగించండి",startCompare:"మీ పోలిక ఇక్కడ ప్రారంభమవుతుంది",selectHint:"పై నుంచి కనీసం ఒక నగరాన్ని ఎంచుకోండి. వివరాలను పోల్చడానికి రెండు లేదా అంతకంటే ఎక్కువ నగరాలను ఎంచుకోండి.",
    whatCompare:"పోల్చాల్సిన అంశం",location:"ప్రాంతం",state:"రాష్ట్రం / కేంద్రపాలిత ప్రాంతం",region:"ప్రాంత విభాగం",local:"స్థానిక సమాచారం",languages:"జాబితాలోని భాషలు",currency:"కరెన్సీ",timezone:"సమయ మండలం",
    research:"ఇంకా పరిశోధించాల్సినవి",notAvailable:"ధృవీకరించిన డేటా అందుబాటులో లేదు",disclaimer:"ఈ వివరాలు సమాచారార్థం మాత్రమే; నగర ర్యాంకింగ్ లేదా సిఫార్సు కాదు. తరలింపు నిర్ణయానికి ముందు స్థానిక పరిస్థితులు, ప్రస్తుత ఖర్చులను స్వయంగా నిర్ధారించుకోండి.",
    usePlan:"మీ తరలింపు ప్రణాళికలో నగరాన్ని ఉపయోగించండి",profile:"ప్రొఫైల్",myMove:"నా తరలింపు",movingServices:"తరలింపు సేవలు",stayDocs:"నివాసం & పత్రాలు",checklist:"చెక్‌లిస్ట్",faq:"తరచుగా అడిగే ప్రశ్నలు",privacy:"గోప్యతా ప్రకటన",support:"సహాయం సంప్రదించండి",feedback:"అభిప్రాయం",signOut:"లాగ్ అవుట్"
  },
  hi: {
    cost:"जीवन-यापन लागत और मासिक बजट",rent:"सामान्य किराया और आवास उपलब्धता",jobs:"रोज़गार के अवसर और वर्तमान नौकरियाँ",climate:"जलवायु और मौसमी स्थितियाँ",transport:"सार्वजनिक परिवहन और संपर्क",lifestyle:"जीवनशैली और पड़ोस की सुविधाएँ",
    language:"वेबसाइट की भाषा",home:"होम",cityGuide:"शहर गाइड",movePlanner:"स्थानांतरण योजना",compareCities:"शहरों की तुलना",
    makeMove:"सोच-समझकर स्थानांतरण करें",compareTitle:"भारतीय शहरों की तुलना करें",compareIntro:"बटसारी में उपलब्ध शहरों की जानकारी साथ-साथ देखें। क्षेत्र और भाषा की जानकारी की तुलना के लिए अधिकतम चार शहर चुनें।",
    transparent:"पारदर्शी जानकारी",transparentText:"हम केवल सत्यापित शहर निर्देशिका के फ़ील्ड दिखाते हैं। स्रोत के बिना किराया, जीवन-यापन लागत, वेतन, नौकरियाँ, मौसम या परिवहन गुणवत्ता का अनुमान नहीं लगाते।",
    step1:"चरण 1",chooseCities:"शहर चुनें",selected:"चुने गए",searchCity:"शहर, राज्य या क्षेत्र से खोजें",searchPlaceholder:"सूरत या गुजरात खोजें",loadingCities:"शहर सूची लोड हो रही है…",tryAgain:"फिर कोशिश करें",noMatch:"इस खोज से कोई शहर नहीं मिला।",source:"स्रोत: बटसारी भारत शहर निर्देशिका · प्राप्त",
    step2:"चरण 2",sideBySide:"आमने-सामने तुलना",clear:"चयन हटाएँ",startCompare:"आपकी तुलना यहाँ शुरू होती है",selectHint:"ऊपर कम से कम एक शहर चुनें। तुलना के लिए दो या अधिक शहर जोड़ें।",
    whatCompare:"तुलना का विषय",location:"स्थान",state:"राज्य / केंद्र शासित प्रदेश",region:"क्षेत्र",local:"स्थानीय जानकारी",languages:"सूचीबद्ध भाषाएँ",currency:"मुद्रा",timezone:"समय क्षेत्र",research:"अभी और शोध आवश्यक",notAvailable:"सत्यापित डेटा उपलब्ध नहीं",
    disclaimer:"ये विवरण जानकारी के लिए हैं, शहर की रैंकिंग या सिफारिश नहीं। स्थानांतरण का निर्णय लेने से पहले स्थानीय स्थितियों और वर्तमान लागतों की पुष्टि करें।",usePlan:"अपने स्थानांतरण प्लान में शहर जोड़ें",
    profile:"प्रोफ़ाइल",myMove:"मेरा स्थानांतरण",movingServices:"स्थानांतरण सेवाएँ",stayDocs:"रहना और दस्तावेज़",checklist:"चेकलिस्ट",faq:"अक्सर पूछे जाने वाले प्रश्न",privacy:"गोपनीयता वक्तव्य",support:"सहायता संपर्क",feedback:"प्रतिक्रिया",signOut:"लॉग आउट"
  },
  gu: {
    cost:"જીવન ખર્ચ અને માસિક બજેટ",rent:"સામાન્ય ભાડું અને રહેઠાણની ઉપલબ્ધતા",jobs:"રોજગારની તકો અને હાલની નોકરીઓ",climate:"આબોહવા અને મોસમી પરિસ્થિતિઓ",transport:"જાહેર પરિવહન અને જોડાણ",lifestyle:"જીવનશૈલી અને પડોશની સુવિધાઓ",
    language:"વેબસાઇટની ભાષા",home:"હોમ",cityGuide:"શહેર માર્ગદર્શિકા",movePlanner:"સ્થળાંતર યોજના",compareCities:"શહેરોની તુલના",
    makeMove:"સમજી વિચારીને સ્થળાંતર કરો",compareTitle:"ભારતીય શહેરોની તુલના કરો",compareIntro:"બતસારીમાં ઉપલબ્ધ શહેરોની વિગતો સાથે જુઓ. પ્રદેશ અને ભાષાની માહિતી સરખાવવા વધુમાં વધુ ચાર શહેરો પસંદ કરો.",
    transparent:"પારદર્શક માહિતી",transparentText:"અમે ફક્ત ચકાસેલી શહેર ડિરેક્ટરીની વિગતો બતાવીએ છીએ. સ્ત્રોત વગર ભાડું, જીવનખર્ચ, પગાર, નોકરીઓ, હવામાન અથવા પરિવહન ગુણવત્તાનો અંદાજ આપતા નથી.",
    step1:"પગલું 1",chooseCities:"શહેરો પસંદ કરો",selected:"પસંદ",searchCity:"શહેર, રાજ્ય અથવા પ્રદેશ શોધો",searchPlaceholder:"સુરત અથવા ગુજરાત અજમાવો",loadingCities:"શહેરોની યાદી લોડ થાય છે…",tryAgain:"ફરી પ્રયાસ કરો",noMatch:"આ શોધ સાથે કોઈ શહેર મળ્યું નથી.",source:"સ્ત્રોત: બતસારી ભારત શહેર ડિરેક્ટરી · મેળવેલ",
    step2:"પગલું 2",sideBySide:"સાથે સાથે તુલના",clear:"પસંદગી દૂર કરો",startCompare:"તમારી તુલના અહીંથી શરૂ થાય છે",selectHint:"ઉપર ઓછામાં ઓછું એક શહેર પસંદ કરો. તુલના માટે બે કે વધુ શહેરો ઉમેરો.",
    whatCompare:"શું સરખાવવું",location:"સ્થાન",state:"રાજ્ય / કેન્દ્રશાસિત પ્રદેશ",region:"પ્રદેશ",local:"સ્થાનિક માહિતી",languages:"સૂચિબદ્ધ ભાષાઓ",currency:"ચલણ",timezone:"સમય ક્ષેત્ર",research:"વધુ સંશોધન જરૂરી",notAvailable:"ચકાસાયેલ ડેટા ઉપલબ્ધ નથી",
    disclaimer:"આ વિગતો માહિતી માટે છે, શહેરની રેન્કિંગ કે ભલામણ નથી. સ્થળાંતરનો નિર્ણય લેતા પહેલાં સ્થાનિક પરિસ્થિતિ અને હાલના ખર્ચની ખાતરી કરો.",usePlan:"તમારી સ્થળાંતર યોજનામાં શહેર વાપરો",
    profile:"પ્રોફાઇલ",myMove:"મારું સ્થળાંતર",movingServices:"સ્થળાંતર સેવાઓ",stayDocs:"રહેઠાણ અને દસ્તાવેજો",checklist:"ચેકલિસ્ટ",faq:"વારંવાર પૂછાતા પ્રશ્નો",privacy:"ગોપનીયતા નિવેદન",support:"સહાયનો સંપર્ક",feedback:"પ્રતિસાદ",signOut:"લૉગ આઉટ"
  },
  ta: {
    cost:"வாழ்க்கைச் செலவு மற்றும் மாதாந்திர பட்ஜெட்",rent:"வழக்கமான வாடகை மற்றும் வீட்டு வசதி",jobs:"வேலை வாய்ப்புகள் மற்றும் தற்போதைய காலியிடங்கள்",climate:"காலநிலை மற்றும் பருவநிலைகள்",transport:"பொது போக்குவரத்து மற்றும் இணைப்பு",lifestyle:"வாழ்க்கை முறை மற்றும் சுற்றுப்புற வசதிகள்",
    language:"இணையதள மொழி",home:"முகப்பு",cityGuide:"நகர வழிகாட்டி",movePlanner:"குடிபெயர்வு திட்டம்",compareCities:"நகரங்களை ஒப்பிடுக",
    makeMove:"தகவலறிந்து குடிபெயருங்கள்",compareTitle:"இந்திய நகரங்களை ஒப்பிடுக",compareIntro:"படசாரியில் உள்ள நகர விவரங்களை அருகருகே பார்க்கவும். பகுதி மற்றும் மொழி விவரங்களை ஒப்பிட அதிகபட்சம் நான்கு நகரங்களைத் தேர்ந்தெடுக்கவும்.",
    transparent:"வெளிப்படையான தகவல்",transparentText:"சரிபார்க்கப்பட்ட நகரப் பட்டியலில் உள்ள விவரங்களை மட்டுமே காட்டுகிறோம். ஆதாரம் இல்லாமல் வாடகை, வாழ்க்கைச் செலவு, சம்பளம், வேலைகள், காலநிலை அல்லது போக்குவரத்தை மதிப்பிடுவதில்லை.",
    step1:"படி 1",chooseCities:"நகரங்களைத் தேர்ந்தெடுக்கவும்",selected:"தேர்ந்தெடுக்கப்பட்டது",searchCity:"நகரம், மாநிலம் அல்லது பகுதி மூலம் தேடுக",searchPlaceholder:"சூரத் அல்லது குஜராத் எனத் தேடுக",loadingCities:"நகரப் பட்டியல் ஏற்றப்படுகிறது…",tryAgain:"மீண்டும் முயற்சி",noMatch:"இந்தத் தேடலுக்கு நகரங்கள் இல்லை.",source:"ஆதாரம்: படசாரி இந்திய நகரப் பட்டியல் · பெறப்பட்ட நேரம்",
    step2:"படி 2",sideBySide:"பக்கம்பக்க ஒப்பீடு",clear:"தேர்வை நீக்குக",startCompare:"உங்கள் ஒப்பீடு இங்கே தொடங்குகிறது",selectHint:"மேலே குறைந்தது ஒரு நகரத்தைத் தேர்ந்தெடுக்கவும். ஒப்பிட இரண்டு அல்லது அதற்கு மேற்பட்ட நகரங்களைச் சேர்க்கவும்.",
    whatCompare:"ஒப்பிட வேண்டியது",location:"இடம்",state:"மாநிலம் / யூனியன் பிரதேசம்",region:"பகுதி",local:"உள்ளூர் விவரங்கள்",languages:"பட்டியலிடப்பட்ட மொழிகள்",currency:"நாணயம்",timezone:"நேர மண்டலம்",research:"மேலும் ஆய்வு தேவை",notAvailable:"சரிபார்க்கப்பட்ட தரவு இல்லை",
    disclaimer:"இந்த விவரங்கள் தகவலுக்காக மட்டுமே; தரவரிசையோ பரிந்துரையோ அல்ல. குடிபெயர்வதற்கு முன் உள்ளூர் நிலைமைகளையும் தற்போதைய செலவுகளையும் உறுதிப்படுத்தவும்.",usePlan:"உங்கள் குடிபெயர்வு திட்டத்தில் நகரத்தைச் சேர்க்கவும்",
    profile:"சுயவிவரம்",myMove:"என் குடிபெயர்வு",movingServices:"குடிபெயர்வு சேவைகள்",stayDocs:"தங்குமிடம் & ஆவணங்கள்",checklist:"சரிபார்ப்புப் பட்டியல்",faq:"அடிக்கடி கேட்கப்படும் கேள்விகள்",privacy:"தனியுரிமை அறிக்கை",support:"ஆதரவைத் தொடர்புகொள்ள",feedback:"கருத்து",signOut:"வெளியேறு"
  },
  kn: {
    cost:"ಜೀವನ ವೆಚ್ಚ ಮತ್ತು ಮಾಸಿಕ ಬಜೆಟ್",rent:"ಸಾಮಾನ್ಯ ಬಾಡಿಗೆ ಮತ್ತು ವಸತಿ ಲಭ್ಯತೆ",jobs:"ಉದ್ಯೋಗಾವಕಾಶಗಳು ಮತ್ತು ಪ್ರಸ್ತುತ ಉದ್ಯೋಗಗಳು",climate:"ಹವಾಮಾನ ಮತ್ತು ಋತುಮಾನದ ಪರಿಸ್ಥಿತಿಗಳು",transport:"ಸಾರ್ವಜನಿಕ ಸಾರಿಗೆ ಮತ್ತು ಸಂಪರ್ಕ",lifestyle:"ಜೀವನಶೈಲಿ ಮತ್ತು ನೆರೆಹೊರೆಯ ಸೌಲಭ್ಯಗಳು",
    language:"ವೆಬ್‌ಸೈಟ್ ಭಾಷೆ",home:"ಮುಖಪುಟ",cityGuide:"ನಗರ ಮಾರ್ಗದರ್ಶಿ",movePlanner:"ಸ್ಥಳಾಂತರ ಯೋಜನೆ",compareCities:"ನಗರಗಳನ್ನು ಹೋಲಿಸಿ",
    makeMove:"ಮಾಹಿತಿಯೊಂದಿಗೆ ಸ್ಥಳಾಂತರ ಯೋಜಿಸಿ",compareTitle:"ಭಾರತೀಯ ನಗರಗಳನ್ನು ಹೋಲಿಸಿ",compareIntro:"ಬತಸಾರಿಯಲ್ಲಿ ಲಭ್ಯವಿರುವ ನಗರ ವಿವರಗಳನ್ನು ಪಕ್ಕಪಕ್ಕದಲ್ಲಿ ನೋಡಿ. ಪ್ರದೇಶ ಮತ್ತು ಭಾಷೆಗಳನ್ನು ಹೋಲಿಸಲು ಗರಿಷ್ಠ ನಾಲ್ಕು ನಗರಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    transparent:"ಪಾರದರ್ಶಕ ಮಾಹಿತಿ",transparentText:"ಪರಿಶೀಲಿಸಿದ ನಗರ ಡೈರೆಕ್ಟರಿಯ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ತೋರಿಸುತ್ತೇವೆ. ಮೂಲವಿಲ್ಲದೆ ಬಾಡಿಗೆ, ಜೀವನ ವೆಚ್ಚ, ವೇತನ, ಉದ್ಯೋಗ, ಹವಾಮಾನ ಅಥವಾ ಸಾರಿಗೆ ಗುಣಮಟ್ಟವನ್ನು ಅಂದಾಜಿಸುವುದಿಲ್ಲ.",
    step1:"ಹಂತ 1",chooseCities:"ನಗರಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",selected:"ಆಯ್ಕೆ",searchCity:"ನಗರ, ರಾಜ್ಯ ಅಥವಾ ಪ್ರದೇಶದಿಂದ ಹುಡುಕಿ",searchPlaceholder:"ಸೂರತ್ ಅಥವಾ ಗುಜರಾತ್ ಹುಡುಕಿ",loadingCities:"ನಗರಗಳ ಪಟ್ಟಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ…",tryAgain:"ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",noMatch:"ಈ ಹುಡುಕಾಟಕ್ಕೆ ನಗರಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",source:"ಮೂಲ: ಬತಸಾರಿ ಭಾರತದ ನಗರ ಡೈರೆಕ್ಟರಿ · ಪಡೆಯಲಾಗಿದೆ",
    step2:"ಹಂತ 2",sideBySide:"ಪಕ್ಕಪಕ್ಕದ ಹೋಲಿಕೆ",clear:"ಆಯ್ಕೆಯನ್ನು ತೆರವುಗೊಳಿಸಿ",startCompare:"ನಿಮ್ಮ ಹೋಲಿಕೆ ಇಲ್ಲಿ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ",selectHint:"ಮೇಲೆ ಕನಿಷ್ಠ ಒಂದು ನಗರ ಆಯ್ಕೆಮಾಡಿ. ಹೋಲಿಸಲು ಎರಡು ಅಥವಾ ಹೆಚ್ಚು ನಗರಗಳನ್ನು ಸೇರಿಸಿ.",
    whatCompare:"ಹೋಲಿಸಬೇಕಾದ ಅಂಶ",location:"ಸ್ಥಳ",state:"ರಾಜ್ಯ / ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶ",region:"ಪ್ರದೇಶ",local:"ಸ್ಥಳೀಯ ಮಾಹಿತಿ",languages:"ಪಟ್ಟಿಯಲ್ಲಿರುವ ಭಾಷೆಗಳು",currency:"ಕರೆನ್ಸಿ",timezone:"ಸಮಯ ವಲಯ",research:"ಇನ್ನಷ್ಟು ಸಂಶೋಧನೆ ಅಗತ್ಯ",notAvailable:"ಪರಿಶೀಲಿತ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ",
    disclaimer:"ಈ ವಿವರಗಳು ಮಾಹಿತಿಗಾಗಿ ಮಾತ್ರ; ನಗರ ಶ್ರೇಯಾಂಕ ಅಥವಾ ಶಿಫಾರಸು ಅಲ್ಲ. ಸ್ಥಳಾಂತರ ನಿರ್ಧಾರಕ್ಕೂ ಮೊದಲು ಸ್ಥಳೀಯ ಪರಿಸ್ಥಿತಿ ಮತ್ತು ಪ್ರಸ್ತುತ ವೆಚ್ಚಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",usePlan:"ನಿಮ್ಮ ಸ್ಥಳಾಂತರ ಯೋಜನೆಯಲ್ಲಿ ನಗರ ಬಳಸಿ",
    profile:"ಪ್ರೊಫೈಲ್",myMove:"ನನ್ನ ಸ್ಥಳಾಂತರ",movingServices:"ಸ್ಥಳಾಂತರ ಸೇವೆಗಳು",stayDocs:"ವಾಸ್ತವ್ಯ ಮತ್ತು ದಾಖಲೆಗಳು",checklist:"ಪರಿಶೀಲನಾ ಪಟ್ಟಿ",faq:"ಪದೇಪದೇ ಕೇಳುವ ಪ್ರಶ್ನೆಗಳು",privacy:"ಗೌಪ್ಯತಾ ಹೇಳಿಕೆ",support:"ಬೆಂಬಲ ಸಂಪರ್ಕ",feedback:"ಪ್ರತಿಕ್ರಿಯೆ",signOut:"ಲಾಗ್ ಔಟ್"
  },
  ml: {
    cost:"ജീവിതച്ചെലവും മാസ ബജറ്റും",rent:"സാധാരണ വാടകയും താമസസൗകര്യവും",jobs:"തൊഴിൽ അവസരങ്ങളും നിലവിലെ ഒഴിവുകളും",climate:"കാലാവസ്ഥയും ഋതുക്കളും",transport:"പൊതുഗതാഗതവും കണക്റ്റിവിറ്റിയും",lifestyle:"ജീവിതശൈലിയും സമീപ സൗകര്യങ്ങളും",
    language:"വെബ്സൈറ്റ് ഭാഷ",home:"ഹോം",cityGuide:"നഗര ഗൈഡ്",movePlanner:"മാറിത്താമസിക്കൽ പദ്ധതി",compareCities:"നഗരങ്ങൾ താരതമ്യം ചെയ്യുക",
    makeMove:"വിവരങ്ങൾ മനസ്സിലാക്കി മാറുക",compareTitle:"ഇന്ത്യൻ നഗരങ്ങൾ താരതമ്യം ചെയ്യുക",compareIntro:"ബതസാരിയിൽ ലഭ്യമായ നഗരവിവരങ്ങൾ ഒപ്പം കാണുക. പ്രദേശവും ഭാഷകളും താരതമ്യം ചെയ്യാൻ പരമാവധി നാല് നഗരങ്ങൾ തിരഞ്ഞെടുക്കുക.",
    transparent:"സുതാര്യമായ വിവരങ്ങൾ",transparentText:"പരിശോധിച്ച നഗര ഡയറക്ടറിയിലുള്ള വിവരങ്ങൾ മാത്രം കാണിക്കുന്നു. ഉറവിടമില്ലാതെ വാടക, ജീവിതച്ചെലവ്, ശമ്പളം, ജോലി, കാലാവസ്ഥ, ഗതാഗത നിലവാരം എന്നിവ കണക്കാക്കുന്നില്ല.",
    step1:"ഘട്ടം 1",chooseCities:"നഗരങ്ങൾ തിരഞ്ഞെടുക്കുക",selected:"തിരഞ്ഞെടുത്തു",searchCity:"നഗരം, സംസ്ഥാനം അല്ലെങ്കിൽ പ്രദേശം തിരയുക",searchPlaceholder:"സൂറത്ത് അല്ലെങ്കിൽ ഗുജറാത്ത് തിരയുക",loadingCities:"നഗരങ്ങളുടെ പട്ടിക ലോഡ് ചെയ്യുന്നു…",tryAgain:"വീണ്ടും ശ്രമിക്കുക",noMatch:"ഈ തിരച്ചിലിൽ നഗരങ്ങളൊന്നും കണ്ടെത്തിയില്ല.",source:"ഉറവിടം: ബതസാരി ഇന്ത്യ നഗര ഡയറക്ടറി · ലഭിച്ചത്",
    step2:"ഘട്ടം 2",sideBySide:"വശങ്ങളിലായി താരതമ്യം",clear:"തിരഞ്ഞെടുപ്പ് മായ്ക്കുക",startCompare:"നിങ്ങളുടെ താരതമ്യം ഇവിടെ തുടങ്ങുന്നു",selectHint:"മുകളിൽ കുറഞ്ഞത് ഒരു നഗരം തിരഞ്ഞെടുക്കുക. താരതമ്യത്തിന് രണ്ടോ അതിലധികമോ നഗരങ്ങൾ ചേർക്കുക.",
    whatCompare:"താരതമ്യം ചെയ്യേണ്ടത്",location:"സ്ഥലം",state:"സംസ്ഥാനം / കേന്ദ്രഭരണ പ്രദേശം",region:"മേഖല",local:"പ്രാദേശിക വിവരം",languages:"പട്ടികപ്പെടുത്തിയ ഭാഷകൾ",currency:"നാണയം",timezone:"സമയ മേഖല",research:"കൂടുതൽ പഠനം ആവശ്യമാണ്",notAvailable:"പരിശോധിച്ച ഡാറ്റ ലഭ്യമല്ല",
    disclaimer:"ഈ വിവരങ്ങൾ വിവരണത്തിനുള്ളതാണ്; നഗര റാങ്കിംഗോ ശുപാർശയോ അല്ല. മാറിത്താമസിക്കുന്നതിന് മുമ്പ് പ്രാദേശിക സാഹചര്യങ്ങളും നിലവിലെ ചെലവുകളും പരിശോധിക്കുക.",usePlan:"നിങ്ങളുടെ താമസം മാറ്റാനുള്ള പദ്ധതിയിൽ നഗരം ഉപയോഗിക്കുക",
    profile:"പ്രൊഫൈൽ",myMove:"എന്റെ താമസം മാറ്റൽ",movingServices:"മാറിത്താമസിക്കൽ സേവനങ്ങൾ",stayDocs:"താമസവും രേഖകളും",checklist:"ചെക്ക്ലിസ്റ്റ്",faq:"പതിവ് ചോദ്യങ്ങൾ",privacy:"സ്വകാര്യതാ പ്രസ്താവന",support:"സഹായവുമായി ബന്ധപ്പെടുക",feedback:"അഭിപ്രായം",signOut:"ലോഗ് ഔട്ട്"
  },
};

type LanguageContextValue = { language: LanguageCode; setLanguage: (code: LanguageCode) => void; t: (key: string) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem("batasari-language");
    if (LANGUAGES.some((item) => item.code === saved)) setLanguageState(saved as LanguageCode);
    setReady(true);
  }, []);
  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    window.localStorage.setItem("batasari-language", code);
    document.documentElement.lang = code;
  };
  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key: string) => language === "en" ? (EN[key] ?? key) : (DICT[language][key] ?? EN[key] ?? key),
  }), [language]);
  useEffect(() => { if (ready) document.documentElement.lang = language; }, [language, ready]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
