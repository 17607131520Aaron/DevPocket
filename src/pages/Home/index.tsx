import React from "react";

import { Card, Typography } from "antd";

const { Title, Text } = Typography;

const Home: React.FC = () => {

  return (
    <div style={{ padding: 12 }}>
      {/* 欢迎横幅 */}
      <Card
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          borderRadius: 12,
          marginBottom: 24,
        }}
        styles={{ body: { padding: "40px 32px" } }}
      >
        <div style={{ color: "#fff" }}>
          <Title
            level={2}
            style={{
              color: "#fff",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            欢迎使用管理系统
          </Title>
          <Text style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 16 }}>
            这里是您的系统首页，您可以快速访问各个功能模块
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Home;
