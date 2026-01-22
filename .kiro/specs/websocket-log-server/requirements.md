# Requirements Document

## Introduction

集成 WebSocket 日志服务器到 Electron 桌面应用中，使其能够接收来自 React Native 应用的日志消息，并将这些日志转发给连接的 web 客户端。服务器应在 Electron 应用启动时自动启动，并在应用退出时优雅关闭。

## Glossary

- **Log_Server**: WebSocket 日志服务器，负责接收和转发日志消息
- **Electron_App**: 基于 Electron 的桌面应用程序
- **Main_Process**: Electron 的主进程，负责应用生命周期管理
- **RN_Client**: React Native 应用客户端，发送日志的源头
- **Web_Client**: Web 浏览器客户端，接收和显示日志

## Requirements

### Requirement 1: 服务器集成

**User Story:** 作为开发者，我希望将 WebSocket 日志服务器集成到 Electron 应用中，以便在桌面端统一管理日志收集功能。

#### Acceptance Criteria

1. THE Log_Server SHALL be placed in the `src/server/log-server.ts` file
2. THE Log_Server SHALL use the existing `ws` package from dependencies
3. THE Log_Server SHALL export a singleton instance through `getLogServer()` function
4. THE Log_Server SHALL provide `startLogServer()` and `stopLogServer()` functions

### Requirement 2: 自动启动

**User Story:** 作为用户，我希望日志服务器在应用启动时自动运行，无需手动操作。

#### Acceptance Criteria

1. WHEN the Electron_App is ready, THE Main_Process SHALL start the Log_Server automatically
2. THE Log_Server SHALL listen on port 8082 with path `/logs`
3. WHEN the Log_Server starts successfully, THE Main_Process SHALL log the server status
4. IF the Log_Server fails to start, THE Main_Process SHALL log the error but continue running

### Requirement 3: 优雅关闭

**User Story:** 作为开发者，我希望在应用退出时正确关闭日志服务器，避免资源泄漏。

#### Acceptance Criteria

1. WHEN the Electron_App quits, THE Main_Process SHALL stop the Log_Server
2. WHEN the Log_Server stops, THE Log_Server SHALL close all client connections
3. WHEN the Log_Server stops, THE Log_Server SHALL release the HTTP server and WebSocket server resources
4. THE Main_Process SHALL wait for the Log_Server to stop before exiting

### Requirement 4: 消息处理

**User Story:** 作为 RN 开发者，我希望服务器能够接收和转发不同类型的日志消息。

#### Acceptance Criteria

1. WHEN a RN_Client sends a `js-log` message, THE Log_Server SHALL broadcast it to all other clients
2. WHEN a RN_Client sends a `network-request` message, THE Log_Server SHALL broadcast it to all clients
3. WHEN a RN_Client sends a `network-response` message, THE Log_Server SHALL broadcast it to all clients
4. WHEN a RN_Client sends a `network-error` message, THE Log_Server SHALL broadcast it to all clients
5. WHEN a message is received, THE Log_Server SHALL parse it as JSON and validate its structure

### Requirement 5: 客户端管理

**User Story:** 作为系统管理员，我希望服务器能够追踪和管理连接的客户端。

#### Acceptance Criteria

1. WHEN a client connects, THE Log_Server SHALL assign a unique client ID
2. WHEN a client connects, THE Log_Server SHALL extract and store the client IP address
3. WHEN a client connects, THE Log_Server SHALL send a welcome message with connection details
4. WHEN a client disconnects, THE Log_Server SHALL remove the client from the active connections map
5. THE Log_Server SHALL provide a `getConnectionCount()` method to query active connections

### Requirement 6: 错误处理

**User Story:** 作为开发者，我希望服务器能够妥善处理各种错误情况。

#### Acceptance Criteria

1. IF the server port is already in use, THE Log_Server SHALL log an error with code `EADDRINUSE`
2. WHEN a WebSocket error occurs, THE Log_Server SHALL log the error without crashing
3. WHEN message parsing fails, THE Log_Server SHALL log the error and continue processing other messages
4. WHEN broadcasting fails for a specific client, THE Log_Server SHALL log the error and continue broadcasting to other clients

### Requirement 7: TypeScript 类型安全

**User Story:** 作为开发者，我希望所有接口和类型都有完整的 TypeScript 定义。

#### Acceptance Criteria

1. THE Log_Server SHALL define `IClientInfo` interface for client information
2. THE Log_Server SHALL define `ILogMessage` interface for log messages
3. THE Log_Server SHALL define `INetworkRequestMessage` interface for network request messages
4. THE Log_Server SHALL define `INetworkResponseMessage` interface for network response messages
5. THE Log_Server SHALL define `INetworkErrorMessage` interface for network error messages
6. THE Log_Server SHALL export all message type interfaces
