// lib/data/hadith_repository.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/cupertino.dart';
import 'package:hive/hive.dart';
import 'package:quranic_words/hive_data/hadith_data.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HadithRepository {
  static final CollectionReference _collectionRef =
      FirebaseFirestore.instance.collection('hadees_data');

  // Static flag to indicate if prefetching is done.
  static bool _hasPrefetched = false;
  static bool _hasListener = false;

  /// Initialize the Hive box for surah hadith data.
  static Future<void> initializeHive() async {
    if (!Hive.isBoxOpen('hadith_surah_data')) {
      await Hive.openBox('hadith_surah_data');
      print("✅ Hive box 'hadith_surah_data' opened.");
    } else {
      print("ℹ️ Hive box 'hadith_surah_data' already open.");
    }
  }

  /// Prefetch hadith data for all surahs only once.
  static Future<void> prefetchAllHadithData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    // Check if prefetching was already done
    if (prefs.getBool("hadithPrefetched") == true) {
      print("Hadith data already prefetched.");
      return;
    }

    await initializeHive();
    List<int> surahIdsToPrefetch = List.generate(114, (index) => index + 1);
    for (var surahId in surahIdsToPrefetch) {
      await loadHadithDataForSurah(surahId);
      debugPrint("Prefetched hadith data for surah $surahId");
    }

    // Save the flag so we don't prefetch again on subsequent launches.
    await prefs.setBool("hadithPrefetched", true);
  }

  /// Load hadith data for a specific surah.
  /// Checks Hive cache first using the surah ID as key.
  /// If not found, fetches the data from Firestore and caches it.
  static Future<List<Hadith>> loadHadithDataForSurah(int surahId) async {
    final box = Hive.box('hadith_surah_data');
    final key = surahId.toString();
    print("Fetching hadiths for Surah ID: $key");

    if (box.containsKey(key)) {
      final rawData = box.get(key);
      print("🔥 Hive Data for Surah ID $key: $rawData");
      if (rawData is List) {
        final hadithList = rawData.cast<Hadith>();
        print("✅ Hadiths loaded from Hive for Surah ID: $key");
        return hadithList;
      } else {
        print(
            "⚠️ Unexpected Hive data format for key $key! Clearing and refetching.");
        await box.delete(key);
      }
    }
    return await fetchHadithFromFirestore(surahId);
  }

  /// Fetch hadith data from Firestore for a specific surah.
  static Future<List<Hadith>> fetchHadithFromFirestore(int surahId) async {
    try {
      final key = surahId.toString();
      final doc = await _collectionRef.doc(key).get();

      if (doc.exists && doc.data() != null) {
        final docData = doc.data() as Map<String, dynamic>;
        print("🔥 Firestore Document Data for Surah ID $key: $docData");

        if (!docData.containsKey("hadiths")) {
          print(
              "❌ 'hadiths' field not found in Firestore document for surah $key!");
          return [];
        }

        List<dynamic> rawHadithList = docData['hadiths'];
        List<Hadith> hadithObjects = rawHadithList.map((item) {
          print("Mapping hadith item: $item");
          return Hadith.fromMap(item as Map<String, dynamic>);
        }).toList();

        // Save the list to Hive for offline use.
        await boxPut(key, hadithObjects);
        print(
            "✅ Hadiths fetched from Firestore and saved to Hive for surah $key.");
        return hadithObjects;
      } else {
        print("❌ No hadiths found in Firestore for Surah ID: $key");
        return [];
      }
    } catch (e) {
      print("❌ Error fetching hadith from Firestore for surah $surahId: $e");
      return [];
    }
  }

  /// Helper function to store the list in Hive using the surah ID as key.
  static Future<void> boxPut(String key, List<Hadith> hadithObjects) async {
    final box = Hive.box('hadith_surah_data');
    await box.put(key, hadithObjects);
  }

  /// Listen for Firestore updates and update the Hive cache.
  static void listenForFirestoreUpdates() {
    // Only attach the listener once.
    if (_hasListener) {
      print("🔄 Firestore update listener already attached.");
      return;
    }
    _collectionRef.snapshots().listen((snapshot) async {
      if (snapshot.docs.isNotEmpty) {
        for (var doc in snapshot.docs) {
          final key = doc.id;
          final data = doc.data() as Map<String, dynamic>;
          if (data.containsKey("hadiths")) {
            List<dynamic> rawHadithList = data['hadiths'];
            List<Hadith> updatedHadith = rawHadithList.map((item) {
              return Hadith.fromMap(item as Map<String, dynamic>);
            }).toList();
            await boxPut(key, updatedHadith);
            print(
                "🔄 Firestore update: Hadith data for surah $key updated in Hive.");
          }
        }
      }
    });
    _hasListener = true;
  }
}
