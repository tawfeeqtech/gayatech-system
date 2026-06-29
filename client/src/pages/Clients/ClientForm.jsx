import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Space, Row, Col, Spin, Typography } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import SmartSelect from '../../components/ui/SmartSelect';
import clientAPI from '../../api/clients';
import countryAPI from '../../api/countries';
import cityAPI from '../../api/cities';
import { useCurrencies } from '../../hooks/useCurrencies';
import toast from 'react-hot-toast';

const { Title } = Typography;

const DEFAULT_COUNTRIES = ['فلسطين', 'السعودية', 'الإمارات', 'مصر', 'الأردن', 'الكويت', 'قطر', 'لبنان', 'تركيا'];

const ClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const { currencies } = useCurrencies();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Countries
  const [countries, setCountries] = useState(
    DEFAULT_COUNTRIES.map((c) => ({ value: c, label: c }))
  );
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countryIdMap, setCountryIdMap] = useState({}); // name -> _id

  // Cities
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [cityIdMap, setCityIdMap] = useState({}); // name -> _id

  // Load countries
  useEffect(() => {
    setCountriesLoading(true);
    countryAPI.getAll()
      .then((res) => {
        const list = res.data.data?.countries || res.data.data || [];
        const apiCountries = list.map((c) => ({ value: c.name, label: c.name, _id: c._id }));
        const idMap = {};
        apiCountries.forEach((c) => { idMap[c.value] = c._id; });
        setCountryIdMap((prev) => ({ ...prev, ...idMap }));

        const all = [...DEFAULT_COUNTRIES.map((n) => ({ value: n, label: n })), ...apiCountries];
        const seen = new Set();
        setCountries(all.filter((c) => {
          const k = c.value?.toString().trim().toLowerCase();
          if (seen.has(k)) return false; seen.add(k); return true;
        }));
      })
      .catch(() => setCountries(DEFAULT_COUNTRIES.map((c) => ({ value: c, label: c }))))
      .finally(() => setCountriesLoading(false));
  }, []);

  // Load cities when country changes
  useEffect(() => {
    const countryName = selectedCountry || form.getFieldValue(['address', 'country']);
    if (!countryName) { setCities([]); return; }

    const countryId = countryIdMap[countryName] || countryName;
    if (!countryId) { setCities([]); return; }

    setCitiesLoading(true);
    cityAPI.getAll({ country: countryId })
      .then((res) => {
        const list = res.data.data?.cities || res.data.data || [];
        const idMap = {};
        const formatted = list.map((c) => {
          idMap[c.name] = c._id;
          return { value: c.name, label: c.name, _id: c._id };
        });
        setCityIdMap((prev) => ({ ...prev, ...idMap }));
        setCities(formatted);
      })
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
  }, [selectedCountry, countryIdMap]);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      clientAPI.getById(id)
        .then(r => {
          const client = r.data.data.client;
          const vals = {
            ...client,
            address: client.address || {},
          };
          form.setFieldsValue(vals);
          if (client.address?.country) {
            setSelectedCountry(client.address.country);
          }
        })
        .catch(() => { toast.error('فشل في جلب البيانات'); navigate('/clients'); })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const ensureCountryCreated = async (countryName) => {
    if (!countryName) return countryName;
    const exists = countries.some(
      (c) => c.value?.toString().toLowerCase() === countryName?.toString().toLowerCase()
    );
    if (exists) return countryName;
    try {
      const res = await countryAPI.create({ name: countryName });
      const created = res.data.data?.country || res.data.data;
      const name = created?.name || countryName;
      setCountryIdMap((prev) => ({ ...prev, [name]: created._id }));
      setCountries((prev) => [...prev, { value: name, label: name, _id: created._id }]);
      return name;
    } catch { return countryName; }
  };

  const ensureCityCreated = async (cityName, countryName) => {
    if (!cityName) return cityName;
    const exists = cities.some(
      (c) => c.value?.toString().toLowerCase() === cityName?.toString().toLowerCase()
    );
    if (exists) return cityName;
    const countryId = countryIdMap[countryName];
    if (!countryId) return cityName;
    try {
      const res = await cityAPI.create({ name: cityName, country: countryId });
      const created = res.data.data?.city || res.data.data;
      const name = created?.name || cityName;
      setCityIdMap((prev) => ({ ...prev, [name]: created._id }));
      setCities((prev) => [...prev, { value: name, label: name, _id: created._id }]);
      return name;
    } catch { return cityName; }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const countryName = await ensureCountryCreated(values.address?.country);
      const cityName = await ensureCityCreated(values.address?.city, countryName);
      const payload = {
        ...values,
        address: {
          country: countryName,
          city: cityName,
          street: values.address?.street || '',
        },
      };
      if (isEdit) { await clientAPI.update(id, payload); toast.success('تم التحديث'); }
      else { await clientAPI.create(payload); toast.success('تمت الإضافة'); }
      navigate('/clients');
    } catch (e) { toast.error(e.response?.data?.message || 'فشل في الحفظ'); }
    finally { setSubmitting(false); }
  };


  return (
    <div style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/clients')}>العودة للقائمة</Button>
        <Title level={4} style={{ margin: 0 }}>{isEdit ? 'تعديل عميل' : 'إضافة عميل جديد'}</Title>
      </div>

      <Spin spinning={loading}>
      <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            clientType: 'شركة',
            status: 'نشط',
            preferredCurrency: 'USD',
            address: { country: 'فلسطين' },
          }}
        >
          {/*基本信息*/}
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <FormField name="name" label="اسم العميل" rules={[{ required: true, message: 'اسم العميل مطلوب' }]} placeholder="أدخل اسم العميل" />
            </Col>
            <Col xs={24} md={12}>
              <FormField name="company" label="اسم الشركة" placeholder="أدخل اسم الشركة (اختياري)" />
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <FormField name="email" label="البريد الإلكتروني" placeholder="example@domain.com" />
            </Col>
            <Col xs={24} md={8}>
              <FormField name="phone" label="رقم الهاتف" placeholder="0599xxxxxx" />
            </Col>
            <Col xs={24} md={8}>
              <FormField type="smartselect" name="clientType" label="نوع العميل"
                options={[
                  { value: 'شركة', label: 'شركة' }, { value: 'مؤسسة', label: 'مؤسسة' },
                  { value: 'فرد', label: 'فرد' }, { value: 'جهة حكومية', label: 'جهة حكومية' },
                  { value: 'أخرى', label: 'أخرى' },
                ]} allowCreate />
            </Col>
          </Row>

          {/* الدولة - المدينة - العنوان */}
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '16px 16px 8px', marginBottom: 16 }}>
            <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>📍 الموقع</Title>
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item
                  name={['address', 'country']}
                  label="الدولة"
                  rules={[{ required: true, message: 'الدولة مطلوبة' }]}
                >
                  <SmartSelect
                    options={countries}
                    placeholder="اختر الدولة"
                    allowCreate
                    loading={countriesLoading}
                    onChange={(val) => {
                      setSelectedCountry(val);
                      form.setFieldValue(['address', 'city'], undefined);
                      setCities([]);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name={['address', 'city']}
                  label="المدينة"
                  rules={[{ required: true, message: 'المدينة مطلوبة' }]}
                >
                  <SmartSelect
                    options={cities}
                    placeholder={selectedCountry ? `اختر مدينة في ${selectedCountry}` : 'اختر الدولة أولاً'}
                    allowCreate
                    loading={citiesLoading}
                    disabled={!selectedCountry && !form.getFieldValue(['address', 'country'])}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <FormField
                  name={['address', 'street']}
                  label="العنوان (الشارع - الحي)"
                  placeholder="مثال: شارع الإرسال، حي المطار"
                />
              </Col>
            </Row>
          </div>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <FormField type="smartselect" name="status" label="الحالة"
                options={[
                  { value: 'نشط', label: 'نشط' }, { value: 'غير نشط', label: 'غير نشط' },
                  { value: 'متوقف مؤقتاً', label: 'متوقف مؤقتاً' }, { value: 'محظور', label: 'محظور' },
                ]} allowCreate />
            </Col>
            <Col xs={24} md={12}>
              <FormField type="smartselect" name="preferredCurrency" label="العملة المفضلة" options={currencies} allowCreate />
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <FormField name="notes" label="ملاحظات" type="textarea" placeholder="أي ملاحظات إضافية..." />
            </Col>
          </Row>

          <div style={{ textAlign: 'left', marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/clients')}>إلغاء</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
                {isEdit ? 'تحديث العميل' : 'حفظ العميل'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
      </Spin>
    </div>
  );
};

export default ClientForm;
