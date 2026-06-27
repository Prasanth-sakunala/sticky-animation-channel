"""
Kokoro TTS Server
Runs on port 8003, provides /tts endpoint for text-to-speech generation.
Falls back to CPU if CUDA is not available.
"""

import os
import io
import argparse
import soundfile as sf
import torch
from flask import Flask, request, send_file, jsonify

app = Flask(__name__)

# Global model reference
model = None
device = None


def load_model():
    """Load Kokoro TTS model."""
    global model, device

    # Auto-detect device
    if torch.cuda.is_available():
        device = "cuda"
        print(f"Using GPU: {torch.cuda.get_device_name(0)}")
    else:
        device = "cpu"
        print("Using CPU (CUDA not available)")

    try:
        from kokoro import KPipeline
        # Use American English voice
        model = KPipeline(lang_code='a', device=device)
        print("Kokoro TTS model loaded successfully")
    except Exception as e:
        print(f"Failed to load Kokoro model: {e}")
        print("Install with: pip install kokoro")
        model = None


@app.route('/tts', methods=['POST'])
def text_to_speech():
    """Generate speech from text."""
    if model is None:
        return jsonify({"error": "Model not loaded"}), 503

    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "text field required"}), 400

    text = data['text']
    speed = data.get('speed', 1.0)
    voice = data.get('voice', 'af_heart')  # Default voice

    try:
        # Generate audio
        generator = model(text, voice=voice, speed=speed)
        
        # Collect all audio segments
        all_audio = []
        sample_rate = 24000
        
        for i, (gs, ps, audio) in enumerate(generator):
            all_audio.append(audio)

        if not all_audio:
            return jsonify({"error": "No audio generated"}), 500

        # Concatenate segments
        import numpy as np
        full_audio = np.concatenate(all_audio)

        # Write to buffer as WAV
        buffer = io.BytesIO()
        sf.write(buffer, full_audio, sample_rate, format='WAV')
        buffer.seek(0)

        return send_file(buffer, mimetype='audio/wav', as_attachment=True, download_name='speech.wav')

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/voices', methods=['GET'])
def list_voices():
    """List available voices."""
    voices = [
        {"id": "af_heart", "name": "Heart (Female)", "lang": "en-us"},
        {"id": "af_bella", "name": "Bella (Female)", "lang": "en-us"},
        {"id": "am_adam", "name": "Adam (Male)", "lang": "en-us"},
        {"id": "am_michael", "name": "Michael (Male)", "lang": "en-us"},
        {"id": "bf_emma", "name": "Emma (Female, British)", "lang": "en-gb"},
        {"id": "bm_george", "name": "George (Male, British)", "lang": "en-gb"},
    ]
    return jsonify({"voices": voices})


@app.route('/health', methods=['GET'])
def health():
    """Health check."""
    return jsonify({
        "status": "ok" if model is not None else "model_not_loaded",
        "device": device,
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
    })


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Kokoro TTS Server')
    parser.add_argument('--port', type=int, default=8003, help='Port to run on')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to bind to')
    args = parser.parse_args()

    load_model()

    print(f"\nKokoro TTS Server starting on port {args.port}")
    print(f"Device: {device}")
    print(f"Endpoints:")
    print(f"  POST /tts          - Generate speech")
    print(f"  GET  /voices       - List voices")
    print(f"  GET  /health       - Health check\n")

    app.run(host=args.host, port=args.port, debug=False)
