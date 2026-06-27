"""Download Kokoro TTS model files."""

def main():
    print("Installing/downloading Kokoro TTS model...")
    print("This will download ~1GB of model files on first run.\n")
    
    try:
        from kokoro import KPipeline
        # This triggers model download
        pipeline = KPipeline(lang_code='a', device='cpu')
        
        # Test with a short phrase
        print("Testing model...")
        for gs, ps, audio in pipeline("Hello, this is a test.", voice='af_heart', speed=1.0):
            print(f"Generated {len(audio)} samples")
            break
        
        print("\n✓ Kokoro TTS model downloaded and verified!")
        print("Run the server with: python server.py --port 8003")
        
    except ImportError:
        print("ERROR: kokoro not installed.")
        print("Install with: pip install kokoro")
    except Exception as e:
        print(f"ERROR: {e}")
        print("\nTry reinstalling: pip install --upgrade kokoro torch")


if __name__ == '__main__':
    main()
