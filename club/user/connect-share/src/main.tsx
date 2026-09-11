import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./redux-toolkit/store/store.ts";
import { connectSocket } from "./socket/socket.ts";

// Only open a socket if there is already a session. An unauthenticated
// handshake is rejected by the server and would retry in a loop.
connectSocket();

createRoot(document.getElementById("root")!).render(<Provider store={store}><App /></Provider>);
