import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive/hive.dart';

import '../hive_data/allah_name.dart';
import '../hive_data/azkar.dart';
import '../hive_data/dua_category.dart';
import '../hive_data/dua_item.dart';
import '../hive_data/prayer_step.dart';
import '../hive_data/rabana_dua.dart';
import '../hive_data/rabi_dua.dart';

final FirebaseFirestore _firestore = FirebaseFirestore.instance;

List<Map<String, String>> rabanaList = [];

Future<void> fetchRabanaData() async {
  final box = Hive.box<RabanaDua>('rabana_duas');

  if (box.isNotEmpty) {
    final sortedHiveList = box.values.toList()
      ..sort((a, b) => a.id.compareTo(b.id));

    rabanaList = sortedHiveList.map((dua) => {
      "id": dua.id.toString(),
      "arabic": dua.arabic,
      "surah_number": dua.surahNumber,
      "english_translation": dua.englishTranslation,
      "urdu_translation": dua.urduTranslation,
    }).toList();

    print("✅ Rabana data loaded from Hive.");
    return;
  }

  try {
    FirebaseFirestore firestore = FirebaseFirestore.instance;
    DocumentSnapshot snapshot = await firestore
        .collection("quranic_duas")
        .doc("rabana")
        .get(const GetOptions(source: Source.serverAndCache));

    if (!snapshot.exists || snapshot.data() == null) {
      print("❌ Firestore document does not exist!");
      return;
    }

    Map<String, dynamic> data = snapshot.data() as Map<String, dynamic>;
    if (!data.containsKey("prayers")) {
      print("❌ Missing 'prayers' field in Firestore document!");
      return;
    }

    List<Map<String, dynamic>> fetchedDuas = [];

    final prayersData = data["prayers"];

    if (prayersData is List) {
      fetchedDuas = List<Map<String, dynamic>>.from(
          prayersData.map((e) => Map<String, dynamic>.from(e as Map))
      );
    } else if (prayersData is Map) {
      final mapData = prayersData as Map<String, dynamic>;
      fetchedDuas = mapData.values
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    } else {
      print("❌ Unexpected data type for 'prayers': ${prayersData.runtimeType}");
      return;
    }

    if (fetchedDuas.isEmpty) {
      print("⚠️ Firestore 'prayers' is empty!");
      return;
    }

    List<RabanaDua> rabanaDuas = fetchedDuas
        .map((e) => RabanaDua.fromMap(e))
        .toList()
      ..sort((a, b) => a.id.compareTo(b.id));

    await box.clear();
    await box.addAll(rabanaDuas);

    rabanaList = rabanaDuas.map((dua) => {
      "id": dua.id.toString(),
      "arabic": dua.arabic,
      "surah_number": dua.surahNumber,
      "english_translation": dua.englishTranslation,
      "urdu_translation": dua.urduTranslation,
    }).toList();

    print("✅ Rabana Data Loaded Successfully from Firestore and saved to Hive.");
  } catch (e, stackTrace) {
    print("❌ Error fetching Rabana data from Firestore: $e");
    print("Stack trace: $stackTrace");
  }
}

List<Azkar> azkarList = [];

Future<List<Azkar>> fetchAzkarData() async {
  final box = Hive.box<Azkar>('azkar_data');

  if (box.isNotEmpty) {
    final existingAzkar = box.values.toList();
    print("✅ Azkar loaded from Hive. Count: ${existingAzkar.length}");
    azkarList = existingAzkar;
    return existingAzkar;
  }

  try {
    final snapshot = await FirebaseFirestore.instance
        .collection("morning_evening_azkar")
        .doc("azkar_list")
        .get();

    if (!snapshot.exists || snapshot.data() == null) {
      print("❌ Firestore doc does not exist or is null!");
      return [];
    }

    final data = snapshot.data() as Map<String, dynamic>;
    if (!data.containsKey("azkar")) {
      print("❌ Missing 'azkar' field in Firestore doc!");
      return [];
    }

    List<Map<String, dynamic>> rawAzkarList = [];

    final azkarData = data["azkar"];

    if (azkarData is List) {
      // If it's already a List, convert it
      rawAzkarList = List<Map<String, dynamic>>.from(
          azkarData.map((e) => Map<String, dynamic>.from(e as Map))
      );
    } else if (azkarData is Map) {
      // If it's a Map, convert Map values to List
      final mapData = azkarData as Map<String, dynamic>;
      rawAzkarList = mapData.values
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    } else {
      print("❌ Unexpected data type for 'azkar': ${azkarData.runtimeType}");
      return [];
    }

    if (rawAzkarList.isEmpty) {
      print("⚠️ Firestore 'azkar' is empty!");
      return [];
    }

    List<Azkar> fetchedAzkar = rawAzkarList.map((item) {
      return Azkar.fromMap(item);
    }).toList();

    await box.clear();
    await box.addAll(fetchedAzkar);

    // ✅ Update the global list for UI consistency
    azkarList = fetchedAzkar;

    print("✅ Azkar data fetched from Firestore and stored in Hive. Count: ${fetchedAzkar.length}");
    return fetchedAzkar;
  } catch (e, stackTrace) {
    print("❌ Error fetching Azkar from Firestore: $e");
    print("Stack trace: $stackTrace");
    return [];
  }
}

