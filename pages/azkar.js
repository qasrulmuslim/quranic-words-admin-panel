import { useEffect, useState } from 'react'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/router'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export default function AzkarPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [documentId, setDocumentId] = useState(null)
  const [formData, setFormData] = useState({
    arabic: '',
    english: '',
    urdu: '',
    repeats: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'morning_evening_azkar'))
      const data = []
      
      snapshot.docs.forEach(doc => {
        const docData = doc.data()
        setDocumentId(doc.id)
        const azkarArray = docData.azkar || {}
        
        Object.entries(azkarArray).forEach(([index, azkarData]) => {
          data.push({
            id: `${doc.id}_${index}`,
            docId: doc.id,
            index: index,
            arabic: azkarData.arabic || '',
            english: azkarData.english || '',
            urdu: azkarData.urdu || '',
            repeats: azkarData.repeats || ''
          })
        })
      })
      
      // Sort by index
      data.sort((a, b) => Number(a.index) - Number(b.index))
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
      const docRef = doc(db, 'morning_evening_azkar', documentId)
      const snapshot = await getDocs(collection(db, 'morning_evening_azkar'))
      const document = snapshot.docs.find(d => d.id === documentId)
      
      if (document) {
        const currentData = document.data()
        const updatedAzkar = { ...currentData.azkar }
        
        if (editingItem) {
          // Update existing
          updatedAzkar[editingItem.index] = {
            arabic: formData.arabic,
            english: formData.english,
            urdu: formData.urdu,
            repeats: formData.repeats
          }
        } else {
          // Add new
          const nextIndex = Math.max(...Object.keys(updatedAzkar).map(Number), -1) + 1
          updatedAzkar[nextIndex] = {
            arabic: formData.arabic,
            english: formData.english,
            urdu: formData.urdu,
            repeats: formData.repeats
          }
        }
        
        await updateDoc(docRef, { azkar: updatedAzkar })
      }
      
      setShowModal(false)
      setFormData({ arabic: '', english: '', urdu: '', repeats: '' })
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
      english: item.english || '',
      urdu: item.urdu || '',
      repeats: item.repeats || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (item) => {
    if (confirm('Are you sure you want to delete this azkar?')) {
      try {
        const docRef = doc(db, 'morning_evening_azkar', item.docId)
        const snapshot = await getDocs(collection(db, 'morning_evening_azkar'))
        const document = snapshot.docs.find(d => d.id === item.docId)
        
        if (document) {
          const currentData = document.data()
          const updatedAzkar = { ...currentData.azkar }
          delete updatedAzkar[item.index]
          
          await updateDoc(docRef, { azkar: updatedAzkar })
        }
        fetchItems()
      } catch (error) {
        alert('Error deleting: ' + error.message)
      }
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({ arabic: '', english: '', urdu: '', repeats: '' })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

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
              <h1 className="text-2xl font-bold text-gray-800">Morning & Evening Azkar</h1>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={20} />
              Add New Azkar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {items.map((item, index) => (
            <div key={item.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-lg font-bold">
                    #{index + 1}
                  </span>
                  {item.repeats && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {item.repeats}
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
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Arabic</p>
                  <p className="text-xl text-right leading-loose bg-gray-50 p-4 rounded-lg" dir="rtl">
                    {item.arabic}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">English Translation</p>
                  <p className="text-base leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {item.english}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Urdu Translation</p>
                  <p className="text-base text-right leading-relaxed bg-gray-50 p-4 rounded-lg" dir="rtl">
                    {item.urdu}
                  </p>
                </div>
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
                {editingItem ? 'Edit Azkar' : 'Add New Azkar'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repeats (How many times)
                </label>
                <input
                  type="text"
                  value={formData.repeats}
                  onChange={(e) => setFormData({ ...formData, repeats: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Thrice in the morning (صبح و شام)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arabic Text *
                </label>
                <textarea
                  value={formData.arabic}
                  onChange={(e) => setFormData({ ...formData, arabic: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-xl leading-loose"
                  rows="4"
                  dir="rtl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  English Translation *
                </label>
                <textarea
                  value={formData.english}
                  onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urdu Translation *
                </label>
                <textarea
                  value={formData.urdu}
                  onChange={(e) => setFormData({ ...formData, urdu: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg leading-relaxed"
                  rows="3"
                  dir="rtl"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                >
                  <Save size={20} />
                  {editingItem ? 'Update' : 'Add'} Azkar
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