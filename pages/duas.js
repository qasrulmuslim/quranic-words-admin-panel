import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/router'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export default function DuasPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    arabic: '',
    english_translation: '',
    urdu_translation: '',
    title: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'duas'))
      const data = []
      
      snapshot.docs.forEach(doc => {
        const docData = doc.data()
        const title = docData.title || 'Dua'
        const duasArray = docData.duas || {}
        
        // Extract all duas from this document
        const documentDuas = Object.entries(duasArray).map(([index, duaData]) => ({
          id: `${doc.id}_${index}`,
          docId: doc.id,
          index: index,
          title: title,
          arabic: duaData.arabic || '',
          english_translation: duaData.english_translation || '',
          urdu_translation: duaData.urdu_translation || ''
        }))
        
        data.push(...documentDuas)
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
      if (editingItem) {
        // Update existing dua within the document
        const docRef = doc(db, 'duas', editingItem.docId)
        const docSnap = await getDocs(collection(db, 'duas'))
        const document = docSnap.docs.find(d => d.id === editingItem.docId)
        
        if (document) {
          const currentData = document.data()
          const updatedDuas = { ...currentData.duas }
          updatedDuas[editingItem.index] = {
            arabic: formData.arabic,
            english_translation: formData.english_translation,
            urdu_translation: formData.urdu_translation
          }
          
          await updateDoc(docRef, { 
            title: formData.title,
            duas: updatedDuas 
          })
        }
      } else {
        // Create new document with duas.0 structure
        await addDoc(collection(db, 'duas'), {
          title: formData.title,
          duas: {
            0: {
              arabic: formData.arabic,
              english_translation: formData.english_translation,
              urdu_translation: formData.urdu_translation
            }
          }
        })
      }
      setShowModal(false)
      setFormData({ arabic: '', english_translation: '', urdu_translation: '', title: '' })
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
      english_translation: item.english_translation || '',
      urdu_translation: item.urdu_translation || '',
      title: item.title || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (item) => {
    if (confirm('Are you sure you want to delete this dua?')) {
      try {
        const docRef = doc(db, 'duas', item.docId)
        const docSnap = await getDocs(collection(db, 'duas'))
        const document = docSnap.docs.find(d => d.id === item.docId)
        
        if (document) {
          const currentData = document.data()
          const updatedDuas = { ...currentData.duas }
          delete updatedDuas[item.index]
          
          // If no duas left in the document, delete the entire document
          if (Object.keys(updatedDuas).length === 0) {
            await deleteDoc(docRef)
          } else {
            await updateDoc(docRef, { duas: updatedDuas })
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
    setFormData({ arabic: '', english_translation: '', urdu_translation: '', title: '' })
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
              <h1 className="text-2xl font-bold text-gray-800">Duas Management</h1>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={20} />
              Add New Dua
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{item.title || 'Dua'}</h3>
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
                  <p className="text-sm text-gray-500 mb-1">Arabic</p>
                  <p className="text-xl text-right" dir="rtl">{item.arabic}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">English Translation</p>
                  <p className="text-gray-700">{item.english_translation}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Urdu Translation</p>
                  <p className="text-lg text-right" dir="rtl">{item.urdu_translation}</p>
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
                {editingItem ? 'Edit Dua' : 'Add New Dua'}
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
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg"
                  dir="rtl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arabic Text *
                </label>
                <textarea
                  value={formData.arabic}
                  onChange={(e) => setFormData({ ...formData, arabic: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-xl"
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
                  value={formData.english_translation}
                  onChange={(e) => setFormData({ ...formData, english_translation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  rows="2"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-xl"
                  rows="2"
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