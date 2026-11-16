
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);
const [sessionId, setSessionId] = useState("");
const [searchText, setSearchText] = useState("");
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);
const [token, setToken] = useState(
  localStorage.getItem("token") || ""
);

const [authMode, setAuthMode] = useState("login");
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [authMessage, setAuthMessage] = useState("");
// Chapter 38: AI product search states
const [productMessage, setProductMessage] = useState("");
const [products, setProducts] = useState([]);
const [productLoading, setProductLoading] = useState(false);

const [productError, setProductError] = useState("");

const filteredSessions = sessions.filter((session) =>
  session.title
    .toLowerCase()
    .includes(searchText.toLowerCase())
);

  // NEW: Load previous chat history from MongoDB
useEffect(() => {
  const controller = new AbortController();
  if (!sessionId || !token) {
  return;
}

  async function loadHistory() {
      
    try {
      const response = await fetch(
  `https://mern-ai-chatbot-my4h.onrender.com/api/ai/history?sessionId=${sessionId}&page=1`,
   {
  headers: {
    Authorization: `Bearer ${token}`
  },
  signal: controller.signal
}
)

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load chat history."
        );
      }

      const oldChats = data.slice().reverse().flatMap((chat) => [
  {
    id: chat._id + "-user",
    role: "user",
    text: chat.userMessage
  },
  {
    id: chat._id + "-ai",
    role: "ai",
    text: chat.aiResponse
  }
]);

      setChats(oldChats);

      setPage(1);
setHasMore(data.length === 10);

    } catch (error) {
      if (error.name === "AbortError") {
  return;
}
      setError(error.message);
    }
  }

  loadHistory();
  return () => {
  controller.abort();
};
}, [sessionId, token]);


useEffect(() => {
  async function loadSessions() {
    if (!token) return;
    try {
     const response = await fetch(
  "https://mern-ai-chatbot-my4h.onrender.com/api/ai/sessions",
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Unable to load sessions.");
      }

      setSessions(data);

      if (data.length > 0) {
        setSessionId(data[0]._id);
      } else {
        const newResponse = await fetch(
          "https://mern-ai-chatbot-my4h.onrender.com/api/ai/sessions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
               Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              title: "New chat"
            })
          }
        );

        const newSession = await newResponse.json();

        if (!newResponse.ok) {
          throw new Error("Unable to create session.");
        }

        setSessions([newSession]);
        setSessionId(newSession._id);
      }

    } catch (error) {
      setError(error.message);
    }
  }

  loadSessions();
}, [token]);


async function renameChat(id) {
  const newTitle = window.prompt("Enter new chat title:");

  if (!newTitle || !newTitle.trim()) {
    return;
  }

  try {
    const response = await fetch(
      `https://mern-ai-chatbot-my4h.onrender.com/api/ai/sessions/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to rename chat.");
    }

    setSessions((previousSessions) =>
      previousSessions.map((session) =>
        session._id === id ? data : session
      )
    );

  } catch (error) {
    setError(error.message);
  }
}


async function deleteChat(id) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this chat?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      `https://mern-ai-chatbot-my4h.onrender.com/api/ai/sessions/${id}`,
      {
        method: "DELETE",
         headers: {
        Authorization: `Bearer ${token}`}
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to delete chat.");
    }

    const remainingSessions = sessions.filter(
      (session) => session._id !== id
    );

    setSessions(remainingSessions);

    if (sessionId === id) {
      setChats([]);

      if (remainingSessions.length > 0) {
        setSessionId(remainingSessions[0]._id);
      } else {
        setSessionId("");
        await createNewChat();
      }
    }

  } catch (error) {
    setError(error.message);
  }
}



async function handleRegister() {
  try {
    setAuthMessage("");

    const response = await fetch(
      "https://mern-ai-chatbot-my4h.onrender.com/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Registration failed.");
    }

    setAuthMessage(data.message);
    setAuthMode("login");
    setPassword("");

  } catch (error) {
    setAuthMessage(error.message);
  }
}


async function handleLogin() {
  try {
    setAuthMessage("");

    const response = await fetch(
      "https://mern-ai-chatbot-my4h.onrender.com/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed.");
    }

    localStorage.setItem("token", data.token);
    setToken(data.token);

    setAuthMessage(data.message);
    setPassword("");

  } catch (error) {
    setAuthMessage(error.message);
  }
}

function handleLogout() {
  localStorage.removeItem("token");

  setToken("");
  setChats([]);
  setSessions([]);
  setSessionId("");
  setMessage("");
  setError("");
  setPassword("");
  setAuthMessage("");
  setAuthMode("login");
}


