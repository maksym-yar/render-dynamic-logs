import { useEffect, useRef, useState } from 'react';
import { FixedSizeList as List, ListOnScrollProps } from "react-window";
import 'tailwindcss/tailwind.css';

class Node {
  value: string;
  next: Node | null = null;

  constructor(value: string) {
    this.value = value;
  }
}

class LinkedList {
  head: Node | null = null;
  tail: Node | null = null;
  length: number = 0;

  constructor(list?: LinkedList) {
    if (list) {
      this.head = list.head;
      this.tail = list.tail;
      this.length = list.length;
    }
  }

  append(value: string) {
    const newNode = new Node(value);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.length++;

    return this
  }

  get(index: number): string | null {
    let current = this.head;
    let count = 0;
    while (current) {
      if (count === index) {
        return current.value;
      }
      current = current.next;
      count++;
    }
    return null;
  }
}

const MAX_HEIGHT = 10737418;
const ITEM_HEIGHT = 20; // Assuming each item has a fixed height
const MAX_ITEMS = Math.floor(MAX_HEIGHT / ITEM_HEIGHT);

function App() {
  const [autoScroll, setAutoScroll] = useState(true);
  const autoScrollRef = useRef(autoScroll);
  const [startIndex, setStartIndex] = useState(0);
  const logContainerRef = useRef<List>(null);
  const downloadBytes = useRef(0);
  const [logs, setLogs] = useState(new LinkedList());

  const scrollOffsetRef = useRef(0);

  useEffect(() => {
    const socket = new WebSocket(`wss://test-log-viewer-backend.stg.onepunch.agency/view-log-ws`);

    socket.addEventListener("open", () => {
      socket.send("Hello Server!");
    });

    socket.addEventListener("message", (event) => {
      const newLog = event.data as string;

      downloadBytes.current += new Blob([newLog]).size

      const totalSize = 1 * 1024 * 1024 * 1024; // 1GB in bytes
      document.title = `${((downloadBytes.current / totalSize) * 100).toFixed(2)}%`;

      setLogs(prevList => {
        prevList.append(newLog);

        if (prevList.length > MAX_ITEMS) {
          const el = document.querySelector('.list')?.children[0]

          if (el) {
            const newStartIndex = Math.min(Math.floor(scrollOffsetRef.current / el.scrollHeight * prevList.length), prevList.length - MAX_ITEMS);
            setStartIndex(newStartIndex);
          }
        }

        return new LinkedList(prevList);
      })
    });

    return () => {
      socket.close();
    };
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => {
      if (autoScroll && logContainerRef.current) {
        logContainerRef.current.scrollToItem(logs.length - 1, 'end');
      }
    })
  }, [logs, autoScroll]);

  const toggleAutoScroll = () => {
    setAutoScroll(!autoScroll);
    autoScrollRef.current = !autoScroll;
  };

  const handleScroll = ({ scrollOffset }: ListOnScrollProps) => {
    scrollOffsetRef.current = scrollOffset;

    const el = document.querySelector('.list')?.children[0]

    if (!el) return

    const itemHeight = el.scrollHeight;
    const newStartIndex = Math.max(Math.min(Math.floor(scrollOffset / itemHeight * logs.length), logs.length - MAX_ITEMS), 0);
    setStartIndex(newStartIndex);
  };

  return (
    <div className="p-4 h-screen bg-black">
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        onClick={toggleAutoScroll}
      >
        {autoScroll ? 'Disable' : 'Enable'} Auto Scroll
      </button>

      <span className='text-white'>{downloadBytes.current}</span>
    
      <div className='border p-2 border-gray-300 bg-gray-900 rounded text-orange-500'>
        <List
            height={window.innerHeight * 0.8}
            width="100%"
            itemCount={Math.min(logs.length, MAX_ITEMS)}
            itemSize={ITEM_HEIGHT}
            ref={logContainerRef}
            onScroll={handleScroll}
            className='list'
            style={{
              overflowX: 'hidden',
            }}
          >
          {({ index, style }) => (
            <div style={{...style, whiteSpace: 'nowrap'}} key={index}>
              {index + startIndex} {logs.get(index + startIndex)}
            </div>
          )}
        </List>
      </div>
    </div>
  );
}

export default App;
