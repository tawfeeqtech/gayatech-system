import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Tag, List, Badge, Skeleton, Empty, Button } from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, ProjectOutlined, FileTextOutlined,
  TeamOutlined, DollarOutlined, WalletOutlined, CrownOutlined,
  ReloadOutlined, WarningOutlined, InfoCircleOutlined, BankOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const rtlStyle = { fontFamily: 'Cairo, sans-serif' };

// ===================== ADMIN DASHBOARD =====================
const AdminDashboard = ({ data, loading, onRefresh }) => {
  if (loading) return <DashboardSkeleton />;
  if (!data) return <Empty description="لا توجد بيانات" />;

  const { stats, charts, alerts, recentTransactions } = data;

  return (
    <div style={rtlStyle}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1e3a8a', ...rtlStyle }}>🌟 لوحة التحكم العامة</Title>
          <Paragraph style={{ margin: '8px 0 0 0', color: '#64748b', ...rtlStyle }}>
            مرحباً بك في نظام غايتك المالي والتشغيلي المتكامل
          </Paragraph>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <Text type="secondary" style={rtlStyle}>آخر تحديث: منذ لحظات</Text>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small">تحديث</Button>
        </div>
      </div>

      {/* Stats Row 1 */}
      <Row gutter={[16, 16]}>
        <StatCard col={6} title="💰 الإيرادات هذا الشهر" value={stats.revenue.value} prefix="$"
          change={stats.revenue.change} trend={stats.revenue.trend} />
        <StatCard col={6} title="💸 المصاريف هذا الشهر" value={stats.expenses.value} prefix="$"
          change={stats.expenses.change} trend={stats.expenses.trend} />
        <StatCard col={6} title="📈 صافي الربح" value={stats.netProfit.value} prefix="$"
          change={stats.netProfit.change} trend={stats.netProfit.trend} />
        <StatCard col={6} title="🏦 رصيد الشركة" value={stats.totalBalance.value} prefix="$"
          icon={<BankOutlined />} color="#3b82f6" />
      </Row>

      {/* Stats Row 2 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <StatCard col={6} title="📋 عقود نشطة" value={stats.activeContracts.value} icon={<FileTextOutlined />} color="#f59e0b" />
        <StatCard col={6} title="🚀 مشاريع نشطة" value={stats.activeProjects.value} icon={<ProjectOutlined />} color="#3b82f6" />
        <StatCard col={6} title="👥 عملاء نشطون" value={stats.activeClients.value} icon={<TeamOutlined />} color="#10b981" />
        <StatCard col={6} title="⏰ فواتير متأخرة" value={stats.overdueInvoices.count}
          suffix={stats.overdueInvoices.total > 0 ? ` / $${stats.overdueInvoices.total.toLocaleString()}` : ''}
          icon={<ExclamationCircleOutlined />} color="#ef4444" />
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}>
          <Card title={<span style={rtlStyle}>📈 الإيرادات vs المصاريف</span>} bordered={false} style={{ borderRadius: 8 }}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={charts.monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" style={rtlStyle} />
                  <YAxis style={rtlStyle} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" name="الإيرادات" stroke="#2563eb" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="expenses" name="المصاريف" stroke="#ef4444" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={<span style={rtlStyle}>🥧 توزيع الدخل</span>} bordered={false} style={{ borderRadius: 8 }}>
            <div style={{ width: '100%', height: 300 }}>
              {charts.incomeBySource.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={charts.incomeBySource} dataKey="total" nameKey="_id" cx="50%" cy="50%" outerRadius={100}
                      label={({ _id, total }) => `$${total.toLocaleString()}`}>
                      {charts.incomeBySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty description="لا توجد بيانات" />}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Second Charts Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={<span style={rtlStyle}>🏦 أرصدة الحسابات</span>} bordered={false} style={{ borderRadius: 8 }}>
            {charts.accountBalances.length > 0 ? (
              <List dataSource={charts.accountBalances} renderItem={item => (
                <List.Item extra={<Text strong>${item.balance?.toLocaleString()}</Text>}>
                  <List.Item.Meta title={item.name} description={item.currency} />
                </List.Item>
              )} />
            ) : <Empty description="لا توجد حسابات" />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span style={rtlStyle}>📊 أداء المشاريع</span>} bordered={false} style={{ borderRadius: 8 }}>
            <div style={{ width: '100%', height: 250 }}>
              {charts.projectStatus.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={charts.projectStatus} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="_id" style={rtlStyle} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="عدد المشاريع" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty description="لا توجد بيانات" />}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Alerts & Recent Transactions */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={8}>
          <Card title={<span style={rtlStyle}>🔔 تنبيهات سريعة</span>} bordered={false} style={{ borderRadius: 8 }}>
            {alerts.length > 0 ? (
              <List dataSource={alerts} renderItem={(alert, i) => (
                <List.Item>
                  <Text style={rtlStyle}>{alert.icon} {alert.message}</Text>
                </List.Item>
              )} />
            ) : <Empty description="لا توجد تنبيهات" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title={<span style={rtlStyle}>📋 آخر المعاملات</span>} bordered={false} style={{ borderRadius: 8 }}>
            {recentTransactions.length > 0 ? (
              <List dataSource={recentTransactions} renderItem={tx => (
                <List.Item>
                  <List.Item.Meta
                    title={`${tx.number || 'TRX'} | ${tx.type === 'دخل' ? '🟢' : tx.type === 'مصروف' ? '🔴' : '🔵'} ${tx.type}`}
                    description={`${tx.clientName || tx.projectName || ''} | ${dayjs(tx.date).format('YYYY-MM-DD')}`}
                  />
                  <Text strong style={{ color: tx.type === 'دخل' ? '#10b981' : '#ef4444' }}>
                    {tx.type === 'دخل' ? '+' : '-'}${tx.amount?.toLocaleString()}
                  </Text>
                </List.Item>
              )} />
            ) : <Empty description="لا توجد معاملات" />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ===================== FINANCE DASHBOARD =====================
const FinanceDashboard = ({ data, loading, onRefresh }) => {
  if (loading) return <DashboardSkeleton />;
  if (!data) return <Empty description="لا توجد بيانات" />;

  const { stats, balance, charts, pendingInvoices, recentCollections } = data;

  return (
    <div style={rtlStyle}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1e3a8a', ...rtlStyle }}>💳 لوحة الإدارة المالية</Title>
          <Paragraph style={{ margin: '8px 0 0 0', color: '#64748b', ...rtlStyle }}>نظرة عامة مالية شاملة</Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small">تحديث</Button>
      </div>

      <Row gutter={[16, 16]}>
        <StatCard col={6} title="💰 الإيرادات" value={stats.revenue} prefix="$" color="#10b981" />
        <StatCard col={6} title="💸 المصاريف" value={stats.expenses} prefix="$" color="#ef4444" />
        <StatCard col={6} title="📈 صافي الربح" value={stats.netProfit} prefix="$" color="#3b82f6" />
        <StatCard col={6} title="⚠️ الديون" value={stats.totalDebt} prefix="$" suffix={stats.debtCount > 0 ? ` (${stats.debtCount})` : ''} color="#f59e0b" />
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}>
          <Card title={<span style={rtlStyle}>📈 الإيرادات الشهرية</span>} bordered={false} style={{ borderRadius: 8 }}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={charts.monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" style={rtlStyle} />
                  <YAxis style={rtlStyle} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" name="الإيرادات" stroke="#10b981" strokeWidth={3} />
                  <Line type="monotone" dataKey="expenses" name="المصاريف" stroke="#ef4444" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={<span style={rtlStyle}>💰 توزيع المصاريف</span>} bordered={false} style={{ borderRadius: 8 }}>
            <div style={{ width: '100%', height: 300 }}>
              {charts.expensesByCategory?.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={charts.expensesByCategory} dataKey="total" nameKey="_id" cx="50%" cy="50%" outerRadius={100}>
                      {charts.expensesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty description="لا توجد بيانات" />}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<span style={rtlStyle}>📋 الفواتير المستحقة</span>} bordered={false} style={{ borderRadius: 8 }}>
            {pendingInvoices?.length > 0 ? (
              <List dataSource={pendingInvoices} renderItem={inv => (
                <List.Item extra={<Text strong>${inv.total?.toLocaleString()}</Text>}>
                  <List.Item.Meta title={inv.invoiceNumber} description={inv.client?.name || ''} />
                </List.Item>
              )} />
            ) : <Empty description="لا توجد فواتير معلقة" />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span style={rtlStyle}>📥 آخر التحصيلات</span>} bordered={false} style={{ borderRadius: 8 }}>
            {recentCollections?.length > 0 ? (
              <List dataSource={recentCollections} renderItem={tx => (
                <List.Item extra={<Text strong style={{ color: '#10b981' }}>+${tx.amount?.toLocaleString()}</Text>}>
                  <List.Item.Meta title={tx.client?.name || tx.description} description={dayjs(tx.date).format('YYYY-MM-DD')} />
                </List.Item>
              )} />
            ) : <Empty description="لا توجد تحصيلات" />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ===================== PM DASHBOARD =====================
const PMDashboard = ({ data, loading, onRefresh }) => {
  if (loading) return <DashboardSkeleton />;
  if (!data) return <Empty description="لا توجد بيانات" />;

  const { stats, projectStatus, projects } = data;

  return (
    <div style={rtlStyle}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1e3a8a', ...rtlStyle }}>🚀 لوحة إدارة المشاريع</Title>
          <Paragraph style={{ margin: '8px 0 0 0', color: '#64748b', ...rtlStyle }}>إحصائيات المشاريع والعملاء</Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small">تحديث</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic title="🚀 مشاريع نشطة" value={stats.activeProjects} valueStyle={{ color: '#3b82f6' }}
              suffix={<Text type="secondary" style={rtlStyle}> / {stats.completedProjects} مكتملة</Text>} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic title="📋 عقود" value={stats.activeContracts} valueStyle={{ color: '#f59e0b' }}
              suffix={<Text type="secondary" style={rtlStyle}> / {stats.endedContracts} منتهية</Text>} />
          </Card>
        </Col>
        <StatCard col={6} title="👥 عملاء نشطون" value={stats.activeClients} icon={<TeamOutlined />} color="#10b981" />
        <StatCard col={6} title="📝 مهام معلقة" value={stats.pendingTasks} icon={<ClockCircleOutlined />} color="#ef4444" />
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<span style={rtlStyle}>📊 تقدم المشاريع</span>} bordered={false} style={{ borderRadius: 8 }}>
            <div style={{ width: '100%', height: 280 }}>
              {projectStatus.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={projectStatus} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="_id" style={rtlStyle} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="عدد المشاريع" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty description="لا توجد بيانات" />}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span style={rtlStyle}>🗓 العقود النشطة</span>} bordered={false} style={{ borderRadius: 8 }}>
            {projects.length > 0 ? (
              <List dataSource={projects.slice(0, 5)} renderItem={p => (
                <List.Item>
                  <List.Item.Meta title={p.name} description={`${p.client?.name || ''} | ${p.status}`} />
                </List.Item>
              )} />
            ) : <Empty description="لا توجد بيانات" />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ===================== ACCOUNTANT DASHBOARD =====================
const AccountantDashboard = ({ data, loading, onRefresh }) => {
  if (loading) return <DashboardSkeleton />;
  if (!data) return <Empty description="لا توجد بيانات" />;

  const { stats, charts, dueInvoices, recentExpenses } = data;

  return (
    <div style={rtlStyle}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1e3a8a', ...rtlStyle }}>📒 لوحة المحاسبة</Title>
          <Paragraph style={{ margin: '8px 0 0 0', color: '#64748b', ...rtlStyle }}>نظرة عامة على الفواتير والمصاريف</Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small">تحديث</Button>
      </div>

      <Row gutter={[16, 16]}>
        <StatCard col={6} title="📋 فواتير معلقة" value={stats.pendingInvoices} icon={<FileTextOutlined />} color="#f59e0b" />
        <StatCard col={6} title="💸 مصاريف الشهر" value={stats.monthlyExpenses} prefix="$" color="#ef4444" />
        <StatCard col={6} title="💳 مدفوعات معلقة" value={stats.pendingPayments} icon={<ClockCircleOutlined />} color="#3b82f6" />
        <StatCard col={6} title="🏦 رصيد الحسابات" value={stats.totalBalance} prefix="$" color="#10b981" />
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<span style={rtlStyle}>📋 الفواتير المستحقة هذا الشهر</span>} bordered={false} style={{ borderRadius: 8 }}>
            {dueInvoices?.length > 0 ? (
              <List dataSource={dueInvoices} renderItem={inv => (
                <List.Item extra={<Text strong>${inv.total?.toLocaleString()}</Text>}>
                  <List.Item.Meta title={inv.invoiceNumber} description={inv.client?.name || ''} />
                </List.Item>
              )} />
            ) : <Empty description="لا توجد فواتير مستحقة" />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span style={rtlStyle}>🧾 آخر المصاريف</span>} bordered={false} style={{ borderRadius: 8 }}>
            {recentExpenses?.length > 0 ? (
              <List dataSource={recentExpenses} renderItem={exp => (
                <List.Item extra={<Text strong style={{ color: '#ef4444' }}>-${exp.amount?.toLocaleString()}</Text>}>
                  <List.Item.Meta title={exp.description || exp.category} description={dayjs(exp.date).format('YYYY-MM-DD')} />
                </List.Item>
              )} />
            ) : <Empty description="لا توجد مصاريف" />}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title={<span style={rtlStyle}>📊 توزيع المصاريف حسب التصنيف</span>} bordered={false} style={{ borderRadius: 8 }}>
            <div style={{ width: '100%', height: 280 }}>
              {charts.expensesByCategory?.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={charts.expensesByCategory} dataKey="total" nameKey="_id" cx="50%" cy="50%" outerRadius={100}>
                      {charts.expensesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty description="لا توجد بيانات" />}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ===================== EMPLOYEE DASHBOARD =====================
const EmployeeDashboard = ({ data, loading, onRefresh }) => {
  if (loading) return <DashboardSkeleton />;
  if (!data) return <Empty description="لا توجد بيانات" />;

  const { stats, tasks, salaries, employee } = data;

  return (
    <div style={rtlStyle}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1e3a8a', ...rtlStyle }}>
            👋 مرحباً {employee?.name || 'بك'}
          </Title>
          <Paragraph style={{ margin: '8px 0 0 0', color: '#64748b', ...rtlStyle }}>
            {employee?.department ? `قسم: ${employee.department}` : 'لوحة معلومات الموظف'}
          </Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small">تحديث</Button>
      </div>

      <Row gutter={[16, 16]}>
        <StatCard col={6} title="💰 الراتب" value={stats.salary} prefix="$" color="#10b981" />
        <StatCard col={6} title="💳 السلف" value={stats.advance} prefix="$" color="#f59e0b" />
        <StatCard col={6} title="📝 مهامي النشطة" value={stats.activeTasks} icon={<ClockCircleOutlined />} color="#3b82f6" />
        <StatCard col={6} title="✅ المهام المنجزة" value={stats.completedTasks} icon={<CheckCircleOutlined />} color="#10b981" />
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<span style={rtlStyle}>📋 مهامي</span>} bordered={false} style={{ borderRadius: 8 }}>
            {tasks?.length > 0 ? (
              <List dataSource={tasks} renderItem={task => (
                <List.Item>
                  <List.Item.Meta
                    title={task.title}
                    description={`${task.projectName} | ${task.status}`}
                  />
                  {task.dueDate && <Text type="secondary">{dayjs(task.dueDate).format('YYYY-MM-DD')}</Text>}
                </List.Item>
              )} />
            ) : <Empty description="لا توجد مهام" />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span style={rtlStyle}>💰 الرواتب السابقة</span>} bordered={false} style={{ borderRadius: 8 }}>
            {salaries?.length > 0 ? (
              <List dataSource={salaries} renderItem={s => (
                <List.Item extra={<Text strong>${s.amount?.toLocaleString()}</Text>}>
                  <List.Item.Meta title={`${s.month} ${s.year}`} description={s.status} />
                </List.Item>
              )} />
            ) : <Empty description="لا توجد رواتب سابقة" />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ===================== HELPER: StatCard =====================
const StatCard = ({ col, title, value, prefix, suffix, change, trend, icon, color }) => (
  <Col xs={24} sm={12} lg={col}>
    <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <Statistic
        title={<span style={rtlStyle}>{title}</span>}
        value={value ?? 0}
        precision={typeof value === 'number' && value % 1 !== 0 ? 2 : 0}
        valueStyle={{ color: color || '#1e3a8a', ...rtlStyle }}
        prefix={prefix || (icon && <span style={{ marginLeft: 8 }}>{icon}</span>)}
        suffix={
          suffix ? <span style={rtlStyle}>{suffix}</span> :
          change !== undefined ? (
            <span style={{ fontSize: 14, color: trend === 'up' ? '#10b981' : '#ef4444', ...rtlStyle }}>
              {trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(change)}%
            </span>
          ) : undefined
        }
      />
    </Card>
  </Col>
);

// ===================== SKELETON =====================
const DashboardSkeleton = () => (
  <div style={rtlStyle}>
    <Skeleton active paragraph={{ rows: 1 }} />
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      {[1, 2, 3, 4].map(i => (
        <Col xs={24} sm={12} lg={6} key={i}>
          <Card><Skeleton active paragraph={{ rows: 1 }} /></Card>
        </Col>
      ))}
    </Row>
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      {[1, 2, 3, 4].map(i => (
        <Col xs={24} sm={12} lg={6} key={i + 4}>
          <Card><Skeleton active paragraph={{ rows: 1 }} /></Card>
        </Col>
      ))}
    </Row>
  </div>
);

// ===================== MAIN DASHBOARD =====================
const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role || 'employee';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    const endpointMap = {
      admin: '/api/dashboard/admin',
      finance: '/api/dashboard/finance',
      pm: '/api/dashboard/pm',
      accountant: '/api/dashboard/accountant',
      employee: '/api/dashboard/employee',
    };
    const endpoint = endpointMap[role] || endpointMap.employee;

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoint);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحميل لوحة التحكم');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => fetchDashboard();

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40, ...rtlStyle }}>
        <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ef4444' }} />
        <Title level={4} style={{ marginTop: 16, ...rtlStyle }}>{error}</Title>
        <Button type="primary" onClick={handleRefresh}>إعادة المحاولة</Button>
      </div>
    );
  }

  switch (role) {
    case 'admin':
      return <AdminDashboard data={data} loading={loading} onRefresh={handleRefresh} />;
    case 'finance':
      return <FinanceDashboard data={data} loading={loading} onRefresh={handleRefresh} />;
    case 'pm':
      return <PMDashboard data={data} loading={loading} onRefresh={handleRefresh} />;
    case 'accountant':
      return <AccountantDashboard data={data} loading={loading} onRefresh={handleRefresh} />;
    case 'employee':
    default:
      return <EmployeeDashboard data={data} loading={loading} onRefresh={handleRefresh} />;
  }
};

export default Dashboard;
