import React from 'react';

const Terminal = ({ entries, commandHistory }) => {
  const terminalRef = React.useRef(null);

  // Auto-scroll to bottom when new entries are added
  React.useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [entries]);

  // Get tone class for different response types
  const getToneClass = (tone) => {
    switch (tone) {
      case 'positive': return 'success';
      case 'negative': return 'danger';
      case 'urgent': return 'warning';
      case 'explore': return 'explore';
      default: return '';
    }
  };

  return (
    <div className="terminal" ref={terminalRef}>
      {entries.map((entry, index) => (
        <div key={index} className="entry">
          {entry.command && (
            <div className="command">{'> ' + entry.command}</div>
          )}
          
          <div className={`response ${getToneClass(entry.tone)}`}>
            {entry.text}
          </div>
          
          {entry.detail && (
            <div className="detail">{entry.detail}</div>
          )}
          
          {entry.image && (
            <div className="image-container">
              <img 
                className="discovery-image" 
                src={entry.image} 
                alt={entry.imageAlt || "Discovery"} 
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Terminal;

