# 🎼 Automatic Music Generation Using LSTM

This project explores the generation of symbolic music (MIDI format) using deep learning techniques. It leverages LSTM-based neural networks to model the temporal dependencies between musical notes and generate novel piano melodies.

---

## 🚀 Project Overview

- **Goal**: Generate realistic piano music using a seed sequence.
- **Input**: MIDI files of classical piano compositions.
- **Output**: MIDI file with generated music.

We trained two models:
1. **Pitch Prediction Model**: Predicts the next note using LSTM and softmax over 88 piano keys.
2. **Duration & Step Model**: Predicts timing and duration using regression.

---

## 🎵 Dataset

- Collection of classical piano MIDI files (Bach, Beethoven, Chopin, Mozart, etc.)
- Preprocessing includes extracting:
  - Pitch (MIDI note)
  - Duration (time held)
  - Step (time between notes)
- Filtered rare notes and normalized features.

---

## 🧠 Model Architectures

### 1. Pitch Prediction
- Bidirectional LSTM → LSTM → Dense(88) with softmax
- Trained using categorical cross-entropy

### 2. Duration & Step Prediction
- Bidirectional LSTM → LSTM → Two Dense(1) layers with sigmoid
- Trained using mean squared error

---

## 🧪 Results & Visualizations

- Generated MIDI files are saved and can be visualized using piano rolls.
- Notes are color-coded by duration.
- Two generation modes:
  - **Model-based**: Predict pitch, duration, step via trained models
  - **Average-based**: Predict pitch and reuse average duration & step from seed

---

## 📂 Folder Structure

