# Design Document: WebSocket Log Server Integration

## Overview

This design integrates a WebSocket-based log server into an Electron desktop application. The server receives log messages from React Native applications and broadcasts them to connected web clients for real-time monitoring. The implementation uses the existing `ws` library and follows a singleton pattern for lifecycle management.

The server will be automatically started when the Electron app initializes and gracefully shut down when the app exits, ensuring proper resource cleanup.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Application                      │
│                                                              │
│  ┌────────────────┐         ┌──────────────────────┐       │
│  │  Main Process  │────────▶│  LogWebSocketServer  │       │
│  │   (main.ts)    │         │  (log-server.ts)     │       │
│  └────────────────┘         └──────────────────────┘       │
│         │                              │                     │
│         │ Lifecycle                    │ WebSocket          │
│         │ Management                   │ Communication      │
│         │                              │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          │                              │ ws://0.0.0.0:8082/logs
          │                              │
          │                    ┌─────────┴──────────┐
          │                    │                    │
    ┌─────▼──────┐      ┌──────▼──────┐    ┌──────▼──────┐
    │   App      │      │ RN Client   │    │ Web Client  │
    │ Lifecycle  │      │  (Sender)   │    │ (Receiver)  │
    └────────────┘      └─────────────┘    └─────────────┘
```

### Component Interaction Flow

1. **Startup Flow**:
   - Electron app fires `ready` event
   - Main process calls `startLogServer()`
   - Server creates HTTP server and WebSocket server
   - Server binds to `0.0.0.0:8082` with path `/logs`
   - Server begins accepting connections

2. **Message Flow**:
   - RN client connects to WebSocket server
   - Server assigns unique client ID and stores connection
   - Server sends welcome message to client
   - Client sends log/network messages
   - Server parses and validates messages
   - Server broadcasts to appropriate recipients
   - Web clients receive and display messages

3. **Shutdown Flow**:
   - Electron app fires `will-quit` or `quit` event
   - Main process calls `stopLogServer()`
   - Server closes all active WebSocket connections
   - Server closes HTTP server
   - Server clears client map
   - Resources are released

## Components and Interfaces

### LogWebSocketServer Class

The core server class managing WebSocket connections and message routing.

**Properties**:

- `wss: WebSocketServer | null` - WebSocket server instance
- `httpServer: HttpServer | null` - HTTP server for WebSocket upgrade
- `clients: Map<WebSocket, IClientInfo>` - Active client connections
- `clientIdCounter: number` - Counter for generating unique client IDs
- `port: number` - Server port (default: 8082)
- `path: string` - WebSocket path (default: '/logs')
- `isRunning: boolean` - Server running state

**Public Methods**:

```typescript
start(port?: number, path?: string): void
stop(): void
getConnectionCount(): number
getIsRunning(): boolean
```

**Private Methods**:

```typescript
handleConnection(ws: WebSocket, request: IncomingMessage): void
handleMessage(sender: WebSocket, data: Buffer): void
handleDisconnect(ws: WebSocket): void
sendWelcomeMessage(ws: WebSocket, clientIp: string): void
broadcastToOthers(sender: WebSocket, message: string): void
broadcastToAll(message: string): void
```

### Singleton Functions

```typescript
getLogServer(): LogWebSocketServer
startLogServer(port?: number, path?: string): void
stopLogServer(): void
```

### Main Process Integration

The `src/main.ts` file will be modified to integrate the log server:

```typescript
import { startLogServer, stopLogServer } from "./server/log-server";

app.on("ready", () => {
  createWindow();

  // Start log server
  try {
    startLogServer(8082, "/logs");
  } catch (error) {
    console.error("Failed to start log server:", error);
    // Continue app execution even if log server fails
  }
});

app.on("will-quit", () => {
  // Stop log server before quitting
  stopLogServer();
});
```

## Data Models

### IClientInfo

```typescript
interface IClientInfo {
  id: string; // Unique client identifier (e.g., "client-1")
  ip: string; // Client IP address
}
```

### Message Type Interfaces

```typescript
interface ILogMessage {
  type: "js-log";
  level: string; // e.g., 'info', 'warn', 'error'
  message: string;
  timestamp: string; // ISO 8601 format
  context?: unknown;
}

