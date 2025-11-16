import { useEffect, useState } from 'react'
import { collection, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/router'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Search, BookOpen, Layers } from 'lucide-react'

export default function QuranicWordsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [formData, setFormData] = useState({
    level: 'level_1',
    category: '',
    urduheading: '',
    engheading: '',
    subheading: '',
    name: '',
    urdu: '',
    eng: '',
    g: '',
    n: ''
  })
  const router = useRouter()

  // Category definitions for each level
  const categories = {
    level_1: [
      { id: 'pronouns', urdu: 'ضمیر', eng: 'Pronouns' },
      { id: 'prepositions', urdu: 'حروف جار', eng: 'Prepositions' },
      { id: 'conjunctions', urdu: 'حروف عطف', eng: 'Conjunctions' },
      { id: 'interrogatives', urdu: 'اسم استفہام', eng: 'Interrogatives' },
      { id: 'conditionals', urdu: 'حروف شرط', eng: 'Conditionals' },
      { id: 'negatives', urdu: 'حروف نفی', eng: 'Negatives' },
      { id: 'murakabs_izafi', urdu: 'مرکب اضافی', eng: 'Possessive Compounds' },
      { id: 'murakabs_ishari', urdu: 'مرکب اشاری', eng: 'Demonstrative Compounds' },
      { id: 'murakabs_jarri', urdu: 'مرکب جاری', eng: 'Prepositional Phrases' },
      { id: 'murakabs_tausefi', urdu: 'مرکب توصیفی', eng: 'Descriptive Compounds' },
      { id: 'time_words', urdu: 'کلمات زمان', eng: 'Time Words' },
      { id: 'place_words', urdu: 'کلمات مکان', eng: 'Place Words' },
      { id: 'relative_pronouns', urdu: 'اسم موصول', eng: 'Relative Pronouns' },
      { id: 'demonstrative_pronouns', urdu: 'اسم اشارہ', eng: 'Demonstrative Pronouns' },
      { id: 'sentences', urdu: 'جملے', eng: 'Sentences' },
      { id: 'separated_words', urdu: 'کلمات منفصل', eng: 'Separated Words' },
      { id: 'signs', urdu: 'نشانیاں', eng: 'Signs' },
      { id: 'preposition_with_maa', urdu: 'حروف جار مع ما', eng: 'Prepositions with Maa' }
    ],
    level_2: [
      { id: 'animals', urdu: 'جانور', eng: 'Animals' },
      { id: 'body_parts', urdu: 'اعضاء', eng: 'Body Parts' },
      { id: 'colors', urdu: 'رنگ', eng: 'Colors' },
      { id: 'fruits', urdu: 'پھل', eng: 'Fruits' },
      { id: 'vegetables', urdu: 'سبزیاں', eng: 'Vegetables' },
      { id: 'relatives', urdu: 'رشتہ دار', eng: 'Relatives' },
      { id: 'blessings', urdu: 'نعمتیں', eng: 'Blessings' },
      { id: 'deeds', urdu: 'اعمال', eng: 'Deeds' },
      { id: 'jannah', urdu: 'جنت', eng: 'Paradise' },
      { id: 'fire', urdu: 'جہنم', eng: 'Hell' },
      { id: 'allah_attributes', urdu: 'اللہ تعالٰی کی صفات', eng: 'Attributes of Allah' },
      { id: 'adjectives', urdu: 'صفات', eng: 'Adjectives' }
    ],
    level_3: [
      { id: 'patterns', urdu: 'ابواب ثلاثی مجرّد', eng: 'Verb Patterns' },
      { id: 'past_tense', urdu: 'فعل ماضی', eng: 'Past Tense' },
      { id: 'present_future', urdu: 'فعل مضارع', eng: 'Present/Future Tense' },
      { id: 'verb_forms', urdu: 'ابواب ثلاثی مزید فیہ', eng: 'Augmented Verb Forms' },
      { id: 'misal', urdu: 'مثال واوی/ یائی', eng: 'Misal (Weak First)' },
      { id: 'ajwaf', urdu: 'اجوف واوی/یائی', eng: 'Ajwaf (Weak Middle)' },
      { id: 'past_active', urdu: 'فعل ماضی (معروف)', eng: 'Past Tense (Active)' },
      { id: 'past_passive', urdu: 'فعل ماضی (مجہول)', eng: 'Past Tense (Passive)' },
      { id: 'present_active', urdu: 'فعل مضارع (معروف)', eng: 'Present/Future (Active)' },
      { id: 'present_passive', urdu: 'فعل مضارع (مجہول)', eng: 'Present/Future (Passive)' }
    ]
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'quranic_words'))
      const data = []
      
      snapshot.docs.forEach(doc => {
        const docData = doc.data()
        const level = doc.id // level_1, level_2, level_3
        
        // Iterate through all categories in this level
        Object.entries(docData).forEach(([category, wordsData]) => {
          // Handle both array and map structures
          let wordsArray = []
          
          if (Array.isArray(wordsData)) {
            wordsArray = wordsData
          } else if (typeof wordsData === 'object') {
            wordsArray = Object.values(wordsData)
          }
          
          wordsArray.forEach((word, index) => {
            if (word && typeof word === 'object') {
              data.push({
                itemId: `${level}_${category}_${index}`,
                level: level,
                category: category,
                index: index,
                urduheading: word.urduheading || '',
                engheading: word.engheading || '',
                subheading: word.subheading || '',
                name: word.name || '',
                urdu: word.urdu || '',
                eng: word.eng || '',
                g: word.g || '',
                n: word.n || ''
              })
            }
          })
        })
      })
      
      setItems(data)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Error fetching data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const docRef = doc(db, 'quranic_words', formData.level)
      const snapshot = await getDocs(collection(db, 'quranic_words'))
      const document = snapshot.docs.find(d => d.id === formData.level)
      
      let updatedData = {}
      
      if (document) {
        updatedData = { ...document.data() }
      }
      
      // Prepare word object
      const wordObject = {
        urduheading: formData.urduheading,
        engheading: formData.engheading,
        subheading: formData.subheading,
        name: formData.name,
        urdu: formData.urdu,
        eng: formData.eng,
        g: formData.g,
        n: formData.n
      }
      
      // Get or create category array/map
      let categoryData = updatedData[formData.category] || {}
      
      if (editingItem) {
        // Update existing word
        if (Array.isArray(categoryData)) {
          categoryData[editingItem.index] = wordObject
        } else {
          categoryData[editingItem.index] = wordObject
        }
      } else {
        // Add new word
        let nextIndex = 0
        if (Array.isArray(categoryData)) {
          nextIndex = categoryData.length
          categoryData.push(wordObject)
        } else {
          const indices = Object.keys(categoryData).map(Number).filter(n => !isNaN(n))
          nextIndex = indices.length > 0 ? Math.max(...indices) + 1 : 0
          categoryData[nextIndex] = wordObject
        }
      }
      
      updatedData[formData.category] = categoryData
      
      await setDoc(docRef, updatedData, { merge: true })
      
      setShowModal(false)
      setFormData({
        level: 'level_1',
        category: '',
        urduheading: '',
        engheading: '',
        subheading: '',
        name: '',
        urdu: '',
        eng: '',
        g: '',
        n: ''
      })
      setEditingItem(null)
      fetchItems()
      alert('Word saved successfully!')
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error saving: ' + error.message)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      level: item.level,
      category: item.category,
      urduheading: item.urduheading,
      engheading: item.engheading,
      subheading: item.subheading,
      name: item.name,
      urdu: item.urdu,
      eng: item.eng,
      g: item.g,
      n: item.n
    })
    setShowModal(true)
  }

  const handleDelete = async (item) => {
    if (confirm('Are you sure you want to delete this word?')) {
      try {
        const docRef = doc(db, 'quranic_words', item.level)
        const snapshot = await getDocs(collection(db, 'quranic_words'))
        const document = snapshot.docs.find(d => d.id === item.level)
        
        if (document) {
          const updatedData = { ...document.data() }
          const categoryData = { ...updatedData[item.category] }
          
          if (Array.isArray(categoryData)) {
            categoryData.splice(item.index, 1)
          } else {
            delete categoryData[item.index]
          }
          
          updatedData[item.category] = categoryData
          await updateDoc(docRef, updatedData)
        }
        
        fetchItems()
        alert('Word deleted successfully!')
      } catch (error) {
        console.error('Error deleting:', error)
        alert('Error deleting: ' + error.message)
      }
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      level: 'level_1',
      category: categories.level_1[0].id,
      urduheading: categories.level_1[0].urdu,
      engheading: categories.level_1[0].eng,
      subheading: '',
      name: '',
      urdu: '',
      eng: '',
      g: '',
      n: ''
    })
    setShowModal(true)
  }

  // Update category heading when level or category changes
  const handleLevelChange = (newLevel) => {
    const firstCategory = categories[newLevel][0]
    setFormData({
      ...formData,
      level: newLevel,
      category: firstCategory.id,
      urduheading: firstCategory.urdu,
      engheading: firstCategory.eng
    })
  }

  const handleCategoryChange = (categoryId) => {
    const categoryInfo = categories[formData.level].find(c => c.id === categoryId)
    setFormData({
      ...formData,
      category: categoryId,
      urduheading: categoryInfo?.urdu || '',
      engheading: categoryInfo?.eng || ''
    })
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.urdu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.eng.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLevel = selectedLevel === 'all' || item.level === selectedLevel
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    
    return matchesSearch && matchesLevel && matchesCategory
  })

  // Group by level and category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.level]) {
      acc[item.level] = {}
    }
    if (!acc[item.level][item.category]) {
      acc[item.level][item.category] = []
    }
    acc[item.level][item.category].push(item)
    return acc
  }, {})

  const getLevelLabel = (level) => {
    return level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getCategoryLabel = (level, categoryId) => {
    const cat = categories[level]?.find(c => c.id === categoryId)
    return cat ? `${cat.urdu} (${cat.eng})` : categoryId
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
                <h1 className="text-2xl font-bold text-gray-800">Quranic Words</h1>
                <p className="text-sm text-gray-600">{filteredItems.length} words total</p>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              <Plus size={20} />
              Add New Word
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search words..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
            </div>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            >
              <option value="all">All Levels</option>
              <option value="level_1">Level 1</option>
              <option value="level_2">Level 2</option>
              <option value="level_3">Level 3</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            >
              <option value="all">All Categories</option>
              {selectedLevel !== 'all' && categories[selectedLevel]?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.eng}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([level, categoriesData]) => (
            <div key={level}>
              {/* Level Header */}
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-2xl p-6">
                <div className="flex items-center gap-3">
                  <Layers size={32} />
                  <div>
                    <h2 className="text-3xl font-bold">{getLevelLabel(level)}</h2>
                    <p className="text-teal-100 mt-1">
                      {Object.values(categoriesData).flat().length} words
                    </p>
                  </div>
                </div>
              </div>

              {/* Categories in this level */}
              <div className="bg-white rounded-b-2xl shadow-lg p-6 space-y-6">
                {Object.entries(categoriesData).map(([category, words]) => (
                  <div key={category} className="border-2 border-teal-100 rounded-xl p-4">
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-teal-100">
                      <div className="flex items-center gap-3">
                        <BookOpen className="text-teal-600" size={24} />
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {getCategoryLabel(level, category)}
                          </h3>
                          <p className="text-sm text-gray-600">{words.length} words</p>
                        </div>
                      </div>
                    </div>

                    {/* Words Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {words.map((word) => (
                        <div
                          key={word.itemId}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-teal-300 transition"
                        >
                          <div className="flex justify-between items-start mb-3">
                            {word.n && (
                              <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-sm font-bold">
                                #{word.n}
                              </span>
                            )}
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(word)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(word)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Arabic</p>
                              <p className="text-xl text-right font-semibold" dir="rtl">
                                {word.name}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-amber-50 p-2 rounded">
                                <p className="text-xs text-gray-600 mb-1">Urdu</p>
                                <p className="text-sm text-right" dir="rtl">{word.urdu}</p>
                              </div>
                              <div className="bg-blue-50 p-2 rounded">
                                <p className="text-xs text-gray-600 mb-1">English</p>
                                <p className="text-sm">{word.eng}</p>
                              </div>
                            </div>

                            {word.g && (
                              <div className="bg-purple-50 p-2 rounded">
                                <p className="text-xs text-gray-600 mb-1">Grammar</p>
                                <p className="text-sm">{word.g}</p>
                              </div>
                            )}

                            {word.subheading && (
                              <p className="text-xs text-gray-600 italic">{word.subheading}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <BookOpen className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No words found</h3>
              <p className="text-gray-500">Try adjusting your filters or add a new word</p>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingItem ? 'Edit Word' : 'Add New Word'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Level and Category Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleLevelChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    disabled={!!editingItem}
                    required
                  >
                    <option value="level_1">Level 1</option>
                    <option value="level_2">Level 2</option>
                    <option value="level_3">Level 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    disabled={!!editingItem}
                    required
                  >
                    {categories[formData.level]?.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.eng} ({cat.urdu})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Headings (Auto-filled) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urdu Heading
                  </label>
                  <input
                    type="text"
                    value={formData.urduheading}
                    onChange={(e) => setFormData({ ...formData, urduheading: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    English Heading
                  </label>
                  <input
                    type="text"
                    value={formData.engheading}
                    onChange={(e) => setFormData({ ...formData, engheading: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Word Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arabic Word *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-2xl"
                  dir="rtl"
                  placeholder="اَلْحَمْدُ لِلّٰہِ"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urdu Translation *
                  </label>
                  <input
                    type="text"
                    value={formData.urdu}
                    onChange={(e) => setFormData({ ...formData, urdu: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-lg"
                    dir="rtl"
                    placeholder="تمام تعریفیں اللہ کے لیے"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    English Translation *
                  </label>
                  <input
                    type="text"
                    value={formData.eng}
                    onChange={(e) => setFormData({ ...formData, eng: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="All praise is for Allah"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grammar Notes
                  </label>
                  <input
                    type="text"
                    value={formData.g}
                    onChange={(e) => setFormData({ ...formData, g: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Masculine, Plural, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number/Index
                  </label>
                  <input
                    type="text"
                    value={formData.n}
                    onChange={(e) => setFormData({ ...formData, n: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subheading
                </label>
                <input
                  type="text"
                  value={formData.subheading}
                  onChange={(e) => setFormData({ ...formData, subheading: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Additional information"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold"
                >
                  <Save size={20} />
                  {editingItem ? 'Update' : 'Add'} Word
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