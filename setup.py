from setuptools import setup, find_packages

# Try to read README, but don't fail if it doesn't exist
try:
    with open("README.md", "r", encoding="utf-8") as fh:
        long_description = fh.read()
except FileNotFoundError:
    long_description = "Chat Window & voice component that handles conversation"

setup(
    name="streamlit-ai-voice-chat",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "streamlit>=1.0.0",
    ],
    author="Stefan Stapinski",
    author_email="stefanstapinski@gmail.com",  # Use your actual TestPyPI email
    description="A Streamlit custom component that provides a chat window with voice capabilities for conversation handling",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/nafets33/ai_voice_chat",
    project_urls={
        "Bug Tracker": "https://github.com/nafets33/ai_voice_chat/issues",
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
)