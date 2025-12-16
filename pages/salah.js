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
      
      // 🔥 THIS LINE FIXES IT - CREATE NEW OBJECT
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
    setFormData(itemData)
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
      
      const data = JSON.parse(JSON.stringify(docSnap.data())) // Deep clone
      const pathParts = path.split('.')
      
      // Navigate to parent
      let parent = data
      for (let i = 0; i < pathParts.length - 1; i++) {
        parent = parent[pathParts[i]]
      }
      
      const keyToDelete = pathParts[pathParts.length - 1]
      
      // ✅ Convert to array, filter, rebuild as ARRAY
      const entries = Object.entries(parent)
      const filtered = entries.filter(([key]) => key !== keyToDelete)
      const rebuiltArray = filtered.map(([_, value]) => value)
      
      // Replace in parent
      const parentKey = pathParts[pathParts.length - 2]
      let parentOfParent = data
      for (let i = 0; i < pathParts.length - 2; i++) {
        parentOfParent = parentOfParent[pathParts[i]]
      }
      parentOfParent[parentKey] = rebuiltArray
      
      // ✅ CRITICAL: Remove ALL undefined values recursively
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
      
      // Update Firestore
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
      const snapshot = await getDocs(collection(db, 'salah_azkar'))
      const document = snapshot.docs.find(d => d.id === editingItem.docId)
      
      if (document) {
        const currentData = document.data()
        const pathParts = editingItem.path.split('.')
        
        if (isAddMode) {
          let parent = currentData
          
          // Special handling for adhan document - add directly without numeric index
          if (editingItem.docId === 'adhan' && pathParts.length === 1) {
            parent[pathParts[0]] = formData
          } else {
            // Original logic for numbered collections
            for (let i = 0; i < pathParts.length; i++) {
              if (i === pathParts.length - 1) {
                if (!parent[pathParts[i]]) {
                  parent[pathParts[i]] = {}
                }
                const existingKeys = Object.keys(parent[pathParts[i]]).filter(k => !isNaN(k)).map(Number)
                const nextIndex = existingKeys.length > 0 ? Math.max(...existingKeys) + 1 : 0
                parent[pathParts[i]][nextIndex] = formData
              } else {
                if (!parent[pathParts[i]]) {
                  parent[pathParts[i]] = {}
                }
                parent = parent[pathParts[i]]
              }
            }
          }
        } else {
          let parent = currentData
          for (let i = 0; i < pathParts.length - 1; i++) {
            parent = parent[pathParts[i]]
          }
          parent[pathParts[pathParts.length - 1]] = formData
        }
        
        await updateDoc(docRef, currentData)
        
        setShowModal(false)
        setEditingItem(null)
        setFormData({})
        setIsAddMode(false)
        fetchData()
        alert(isAddMode ? 'Added successfully!' : 'Updated successfully!')
      }
    } catch (error) {
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
    reference: '',
    title_english: ''
  })

  const getSalahTemplate = () => ({
    step_id: '',
    title_english: '',
    title_urdu: '',
    arabic_text: '',
    translation_urdu: '',
    explanation: '',
    reference: ''
  })

  const getAdhanTemplate = () => ({
    title_english: '',
    title_urdu: '',
    arabic: '',
    english: '',
    urdu: '',
    explanation_urdu: '',
    reference: ''
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
                {data.adhan.adhan_response && (
                  <div className="border border-purple-200 rounded-xl p-6 bg-purple-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-purple-900 mb-2">
                          {data.adhan.adhan_response.title_english}
                        </h3>
                        <h4 className="text-lg font-semibold text-purple-700" dir="rtl">
                          {data.adhan.adhan_response.title_urdu}
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit('adhan', 'adhan_response', data.adhan.adhan_response)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete('adhan', 'adhan_response')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Arabic</p>
                        <p className="text-2xl text-right" dir="rtl">{data.adhan.adhan_response.arabic}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">English</p>
                        <p className="text-base">{data.adhan.adhan_response.english}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Urdu</p>
                        <p className="text-base text-right" dir="rtl">{data.adhan.adhan_response.urdu}</p>
                      </div>
                      
                      {data.adhan.adhan_response.explanation_urdu && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Explanation (Urdu)</p>
                          <p className="text-sm text-right leading-relaxed" dir="rtl">{data.adhan.adhan_response.explanation_urdu}</p>
                        </div>
                      )}
                      
                      {data.adhan.adhan_response.reference && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-xs text-gray-500">Reference: {data.adhan.adhan_response.reference}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {data.adhan.dua_between_adhan_and_aqamat && (
                  <div className="border border-purple-200 rounded-xl p-6 bg-purple-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-purple-900 mb-2">
                          {data.adhan.dua_between_adhan_and_aqamat.title_english}
                        </h3>
                        <h4 className="text-lg font-semibold text-purple-700" dir="rtl">
                          {data.adhan.dua_between_adhan_and_aqamat.title_urdu}
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit('adhan', 'dua_between_adhan_and_aqamat', data.adhan.dua_between_adhan_and_aqamat)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete('adhan', 'dua_between_adhan_and_aqamat')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Arabic</p>
                        <p className="text-2xl text-right leading-loose" dir="rtl">{data.adhan.dua_between_adhan_and_aqamat.arabic}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">English</p>
                        <p className="text-base">{data.adhan.dua_between_adhan_and_aqamat.english}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Urdu</p>
                        <p className="text-base text-right leading-relaxed" dir="rtl">{data.adhan.dua_between_adhan_and_aqamat.urdu}</p>
                      </div>
                      
                      {data.adhan.dua_between_adhan_and_aqamat.reference && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-xs text-gray-500">Reference: {data.adhan.dua_between_adhan_and_aqamat.reference}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {data.adhan.dua_when_entering_mosque && (
                  <div className="border border-purple-200 rounded-xl p-6 bg-purple-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-purple-900 mb-2">
                          {data.adhan.dua_when_entering_mosque.title_english}
                        </h3>
                        <h4 className="text-lg font-semibold text-purple-700" dir="rtl">
                          {data.adhan.dua_when_entering_mosque.title_urdu}
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit('adhan', 'dua_when_entering_mosque', data.adhan.dua_when_entering_mosque)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete('adhan', 'dua_when_entering_mosque')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Arabic</p>
                        <p className="text-2xl text-right leading-loose" dir="rtl">{data.adhan.dua_when_entering_mosque.arabic}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">English</p>
                        <p className="text-base">{data.adhan.dua_when_entering_mosque.english}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Urdu</p>
                        <p className="text-base text-right" dir="rtl">{data.adhan.dua_when_entering_mosque.urdu}</p>
                      </div>
                      
                      {data.adhan.dua_when_entering_mosque.reference && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-xs text-gray-500">Reference: {data.adhan.dua_when_entering_mosque.reference}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
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

          {/* AFTER SALAH DOCUMENT */}
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
                              
                              {item.reference && (
                                <p className="text-xs text-gray-500">Reference: {item.reference}</p>
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

          {/* SALAH DOCUMENT (Steps) */}
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
                              
                              {part.explanation && (
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-600 mb-1">Explanation</p>
                                  <p className="text-xs text-right" dir="rtl">{part.explanation}</p>
                                </div>
                              )}
                              
                              {part.reference && (
                                <p className="text-xs text-gray-500">Reference: {part.reference}</p>
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

              {(formData.english !== undefined || formData.translation_en !== undefined) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    English Translation
                  </label>
                  <textarea
                    value={formData.english || formData.translation_en || ''}
                    onChange={(e) => {
                      const key = formData.english !== undefined ? 'english' : 'translation_en'
                      setFormData({ ...formData, [key]: e.target.value })
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    rows="3"
                  />
                </div>
              )}

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
                  />
                </div>
              )}

              {(formData.explanation_urdu !== undefined || formData.explanation !== undefined) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation (Urdu)
                  </label>
                  <textarea
                    value={formData.explanation_urdu || formData.explanation || ''}
                    onChange={(e) => {
                      const key = formData.explanation_urdu !== undefined ? 'explanation_urdu' : 'explanation'
                      setFormData({ ...formData, [key]: e.target.value })
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-base leading-relaxed"
                    rows="3"
                    dir="rtl"
                  />
                </div>
              )}

              {formData.reference !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={formData.reference || ''}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
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