function handleUnauthorized(response) {
  if (response.status === 401) {
    handleLogout();
    setAuthMessage("Session expired. Please login again.");
    return true;
  }

  return false;
}
  // EXISTING FUNCTION FROM PREVIOUS LESSONS
  async function sendMessage() {
  if (!message.trim() || loading || !sessionId) {
  return;
}

    const userMessage = message;

    setChats((previousChats) => [
      ...previousChats,
      { role: "user", text: userMessage }
    ]);

    setMessage("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://mern-ai-chatbot-my4h.onrender.com/api/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
             Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
  message: userMessage,
  sessionId: sessionId
})
        }
      );

      const data = await response.json();

      if (handleUnauthorized(response)) {
  return;
}

      if (!response.ok) {
        throw new Error(
          data.error || "Request failed"
        );
      }

      setChats((previousChats) => [
        ...previousChats,
        { role: "ai", text: data.reply }
      ]);

      // Refresh the session list
const sessionsResponse = await fetch(
  "https://mern-ai-chatbot-my4h.onrender.com/api/ai/sessions",
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

const sessionsData = await sessionsResponse.json();

setSessions(sessionsData);


    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }


async function createNewChat() {
  try {
    const response = await fetch(
      "https://mern-ai-chatbot-my4h.onrender.com/api/ai/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: "New chat"
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error("Unable to create new chat.");
    }

    setSessions((previousSessions) => [
      data,
      ...previousSessions
    ]);

   setChats([]);
setPage(1);
setHasMore(true);
setSessionId(data._id);
setMessage("");
setError("");

  } catch (error) {
    setError(error.message);
  }
}

const loadMoreChats = async () => {
  if (!sessionId || !hasMore || loadingMore) return;

  const nextPage = page + 1;

  try {
    setLoadingMore(true);

   const response = await fetch(
  `https://mern-ai-chatbot-my4h.onrender.com/api/ai/history?sessionId=${sessionId}&page=${nextPage}`,
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load older chats.");
    }

   const olderChats = data.slice().reverse().flatMap((chat) => [
  {
    id: chat._id + "-user",
    role: "user",
    text: chat.userMessage
  },
  {
    id: chat._id + "-ai",
    role: "ai",
    text: chat.aiResponse
  }
]);

   setChats((prevChats) => {
  const existingIds = new Set(
    prevChats.map((chat) => chat.id)
  );

  const newOlderChats = olderChats.filter(
    (chat) => !existingIds.has(chat.id)
  );

  return [
    ...newOlderChats,
    ...prevChats
  ];
});

    setPage(nextPage);

    setHasMore(data.length === 10);

  } catch (error) {
    console.error("Load more error:", error.message);
  } finally {
    setLoadingMore(false);
  }
};

// Chapter 38: Search products using AI
async function handleProductSearch() {
  if (!productMessage.trim() || productLoading) {
    return;
  }

  try {
    setProductLoading(true);
    setProductError("");
    setProducts([]);

    const response = await fetch(
      "https://mern-ai-chatbot-my4h.onrender.com/api/ai/product-search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: productMessage.trim()
        })
      }
    );

    const data = await response.json();

    if (handleUnauthorized(response)) {
      return;
    }

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to search products."
      );
    }

    setProducts(data.products);

  } catch (error) {
    setProductError(error.message);

  } finally {
    setProductLoading(false);
  }
}

