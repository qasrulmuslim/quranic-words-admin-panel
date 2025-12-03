import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive/hive.dart';

import '../hive_data/wudu_data.dart';

class WuduRepository {
  // Firestore collection reference (collection name "wudu")
  static final CollectionReference _collectionRef =
  FirebaseFirestore.instance.collection('wudu');

  /// Initialize the Hive box for Wudu data.
  /// We use an untyped box to store our custom WuduData object.
  static Future<void> initializeHive() async {
    if (!Hive.isBoxOpen('wudu_data')) {
      await Hive.openBox('wudu_data');
      print("✅ Hive box 'wudu_data' opened.");
    } else {
      print("ℹ️ Hive box 'wudu_data' already open.");
    }
  }

  /// Load Wudu data from Hive or fetch from Firestore.
  /// [docId] is the document ID in the "wudu" collection (default "1").
  static Future<WuduData?> loadWuduData({String docId = "1"}) async {
    final box = Hive.box('wudu_data');
    if (box.containsKey(docId)) {
      final rawData = box.get(docId);
      print("🔥 Hive data for Wudu doc $docId: $rawData");
      if (rawData is WuduData) {
        print("✅ Loaded Wudu data from Hive for doc $docId");
        return rawData;
      } else if (rawData is Map) {
        WuduData wuduData =
        WuduData.fromMap(Map<String, dynamic>.from(rawData));
        print("✅ Loaded Wudu data from Hive (as map) for doc $docId");
        return wuduData;
      } else {
        print("⚠️ Unexpected Hive data format for key $docId, clearing it.");
        await box.delete(docId);
      }
    }
    return await fetchWuduDataFromFirestore(docId: docId);
  }

  /// Fetch Wudu data from Firestore and cache it in Hive.
  static Future<WuduData?> fetchWuduDataFromFirestore({String docId = "1"}) async {
    try {
      final doc = await _collectionRef.doc(docId).get();
      if (doc.exists && doc.data() != null) {
        final data = doc.data() as Map<String, dynamic>;
        print("🔥 Firestore data for Wudu doc $docId: $data");
        WuduData wuduData = WuduData.fromMap(data);
        final box = Hive.box('wudu_data');
        await box.put(docId, wuduData);
        print("✅ Wudu data fetched from Firestore and stored in Hive for doc $docId.");
        return wuduData;
      } else {
        print("❌ No Wudu data found in Firestore for doc $docId");
        return null;
      }
    } catch (e) {
      print("❌ Error fetching Wudu data from Firestore: $e");
      return null;
    }
  }

  /// Listen for Firestore updates for the specified document and update Hive.
  static void listenForFirestoreUpdates({String docId = "1"}) {
    _collectionRef.doc(docId).snapshots().listen((docSnapshot) async {
      if (docSnapshot.exists && docSnapshot.data() != null) {
        final data = docSnapshot.data() as Map<String, dynamic>;
        WuduData updatedData = WuduData.fromMap(data);
        final box = Hive.box('wudu_data');
        await box.put(docId, updatedData);
        print("🔄 Firestore update: Wudu data for doc $docId updated in Hive.");
      }
    });
  }
}