interface INetworkRequestMessage {
  type: "network-request";
  data: {
    id?: string;
    method?: string; // HTTP method
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
    timestamp?: string;
  };
}

interface INetworkResponseMessage {
  type: "network-response";
  data: {
    id?: string; // Matches request ID
    status?: number; // HTTP status code
    statusText?: string;
    headers?: Record<string, string>;
    body?: unknown;
    timestamp?: string;
  };
}

interface INetworkErrorMessage {
  type: "network-error";
  data: {
    id?: string; // Matches request ID
    error?: string;
    timestamp?: string;
  };
}

interface ISystemMessage {
  type: "system";
  message: string;
  timestamp: string;
  clientIp: string;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Singleton Instance Consistency

_For any_ sequence of calls to `getLogServer()`, all calls should return the same instance reference.

**Validates: Requirements 1.3**

### Property 2: Client Connection Cleanup

_For any_ set of connected clients, when the server stops, all clients should be disconnected and the client map should be empty.

**Validates: Requirements 3.2**

### Property 3: js-log Broadcast Exclusion

_For any_ js-log message sent by a client, all other connected clients (excluding the sender) should receive the message.

**Validates: Requirements 4.1**

### Property 4: Network Message Broadcast Inclusion

_For any_ network-request, network-response, or network-error message, all connected clients (including the sender) should receive the message.

**Validates: Requirements 4.2, 4.3, 4.4**

### Property 5: JSON Parsing Resilience

_For any_ invalid JSON message received, the server should log an error and continue processing subsequent messages without crashing.

**Validates: Requirements 4.5, 6.3**

### Property 6: Unique Client ID Assignment

_For any_ sequence of client connections, each client should receive a unique client ID that is different from all previously assigned IDs.

**Validates: Requirements 5.1**

### Property 7: Client IP Extraction

_For any_ client connection, the server should extract and store an IP address (from headers or socket) in the client info.

**Validates: Requirements 5.2**

### Property 8: Welcome Message Delivery

_For any_ newly connected client, the server should send a welcome message containing the client's IP address and connection confirmation.

**Validates: Requirements 5.3**

### Property 9: Disconnection Cleanup

_For any_ client that disconnects, the client should be removed from the connections map and the connection count should decrease by one.

**Validates: Requirements 5.4**

### Property 10: Connection Count Accuracy

_For any_ state of the server, `getConnectionCount()` should return a value equal to the size of the clients map.

**Validates: Requirements 5.5**

### Property 11: WebSocket Error Resilience

_For any_ WebSocket error that occurs on a client connection, the server should continue running and processing messages from other clients.

**Validates: Requirements 6.2**

### Property 12: Broadcast Partial Failure Tolerance

_For any_ broadcast operation where one or more clients fail to receive the message, the remaining clients should still receive the message successfully.

**Validates: Requirements 6.4**

## Error Handling

### Port Already in Use (EADDRINUSE)

When the server attempts to start but the port is already occupied:

- Catch the error in the HTTP server's `error` event handler
- Log a descriptive error messagewith the error code
- Set `isRunning` to `false`
- Allow the Electron app to continue running

### WebSocket Connection Errors

When a WebSocket connection encounters an error:

- Log the error with the client ID
- Do not crash the server
- Allow other connections to continue normally
- The connection will be cleaned up when it closes

### Message Parsing Errors

When a message cannot be parsed as JSON:

- Catch the parsing exception
- Log the error with details
- Continue processing subsequent messages
- Do not disconnect the client

### Broadcast Failures

When broadcasting fails for a specific client:

- Catch the error for that client
- Log the error
- Continue broadcasting to remaining clients
- Do not interrupt the broadcast loop

### Server Startup Failures

When the server fails to start:

- Log the error with stack trace
- Set `isRunning` to `false`
- Return control to the main process
- The Electron app should continue running

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Server Lifecycle**:
   - Test that `start()` initializes HTTP and WebSocket servers
   - Test that `stop()` cleans up resources
   - Test that calling `start()` when already running logs a warning
   - Test that `getIsRunning()` reflects the correct state

2. **Client Management**:
   - Test that connecting a client assigns a unique ID
   - Test that disconnecting a client removes it from the map
   - Test that `getConnectionCount()` returns the correct count

3. **Message Handling**:
   - Test that valid JSON messages are parsed correctly
   - Test that invalid JSON messages are handled gracefully
   - Test that different message types trigger appropriate broadcast behavior

4. **Error Conditions**:
   - Test port already in use error (EADDRINUSE)
   - Test WebSocket error handling
   - Test message parsing error handling
   - Test broadcast failure handling

### Property-Based Tests

Property-based tests will verify universal properties across randomized inputs. Each test will run a minimum of 100 iterations.

1. **Property 1: Singleton Instance Consistency**
   - Generate: Multiple calls to `getLogServer()`
   - Verify: All calls return the same instance
   - **Feature: websocket-log-server, Property 1: Singleton Instance Consistency**

2. **Property 2: Client Connection Cleanup**
   - Generate: Random number of mock client connections
   - Action: Call `stop()`
   - Verify: All clients disconnected, map is empty
   - **Feature: websocket-log-server, Property 2: Client Connection Cleanup**

3. **Property 3: js-log Broadcast Exclusion**
   - Generate: Random js-log message, random set of clients
   - Action: Send message from one client
   - Verify: All other clients receive it, sender does not
   - **Feature: websocket-log-server, Property 3: js-log Broadcast Exclusion**

4. **Property 4: Network Message Broadcast Inclusion**
   - Generate: Random network message (request/response/error), random set of clients
   - Action: Send message from one client
   - Verify: All clients (including sender) receive it
   - **Feature: websocket-log-server, Property 4: Network Message Broadcast Inclusion**

5. **Property 5: JSON Parsing Resilience**
   - Generate: Random invalid JSON strings
   - Action: Send as message to server
   - Verify: Server continues running, subsequent valid messages are processed
   - **Feature: websocket-log-server, Property 5: JSON Parsing Resilience**

6. **Property 6: Unique Client ID Assignment**
   - Generate: Random sequence of client connections
   - Verify: All assigned IDs are unique
   - **Feature: websocket-log-server, Property 6: Unique Client ID Assignment**

7. **Property 7: Client IP Extraction**
   - Generate: Random client connections with various IP sources (headers, socket)
   - Verify: Each client info contains a non-empty IP string
   - **Feature: websocket-log-server, Property 7: Client IP Extraction**

8. **Property 8: Welcome Message Delivery**
   - Generate: Random client connections
   - Verify: Each client receives a welcome message with correct structure
   - **Feature: websocket-log-server, Property 8: Welcome Message Delivery**

9. **Property 9: Disconnection Cleanup**
   - Generate: Random set of clients, random disconnection sequence
   - Verify: After each disconnection, client is removed and count decreases
   - **Feature: websocket-log-server, Property 9: Disconnection Cleanup**

10. **Property 10: Connection Count Accuracy**
    - Generate: Random sequence of connections and disconnections
    - Verify: At each step, `getConnectionCount()` equals clients map size
    - **Feature: websocket-log-server, Property 10: Connection Count Accuracy**

11. **Property 11: WebSocket Error Resilience**
    - Generate: Random WebSocket errors on random clients
    - Verify: Server continues running, other clients unaffected
    - **Feature: websocket-log-server, Property 11: WebSocket Error Resilience**

12. **Property 12: Broadcast Partial Failure Tolerance**
    - Generate: Random broadcast with some clients configured to fail
    - Verify: Non-failing clients still receive the message
    - **Feature: websocket-log-server, Property 12: Broadcast Partial Failure Tolerance**

### Testing Framework

- **Unit Testing**: Jest (already commonly used with TypeScript/Electron projects)
- **Property-Based Testing**: fast-check (TypeScript property-based testing library)
- **Mocking**: Mock WebSocket connections using `ws` test utilities or custom mocks

### Test Configuration

```json
{
  "jest": {
    "testMatch": ["**/*.test.ts"],
    "collectCoverageFrom": ["src/server/**/*.ts"]
  }
}
```

Each property-based test will be configured to run 100 iterations minimum to ensure comprehensive coverage of the input space.