if (!token) {
  return (
    <div className="chat-container">

      <div className="chat-header">
        <h2>
          {authMode === "login" ? "Login" : "Register"}
        </h2>
      </div>

      <div className="chat-input">

        {authMode === "register" && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={
            authMode === "login"
              ? handleLogin
              : handleRegister
          }
        >
          {authMode === "login" ? "Login" : "Register"}
        </button>

        <p>{authMessage}</p>

        <button
          onClick={() => {
            setAuthMode(
              authMode === "login" ? "register" : "login"
            );
            setAuthMessage("");
          }}
        >
          {authMode === "login"
            ? "Create an account"
            : "Already have an account? Login"}
        </button>

      </div>
    </div>
  );
}


 return (
  <div className="app-layout">

    {/* LEFT SIDEBAR */}
    <aside className="chat-sidebar">

      <div className="sidebar-heading">
        <h2>My AI Workspace</h2>
        <p>Your personal assistant</p>
      </div>

      <button
        className="new-chat-button"
        onClick={createNewChat}
      >
        + New Chat
      </button>

      <div className="history-heading">
        <h3>Chat History</h3>
      </div>

      <input
        className="search-chats"
        type="text"
        placeholder="Search chats..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <div className="sessions-list">
        {filteredSessions.map((session) => (
          <div
            className={`session-item ${
              sessionId === session._id ? "active-session" : ""
            }`}
            key={session._id}
          >
            <button
              className="session-title"
              onClick={() => {
                setChats([]);
                setPage(1);
                setHasMore(true);
                setSessionId(session._id);
                setError("");
              }}
              disabled={sessionId === session._id}
            >
              {session.title}
            </button>

            <div className="session-actions">
              <button onClick={() => renameChat(session._id)}>
                Rename
              </button>

              <button
                className="delete-button"
                onClick={() => deleteChat(session._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {filteredSessions.length === 0 && (
          <p className="empty-history">No chats found.</p>
        )}
      </div>

      <button
        className="logout-button"
        onClick={handleLogout}
      >
        Logout
      </button>

    </aside>


    {/* MAIN CONTENT */}
    <main className="main-content">

      <header className="top-header">
        <div>
          <h1>AI Assistant</h1>
          <p>Chat, learn and discover products with AI.</p>
        </div>

        <span className="online-status">
          <span className="status-dot"></span>
          Assistant ready
        </span>
      </header>


      {/* AI PRODUCT SEARCH */}
      <section className="product-search">

        <div className="section-heading">
          <div>
            <h2>AI Product Search</h2>
            <p>Find products using your own requirements.</p>
          </div>
          <span className="section-icon">⌕</span>
        </div>

        <div className="product-search-form">
          <input
            type="text"
            placeholder="Example: Laptop below 50000 with 16GB RAM and 512GB SSD"
            value={productMessage}
            onChange={(e) => setProductMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleProductSearch();
              }
            }}
          />

          <button
            onClick={handleProductSearch}
            disabled={productLoading || !productMessage.trim()}
          >
            {productLoading ? "Searching..." : "Search Products"}
          </button>
        </div>

        {productError && (
          <p className="status error-message">
            {productError}
          </p>
        )}

        {productLoading && (
          <p className="status">Finding matching products...</p>
        )}

        {products.length > 0 && (
          <div className="product-results">
            <h3>Matching Products ({products.length})</h3>

            <div className="product-grid">
              {products.map((product) => (
                <div
                  className="product-card"
                  key={product._id}
                >
                  <div className="product-card-top">
                    <span className="product-label">MATCH FOUND</span>
                    <span className="product-symbol">▣</span>
                  </div>

                  <h4>{product.name || "Unnamed Product"}</h4>

                  <p className="product-price">
                    ₹{product.price ?? "Not available"}
                  </p>

                  <div className="product-specs">
                    <span>Category: {product.category || "Not specified"}</span>
                    <span>RAM: {product.ram || "Not specified"}</span>
                    <span>Storage: {product.storage || "Not specified"}</span>
                  </div>

                  <p className="product-description">
                    {product.description || "No description available"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {productMessage.trim() &&
          !productLoading &&
          !productError &&
          products.length === 0 && (
            <p className="no-products">
              No matching products found. Try changing your requirements.
            </p>
          )}

      </section>


      {/* CHAT PANEL */}
      <section className="chat-panel">

        <div className="chat-panel-header">
          <div className="assistant-avatar">AI</div>

          <div>
            <h2>My AI Assistant</h2>
            <p>Ask me anything!</p>
          </div>
        </div>


        <div className="chat-messages">

          {hasMore && (
            <button
              className="load-more-button"
              onClick={loadMoreChats}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load older messages"}
            </button>
          )}

          {chats.length === 0 && (
            <div className="welcome-message">
              <div className="welcome-avatar">AI</div>
              <h3>How can I help you today?</h3>
              <p>Ask a question to start your conversation.</p>
            </div>
          )}

          {chats.map((chat, index) => (
            <div
              key={chat.id || index}
              className={`message ${chat.role}`}
            >
              <strong>
                {chat.role === "user" ? "You" : "AI Assistant"}
              </strong>

              <span>{chat.text}</span>
            </div>
          ))}

          {loading && (
            <p className="status">AI is thinking...</p>
          )}

          {error && (
            <p className="status error-message">{error}</p>
          )}

        </div>


        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button
            onClick={sendMessage}
            disabled={loading || !message.trim()}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        <p className="chat-footer">
          AI responses may not always be accurate. Please verify important information.
        </p>

      </section>

    </main>

  </div>
);
}

export default App;
