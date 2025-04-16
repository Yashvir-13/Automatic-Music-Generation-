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

## 🛠️ Installation

```bash
git clone https://github.com/Yashvir-13/Automatic-Music-Generation-.git
cd Automatic-Music-Generation-
pip install -r requirements.txt
```

---

## ▶️ Run the Notebook
Open and run amg.ipynb to train models, generate MIDI files, and visualize results.

---

## 📈 Future Enhancements

- Add chord conditioning.
- Integrate Transformer-based models.
- Real-time generation via MIDI input.
 
---
##  Author

### Yashvir Singh

#### Loves time, tech, and the timeless beauty of music.
---
