import React, { useState } from 'react';
import { Card, Steps, Button, Upload, Select, message, Alert, Table, Typography, Space } from 'antd';
import { UploadOutlined, DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import importAPI from '../../api/import';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const steps = [
  { title: 'اختيار النوع' },
  { title: 'تحميل القالب' },
  { title: 'رفع الملف' },
  { title: 'معاينة واستيراد' },
];

const importTypes = [
  { value: 'clients', label: 'العملاء' },
  { value: 'employees', label: 'الموظفون' },
  { value: 'contracts', label: 'العقود' },
  { value: 'projects', label: 'المشاريع' },
  { value: 'transactions', label: 'المعاملات' },
  { value: 'expenses', label: 'المصاريف' },
];

const ImportData = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedType, setSelectedType] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDownloadTemplate = async () => {
    if (!selectedType) return;
    try {
      const response = await importAPI.downloadTemplate(selectedType);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `template_${selectedType}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('تم تحميل القالب');
    } catch (e) {
      message.error('فشل في تحميل القالب');
    }
  };

  const handleImport = async () => {
    if (!file || !selectedType) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await importAPI.importData(selectedType, formData);
      setResult(response.data.data);
      setCurrentStep(3);
      message.success('تم الاستيراد بنجاح');
    } catch (e) {
      message.error(e.response?.data?.message || 'فشل في الاستيراد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 24 }}>استيراد البيانات</Title>

      <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

      {currentStep === 0 && (
        <Card title="اختر نوع البيانات للاستيراد" style={{ borderRadius: 8 }}>
          <Select
            placeholder="اختر النوع..."
            style={{ width: '100%', marginBottom: 16 }}
            options={importTypes}
            value={selectedType}
            onChange={(v) => setSelectedType(v)}
          />
          <Button type="primary" disabled={!selectedType} onClick={() => setCurrentStep(1)}>
            التالي: تحميل القالب
          </Button>
        </Card>
      )}

      {currentStep === 1 && (
        <Card title="تحميل القالب" style={{ borderRadius: 8 }}>
          <Alert
            message="قم بتحميل القالب ثم تعبئته بالبيانات"
            description="القالب يحتوي على تعليمات وأمثلة للبيانات المطلوبة."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Space>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              تحميل القالب
            </Button>
            <Button onClick={() => setCurrentStep(0)}>السابق</Button>
            <Button type="primary" onClick={() => setCurrentStep(2)} disabled={!selectedType}>
              التالي: رفع الملف
            </Button>
          </Space>
        </Card>
      )}

      {currentStep === 2 && (
        <Card title="رفع الملف" style={{ borderRadius: 8 }}>
          <Dragger
            name="file"
            accept=".xlsx,.xls"
            beforeUpload={(f) => { setFile(f); return false; }}
            onRemove={() => setFile(null)}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p>انقر أو اسحب ملف Excel إلى هنا</p>
          </Dragger>
          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => setCurrentStep(1)}>السابق</Button>
            <Button type="primary" onClick={handleImport} loading={loading} disabled={!file}>
              استيراد
            </Button>
          </Space>
        </Card>
      )}

      {currentStep === 3 && result && (
        <Card title="نتيجة الاستيراد" style={{ borderRadius: 8 }}>
          <Alert
            message={`تم استيراد ${result.inserted} من ${result.total} سجل`}
            type={result.errors > 0 ? 'warning' : 'success'}
            showIcon
            style={{ marginBottom: 16 }}
          />
          {result.errors > 0 && (
            <div>
              <Text type="danger">الأخطاء:</Text>
              {result.errorDetails?.map((err, i) => (
                <Alert key={i} message={`صف ${err.row}`} description={err.errors?.join(', ')} type="error" style={{ marginTop: 8 }} />
              ))}
            </div>
          )}
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={() => { setCurrentStep(0); setFile(null); setResult(null); setSelectedType(null); }}>
              استيراد ملف آخر
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default ImportData;