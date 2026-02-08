import { useEffect, useState } from 'react'
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/router'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Search, BookOpen } from 'lucide-react'

export default function SurahsPage() {
  const [surahs, setSurahs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAyatModal, setShowAyatModal] = useState(false)
  const [showWordModal, setShowWordModal] = useState(false)
  const [selectedSurah, setSelectedSurah] = useState(null)
  const [selectedAyat, setSelectedAyat] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [ayatFormData, setAyatFormData] = useState({
    ayat: '',
    ur: '',
    eng: ''
  })
  const [wordFormData, setWordFormData] = useState({
    arabic: '',
    urdu: '',
    english: ''
  })
  const router = useRouter()

  // Surah names (78-114)
  const surahNames = {
    78: 'النبأ (An-Naba)',
    79: 'النازعات (An-Naziat)',
    80: 'عبس (Abasa)',
    81: 'التكوير (At-Takwir)',
    82: 'الإنفطار (Al-Infitar)',
    83: 'المطففين (Al-Mutaffifin)',
    84: 'الإنشقاق (Al-Inshiqaq)',
    85: 'البروج (Al-Buruj)',
    86: 'الطارق (At-Tariq)',
    87: 'الأعلى (Al-A\'la)',
    88: 'الغاشية (Al-Ghashiyah)',
    89: 'الفجر (Al-Fajr)',
    90: 'البلد (Al-Balad)',
    91: 'الشمس (Ash-Shams)',
    92: 'الليل (Al-Layl)',
    93: 'الضحى (Ad-Dhuha)',
    94: 'الشرح (Ash-Sharh)',
    95: 'التين (At-Tin)',
    96: 'العلق (Al-Alaq)',
    97: 'القدر (Al-Qadr)',
    98: 'البينة (Al-Bayyinah)',
    99: 'الزلزلة (Az-Zalzalah)',
    100: 'العاديات (Al-Adiyat)',
    101: 'القارعة (Al-Qari\'ah)',
    102: 'التكاثر (At-Takathur)',
    103: 'العصر (Al-Asr)',
    104: 'الهمزة (Al-Humazah)',
    105: 'الفيل (Al-Fil)',
    106: 'قريش (Quraysh)',
    107: 'الماعون (Al-Ma\'un)',
    108: 'الكوثر (Al-Kawthar)',
    109: 'الكافرون (Al-Kafirun)',
    110: 'النصر (An-Nasr)',
    111: 'المسد (Al-Masad)',
    112: 'الإخلاص (Al-Ikhlas)',
    113: 'الفلق (Al-Falaq)',
    114: 'الناس (An-Nas)'
  }

  useEffect(() => {
    fetchSurahs()
  }, [])

  const fetchSurahs = async () => {
    try {
      const surahsData = []
      
      // Fetch all surahs (78-114)
      for (let num = 78; num <= 114; num++) {
        const docRef = doc(db, 'quranic_surahs', num.toString())
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          surahsData.push({
            number: num,
            name: surahNames[num],
            surah_key: data.surah_key,
            ayat: data.ayat || []
          })
        }
      }
      
      setSurahs(surahsData)
    } catch (error) {
      console.error('Error fetching surahs:', error)
      alert('Error fetching data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditAyat = (surah, ayatIndex) => {
    setSelectedSurah(surah)
    setSelectedAyat(ayatIndex)
    const ayat = surah.ayat[ayatIndex]
    setAyatFormData({
      ayat: ayat.ayat || '',
      ur: ayat.ur || '',
      eng: ayat.eng || ''
    })
    setShowAyatModal(true)
  }

  const handleAddAyat = (surah) => {
    setSelectedSurah(surah)
    setSelectedAyat(null)
    setAyatFormData({
      ayat: '',
      ur: '',
      eng: ''
    })
    setShowAyatModal(true)
  }

  const handleSaveAyat = async () => {
    try {
      const docRef = doc(db, 'quranic_surahs', selectedSurah.number.toString())
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const currentData = docSnap.data()
        const updatedAyat = [...currentData.ayat]
        
        const newAyat = {
          ayat: parseInt(ayatFormData.ayat),
          ur: ayatFormData.ur,
          eng: ayatFormData.eng,
          words: selectedAyat !== null ? updatedAyat[selectedAyat].words : []
        }
        
        if (selectedAyat !== null) {
          updatedAyat[selectedAyat] = newAyat
        } else {
          updatedAyat.push(newAyat)
        }
        
        await setDoc(docRef, {
          ...currentData,
          ayat: updatedAyat
        })
        
        setShowAyatModal(false)
        fetchSurahs()
        alert('Ayat saved successfully!')
      }
    } catch (error) {
      console.error('Error saving ayat:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleDeleteAyat = async (surah, ayatIndex) => {
    if (!confirm('Are you sure you want to delete this ayat?')) return
    
    try {
      const docRef = doc(db, 'quranic_surahs', surah.number.toString())
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const currentData = docSnap.data()
        const updatedAyat = currentData.ayat.filter((_, i) => i !== ayatIndex)
        
        await setDoc(docRef, {
          ...currentData,
          ayat: updatedAyat
        })
        
        fetchSurahs()
        alert('Ayat deleted successfully!')
      }
    } catch (error) {
      console.error('Error deleting ayat:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleEditWord = (surah, ayatIndex, wordIndex) => {
    setSelectedSurah(surah)
    setSelectedAyat(ayatIndex)
    const word = surah.ayat[ayatIndex].words[wordIndex]
    setWordFormData({
      arabic: word.arabic || '',
      urdu: word.urdu || '',
      english: word.english || ''
    })
    setShowWordModal(true)
  }

  const handleAddWord = (surah, ayatIndex) => {
    setSelectedSurah(surah)
    setSelectedAyat(ayatIndex)
    setWordFormData({
      arabic: '',
      urdu: '',
      english: ''
    })
    setShowWordModal(true)
  }

  const handleSaveWord = async () => {
    try {
      const docRef = doc(db, 'quranic_surahs', selectedSurah.number.toString())
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const currentData = docSnap.data()
        const updatedAyat = [...currentData.ayat]
        const currentWords = [...(updatedAyat[selectedAyat].words || [])]
        
        currentWords.push(wordFormData)
        updatedAyat[selectedAyat].words = currentWords
        
        await setDoc(docRef, {
          ...currentData,
          ayat: updatedAyat
        })
        
        setShowWordModal(false)
        fetchSurahs()
        alert('Word saved successfully!')
      }
    } catch (error) {
      console.error('Error saving word:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleDeleteWord = async (surah, ayatIndex, wordIndex) => {
    if (!confirm('Are you sure you want to delete this word?')) return
    
    try {
      const docRef = doc(db, 'quranic_surahs', surah.number.toString())
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const currentData = docSnap.data()
        const updatedAyat = [...currentData.ayat]
        const updatedWords = updatedAyat[ayatIndex].words.filter((_, i) => i !== wordIndex)
        
        updatedAyat[ayatIndex].words = updatedWords
        
        await setDoc(docRef, {
          ...currentData,
          ayat: updatedAyat
        })
        
        fetchSurahs()
        alert('Word deleted successfully!')
      }
    } catch (error) {
      console.error('Error deleting word:', error)
      alert('Error: ' + error.message)
    }
  }

  const filteredSurahs = surahs.filter(surah =>
    searchTerm === '' ||
    surah.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    surah.number.toString().includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Quranic Surahs (78-114)</h1>
                <p className="text-sm text-gray-600">{surahs.length} surahs</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search surahs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {filteredSurahs.map((surah) => (
            <div key={surah.number} className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Surah Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-white text-purple-600 px-4 py-2 rounded-full text-lg font-bold">
                        #{surah.number}
                      </span>
                      <span className="bg-purple-500 px-3 py-1 rounded-full text-sm font-semibold">
                        {surah.ayat.length} Ayat
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold" dir="rtl">{surah.name}</h2>
                    <p className="text-purple-200 text-sm mt-1">Key: {surah.surah_key}</p>
                  </div>
                  <button
                    onClick={() => handleAddAyat(surah)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition font-semibold"
                  >
                    <Plus size={20} />
                    Add Ayat
                  </button>
                </div>
              </div>

              {/* Ayat List */}
              <div className="p-6 space-y-4">
                {surah.ayat.map((ayat, ayatIndex) => (
                  <div key={ayatIndex} className="border-2 border-purple-100 rounded-xl p-4">
                    {/* Ayat Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-purple-100">
                      <div className="flex items-center gap-3">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                          Ayat #{ayat.ayat}
                        </span>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {ayat.words?.length || 0} words
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditAyat(surah, ayatIndex)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteAyat(surah, ayatIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Ayat Content */}
                    <div className="space-y-3 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Urdu</p>
                        <p className="text-base text-right" dir="rtl">{ayat.ur}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">English</p>
                        <p className="text-sm">{ayat.eng}</p>
                      </div>
                    </div>

                    {/* Words Section */}
                    <div className="border-t-2 border-purple-100 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-purple-900">Word-by-Word Translation</h4>
                        <button
                          onClick={() => handleAddWord(surah, ayatIndex)}
                          className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm font-semibold"
                        >
                          <Plus size={16} />
                          Add Word
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ayat.words?.map((word, wordIndex) => (
                          <div key={wordIndex} className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                                Word #{wordIndex + 1}
                              </span>
                              <button
                                onClick={() => handleDeleteWord(surah, ayatIndex, wordIndex)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xl text-right font-semibold" dir="rtl">{word.arabic}</p>
                              <p className="text-sm text-right text-gray-600" dir="rtl">{word.urdu}</p>
                              <p className="text-xs text-gray-500">{word.english}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {surah.ayat.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="mx-auto mb-3" size={48} />
                    <p>No ayat yet. Click "Add Ayat" to get started.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Ayat Modal */}
      {showAyatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedAyat !== null ? 'Edit Ayat' : 'Add New Ayat'}
              </h2>
              <button
                onClick={() => setShowAyatModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ayat Number *
                </label>
                <input
                  type="number"
                  value={ayatFormData.ayat}
                  onChange={(e) => setAyatFormData({ ...ayatFormData, ayat: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urdu Translation *
                </label>
                <textarea
                  value={ayatFormData.ur}
                  onChange={(e) => setAyatFormData({ ...ayatFormData, ur: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                  rows="3"
                  dir="rtl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  English Translation *
                </label>
                <textarea
                  value={ayatFormData.eng}
                  onChange={(e) => setAyatFormData({ ...ayatFormData, eng: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  rows="3"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveAyat}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  <Save size={20} />
                  Save Ayat
                </button>
                <button
                  onClick={() => setShowAyatModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Word Modal */}
      {showWordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add Word Translation</h2>
              <button
                onClick={() => setShowWordModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arabic Word *
                </label>
                <input
                  type="text"
                  value={wordFormData.arabic}
                  onChange={(e) => setWordFormData({ ...wordFormData, arabic: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-2xl"
                  dir="rtl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urdu Translation *
                </label>
                <input
                  type="text"
                  value={wordFormData.urdu}
                  onChange={(e) => setWordFormData({ ...wordFormData, urdu: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                  dir="rtl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  English Translation *
                </label>
                <input
                  type="text"
                  value={wordFormData.english}
                  onChange={(e) => setWordFormData({ ...wordFormData, english: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveWord}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  <Save size={20} />
                  Add Word
                </button>
                <button
                  onClick={() => setShowWordModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}