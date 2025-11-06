# ACC Reverse Entrylist Generator

Ein interaktiver Node.js-basierter Entrylist-Generator für Assetto Corsa Competizione (ACC), der verschiedene Grid-Strategien aus Qualifying-Ergebnissen erstellt.

## Features

### 🏁 Grid-Strategien
- **Normal Grid**: Qualifying-Reihenfolge beibehalten
- **Reverse Grid**: Komplett umgedrehte Startaufstellung
- **Custom Reverse**: Wählbare Anzahl von Fahrern reversed
  - Optional: Reversed Fahrer ans Ende der Liste verschieben
- **Random Grid**: Zufällige Startreihenfolge

### ⚙️ Konfigurationsoptionen
- **Rennnummern forcen**: Übernimmt die Startnummern aus dem Qualifying
- **Fahrzeugmodelle forcen**: Zwingt Fahrer, ihr Qualifying-Fahrzeug zu verwenden
- **Manuelle Bearbeitung**: 
  - Fahrer tauschen
  - Fahrer verschieben
- **Grid-Positionen**: Automatische Zuweisung basierend auf finaler Reihenfolge

### 📊 Vergleichsansicht
Zeigt eine übersichtliche Tabelle mit Qualifying vs. Race Grid Positionen inklusive Positionsänderungen.

## Installation

1. Node.js installieren (falls noch nicht vorhanden)
2. Projekt herunterladen
3. Abhängigkeiten installieren:


## Verwendung

1. Lege die Qualifying-Ergebnisdatei (endet mit `Q.json`) im gleichen Verzeichnis ab
2. Führe das Programm aus:
3. Folge den interaktiven Anweisungen

## Workflow

1. **Qualifying-Datei wird automatisch erkannt**
2. **Grid-Strategie wählen** (Normal, Reverse, Custom Reverse, Random)
3. **Optional: Manuelle Bearbeitung** der Grid-Reihenfolge
4. **Vergleichsansicht** zwischen Qualifying und finalem Grid
5. **Force-Optionen** für Rennnummern und Fahrzeugmodelle
6. **Dateinamen eingeben** und speichern

## Technische Details

- **Encoding**: Unterstützt UTF-16 LE, UTF-8, Latin1, ASCII beim Einlesen
- **Ausgabeformat**: UTF-16 LE mit BOM (ACC-Standard)
- **Automatische BOM-Erkennung** für verschiedene Encodings
- **Robuste Fehlerbehandlung**

## Beispiel-Output

Die generierte Entrylist enthält:
- Fahrer-Informationen (PlayerID, Name, Nationalität)
- Grid-Positionen (1-basiert)
- Rennnummern (forciert oder -1)
- Fahrzeugmodelle (forciert oder -1)
- Team-Namen


## Anforderungen

- Node.js (v14 oder höher empfohlen)
- npm Package: `prompts`

## Hinweise

- Die Qualifying-Datei muss mit `Q.json` enden
- Die Ausgabedatei wird im UTF-16 LE BOM Format gespeichert (ACC-Standard)
- Grid-Positionen beginnen bei 1 (nicht 0)
- Verwende `-1` für nicht forcierte Werte (Rennnummer/Fahrzeugmodell)

## Lizenz

Frei verwendbar für private und kommerzielle Zwecke.

## Support

NONE



