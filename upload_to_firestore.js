const admin = require('firebase-admin');

// Initialize Firebase Admin
// REPLACE THIS with your Firebase service account key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ============================================
// LEVEL 1 DATA - Basic Grammar
// ============================================

const level1Data = {
  // Pronouns (ضمائر)
  pronouns: [
    {
      urduheading: 'ضمائر منفصل',
    engheading: ' ',
    subheading: 'Independent Pronouns - رفع',
    color: red,
    n: '1',
    name: 'ھُوَ',
    urdu: 'وہ (مذکر)',
    eng: 'He',
    g: ''
    },
    {
      urduheading: 'ضمائر منفصل',
    engheading: ' ',
    subheading: 'Independent Pronouns - رفع',
    color: yellow,
    n: '2',
    name: 'ھُمَا',
    urdu: 'وہ دو (مذکر و مؤنث)',
    eng: 'They two',
    g: '(M+F)'
    },
    {
      urduheading: 'ضمائر منفصل',
      engheading: 'Pronouns',
      subheading: 'Independent Pronouns - رفع',
      name: 'ھُمْ',
      urdu: 'وہ سب (مذکر)',
      eng: 'All of them',
      g: '(M)',
      n: '3'
    },
    // Add more pronouns from your pronoun_data.dart
  ],

  // Demonstrative Pronouns (اسماء اشارہ)
  demonstrative_pronouns: [
    {
      urduheading: 'اسماء اشارہ',
      engheading: 'Demonstrative Pronouns',
      subheading: '',
      name: 'ھٰذَا',
      urdu: 'یہ (مذکر)',
      eng: 'This',
      g: '(M)',
      n: '1'
    },
    // Add more from demospronoun_data.dart
  ],

  // Prepositions (حروف جارہ)
  prepositions: [
    {
      urduheading: 'حروف جارہ',
      engheading: 'Prepositions',
      subheading: '',
      name: 'فِی',
      urdu: 'میں',
      eng: 'In',
      g: '',
      n: '1'
    },
    {
      urduheading: 'حروف جارہ',
      engheading: 'Prepositions',
      subheading: '',
      name: 'مِنْ',
      urdu: 'سے',
      eng: 'From',
      g: '',
      n: '2'
    },
    // Add more from preposition_data.dart
  ],

  // Conjunctions (حروف عطف)
  conjunctions: [
    {
      urduheading: 'حروف الْعَطف',
      engheading: 'Conjunctions',
      subheading: '',
      name: 'وَ',
      urdu: 'اور',
      eng: 'And',
      g: '',
      n: '1'
    },
    // Add more from conjunc_data.dart
  ],

  // Conditionals (حروف مشبہ بالفعل)
  conditionals: [
    {
      urduheading: 'حروف مشبہ بالفعل',
      engheading: 'Conditional Words',
      subheading: '',
      name: 'اِنَّ',
      urdu: 'بے شک',
      eng: 'For sure',
      g: '',
      n: '1'
    },
    // Add more from conditional_data.dart
  ],

  // Negatives (حروف نفی)
  negatives: [
    {
      urduheading: 'حروف نفی',
      engheading: 'Negative Words',
      subheading: '',
      name: 'لَا',
      urdu: 'نہیں',
      eng: 'No/Not',
      g: '',
      n: '1'
    },
    // Add more from nafi_data.dart
  ],

  // Place Words (ظروف المکان)
  place_words: [
    {
      urduheading: 'ظروف المکان',
      engheading: 'Adverbs of Place',
      subheading: '',
      name: 'فَوقَ',
      urdu: 'اوپر',
      eng: 'On top',
      g: '',
      n: '1'
    },
    // Add more from makan_data.dart
  ],

  // Time Words (ظروف الزَّمَان)
  time_words: [
    {
      urduheading: 'ظروف الزَّمَان',
      engheading: 'Adverbs of Time',
      subheading: '',
      name: 'قَبْلَ',
      urdu: 'پہلے',
      eng: 'Before',
      g: '',
      n: '1'
    },
    // Add more from zaman_data.dart
  ],

  // Separated Words (متفرق حروف)
  separated_words: [
    {
      urduheading: 'متفرق حروف',
      engheading: 'Separated Words',
      subheading: '',
      name: 'عسٰی',
      urdu: 'امید ہے',
      eng: 'expected/ Perhaps',
      g: '',
      n: '1'
    },
    // Add more from sprated_data.dart
  ],

  // Signs (نشانیاں)
  signs: [
    {
      urduheading: 'نشانیاں',
      engheading: 'Signs',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from signs_data.dart
  ],

  // Continue for all other level 1 categories...
  interrogatives: [],
  relative_pronouns: [],
  murakabs_izafi: [],
  murakabs_ishari: [],
  murakabs_jarri: [],
  murakabs_tausefi: [],
  sentences: [],
  preposition_with_maa: []
};

// ============================================
// LEVEL 2 DATA - Thematic Vocabulary
// ============================================

const level2Data = {
  // Colors (رنگوں کے نام)
  colors: [
    {
      urduheading: 'رنگوں کے نام',
      engheading: 'Names of Colors',
      subheading: '',
      name: 'اَبْیَضُ',
      urdu: 'سفید',
      eng: 'White',
      g: '',
      n: '1'
    },
    // Add more from colors.dart
  ],

  // Fruits (پھلوں کے نام)
  fruits: [
    {
      urduheading: 'پھلوں کے نام',
      engheading: 'Names of Fruits',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from fruits.dart
  ],

  // Vegetables (سبزیوں کے نام)
  vegetables: [
    {
      urduheading: 'سبزیوں کے نام',
      engheading: 'Names of Vegetables',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from veg.dart
  ],

  // Animals (جانوروں کے نام)
  animals: [
    {
      urduheading: 'جانوروں کے نام',
      engheading: 'Names of Animals',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from animals.dart
  ],

  // Body Parts (جسم کے حصّوں کے نام)
  body_parts: [
    {
      urduheading: 'جسم کے حصّوں کے نام',
      engheading: 'Names of Body Parts',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from bodyparts.dart
  ],

  // Relatives (رشتےدراوں کے نام)
  relatives: [
    {
      urduheading: 'رشتےدراوں کے نام',
      engheading: 'Names of Relatives',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from relatives.dart
  ],

  // Blessings (نعمتوں کے نام)
  blessings: [
    {
      urduheading: 'نعمتوں کے نام',
      engheading: 'Names of Blessings',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from blessings.dart
  ],

  // Deeds (اعمال کے نام)
  deeds: [
    {
      urduheading: 'اعمال کے نام',
      engheading: 'Names of Deeds',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from deeds.dart
  ],

  // Jannah (جنت کے نام)
  jannah: [
    {
      urduheading: 'جنت کے نام',
      engheading: 'Names of Paradise',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from jannah.dart
  ],

  // Fire/Hell (آگ کے نام)
  fire: [
    {
      urduheading: 'آگ کے نام',
      engheading: 'Name of Fire',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from fire.dart
  ],

  // Adjectives (صفات)
  adjectives: [
    {
      urduheading: 'صفات',
      engheading: 'Adjectives',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from adjectives_data.dart
  ],

  // Attributes of Allah
  allah_attributes: []
};

// ============================================
// LEVEL 3 DATA - Grammar & Verbs
// ============================================

const level3Data = {
  // Patterns (ابواب ثلاثی مجرّد)
  patterns: [
    {
      urduheading: 'ابواب ثلاثی مجرّد',
      engheading: 'Verb Patterns',
      subheading: '',
      name: 'نَصَرَ',
      urdu: 'اُس نے مدد کی',
      eng: 'he helped',
      g: '',
      n: '1'
    },
    // Add more from patterns.dart
  ],

  // Past Tense (فعل ماضی)
  past_tense: [
    {
      urduheading: 'فعل ماضی',
      engheading: 'Past Tense',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from past_tense.dart
  ],

  // Present/Future (فعل مضارع)
  present_future: [
    {
      urduheading: 'فعل مضارع',
      engheading: 'Present/Future Tense',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from present_future.dart
  ],

  // Verb Forms (ابواب ثلاثی مزید فیہ)
  verb_forms: [
    {
      urduheading: 'ابواب ثلاثی مزید فیہ',
      engheading: 'Augmented Verb Forms',
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: '1'
    },
    // Add more from verb.dart
  ],

  // Misal (مثال واوی/ یائی)
  misal: [
    {
      urduheading: 'مثال واوی/ یائی',
      engheading: 'Misal (Weak First)',
      subheading: 'مثال (واوی)',
      name: 'وَھَبَ',
      urdu: 'عطا کرنا',
      eng: 'he bestows',
      g: '',
      n: '1'
    },
    // Add more from misal.dart
  ],

  // Ajwaf (اجوف واوی/یائی)
  ajwaf: [
    {
      urduheading: 'اجوف واوی/یائی',
      engheading: 'Ajwaf (Weak Middle)',
      subheading: 'اجوف (واوی)',
      name: 'قَال',
      urdu: 'کہنا',
      eng: 'to say',
      g: '',
      n: '1'
    },
    // Add more from ajwaf.dart
  ],

  // Active/Passive forms
  past_active: [],
  past_passive: [],
  present_active: [],
  present_passive: []
};

// ============================================
// UPLOAD FUNCTION
// ============================================

async function uploadToFirestore() {
  try {
    console.log('Starting upload to Firestore...');

    // Upload Level 1
    console.log('Uploading Level 1 data...');
    await db.collection('quranic_words').doc('level_1').set(level1Data);
    console.log('✅ Level 1 uploaded successfully');

    // Upload Level 2
    console.log('Uploading Level 2 data...');
    await db.collection('quranic_words').doc('level_2').set(level2Data);
    console.log('✅ Level 2 uploaded successfully');

    // Upload Level 3
    console.log('Uploading Level 3 data...');
    await db.collection('quranic_words').doc('level_3').set(level3Data);
    console.log('✅ Level 3 uploaded successfully');

    console.log('\n🎉 All data uploaded successfully!');
    console.log('\nFirestore Structure:');
    console.log('quranic_words/');
    console.log('  ├── level_1/ (document with all categories)');
    console.log('  ├── level_2/ (document with all categories)');
    console.log('  └── level_3/ (document with all categories)');

  } catch (error) {
    console.error('❌ Error uploading data:', error);
  }
}

// Run the upload
uploadToFirestore();