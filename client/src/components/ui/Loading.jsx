import React from 'react';
import { Spin } from 'antd';

const Loading = ({ tip = 'جاري التحميل...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8fafc',
      }}>
        <Spin size="large" tip={tip}>
          <div style={{ padding: 50 }} />
        </Spin>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '60px 0',
    }}>
      <Spin tip={tip}>
        <div style={{ padding: 30 }} />
      </Spin>
    </div>
  );
};

export default Loading;