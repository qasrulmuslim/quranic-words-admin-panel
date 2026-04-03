import { useEffect, useState } from 'react'
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/router'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export default function HadeesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    book: '',
    hadith_number: '',
    text_arabic: '',
    text_urdu: '',
    text_english: '',
    surah_id: '',
    surah_name_arabic: '',
    surah_name_english: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'hadees_data'))
      const data = []
      
      snapshot.docs.forEach(doc => {
        const docData = doc.data()
        const hadithsArray = docData.hadiths || {}
        
        Object.entries(hadithsArray).forEach(([index, hadithData]) => {
          data.push({
            id: `${doc.id}_${index}`,
            docId: doc.id,
            index: index,
            book: hadithData.book || '',
            hadith_number: hadithData.hadith_number || '',
            text_arabic: hadithData.text_arabic || '',
            text_urdu: hadithData.text_urdu || '',
            text_english: hadithData.text_english || '',
            surah_id: docData.surah_id || '',           // FROM DOCUMENT ROOT
            surah_name_arabic: docData.surah_name_arabic || '',  // FROM DOCUMENT ROOT
            surah_name_english: docData.surah_name_english || '' // FROM DOCUMENT ROOT
          })
        })
      })
      
      data.sort((a, b) => (a.surah_id || 0) - (b.surah_id || 0))
      setItems(data)
    } catch (error) {
      alert('Error fetching data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const surahId = formData.surah_id.toString() // Use surah_id as document ID
      
      if (editingItem) {
        // Update existing hadith
        const docRef = doc(db, 'hadees_data', editingItem.docId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const currentData = docSnap.data()
          const updatedHadiths = { ...currentData.hadiths }
          updatedHadiths[editingItem.index] = {
            book: formData.book,
            text_arabic: formData.text_arabic,
            text_urdu: formData.text_urdu,
            text_english: formData.text_english,
            hadith_number: formData.hadith_number
          }
          
          await updateDoc(docRef, { 
            hadiths: updatedHadiths,
            surah_id: parseInt(formData.surah_id),
            surah_name_arabic: formData.surah_name_arabic,
            surah_name_english: formData.surah_name_english
          })
        }
      } else {
        // ✅ FIX: Use setDoc with surah_id as document ID
        await setDoc(doc(db, 'hadees_data', surahId), {
          surah_id: parseInt(formData.surah_id),
          surah_name_arabic: formData.surah_name_arabic,
          surah_name_english: formData.surah_name_english,
          hadiths: {
            0: {
              book: formData.book,
              text_arabic: formData.text_arabic,
              text_urdu: formData.text_urdu,
              text_english: formData.text_english,
              hadith_number: formData.hadith_number
            }
          }
        })
      }
      
      setShowModal(false)
      setFormData({
        surah_id: '',
        surah_name_arabic: '',
        surah_name_english: '',
        book: '',
        text_arabic: '',
        text_urdu: '',
        text_english: '',
        hadith_number: ''
      })
      setEditingItem(null)
      fetchItems()
    } catch (error) {
      alert('Error saving: ' + error.message)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      book: item.book || '',
      hadith_number: item.hadith_number || '',
      text_arabic: item.text_arabic || '',
      text_urdu: item.text_urdu || '',
      text_english: item.text_english || '',
      surah_id: item.surah_id || '',
      surah_name_arabic: item.surah_name_arabic || '',
      surah_name_english: item.surah_name_english || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (item) => {
    if (confirm('Are you sure you want to delete this hadith?')) {
      try {
        const docRef = doc(db, 'hadees_data', item.docId)
        const docSnap = await getDocs(collection(db, 'hadees_data'))
        const document = docSnap.docs.find(d => d.id === item.docId)
        
        if (document) {
          const currentData = document.data()
          const updatedHadiths = { ...currentData.hadiths }
          delete updatedHadiths[item.index]
          
          if (Object.keys(updatedHadiths).length === 0) {
            await deleteDoc(docRef)
          } else {
            await updateDoc(docRef, { hadiths: updatedHadiths })
          }
        }
        fetchItems()
      } catch (error) {
        alert('Error deleting: ' + error.message)
      }
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({ book: '', hadith_number: '', text_arabic: '', text_urdu: '', text_english: '', surah_id: '', surah_name_arabic: '', surah_name_english: '' })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  // Group items by surah
  const groupedBySurah = items.reduce((acc, item) => {
    const surahKey = (item.surah_id && item.surah_id !== '') ? item.surah_id : 'no_surah'
    if (!acc[surahKey]) {
      acc[surahKey] = {
        surah_id: item.surah_id,
        surah_name_arabic: item.surah_name_arabic,
        surah_name_english: item.surah_name_english,
        hadiths: []
      }
    }
    acc[surahKey].hadiths.push(item)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Hadees Management</h1>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={20} />
              Add New Hadith
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {Object.values(groupedBySurah).map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* MAIN SURAH HEADER - ONLY SHOW IF SURAH INFO EXISTS */}
              {group.surah_id && group.surah_id !== '' && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl p-8 mb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-white text-indigo-600 px-5 py-2 rounded-full text-lg font-bold">
                          Surah #{group.surah_id}
                        </span>
                        <span className="bg-indigo-500 px-4 py-2 rounded-full text-sm font-semibold">
                          {group.hadiths.length} Hadith{group.hadiths.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <h1 className="text-4xl font-bold mb-2" dir="rtl">
                        {group.surah_name_arabic}
                      </h1>
                      <p className="text-xl text-indigo-100">
                        {group.surah_name_english}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* If no surah info, show a simple header */}
              {(!group.surah_id || group.surah_id === '') && (
                <div className="bg-gray-600 text-white rounded-t-2xl p-6 mb-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Other Hadiths</h2>
                    <span className="bg-gray-500 px-4 py-2 rounded-full text-sm font-semibold">
                      {group.hadiths.length} Hadith{group.hadiths.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* HADITHS UNDER THIS SURAH */}
              <div className="bg-white rounded-b-2xl shadow-lg p-6 space-y-4">
                {group.hadiths.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                          #{index + 1}
                        </span>
                        <div>
                          <h3 className="text-base font-semibold text-gray-800">{item.book}</h3>
                          <p className="text-xs text-gray-500">Hadith #{item.hadith_number}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Arabic Text</p>
                        <p className="text-lg text-right leading-loose bg-gray-50 p-4 rounded-lg" dir="rtl">
                          {item.text_arabic}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Urdu Translation</p>
                        <p className="text-base text-right leading-relaxed bg-gray-50 p-4 rounded-lg" dir="rtl">
                          {item.text_urdu}
                        </p>
                      </div>

                      {item.text_english && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">English Translation</p>
                          <p className="text-base leading-relaxed bg-gray-50 p-4 rounded-lg">
                            {item.text_english}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingItem ? 'Edit Hadith' : 'Add New Hadith'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Book Name *
                  </label>
                  <input
                    type="text"
                    value={formData.book}
                    onChange={(e) => setFormData({ ...formData, book: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg"
                    dir="rtl"
                    placeholder="صحیح البخاری"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hadith Number *
                  </label>
                  <input
                    type="text"
                    value={formData.hadith_number}
                    onChange={(e) => setFormData({ ...formData, hadith_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="4704"
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Surah Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Surah ID
                    </label>
                    <input
                      type="number"
                      value={formData.surah_id}
                      onChange={(e) => setFormData({ ...formData, surah_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="113"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Surah Name (Arabic)
                    </label>
                    <input
                      type="text"
                      value={formData.surah_name_arabic}
                      onChange={(e) => setFormData({ ...formData, surah_name_arabic: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg"
                      dir="rtl"
                      placeholder="سورۃ الفلق"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Surah Name (English)
                    </label>
                    <input
                      type="text"
                      value={formData.surah_name_english}
                      onChange={(e) => setFormData({ ...formData, surah_name_english: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Surah Al-Falaq"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arabic Text *
                </label>
                <textarea
                  value={formData.text_arabic}
                  onChange={(e) => setFormData({ ...formData, text_arabic: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg leading-loose"
                  rows="4"
                  dir="rtl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urdu Translation *
                </label>
                <textarea
                  value={formData.text_urdu}
                  onChange={(e) => setFormData({ ...formData, text_urdu: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base leading-relaxed"
                  rows="4"
                  dir="rtl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  English Translation
                </label>
                <textarea
                  value={formData.text_english}
                  onChange={(e) => setFormData({ ...formData, text_english: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base leading-relaxed"
                  rows="4"
                  placeholder="English translation..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                >
                  <Save size={20} />
                  {editingItem ? 'Update' : 'Add'} Hadith
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}