import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/router'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export default function AttributesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({ english: '', name: '', urdu: '' })
  const router = useRouter()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'attributes_of_allah'))
      const data = []
      
      snapshot.docs.forEach(doc => {
        const docData = doc.data()
        const allahAttributes = docData.allah || {}
        
        // Extract all attributes from this document
        Object.entries(allahAttributes).map(([index, attrData]) => {
          data.push({
            id: `${doc.id}_${index}`,
            docId: doc.id,
            index: index,
            english: attrData.english || '',
            name: attrData.name || '',
            urdu: attrData.urdu || ''
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
      if (editingItem) {
        // Update existing attribute within the document
        const docRef = doc(db, 'attributes_of_allah', editingItem.docId)
        const docSnap = await getDocs(collection(db, 'attributes_of_allah'))
        const document = docSnap.docs.find(d => d.id === editingItem.docId)
        
        if (document) {
          const currentData = document.data()
          const updatedAllah = { ...currentData.allah }
          updatedAllah[editingItem.index] = formData
          
          await updateDoc(docRef, { allah: updatedAllah })
        }
      } else {
        // Create new document with allah.0 structure
        await addDoc(collection(db, 'attributes_of_allah'), {
          allah: {
            0: formData
          }
        })
      }
      setShowModal(false)
      setFormData({ english: '', name: '', urdu: '' })
      setEditingItem(null)
      fetchItems()
    } catch (error) {
      alert('Error saving: ' + error.message)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({ english: item.english || '', name: item.name || '', urdu: item.urdu || '' })
    setShowModal(true)
  }

  const handleDelete = async (item) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const docRef = doc(db, 'attributes_of_allah', item.docId)
        const docSnap = await getDocs(collection(db, 'attributes_of_allah'))
        const document = docSnap.docs.find(d => d.id === item.docId)
        
        if (document) {
          const currentData = document.data()
          const updatedAllah = { ...currentData.allah }
          delete updatedAllah[item.index]
          
          // If no attributes left, delete the entire document
          if (Object.keys(updatedAllah).length === 0) {
            await deleteDoc(docRef)
          } else {
            await updateDoc(docRef, { allah: updatedAllah })
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
    setFormData({ english: '', name: '', urdu: '' })
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
      {/* Header */}
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
              <h1 className="text-2xl font-bold text-gray-800">Allah's Names</h1>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={20} />
              Add New
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Arabic Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">English</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Urdu</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-lg">{item.name}</td>
                  <td className="px-6 py-4 text-gray-700">{item.english}</td>
                  <td className="px-6 py-4 text-lg">{item.urdu}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingItem ? 'Edit Name' : 'Add New Name'}
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
                  Arabic Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  English Translation
                </label>
                <input
                  type="text"
                  value={formData.english}
                  onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urdu Translation
                </label>
                <input
                  type="text"
                  value={formData.urdu}
                  onChange={(e) => setFormData({ ...formData, urdu: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                >
                  <Save size={20} />
                  {editingItem ? 'Update' : 'Add'}
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