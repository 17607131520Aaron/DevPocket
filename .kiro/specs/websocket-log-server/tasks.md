# Implementation Plan: WebSocket Log Server Integration

## Overview

This implementation plan integrates a WebSocket log server into the Electron application. The server will be placed in a new `src/server` directory and automatically started when the app launches. Tasks are organized to build incrementally, with testing integrated throughout.

## Tasks

- [x] 1. Create server directory and log server implementation
  - Create `src/server` directory
  - Create `src/server/log-server.ts` with the LogWebSocketServer class
  - Implement all interfaces (IClientInfo, ILogMessage, INetworkRequestMessage, INetworkResponseMessage, INetworkErrorMessage)
  - Implement singleton pattern with getLogServer(), startLogServer(), stopLogServer()
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]\* 1.1 Write property test for singleton pattern
  - **Property 1: Singleton Instance Consistency**
  - **Validates: Requirements 1.3**

- [ ] 2. Implement server lifecycle management
  - [x] 2.1 Implement start() method
    - Create HTTP server
    - Create WebSocket server with path configuration
    - Bind to 0.0.0.0 with specified port
    - Set up connection event handler
    - Handle server errors (EADDRINUSE, etc.)
    - Set isRunning flag
    - _Requirements: 2.1, 2.2, 2.4, 6.1_

  - [x] 2.2 Implement stop() method
    - Close WebSocket server
    - Close HTTP server
    - Clear clients map
    - Set isRunning to false
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]\* 2.3 Write unit tests for lifecycle methods
    - Test start() initializes servers correctly
    - Test stop() cleans up resources
    - Test calling start() when already running
    - Test getIsRunning() state tracking
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

  - [ ]\* 2.4 Write property test for connection cleanup
    - **Property 2: Client Connection Cleanup**
    - **Validates: Requirements 3.2**

- [ ] 3. Implement client connection management
  - [x] 3.1 Implement handleConnection() method
    - Generate unique client ID
    - Extract client IP from headers or socket
    - Store client info in map
    - Send welcome message
    - Set up message, close, and error handlers
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 3.2 Implement handleDisconnect() method
    - Remove client from map
    - Log disconnection
    - _Requirements: 5.4_

  - [x] 3.3 Implement getConnectionCount() method
    - Return size of clients map
    - _Requirements: 5.5_

  - [ ]\* 3.4 Write property test for unique client IDs
    - **Property 6: Unique Client ID Assignment**
    - **Validates: Requirements 5.1**

  - [ ]\* 3.5 Write property test for IP extraction
    - **Property 7: Client IP Extraction**
    - **Validates: Requirements 5.2**

  - [ ]\* 3.6 Write property test for welcome messages
    - **Property 8: Welcome Message Delivery**
    - **Validates: Requirements 5.3**

  - [ ]\* 3.7 Write property test for disconnection cleanup
    - **Property 9: Disconnection Cleanup**
    - **Validates: Requirements 5.4**

  - [ ]\* 3.8 Write propertytest for connection count accuracy
    - **Property 10: Connection Count Accuracy**
    - **Validates: Requirements 5.5**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement message handling and broadcasting
  - [x] 5.1 Implement handleMessage() method
    - Parse incoming message as JSON
    - Handle parsing errors gracefully
    - Route message based on type (js-log, network-request, network-response, network-error)
    - Log message receipt
    - _Requirements: 4.5, 6.3_

  - [x] 5.2 Implement broadcastToOthers() method
    - Parse and re-stringify message
    - Iterate through clients map
    - Send to all clients except sender
    - Handle send errors for individual clients
    - _Requirements: 4.1, 6.4_

  - [x] 5.3 Implement broadcastToAll() method
    - Parse and re-stringify message
    - Iterate through clients map
    - Send to all clients including sender
    - Handle send errors for individual clients
    - _Requirements: 4.2, 4.3, 4.4, 6.4_

  - [x] 5.4 Implement sendWelcomeMessage() method
    - Create system message with client IP
    - Send to newly connected client
    - Handle send errors
    - _Requirements: 5.3_

  - [ ]\* 5.5 Write property test for js-log broadcast exclusion
    - **Property 3: js-log Broadcast Exclusion**
    - **Validates: Requirements 4.1**

  - [ ]\* 5.6 Write property test for network message broadcast inclusion
    - **Property 4: Network Message Broadcast Inclusion**
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [ ]\* 5.7 Write property test for JSON parsing resilience
    - **Property 5: JSON Parsing Resilience**
    - **Validates: Requirements 4.5, 6.3**

  - [ ]\* 5.8 Write property test for broadcast partial failure tolerance
    - **Property 12: Broadcast Partial Failure Tolerance**
  - **Validates: Requirements 6.4**

- [ ] 6. Implement error handling
  - [x] 6.1 Add HTTP server error handler
    - Listen for 'error' event
    - Log error with code
    - Provide specific message for EADDRINUSE
    - _Requirements: 6.1_

  - [x] 6.2 Add WebSocket server error handler
    - Listen for 'error' event
    - Log error without crashing
    - _Requirements: 6.2_

  - [x] 6.3 Add per-client error handler
    - Listen for 'error' event on each WebSocket
    - Log error with client ID
    - Continue server operation
    - _Requirements: 6.2_

  - [ ]\* 6.4 Write property test for WebSocket error resilience
    - **Property 11: WebSocket Error Resilience**
    - **Validates: Requirements 6.2**

  - [ ]\* 6.5 Write unit tests for error conditions
    - Test EADDRINUSE error handling
    - Test WebSocket error handling
    - Test message parsing error handling
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Integrate with Electron main process
  - [x] 8.1 Modify src/main.ts to import log server
    - Add import statement for startLogServer and stopLogServer
    - _Requirements: 2.1, 3.1_

  - [x] 8.2 Start log server on app ready
    - Add startLogServer() call in 'ready' event handler
    - Wrap in try-catch to handle startup failures
    - Log success or failure
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 8.3 Stop log server on app quit
    - Add stopLogServer() call in 'will-quit' event handler
    - Ensure cleanup completes before exit
    - _Requirements: 3.1, 3.4_

  - [ ]\* 8.4 Write integration test for app lifecycle
    - Test server starts when app is ready
    - Test server stops when app quits
    - Test app continues if server fails to start
    - _Requirements: 2.1, 2.4, 3.1_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- The server will listen on `ws://0.0.0.0:8082/logs` by default
- All TypeScript types are defined inline in the log-server.ts file
