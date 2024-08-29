import { useEffect, useRef, useState } from 'react';
import { FixedSizeList as List } from "react-window";
import 'tailwindcss/tailwind.css'; // Ensure Tailwind CSS is imported

function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<List>(null);

  useEffect(() => {
    const socket = new WebSocket(`wss://test-log-viewer-backend.stg.onepunch.agency/view-log-ws`);

    socket.addEventListener("open", () => {
      socket.send("Hello Server!");
    });

    socket.addEventListener("message", (event) => {
      const newLog = event.data;

      setLogs(prevLogs => [...prevLogs, newLog]);
    });

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollToItem(logs.length - 1, 'end');
    }
  }, [logs, autoScroll]);

  const toggleAutoScroll = () => {
    setAutoScroll(!autoScroll);
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} className="truncate">
      {index + 1} {logs[index]}
    </div>
  );

  return (
    <div className="p-4 h-screen bg-black">
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        onClick={toggleAutoScroll}
      >
        {autoScroll ? 'Disable' : 'Enable'} Auto Scroll
      </button>
    
      <List
        height={window.innerHeight * 0.8}
        width="100%"
        itemCount={logs.length}
        itemSize={32}
        ref={logContainerRef}
        className='border border-gray-300 bg-gray-900 rounded text-orange-500'
      >
        {Row}
      </List>
    </div>
  );
}

export default App;
