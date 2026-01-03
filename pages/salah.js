import { useEffect, useState } from 'react'
import { collection, getDocs, updateDoc, doc, deleteField, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/router'
import { ArrowLeft, ChevronDown, ChevronUp, Edit2, Save, X, Plus, Trash2 } from 'lucide-react'

export default function SalahAzkarPage() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [isAddMode, setIsAddMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, 'salah_azkar'))
      const allData = {}
      
      snapshot.docs.forEach(doc => {
        allData[doc.id] = doc.data()
      })
      
      setData({ ...allData })
      return allData
    } catch (error) {
      alert('Error fetching data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (docId, path, itemData) => {
    setIsAddMode(false)
    setEditingItem({ docId, path, itemData })
    
    // Ensure reference, explanation, and translation fields are properly set
    const editData = { ...itemData }
    
    // If old 'reference' field exists, copy to reference_urdu
    if (editData.reference && !editData.reference_urdu) {
      editData.reference_urdu = editData.reference
    }
    
    // If old 'explanation' field exists, copy to explanation_urdu
    if (editData.explanation && !editData.explanation_urdu) {
      editData.explanation_urdu = editData.explanation
    }
    
    // Always ensure English fields exist
    if (editData.reference_english === undefined) {
      editData.reference_english = ''
    }
    if (editData.explanation_english === undefined) {
      editData.explanation_english = ''
    }
    if (editData.translation_english === undefined && editData.translation_en === undefined && editData.english === undefined) {
      // Add the appropriate translation_english field based on what exists
      if (editData.translation_urdu !== undefined) {
        editData.translation_english = ''
      } else if (editData.translation_en !== undefined) {
        // Already has translation_en, that's fine
      } else if (editData.urdu !== undefined) {
        editData.english = ''
      }
    }
    
    setFormData(editData)
    setShowModal(true)
  }

  const handleAdd = (docId, path, template) => {
    setIsAddMode(true)
    setEditingItem({ docId, path })
    setFormData(template)
    setShowModal(true)
  }

  const handleDelete = async (docId, path) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      const docRef = doc(db, 'salah_azkar', docId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        alert('Document not found!')
        return
      }
      
      const data = JSON.parse(JSON.stringify(docSnap.data()))
      const pathParts = path.split('.')
      
      let parent = data
      for (let i = 0; i < pathParts.length - 1; i++) {
        parent = parent[pathParts[i]]
      }
      
      const keyToDelete = pathParts[pathParts.length - 1]
      const entries = Object.entries(parent)
      const filtered = entries.filter(([key]) => key !== keyToDelete)
      const rebuiltArray = filtered.map(([_, value]) => value)
      
      const parentKey = pathParts[pathParts.length - 2]
      let parentOfParent = data
      for (let i = 0; i < pathParts.length - 2; i++) {
        parentOfParent = parentOfParent[pathParts[i]]
      }
      parentOfParent[parentKey] = rebuiltArray
      
      const removeUndefined = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined).filter(item => item !== undefined)
        }
        if (obj && typeof obj === 'object') {
          const cleaned = {}
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
              cleaned[key] = removeUndefined(value)
            }
          }
          return cleaned
        }
        return obj
      }
      
      const cleanedData = removeUndefined(data)
      await setDoc(docRef, cleanedData)
      await fetchData()
      alert('Deleted successfully!')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleSave = async () => {
    try {
      const docRef = doc(db, 'salah_azkar', editingItem.docId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        alert('Document not found!')
        return
      }
      
      const currentData = JSON.parse(JSON.stringify(docSnap.data()))
      const pathParts = editingItem.path.split('.')
      
      if (isAddMode) {
        let parent = currentData
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!parent[pathParts[i]]) {
            parent[pathParts[i]] = pathParts[i] === 'data' ? [] : {}
          }
          parent = parent[pathParts[i]]
        }
        
        const lastKey = pathParts[pathParts.length - 1]
        
        if (lastKey === 'data') {
          if (!Array.isArray(parent[lastKey])) {
            parent[lastKey] = []
          }
          parent[lastKey].push(formData)
        } else if (editingItem.docId === 'adhan') {
          if (!parent[lastKey]) {
            parent[lastKey] = {}
          }
          const existingKeys = Object.keys(parent[lastKey]).filter(k => !isNaN(k)).map(Number)
          const nextIndex = existingKeys.length > 0 ? Math.max(...existingKeys) + 1 : 0
          parent[lastKey][nextIndex] = formData
        } else {
          parent[lastKey] = formData
        }
      } else {
        let parent = currentData
        for (let i = 0; i < pathParts.length - 1; i++) {
          parent = parent[pathParts[i]]
        }
        parent[pathParts[pathParts.length - 1]] = formData
      }
      
      await setDoc(docRef, currentData)
      
      setShowModal(false)
      setEditingItem(null)
      setFormData({})
      setIsAddMode(false)
      await fetchData()
      alert(isAddMode ? 'Added successfully!' : 'Updated successfully!')
    } catch (error) {
      console.error('Save error:', error)
      alert('Error saving: ' + error.message)
    }
  }

  const toggleSection = (key) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const getAfterSalahTemplate = () => ({
    arabic_text: '',
    translation_en: '',
    translation_urdu: '',
    explanation: '',
    reference_urdu: '',
    reference_english: '',
    title_english: ''
  })

  const getSalahTemplate = () => ({
    step_id: '',
    title_english: '',
    title_urdu: '',
    arabic_text: '',
    translation_urdu: '',
    translation_english: '',
    explanation: '',
    reference_urdu: '',
    reference_english: ''
  })

  const getAdhanTemplate = () => ({
    title_english: '',
    title_urdu: '',
    arabic: '',
    english: '',
    urdu: '',
    explanation_urdu: '',
    explanation_english: '',
    reference_urdu: '',
    reference_english: ''
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Salah Azkar</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* ADHAN DOCUMENT */}
          {data.adhan && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                <h2 className="text-3xl font-bold">Adhan & Related Duas</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Render all adhan sections dynamically */}
                {Object.entries(data.adhan).map(([key, sectionData]) => (
                  <div key={key} className="border border-purple-200 rounded-xl p-6 bg-purple-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-purple-900 mb-2">
                          {sectionData.title_english}
                        </h3>
                        <h4 className="text-lg font-semibold text-purple-700" dir="rtl">
                          {sectionData.title_urdu}
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit('adhan', key, sectionData)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete('adhan', key)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Arabic</p>
                        <p className="text-2xl text-right leading-loose" dir="rtl">{sectionData.arabic}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">English</p>
                        <p className="text-base">{sectionData.english}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Urdu</p>
                        <p className="text-base text-right leading-relaxed" dir="rtl">{sectionData.urdu}</p>
                      </div>
                      
                      {sectionData.explanation_urdu && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Explanation (Urdu)</p>
                          <p className="text-sm text-right leading-relaxed" dir="rtl">{sectionData.explanation_urdu}</p>
                        </div>
                      )}
                      
                      {sectionData.explanation_english && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Explanation (English)</p>
                          <p className="text-sm leading-relaxed">{sectionData.explanation_english}</p>
                        </div>
                      )}
                      
                      {(sectionData.reference_urdu || sectionData.reference_english || sectionData.reference) && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">References:</p>
                          {sectionData.reference_urdu && (
                            <p className="text-xs text-gray-600 text-right mb-1" dir="rtl">📖 Urdu: {sectionData.reference_urdu}</p>
                          )}
                          {sectionData.reference_english && (
                            <p className="text-xs text-gray-600">📖 English: {sectionData.reference_english}</p>
                          )}
                          {sectionData.reference && !sectionData.reference_urdu && !sectionData.reference_english && (
                            <p className="text-xs text-gray-600">📖 {sectionData.reference}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => {
                    const duaKeys = Object.keys(data.adhan)
                    const nextDuaKey = `dua_${duaKeys.length}`
                    handleAdd('adhan', nextDuaKey, getAdhanTemplate())
                  }}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition text-purple-600 font-semibold"
                >
                  <Plus size={20} />
                  Add New Dua
                </button>
              </div>
            </div>
          )}

          {/* AFTER SALAH - Keep existing code, just update template */}
          {data.after_salah && data.after_salah.categories && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
                <h2 className="text-3xl font-bold">After Salah Duas</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {Object.entries(data.after_salah.categories).map(([categoryKey, categoryData]) => (
                  <div key={categoryKey} className="border border-blue-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection(`after_salah_${categoryKey}`)}
                      className="w-full bg-blue-50 p-4 flex justify-between items-center hover:bg-blue-100 transition"
                    >
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 text-left capitalize">
                          {categoryKey.replace(/_/g, ' ')}
                        </h3>
                        {categoryData.data && (
                          <p className="text-sm text-blue-600">
                            {Object.keys(categoryData.data).length} items
                          </p>
                        )}
                      </div>
                      {expandedSections[`after_salah_${categoryKey}`] ? 
                        <ChevronUp size={24} /> : <ChevronDown size={24} />
                      }
                    </button>
                    
                    {expandedSections[`after_salah_${categoryKey}`] && categoryData.data && (
                      <div className="p-4 space-y-4 bg-white">
                        {Object.entries(categoryData.data).map(([itemKey, item]) => (
                          <div key={itemKey} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                  #{parseInt(itemKey) + 1}
                                </span>
                                {item.title_english && (
                                  <span className="text-blue-900 font-semibold">{item.title_english}</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit('after_salah', `categories.${categoryKey}.data.${itemKey}`, item)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDelete('after_salah', `categories.${categoryKey}.data.${itemKey}`)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {item.arabic_text && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-600 mb-1">Arabic</p>
                                  <p className="text-lg text-right" dir="rtl">{item.arabic_text}</p>
                                </div>
                              )}
                              
                              {item.translation_en && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-600 mb-1">English</p>
                                  <p className="text-sm">{item.translation_en}</p>
                                </div>
                              )}
                              
                              {item.translation_urdu && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-600 mb-1">Urdu</p>
                                  <p className="text-sm text-right" dir="rtl">{item.translation_urdu}</p>
                                </div>
                              )}
                              
                              {item.explanation && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-600 mb-1">Explanation</p>
                                  <p className="text-xs text-right" dir="rtl">{item.explanation}</p>
                                </div>
                              )}
                              
                              {(item.reference_urdu || item.reference_english || item.reference) && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-xs text-gray-500 mb-1">References:</p>
                                  {item.reference_urdu && (
                                    <p className="text-xs text-gray-600 text-right mb-1" dir="rtl">📖 {item.reference_urdu}</p>
                                  )}
                                  {item.reference_english && (
                                    <p className="text-xs text-gray-600">📖 {item.reference_english}</p>
                                  )}
                                  {item.reference && !item.reference_urdu && !item.reference_english && (
                                    <p className="text-xs text-gray-600">📖 {item.reference}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => handleAdd('after_salah', `categories.${categoryKey}.data`, getAfterSalahTemplate())}
                          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-blue-600 font-semibold"
                        >
                          <Plus size={20} />
                          Add New Item
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SALAH DOCUMENT (Steps) - Keep existing, just update template */}
          {data.salah && data.salah.data && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
                <h2 className="text-3xl font-bold">Salah Steps</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {Object.entries(data.salah.data).map(([stepKey, stepData]) => (
                  <div key={stepKey} className="border border-green-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection(`salah_step_${stepKey}`)}
                      className="w-full bg-green-50 p-4 flex justify-between items-center hover:bg-green-100 transition"
                    >
                      <div>
                        <h3 className="text-xl font-bold text-green-900 text-left">
                          Step {parseInt(stepKey) + 1}
                        </h3>
                        {stepData.data && (
                          <p className="text-sm text-green-600">
                            {Object.keys(stepData.data).length} parts
                          </p>
                        )}
                      </div>
                      {expandedSections[`salah_step_${stepKey}`] ? 
                        <ChevronUp size={24} /> : <ChevronDown size={24} />
                      }
                    </button>
                    
                    {expandedSections[`salah_step_${stepKey}`] && stepData.data && (
                      <div className="p-4 space-y-4 bg-white">
                        {Object.entries(stepData.data).map(([partKey, part]) => (
                          <div key={partKey} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {part.step_id && (
                                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                                    Step ID: {part.step_id}
                                  </span>
                                )}
                                {part.title_english && (
                                  <span className="text-green-900 font-semibold">{part.title_english}</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit('salah', `data.${stepKey}.data.${partKey}`, part)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDelete('salah', `data.${stepKey}.data.${partKey}`)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            
                            {part.title_urdu && (
                              <h4 className="text-base font-semibold text-green-700 mb-3" dir="rtl">
                                {part.title_urdu}
                              </h4>
                            )}
                            
                            <div className="space-y-2">
                              {part.arabic_text && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-600 mb-1">Arabic</p>
                                  <p className="text-xl text-right" dir="rtl">{part.arabic_text}</p>
                                </div>
                              )}
                              
                              {part.translation_urdu && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-600 mb-1">Urdu Translation</p>
                                  <p className="text-sm text-right" dir="rtl">{part.translation_urdu}</p>
                                </div>
                              )}
                              
                              {part.translation_english && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-600 mb-1">English Translation</p>
                                  <p className="text-sm">{part.translation_english}</p>
                                </div>
                              )}
                              
                              {part.explanation && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-600 mb-1">Explanation</p>
                                  <p className="text-xs text-right" dir="rtl">{part.explanation}</p>
                                </div>
                              )}
                              
                              {(part.reference_urdu || part.reference_english || part.reference) && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-xs text-gray-500 mb-1">References:</p>
                                  {part.reference_urdu && (
                                    <p className="text-xs text-gray-600 text-right mb-1" dir="rtl">📖 {part.reference_urdu}</p>
                                  )}
                                  {part.reference_english && (
                                    <p className="text-xs text-gray-600">📖 {part.reference_english}</p>
                                  )}
                                  {part.reference && !part.reference_urdu && !part.reference_english && (
                                    <p className="text-xs text-gray-600">📖 {part.reference}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => handleAdd('salah', `data.${stepKey}.data`, getSalahTemplate())}
                          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-green-600 font-semibold"
                        >
                          <Plus size={20} />
                          Add New Part
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Edit/Add Modal */}
      {showModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {isAddMode ? 'Add New Item' : 'Edit Content'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {formData.title_english !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={formData.title_english || ''}
                    onChange={(e) => setFormData({ ...formData, title_english: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {formData.title_urdu !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Urdu)
                  </label>
                  <input
                    type="text"
                    value={formData.title_urdu || ''}
                    onChange={(e) => setFormData({ ...formData, title_urdu: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                    dir="rtl"
                  />
                </div>
              )}

              {formData.step_id !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step ID
                  </label>
                  <input
                    type="text"
                    value={formData.step_id || ''}
                    onChange={(e) => setFormData({ ...formData, step_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {(formData.arabic !== undefined || formData.arabic_text !== undefined) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arabic Text
                  </label>
                  <textarea
                    value={formData.arabic || formData.arabic_text || ''}
                    onChange={(e) => {
                      const key = formData.arabic !== undefined ? 'arabic' : 'arabic_text'
                      setFormData({ ...formData, [key]: e.target.value })
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xl leading-loose"
                    rows="4"
                    dir="rtl"
                  />
                </div>
              )}

              {/* English Translation - handles all document types */}
              {(formData.english !== undefined || formData.translation_en !== undefined || formData.translation_english !== undefined) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    English Translation
                  </label>
                  <textarea
                    value={formData.english || formData.translation_en || formData.translation_english || ''}
                    onChange={(e) => {
                      const key = formData.english !== undefined ? 'english' : 
                                  formData.translation_en !== undefined ? 'translation_en' : 'translation_english'
                      setFormData({ ...formData, [key]: e.target.value })
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    rows="3"
                    placeholder="English translation..."
                  />
                </div>
              )}

              {/* Urdu Translation - handles all document types */}
              {(formData.urdu !== undefined || formData.translation_urdu !== undefined) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urdu Translation
                  </label>
                  <textarea
                    value={formData.urdu || formData.translation_urdu || ''}
                    onChange={(e) => {
                      const key = formData.urdu !== undefined ? 'urdu' : 'translation_urdu'
                      setFormData({ ...formData, [key]: e.target.value })
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg leading-relaxed"
                    rows="3"
                    dir="rtl"
                    placeholder="اردو میں ترجمہ..."
                  />
                </div>
              )}

              {/* Explanation Fields - ALWAYS show both */}
              {(formData.explanation_urdu !== undefined || formData.explanation !== undefined ||
                formData.arabic !== undefined || formData.arabic_text !== undefined) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explanation (Urdu) / تشریح
                    </label>
                    <textarea
                      value={formData.explanation_urdu || formData.explanation || ''}
                      onChange={(e) => {
                        // Always save as explanation_urdu
                        const newData = { ...formData, explanation_urdu: e.target.value }
                        // Remove old explanation field if it exists
                        if (newData.explanation !== undefined) {
                          delete newData.explanation
                        }
                        setFormData(newData)
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-base leading-relaxed"
                      rows="3"
                      dir="rtl"
                      placeholder="اردو میں تشریح..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explanation (English)
                    </label>
                    <textarea
                      value={formData.explanation_english || ''}
                      onChange={(e) => setFormData({ ...formData, explanation_english: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-base leading-relaxed"
                      rows="3"
                      placeholder="Explanation in English..."
                    />
                  </div>
                </>
              )}

              {/* UPDATED: Separate Reference Fields - ALWAYS show both */}
              {(formData.reference_urdu !== undefined || formData.reference !== undefined || 
                formData.arabic !== undefined || formData.arabic_text !== undefined) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference (Urdu) / حوالہ
                    </label>
                    <input
                      type="text"
                      value={formData.reference_urdu || formData.reference || ''}
                      onChange={(e) => {
                        // Always save as reference_urdu
                        const newData = { ...formData, reference_urdu: e.target.value }
                        // Remove old reference field if it exists
                        if (newData.reference !== undefined) {
                          delete newData.reference
                        }
                        setFormData(newData)
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                      dir="rtl"
                      placeholder="صحیح بخاری، کتاب الاذان، حدیث:499"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference (English)
                    </label>
                    <input
                      type="text"
                      value={formData.reference_english || ''}
                      onChange={(e) => setFormData({ ...formData, reference_english: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Sahih Bukhari, Book of Adhan, Hadith:499"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                >
                  <Save size={20} />
                  {isAddMode ? 'Add Item' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
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