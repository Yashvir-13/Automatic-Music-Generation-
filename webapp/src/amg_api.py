from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import pretty_midi
import numpy as np
import io
import tensorflow as tf

app = Flask(__name__)
CORS(app)

# Normalization ranges (adjust these based on training)
pitch_min, pitch_max = 21, 108
step_min, step_max = 0.01, 1.0
duration_min, duration_max = 0.05, 1.0

# Load pre-trained models
music_model = tf.keras.models.load_model('/mnt/d/Projects/Automatic music generation/webapp/models/music_model.keras')
ds_model = tf.keras.models.load_model('/mnt/d/Projects/Automatic music generation/webapp/models/ds_model.keras')

# Normalization functions
def normalize(value, min_val, max_val):
    return (value - min_val) / (max_val - min_val)

def normalize_note(note):
    pitch = normalize(note.pitch, pitch_min, pitch_max)
    step = np.log1p(note.start - note.previous_start)/5
    duration = np.log1p(note.end - note.start)/5
    return [pitch, step, duration]

# Denormalization (used while creating MIDI)
def denormalize(value, min_val, max_val):
    return value * (max_val - min_val) + min_val

# Music generation logic
def generate_music(pitch_model, ds_model, seed_sequence, steps=200, temperature=0.5):
    generated = seed_sequence.copy()

    for _ in range(steps):
        inputs = generated[-50:][np.newaxis, :, :]  # (1, 50, 3)

        pitch_probs = pitch_model.predict(inputs, verbose=0)
        duration_pred, step_pred = ds_model.predict(inputs, verbose=0)

        # Sample pitch
        pitch_logits = np.log(pitch_probs[0, -1, :] + 1e-8) / temperature
        pitch_exp = np.exp(pitch_logits)
        pitch_probs_temp = pitch_exp / np.sum(pitch_exp)
        sampled_pitch = np.random.choice(88, p=pitch_probs_temp)
        denorm_pitch = sampled_pitch + pitch_min
        normalized_pitch = (denorm_pitch - pitch_min) / (pitch_max - pitch_min)

        # Get predicted duration & step (already normalized)
        predicted_duration = float(duration_pred[0, -1, 0])
        predicted_step = float(step_pred[0, -1, 0])

        # Clip to prevent weird results
        predicted_duration = np.clip(predicted_duration, 0.0, 1.0)
        predicted_step = np.clip(predicted_step, 0.05, 1.0)

        # Append for next input
        new_note = np.array([[normalized_pitch, predicted_duration, predicted_step]])
        generated = np.vstack([generated, new_note])

    return generated

# Parse MIDI file and return normalized seed sequence
def extract_normalized_seed(midi_data, max_notes=50):
    notes = []
    pm = pretty_midi.PrettyMIDI(io.BytesIO(midi_data))
    instrument = pm.instruments[0]
    instrument.notes.sort(key=lambda note: note.start)

    previous_start = 0.0
    for i, note in enumerate(instrument.notes[:max_notes]):
        note.previous_start = previous_start
        notes.append(normalize_note(note))
        previous_start = note.start

    return np.array(notes)

@app.route('/generate', methods=['POST'])
def generate():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        midi_data = file.read()
        seed = extract_normalized_seed(midi_data)

        generated = generate_music(music_model, ds_model, seed)

        # Convert generated notes to MIDI
        midi_output = pretty_midi.PrettyMIDI()
        instrument = pretty_midi.Instrument(program=0)
        time = 0.0

        for note_data in generated:
            pitch = int(note_data[0]* 87 + 21)
            pitch=int(np.clip(pitch, 21, 108))
            duration = np.expm1(note_data[1]*5)
            step = np.expm1(note_data[2]*5)
            start = time + step
            end = start + duration

            note = pretty_midi.Note(velocity=100, pitch=pitch, start=start, end=end)
            instrument.notes.append(note)
            time = start

        


        midi_output.instruments.append(instrument)

        # Convert to file-like object
        midi_io = io.BytesIO()
        midi_output.write(midi_io)
        midi_io.seek(0)

        return send_file(midi_io, mimetype='audio/midi', as_attachment=True, download_name='generated.mid')

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
