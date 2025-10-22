import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/router'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export default function WuduPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    step_number: '',
    arabic: '',
    english_translation: '',
    urdu_translation: '',
    description: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'wudu'))
      const data = []
      
      snapshot.docs.forEach(doc => {
        const docData = doc.data()
        const stepsArray = docData.steps || {}
        
        Object.entries(stepsArray).forEach(([index, stepData]) => {
          data.push({
            id: `${doc.id}_${index}`,
            docId: doc.id,
            index: index,
            step_number: stepData.step_number || '',
            arabic: stepData.arabic || '',
            english_translation: stepData.english_translation || '',
            urdu_translation: stepData.urdu_translation || '',
            description: stepData.description || ''
          })
        })
      })
      
      // Sort by step_number
      data.sort((a, b) => Number(a.step_number) - Number(b.step_number))
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
        // Update existing step
        const docRef = doc(db, 'wudu', editingItem.docId)
        const snapshot = await getDocs(collection(db, 'wudu'))
        const document = snapshot.docs.find(d => d.id === editingItem.docId)
        
        if (document) {
          const currentData = document.data()
          const updatedSteps = { ...currentData.steps }
          updatedSteps[editingItem.index] = {
            step_number: formData.step_number,
            arabic: formData.arabic,
            english_translation: formData.english_translation,
            urdu_translation: formData.urdu_translation,
            description: formData.description
          }
          
          await updateDoc(docRef, { steps: updatedSteps })
        }
      } else {
        // Create new document with first step
        await addDoc(collection(db, 'wudu'), {
          steps: {
            0: {
              step_number: formData.step_number,
              arabic: formData.arabic,
              english_translation: formData.english_translation,
              urdu_translation: formData.urdu_translation,
              description: formData.description
            }
          }
        })
      }
      
      setShowModal(false)
      setFormData({
        step_number: '',
        arabic: '',
        english_translation: '',
        urdu_translation: '',
        description: ''
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
      step_number: item.step_number || '',
      arabic: item.arabic || '',
      english_translation: item.english_translation || '',
      urdu_translation: item.urdu_translation || '',
      description: item.description || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (item) => {
    if (confirm('Are you sure you want to delete this wudu step?')) {
      try {
        const docRef = doc(db, 'wudu', item.docId)
        const snapshot = await getDocs(collection(db, 'wudu'))
        const document = snapshot.docs.find(d => d.id === item.docId)
        
        if (document) {
          const currentData = document.data()
          const updatedSteps = { ...currentData.steps }
          delete updatedSteps[item.index]
          
          // If no steps left, delete entire document
          if (Object.keys(updatedSteps).length === 0) {
            await deleteDoc(docRef)
          } else {
            await updateDoc(docRef, { steps: updatedSteps })
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
    setFormData({
      step_number: '',
      arabic: '',
      english_translation: '',
      urdu_translation: '',
      description: ''
    })
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
              <h1 className="text-2xl font-bold text-gray-800">Wudu Steps Management</h1>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              Add New Step
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
                  <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-lg font-bold">
                    Step {item.step_number}
                  </span>
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
                  <p className="text-xl text-right leading-loose bg-blue-50 p-4 rounded-lg" dir="rtl">
                    {item.arabic}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">English Translation</p>
                  <p className="text-base leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {item.english_translation}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Urdu Translation</p>
                  <p className="text-lg text-right leading-relaxed bg-blue-50 p-4 rounded-lg" dir="rtl">
                    {item.urdu_translation}
                  </p>
                </div>
                
                {item.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Description</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {item.description}
                    </p>
                  </div>
                )}
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
                {editingItem ? `Edit Step ${editingItem.step_number}` : 'Add New Wudu Step'}
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
                  Step Number *
                </label>
                <input
                  type="number"
                  value={formData.step_number}
                  onChange={(e) => setFormData({ ...formData, step_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min="1"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xl leading-loose"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows="3"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg leading-relaxed"
                  rows="3"
                  dir="rtl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows="2"
                  placeholder="Additional instructions or notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  <Save size={20} />
                  {editingItem ? 'Update' : 'Add'} Step
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