List<Map<String, String>> rabiList = [];

Future<void> fetchRabiData() async {
  final box = Hive.box<RabiDua>('rabi_duas');

  // 1) Load from Hive if available
  if (box.isNotEmpty) {
    final hiveItems = box.values.toList()..sort((a,b)=>a.id.compareTo(b.id));
    rabiList = hiveItems.map((dua) => {
      'id': dua.id.toString(),
      'surah_number': dua.surahNumber,
      'arabic': dua.arabic,
      'urdu_translation': dua.urduTranslation,
    }).toList();
    print('✅ Rabi data loaded from Hive.');
    return;
  }

  // 2) Otherwise fetch from Firestore
  try {
    final snapshot = await FirebaseFirestore.instance
        .collection('quranic_duas')
        .doc('rabi')
        .get(const GetOptions(source: Source.serverAndCache));

    if (!snapshot.exists || snapshot.data()==null) {
      print('❌ No rabi document found in Firestore!');
      return;
    }

    final data = snapshot.data()! as Map<String,dynamic>;
    if (!data.containsKey('prayers')) {
      print("❌ Missing 'prayers' field in rabi doc!");
      return;
    }

    // ✅ FIX: Handle both Map and List structures
    List<Map<String, dynamic>> rawList = [];

    final prayersData = data['prayers'];

    if (prayersData is List) {
      // If it's already a List, convert it
      rawList = List<Map<String, dynamic>>.from(
          prayersData.map((e) => Map<String, dynamic>.from(e as Map))
      );
    } else if (prayersData is Map) {
      // If it's a Map, convert Map values to List
      final mapData = prayersData as Map<String, dynamic>;
      rawList = mapData.values
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    } else {
      print('❌ Unexpected data type for prayers: ${prayersData.runtimeType}');
      return;
    }

    if (rawList.isEmpty) {
      print('⚠️ rabi/prayers is empty');
      return;
    }

    // 3) Convert each entry, using index+1 as fallback id
    final fetched = rawList.asMap().entries.map((entry) {
      final idx = entry.key;
      final map = entry.value;
      final int id = map['id'] is int ? map['id'] as int : (idx + 1);
      return RabiDua(
        id:              id,
        surahNumber:     map['surah_number']   as String? ?? '',
        arabic:          map['arabic']         as String? ?? '',
        urduTranslation: map['urdu_translation'] as String? ?? '',
      );
    }).toList()
      ..sort((a,b)=>a.id.compareTo(b.id));

    // 4) Save to Hive
    await box.clear();
    await box.addAll(fetched);

    // 5) Build your view-model list
    rabiList = fetched.map((dua) => {
      'id': dua.id.toString(),
      'surah_number': dua.surahNumber,
      'arabic': dua.arabic,
      'urdu_translation': dua.urduTranslation,
    }).toList();

    print('✅ Rabi data fetched & cached. Count: ${fetched.length}');
  } catch (e, stackTrace) {
    print('❌ Error fetching Rabi data: $e');
    print('Stack trace: $stackTrace');
  }
}

void listenToPrayerStepsUpdates() {
  FirebaseFirestore.instance
      .collection("prayer_steps")
      .orderBy("step_id")
      .snapshots()
      .listen((snapshot) async {
    if (snapshot.docs.isNotEmpty) {
      final updatedSteps = snapshot.docs.map((doc) {
        return PrayerStep.fromMap(doc.data(), doc.id);
      }).toList();

      final box = Hive.box<PrayerStep>('prayer_steps');
      await box.clear();
      await box.addAll(updatedSteps);

      print("🔄 Hive updated with new Firestore data. Count: ${updatedSteps.length}");
    }
  }, onError: (error) {
    print("❌ Firestore listener error: $error");
  });
}

