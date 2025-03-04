import React from 'react';

const InputArea = ({ onSendCommand, isProcessing }) => {
  const [command, setCommand] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    // Focus the input field when the component mounts
    inputRef.current.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (command.trim() && !isProcessing) {
      onSendCommand(command);
      setCommand('');
    }
  };

  return (
    <form className="input-container" onSubmit={handleSubmit}>
      <input
        type="text"
        className="command-input"
        placeholder="Enter your command..."
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        disabled={isProcessing}
        ref={inputRef}
      />
      <button 
        type="submit" 
        className="send-button"
        disabled={isProcessing || !command.trim()}
      >
        {isProcessing ? (
          <div className="loading-spinner"></div>
        ) : (
          <span>Send</span>
        )}
      </button>
    </form>
  );
};

export default InputArea;

