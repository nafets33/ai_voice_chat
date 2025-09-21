import React, { useState, useEffect, useRef, useCallback } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import './spinner.css';

const Dictaphone = ({
  commands,
  myFunc,
  listenAfterReply = false,
  no_response_time = 3,
  apiInProgress = false,
  listenButton = false,
  session_listen = false,
  initialFinalTranscript = "",
  splitImage = false,
}) => {
  const {
    finalTranscript,
    interimTranscript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const [editableTranscript, setEditableTranscript] = useState("");
  const [show_transcript, setShowTranscript] = useState(true);

  // New states for text selection and replacement
  const [selectedText, setSelectedText] = useState("");
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [showReplaceBox, setShowReplaceBox] = useState(false);
  const [replaceInput, setReplaceInput] = useState("");
  const [isProcessingReplace, setIsProcessingReplace] = useState(false);

  const textareaRef = useRef(null);
  const cursorPosRef = useRef(null);
  const replaceInputRef = useRef(null);

  const [transcriptHistory, setTranscriptHistory] = useState([]);

  // Handle text selection in textarea
  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = editableTranscript.substring(start, end);

      if (selected.length > 0) {
        setSelectedText(selected);
        setSelectionStart(start);
        setSelectionEnd(end);
        // setShowReplaceBox(true);
        setReplaceInput(""); // Clear previous input
      } else {
        setSelectedText("");
        setSelectionStart(0);
        setSelectionEnd(0);
      }
    }
  };

  // Handle the replace operation
  const handleReplaceText = async () => {
    if (!replaceInput.trim() || !selectedText) return;

    setIsProcessingReplace(true);

    try {
      // Create a special command for text replacement
      const replaceCommand = {
        api_body: {
          action: "replace_text",
          original_text: selectedText,
          replacement_prompt: replaceInput.trim()
        }
      };

      // Call myFunc and wait for the result
      const result = await myFunc(replaceInput.trim(), replaceCommand, 9);

      // Check if result is valid for replacement
      if (result === null ||
        result === undefined ||
        result === "" ||
        result === "None" ||
        (typeof result === 'string' && result.trim() === "")) {

        console.log("MyFunc returned empty/null result, not replacing text");

        // Show user feedback that no replacement occurred
        setReplaceInput(""); // Clear input but keep box open

        // Optional: Show a temporary message
        const originalPlaceholder = replaceInputRef.current?.placeholder;
        if (replaceInputRef.current) {
          replaceInputRef.current.placeholder = "No replacement text returned - try a different prompt";
          setTimeout(() => {
            if (replaceInputRef.current) {
              replaceInputRef.current.placeholder = originalPlaceholder || "Enter replacement text or prompt...";
            }
          }, 3000);
        }

        return; // Exit without replacing text
      }

      // Replace the selected text with the result
      const newTranscript =
        editableTranscript.substring(0, selectionStart) +
        result +
        editableTranscript.substring(selectionEnd);

      setEditableTranscript(newTranscript);
      setShowReplaceBox(false);
      setSelectedText("");
      setReplaceInput("");

      // Focus back to textarea and position cursor after replacement
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = selectionStart + result.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }

    } catch (error) {
      console.error("Error replacing text:", error);

      // Show error feedback to user
      if (replaceInputRef.current) {
        const originalPlaceholder = replaceInputRef.current.placeholder;
        replaceInputRef.current.placeholder = "Error occurred during replacement";
        setTimeout(() => {
          if (replaceInputRef.current) {
            replaceInputRef.current.placeholder = originalPlaceholder || "Enter replacement text or prompt...";
          }
        }, 3000);
      }
    } finally {
      setIsProcessingReplace(false);
    }
  };

  // Cancel replace operation
  const handleCancelReplace = () => {
    setShowReplaceBox(false);
    setSelectedText("");
    setReplaceInput("");
    setSelectionStart(0);
    setSelectionEnd(0);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };



  const showTranscript_func = () => setShowTranscript((prev) => !prev);

  const clearTranscript_func = () => {
    resetTranscript();
    setEditableTranscript("");
    setShowReplaceBox(false);
    setSelectedText("");
  };

  const processTranscript = useCallback(() => {
    if (finalTranscript !== "") {
      // Add the current editableTranscript to the history
      setTranscriptHistory((prevHistory) => {
        const updatedHistory = [...prevHistory, editableTranscript];
        // Keep only the last 8 slices
        if (updatedHistory.length > 8) {
          updatedHistory.shift(); // Remove the oldest slice
        }
        console.log("Updated transcript history:", updatedHistory); // Debugging
        return updatedHistory;
      });

      if (listenButton) {
        // When session_listen is false and not using listenButton, just append
        myFunc(finalTranscript, { api_body: {} }, 8);
        setEditableTranscript((prev) => `${prev} ${finalTranscript}`.trim());
        resetTranscript();
        setEditableTranscript(""); // Clear editable transcript state
        return;
      }

      if (session_listen) {
        // Check for keywords only when session_listen is true
        let keywordFound = false;
        for (let i = 0; i < commands.length; i++) {
          const { keywords } = commands[i];
          for (let j = 0; j < keywords.length; j++) {
            const keyword = new RegExp(keywords[j], "i");
            const isKeywordFound = finalTranscript.search(keyword) !== -1;

            if (isKeywordFound && !apiInProgress) {
              console.log(`Keyword found: ${keywords[j]}`);
              myFunc(finalTranscript, commands[i], 1);
              resetTranscript(); // Reset transcript after processing keyword
              keywordFound = true;
              return;
            }
          }
        }

        if (!keywordFound) {
          // Append transcript if no keyword is found
          setEditableTranscript((prev) => `${prev} ${finalTranscript}`.trim());
          resetTranscript(); // Clear finalTranscript after appending
        }
      } else {
        // When session_listen is false, focus on capturing speech-to-text
        if (textareaRef.current) {
          cursorPosRef.current = textareaRef.current.selectionStart;
        }

        console.log("Recording speech-to-text without keyword triggers");
        setEditableTranscript((prev) => `${prev} ${finalTranscript}`.trim());
        resetTranscript(); // Clear finalTranscript after appending
      }
    }
  }, [finalTranscript, listenButton, session_listen, commands, apiInProgress, editableTranscript]);


  const handleTranscriptChange = (e) => {
    const newValue = e.target.value;

    // Update the editable transcript
    setEditableTranscript(newValue);

    // Add the current editableTranscript to the history
    setTranscriptHistory((prevHistory) => {
      const updatedHistory = [...prevHistory, editableTranscript];
      // Keep only the last 8 slices
      if (updatedHistory.length > 8) {
        updatedHistory.shift(); // Remove the oldest slice
      }
      console.log("Updated transcript history (manual edit):", updatedHistory); // Debugging
      return updatedHistory;
    });
  };

  const handleBackwards = () => {
    setTranscriptHistory((prevHistory) => {
      if (prevHistory.length > 0) {
        const lastSlice = prevHistory[prevHistory.length - 1];
        setEditableTranscript(lastSlice); // Revert to the last slice
        return prevHistory.slice(0, -1); // Remove the last slice from history
      }
      return prevHistory; // If no history, do nothing
    });
  };

  // Focus replace input when box appears
  useEffect(() => {
    if (showReplaceBox && replaceInputRef.current) {
      setTimeout(() => {
        replaceInputRef.current.focus();
      }, 100);
    }
  }, [showReplaceBox]);

  useEffect(() => {
    if (initialFinalTranscript) {
      setEditableTranscript((prev) => `${prev} ${initialFinalTranscript}`.trim());
    }

    processTranscript();
  }, [initialFinalTranscript, processTranscript]);


  useEffect(() => {
    if (textareaRef.current && cursorPosRef.current !== null) {
      textareaRef.current.selectionStart = cursorPosRef.current;
      textareaRef.current.selectionEnd = cursorPosRef.current;
      cursorPosRef.current = null;
    }
  }, [editableTranscript]);


  if (!browserSupportsSpeechRecognition) {
    return <span>No browser support</span>;
  }

  if (!isMicrophoneAvailable) {
    return <span>Please allow access to the microphone</span>;
  }

  return (
    <>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button
          onClick={() => {
            myFunc(editableTranscript, { api_body: {} }, 5);
            resetTranscript();
            setEditableTranscript("");
          }}
          style={{
            backgroundColor: "rgb(196, 230, 252)",
            color: "black",
            border: "none",
            padding: "5px 10px",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "0.9em",
          }}
        >
          Send Transcript
        </button>
        <button
          onClick={showTranscript_func}
          style={{
            backgroundColor: "white",
            color: "grey",
            border: "none",
            padding: "5px 10px",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "0.9em",
          }}
        >
          {show_transcript ? "Hide Transcript" : "Show Transcript"}
        </button>
        <button
          onClick={clearTranscript_func}
          style={{
            backgroundColor: "white",
            color: "grey",
            border: "none",
            padding: "5px 10px",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "0.9em",
          }}
        >
          Clear Transcript
        </button>

        {/* New button to show replace functionality hint */}
        <button
          onClick={() => {
            if (selectedText) {
              setShowReplaceBox(true);
              setReplaceInput(""); // Clear previous input
            }
          }}
          disabled={!selectedText}
          style={{
            backgroundColor: selectedText ? "rgb(255, 245, 157)" : "rgb(245, 245, 245)",
            color: selectedText ? "black" : "grey",
            border: "none",
            padding: "5px 10px",
            borderRadius: "3px",
            cursor: selectedText ? "pointer" : "not-allowed",
            fontSize: "0.8em",
          }}
          title={selectedText ? "Click to replace selected text" : "Select text in transcript first"}
        >
          {selectedText ? `Replace: "${selectedText.substring(0, 20)}${selectedText.length > 20 ? '...' : ''}"` : "Select text to replace"}
        </button>
      </div>

<button
  onClick={handleBackwards}
  disabled={transcriptHistory.length === 0} // Disable if no history
  style={{
    backgroundColor: transcriptHistory.length > 0 ? "rgb(213, 209, 150)" : "#ccc",
    color: "white",
    border: "none",
    padding: "3px 6px",
    borderRadius: "4px",
    cursor: transcriptHistory.length > 0 ? "pointer" : "not-allowed",
    fontSize: "0.9em",
    fontWeight: "bold",
    position: "relative", // For tooltip positioning
  }}
>
  <span style={{ fontSize: "1.2em", marginRight: "6px" }}>&larr;</span>
  <span
    style={{
      visibility: "hidden", // Initially hidden
      opacity: 0, // Initially transparent
      backgroundColor: "black",
      color: "white",
      textAlign: "center",
      borderRadius: "4px",
      padding: "5px",
      position: "absolute",
      bottom: "120%", // Position above the button
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1,
      fontSize: "0.8em",
      whiteSpace: "nowrap",
      transition: "opacity 0.2s ease-in-out", // Smooth fade-in effect
    }}
    className="tooltip"
  >
    Revert Transcript
  </span>
</button>

      {/* Replace text input box */}
      {showReplaceBox && (
        <div style={{
          position: "relative",
          backgroundColor: "rgb(255, 248, 220)",
          border: "2px solid rgb(255, 193, 7)",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          <div style={{ marginBottom: "10px", fontSize: "0.9em", fontWeight: "bold" }}>
            Replace: "<span style={{ fontStyle: "italic", color: "#666" }}>{selectedText}</span>"
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              ref={replaceInputRef}
              type="text"
              value={replaceInput}
              onChange={(e) => setReplaceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleReplaceText();
                } else if (e.key === 'Escape') {
                  handleCancelReplace();
                }
              }}
              placeholder="Enter replacement text or prompt..."
              style={{
                flex: 1,
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "0.9em"
              }}
              disabled={isProcessingReplace}
            />

            <button
              onClick={handleReplaceText}
              disabled={!replaceInput.trim() || isProcessingReplace}
              style={{
                backgroundColor: isProcessingReplace ? "#ccc" : "rgb(40, 167, 69)",
                color: "white",
                border: "none",
                padding: "8px 15px",
                borderRadius: "4px",
                cursor: isProcessingReplace ? "not-allowed" : "pointer",
                fontSize: "0.9em",
                fontWeight: "bold"
              }}
            >
              {isProcessingReplace ? "⏳" : "Replace"}
            </button>

            {/* ADD THIS CANCEL BUTTON */}
            <button
              onClick={handleCancelReplace}
              disabled={isProcessingReplace}
              style={{
                backgroundColor: "rgb(108, 117, 125)",
                color: "white",
                border: "none",
                padding: "8px 15px",
                borderRadius: "4px",
                cursor: isProcessingReplace ? "not-allowed" : "pointer",
                fontSize: "0.9em",
                fontWeight: "bold"
              }}
            >
              Cancel
            </button>
          </div>

          <div style={{ marginTop: "8px", fontSize: "0.8em", color: "#666" }}>
            💡 Note: `Replace, will replace text with {splitImage}'s response`;
          </div>
        </div>
      )}

      {show_transcript && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "800px",
            height: "550px",
            overflowY: "auto",
            border: "1px solid #ccc",
            padding: "10px",
          }}
        >
          <span>
            <strong>Listening:</strong>{" "}
            <span
              style={{
                color: listening ? "green" : "gray",
                fontWeight: 600,
                animation: listening ? "flash-green 1s infinite alternate" : "none",
              }}
            >
              {listening ? "ON" : "OFF"}
            </span>
            <style>
              {`
                @keyframes flash-green {
                  0% { opacity: 1; }
                  100% { opacity: 0.4; }
                }
              `}
            </style>
          </span>

          <span>
            <strong>Transcript:</strong>
            {selectedText && (
              <span style={{ marginLeft: "10px", fontSize: "0.8em", color: "#666" }}>
                (`Replace with {splitImage}'s response`);
              </span>
            )}
          </span>

          {interimTranscript && (
            <div style={{ color: "#888", fontStyle: "italic", marginBottom: "8px" }}>
              {interimTranscript}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={editableTranscript}
            onChange={handleTranscriptChange}
            onSelect={handleTextSelection} // Add selection handler
            onMouseUp={handleTextSelection} // Handle mouse selection
            onKeyUp={handleTextSelection} // Handle keyboard selection
            style={{
              backgroundColor: "rgb(255, 255, 255)",
              color: "black",
              width: "100%",
              height: "550px",
              border: "1px solid #ccc",
              padding: "5px",
              resize: "none",
            }}
          />
        </div>
      )}
    </>
  );
};

export default Dictaphone;