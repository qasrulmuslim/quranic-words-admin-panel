class IslamicEvents {
  int month;
  int date;

  String event;

  IslamicEvents({required this.date, required this.month, required this.event});
}

List<IslamicEvents> events = [
  IslamicEvents(
    month: 1,
    date: 9,
    event: 'Ashura',
  ),
  IslamicEvents(
    month: 1,
    date: 10,
    event: 'Ashura',
  ),
  IslamicEvents(
    month: 3,
    date: 12,
    event: 'Eid Milad un Nabi',
  ),
  IslamicEvents(
    month: 7,
    date: 27,
    event: 'Shab e Miraj',
  ),
  IslamicEvents(
    month: 8,
    date: 15,
    event: 'Shab e Barat',
  ),
  IslamicEvents(
    month: 9,
    date: 1,
    event: 'Ramadan',
  ),
  IslamicEvents(
    month: 10,
    date: 1,
    event: 'Eid ul Fitr',
  ),
  IslamicEvents(
    month: 12,
    date: 9,
    event: 'Hajj',
  ),
  IslamicEvents(
    month: 12,
    date: 10,
    event: 'Eid ul Adha',
  ),
];
