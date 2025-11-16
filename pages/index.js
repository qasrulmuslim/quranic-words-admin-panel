import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/router'
import { Book, FileText, Heart, Moon, Sun, Droplets, BookOpen, LogOut, Users, BookMarked } from 'lucide-react'

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const collections = [
    { name: 'quranic_words', label: "Quranic Words", icon: BookMarked, path: '/quranic-words' },
    { name: 'attributes_of_allah', label: "Allah's Names", icon: Heart, path: '/attributes' },
    { name: 'duas', label: 'Duas', icon: Book, path: '/duas' },
    { name: 'hadees_data', label: 'Hadees', icon: FileText, path: '/hadees' },
    { name: 'morning_evening_azkar', label: 'Morning/Evening Azkar', icon: Sun, path: '/azkar' },
    { name: 'quranic_duas', label: 'Quranic Duas', icon: BookOpen, path: '/quranic-duas' },
    { name: 'salah_azkar', label: 'Salah Azkar', icon: Moon, path: '/salah' },
    // { name: 'surahs', label: 'Surahs', icon: Book, path: '/surahs' },
    // { name: 'wudu', label: 'Wudu', icon: Droplets, path: '/wudu' },
    // { name: 'names_list', label: 'Names List', icon: Users, path: '/names' }
  ]

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const statsData = {}
      
      // For quranic_words - count all words across levels
      const quranicWordsSnapshot = await getDocs(collection(db, 'quranic_words'))
      let quranicWordsCount = 0
      quranicWordsSnapshot.docs.forEach(doc => {
        const data = doc.data()
        // Each document is a level (level_1, level_2, level_3)
        // Each field in the document is a category containing words
        Object.values(data).forEach(categoryData => {
          if (Array.isArray(categoryData)) {
            quranicWordsCount += categoryData.length
          } else if (typeof categoryData === 'object') {
            quranicWordsCount += Object.keys(categoryData).length
          }
        })
      })
      statsData['quranic_words'] = quranicWordsCount
      
      // For attributes_of_allah - count items in 'allah' field
      const attributesSnapshot = await getDocs(collection(db, 'attributes_of_allah'))
      let attributesCount = 0
      attributesSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.allah) {
          attributesCount += Object.keys(data.allah).length
        }
      })
      statsData['attributes_of_allah'] = attributesCount
      
      // For duas - count items in 'duas' field
      const duasSnapshot = await getDocs(collection(db, 'duas'))
      let duasCount = 0
      duasSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.duas) {
          duasCount += Object.keys(data.duas).length
        }
      })
      statsData['duas'] = duasCount
      
      // For hadees_data - count items in 'hadiths' field
      const hadeesSnapshot = await getDocs(collection(db, 'hadees_data'))
      let hadeesCount = 0
      hadeesSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.hadiths) {
          hadeesCount += Object.keys(data.hadiths).length
        }
      })
      statsData['hadees_data'] = hadeesCount
      
      // For morning_evening_azkar - count items in 'azkar' field
      const azkarSnapshot = await getDocs(collection(db, 'morning_evening_azkar'))
      let azkarCount = 0
      azkarSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.azkar) {
          azkarCount += Object.keys(data.azkar).length
        }
      })
      statsData['morning_evening_azkar'] = azkarCount
      
      // For quranic_duas - count items in 'prayers' field
      const quranicDuasSnapshot = await getDocs(collection(db, 'quranic_duas'))
      let quranicDuasCount = 0
      quranicDuasSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.prayers) {
          quranicDuasCount += Object.keys(data.prayers).length
        }
      })
      statsData['quranic_duas'] = quranicDuasCount
      
      // For other collections - count normally
      const otherCollections = [
        'salah_azkar',
        'surahs',
        'wudu',
        'names_list'
      ]
      
      for (const collectionName of otherCollections) {
        const snapshot = await getDocs(collection(db, collectionName))
        statsData[collectionName] = snapshot.size
      }
      
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
          <p className="text-gray-600">Manage your Quranic content and data</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => {
            const Icon = col.icon
            return (
              <div
                key={col.name}
                onClick={() => router.push(col.path)}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-indigo-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <Icon className="text-indigo-600" size={24} />
                  </div>
                  <span className="text-3xl font-bold text-indigo-600">
                    {stats[col.name] || 0}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{col.label}</h3>
                <p className="text-sm text-gray-500 mt-1">Click to manage</p>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}