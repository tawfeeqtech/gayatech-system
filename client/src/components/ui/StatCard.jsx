import React from 'react';
import { Card } from 'antd';
import CountUp from 'react-countup';

const StatCard = ({
  title,
  value,
  prefix,
  suffix,
  color = '#2563eb',
  icon,
  loading = false,
  precision = 0,
}) => {
  return (
    <Card
      loading={loading}
      style={{
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#64748b', fontSize: 13, fontFamily: 'Cairo, sans-serif', marginBottom: 8 }}>
            {title}
          </div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color, fontFamily: 'Cairo, sans-serif' }}>
            {prefix && <span style={{ fontSize: 18 }}>{prefix} </span>}
            <CountUp end={value} duration={1.5} decimals={precision} separator="," />
            {suffix && <span style={{ fontSize: 14 }}> {suffix}</span>}
          </div>
        </div>
        {icon && (
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color,
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;