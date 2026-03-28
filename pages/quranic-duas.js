import { useEffect, useState } from 'react'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/router'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export default function QuranicDuasPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    arabic: '',
    urdu_translation: '',
    surah_number: '',
    id: '',
    prophet_en: '',
    prophet_ur: '',
    category: 'rabana' // For new duas
  })
  const router = useRouter()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'quranic_duas'))
      const data = []
      
      snapshot.docs.forEach(doc => {
        const docData = doc.data()
        const docName = doc.id
        const prayersArray = docData.prayers || {}
        
        Object.entries(prayersArray).forEach(([index, prayerData]) => {
          data.push({
            itemId: `${doc.id}_${index}`,
            docId: doc.id,
            docName: docName,
            index: index,
            arabic: prayerData.arabic || '',
            urdu_translation: prayerData.urdu_translation || '',
            surah_number: prayerData.surah_number || '',
            id: prayerData.id || '',
            prophet_en: prayerData.prophet_en || '',
            prophet_ur: prayerData.prophet_ur || ''
          })
        })
      })
      
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
      // Determine which document to update
      const targetDocId = editingItem ? editingItem.docId : formData.category
      const docRef = doc(db, 'quranic_duas', targetDocId)
      const snapshot = await getDocs(collection(db, 'quranic_duas'))
      const document = snapshot.docs.find(d => d.id === targetDocId)
      
      if (document) {
        const currentData = document.data()
        const updatedPrayers = { ...currentData.prayers }
        
        if (editingItem) {
          // Update existing
          updatedPrayers[editingItem.index] = {
            arabic: formData.arabic,
            urdu_translation: formData.urdu_translation,
            surah_number: formData.surah_number,
            id: formData.id,
            prophet_en: formData.prophet_en,
            prophet_ur: formData.prophet_ur
          }
        } else {
          // Add new
          const nextIndex = Math.max(...Object.keys(updatedPrayers).map(Number), -1) + 1
          updatedPrayers[nextIndex] = {
            arabic: formData.arabic,
            urdu_translation: formData.urdu_translation,
            surah_number: formData.surah_number,
            id: formData.id,
            prophet_en: formData.prophet_en,
            prophet_ur: formData.prophet_ur
          }
        }
        
        await updateDoc(docRef, { prayers: updatedPrayers })
      }
      
      setShowModal(false)
      setFormData({ arabic: '', urdu_translation: '', surah_number: '', id: '', prophet_en: '', prophet_ur: '', category: 'rabana' })
      setEditingItem(null)
      fetchItems()
    } catch (error) {
      alert('Error saving: ' + error.message)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      arabic: item.arabic || '',
      urdu_translation: item.urdu_translation || '',
      surah_number: item.surah_number || '',
      id: item.id || '',
      prophet_en: item.prophet_en || '',
      prophet_ur: item.prophet_ur || '',
      category: item.docName
    })
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({ arabic: '', urdu_translation: '', surah_number: '', id: '', prophet_en: '', prophet_ur: '', category: 'rabana' })
    setShowModal(true)
  }

  const handleDelete = async (item) => {
    if (confirm('Are you sure you want to delete this dua?')) {
      try {
        const docRef = doc(db, 'quranic_duas', item.docId)
        const snapshot = await getDocs(collection(db, 'quranic_duas'))
        const document = snapshot.docs.find(d => d.id === item.docId)
        
        if (document) {
          const currentData = document.data()
          const updatedPrayers = { ...currentData.prayers }
          delete updatedPrayers[item.index]
          
          await updateDoc(docRef, { prayers: updatedPrayers })
        }
        fetchItems()
      } catch (error) {
        alert('Error deleting: ' + error.message)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  // Group by document (rabana, rabi)
  const groupedByDoc = items.reduce((acc, item) => {
    if (!acc[item.docName]) {
      acc[item.docName] = []
    }
    acc[item.docName].push(item)
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
              <h1 className="text-2xl font-bold text-gray-800">Quranic Duas</h1>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus size={20} />
              Add New Dua
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {Object.entries(groupedByDoc).map(([docName, duas]) => (
            <div key={docName}>
              {/* Category Header */}
              <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-2xl p-6 mb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold capitalize">{docName}</h2>
                    <p className="text-green-100 mt-1">
                      {duas.length} Dua{duas.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="bg-green-500 px-4 py-2 rounded-full text-sm font-semibold">
                    Category
                  </span>
                </div>
              </div>

              {/* Duas in this category */}
              <div className="bg-white rounded-b-2xl shadow-lg p-6 space-y-4">
                {duas.map((item, index) => (
                  <div key={item.itemId} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                          #{index + 1}
                        </span>
                        {item.surah_number && (
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {item.surah_number}
                          </span>
                        )}
                        {item.id && (
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                            ID: {item.id}
                          </span>
                        )}
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
                        <p className="text-sm font-medium text-gray-600 mb-2">Arabic</p>
                        <p className="text-xl text-right leading-loose bg-gray-50 p-4 rounded-lg" dir="rtl">
                          {item.arabic}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Urdu Translation</p>
                        <p className="text-base text-right leading-relaxed bg-gray-50 p-4 rounded-lg" dir="rtl">
                          {item.urdu_translation}
                        </p>
                      </div>
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
                {editingItem ? `Edit Dua - ${editingItem.docName}` : 'Add New Dua'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category selector - only show when adding new */}
              {!editingItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="rabana">Rabana (ربنا)</option>
                    <option value="rabi">Rabi (رب)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Surah Number
                  </label>
                  <input
                    type="text"
                    value={formData.surah_number}
                    onChange={(e) => setFormData({ ...formData, surah_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Surah No 2 : آیت نمبر - Ayat No 127"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prophet Name (English)
                  </label>
                  <input
                    type="text"
                    value={formData.prophet_en}
                    onChange={(e) => setFormData({ ...formData, prophet_en: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="e.g. Prophet Ibrahim (AS)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prophet Name (Urdu)
                  </label>
                  <input
                    type="text"
                    value={formData.prophet_ur}
                    onChange={(e) => setFormData({ ...formData, prophet_ur: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-right"
                    placeholder="مثلاً: حضرت ابراہیم ؑ"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arabic Text *
                </label>
                <textarea
                  value={formData.arabic}
                  onChange={(e) => setFormData({ ...formData, arabic: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-xl leading-loose"
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
                  value={formData.urdu_translation}
                  onChange={(e) => setFormData({ ...formData, urdu_translation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-lg leading-relaxed"
                  rows="3"
                  dir="rtl"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  <Save size={20} />
                  {editingItem ? 'Update' : 'Add'} Dua
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