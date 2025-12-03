import 'dart:ui';

class WordsData {
  Color color;
  String urduheading, engheading, subheading, n, name, urdu, eng, g;
  WordsData(
      {required this.urduheading,
      required this.engheading,
      required this.subheading,
      required this.color,
      required this.n,
      required this.name,
      required this.urdu,
      required this.eng,
      required this.g});
}

class FavouriteWordData {
  String urduheading, engheading, subheading, name, urdu, eng, g, level;
  FavouriteWordData(
      {required this.urduheading,
      required this.engheading,
      required this.subheading,
      required this.name,
      required this.urdu,
      required this.eng,
      required this.g,
      required this.level});

  FavouriteWordData.fromMap(Map map)
      : urduheading = map['urduheading'],
        engheading = map['engheading'],
        subheading = map['subheading'],
        name = map['name'],
        urdu = map['urdu'],
        eng = map['eng'],
        g = map['g'],
        level = map['level'];

  Map toMap() {
    return {
      'urduheading': urduheading,
      'engheading': engheading,
      'subheading': subheading,
      'name': name,
      'urdu': urdu,
      'eng': eng,
      'g': g,
      'level': level
    };
  }
}
