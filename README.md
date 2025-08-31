# AI Voice LLM Chat

A Streamlit custom component that provides a chat window with voice capabilities for conversation handling.

## Features

- Voice-activated chat interface
- Face recognition capabilities
- Customizable conversation handling
- React-based frontend with TypeScript
- Integration with custom APIs for voice processing

## Installation

```bash
pip streamlit-ai-voice-chat
```


# See Demo of Component
See Component in Action -- Demo: divergent-thinker.com/stefan

## Usage

```python
import streamlit as st
from streamlit_ai_voice_chat import custom_voiceGPT, VoiceGPT_options_builder

# Create options
to_builder = VoiceGPT_options_builder.create()
to = to_builder.build()

# Example usage of custom_voiceGPT
custom_voiceGPT(
    api=f"{st.session_state['ip_address']}/api/data/voiceGPT",
    api_key=os.environ.get('ozz_key'),
    client_user=st.session_state['client_user'],
    self_image="hootsAndHootie.png",
    width=350,
    height=350,
    key='hootsAndHootie.png True',
    hello_audio="test_audio.mp3",
    face_recon=True,
    show_video=True,
    input_text=True,
    show_conversation=True,
    no_response_time=3,
    refresh_ask={},
    force_db_root=True if 'force_db_root' in st.session_state and st.session_state['force_db_root'] else False,
    before_trigger={'how are you': 'hoots_waves__272.mp3', 'phrases': []},
    api_audio=f"{st.session_state['ip_address']}/api/data/",
    agent_actions=["Generate A Summary", "Create a Story"],
    commands=[
        {
            "keywords": [],
            "api_body": {"keyword": "hey hoots"},
        },
        {
            "keywords": ["bye Hoots"],
            "api_body": {"keyword": "bye hoots"},
        }
    ],
    datatree={},
    datatree_title="",
    answers=[],
    initialFinalTranscript=None,
)
```

## Development

This project consists of:
- Python backend using Streamlit
- React/TypeScript frontend
- Face recognition using face-api.js

### Requirements

- Python >= 3.7
- Streamlit >= 1.0.0
- Node.js (for frontend development)

## License

MIT License

## Author

Stefan Stapinski

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Repository

https://github.com/nafets33/ai_voice_chat