Future<List<PrayerStep>> fetchPrayerSteps() async {
  final box = Hive.box<PrayerStep>('prayer_steps');

  if (box.isNotEmpty) {
    final localSteps = box.values.toList();
    print("✅ Loaded Prayer Steps from Hive: ${localSteps.length}");
    listenToPrayerStepsUpdates();
    return localSteps;
  }

  try {
    final snapshot = await FirebaseFirestore.instance
        .collection("prayer_steps")
        .orderBy("step_id")
        .get();

    final loadedSteps = snapshot.docs.map((doc) {
      return PrayerStep.fromMap(doc.data(), doc.id);
    }).toList();

    await box.clear();
    await box.addAll(loadedSteps);

    print("✅ Loaded Prayer Steps from Firestore: ${loadedSteps.length}");
    listenToPrayerStepsUpdates();

    return loadedSteps;
  } catch (e) {
    print("❌ Error fetching prayer steps from Firestore: $e");
    return [];
  }
}

List<Map<String, dynamic>> namesOfAllah = [];

Future<void> fetchAllahNames(void Function() updateUI) async {
  final box = Hive.box<AllahName>('names_of_allah');

  final offlineData = box.values.toList();
  if (offlineData.isNotEmpty) {
    print("✅ Allah Names loaded from Hive.");
    namesOfAllah = offlineData.map((allah) {
      return {
        "name": allah.name,
        "english": allah.english,
        "urdu": allah.urdu,
      };
    }).toList();
    updateUI();
    return;
  }

  try {
    FirebaseFirestore firestore = FirebaseFirestore.instance;
    DocumentSnapshot snapshot = await firestore
        .collection("attributes_of_allah")
        .doc("names_list")
        .get();

    if (!snapshot.exists || snapshot.data() == null) {
      print("❌ Firestore document does not exist!");
      return;
    }

    Map<String, dynamic> data = snapshot.data() as Map<String, dynamic>;
    if (!data.containsKey("allah")) {
      print("❌ Missing 'allah' key in Firestore document!");
      return;
    }

    List<dynamic> fetchedNames = data["allah"];
    if (fetchedNames.isEmpty) {
      print("⚠️ 'allah' list is empty!");
      return;
    }

    List<AllahName> fetchedAllahNames = fetchedNames
        .map((e) => AllahName.fromMap(e as Map<String, dynamic>))
        .toList();

    await box.clear();
    await box.addAll(fetchedAllahNames);

    namesOfAllah = fetchedAllahNames.map((allah) {
      return {
        "name": allah.name,
        "english": allah.english,
        "urdu": allah.urdu,
      };
    }).toList();

    updateUI();
    print("✅ Allah Names loaded from Firestore and saved to Hive.");
  } catch (e) {
    print("❌ Error fetching Allah Names from Firestore: $e");
  }
}

List<DuaCategory> duaCategories = [];
List<DuaItem> duaList = [];

Future<void> fetchDuaData() async {
  final categoryBox = Hive.box<DuaCategory>('dua_categories');
  final duaBox = Hive.box<DuaItem>('dua_list');

  if (categoryBox.isNotEmpty && duaBox.isNotEmpty) {
    duaCategories = categoryBox.values.toList();
    duaList = duaBox.values.toList();
    print("✅ Dua data loaded from Hive.");
    return;
  }

  try {
    FirebaseFirestore firestore = FirebaseFirestore.instance;
    QuerySnapshot querySnapshot = await firestore.collection("duas").get();

    if (querySnapshot.docs.isEmpty) {
      print("❌ Firestore collection 'duas' is EMPTY!");
      throw Exception("Firestore collection 'duas' is empty!");
    }

    duaCategories.clear();
    duaList.clear();

    for (var doc in querySnapshot.docs) {
      Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
      if (!data.containsKey("duas")) {
        print("❌ Missing 'duas' field in document: ${doc.id}");
        continue;
      }

      DuaCategory category = DuaCategory(category: doc.id);
      duaCategories.add(category);

      List<dynamic> duas = data["duas"];
      for (var duaItem in duas) {
        DuaItem dua = DuaItem.fromMap(duaItem, doc.id);
        duaList.add(dua);
      }
    }

    await categoryBox.clear();
    await duaBox.clear();
    await categoryBox.addAll(duaCategories);
    await duaBox.addAll(duaList);

    print("✅ Dua Categories Loaded: $duaCategories");
    print("✅ Dua Data Loaded Successfully: $duaList");
  } catch (e) {
    print("❌ Error fetching Dua data from Firestore: $e");
  }
}